---
title: UART 环形缓冲区
date: 2026-06-01 14:00:02
tags:
- [MCU]
categories: 
- [嵌入式]
description:  UART 环形缓冲区：从 DMA/中断共存到优雅的溢出处理
---


# UART 环形缓冲区：从 DMA/中断共存到优雅的溢出处理

## 1. 背景

在嵌入式串口通信中，我们常常需要同时使用 **DMA 接收**（降低 CPU 负载）和 **普通中断接收**（低延迟响应）。这就需要设计一个统一的 FIFO 环形缓冲区来管理数据。

本文分析一个基于 **镜像位（mirror bit）** 的环形缓冲区设计，探讨其在 DMA 模式下满溢时的行为，并给出一个简洁优雅的修复方案。

## 2. 环形缓冲区数据结构

```c
typedef struct {
    uint16_t head;          // 读指针
    uint16_t tail;          // 写指针
    uint16_t mirror:1;      // 镜像位，区分空/满
    uint16_t lenth:15;      // 数据长度
    uint8_t *data;          // 数据缓冲区（由 DMA Circular 模式写入）
} structUsartData;
```

### 2.1 核心技巧：镜像位区分空和满

环形缓冲区中，`tail == head` 可以同时表示"空"和"满"两个状态。引入 1-bit `mirror` 来区分：

| 状态 | tail == head | mirror |
|------|-------------|--------|
| 空 | ✅ 是 | 0 |
| 满 | ✅ 是 | 1 |

每次 `tail` 绕回（wrap around）时，`mirror` 翻转一次。

### 2.2 空/满检测

```c
// 写入时检测是否满
int used_size = rx_buff->tail + rx_buff->mirror * fifo_size - rx_buff->head;
int current_size = fifo_size - used_size;  // 剩余空间
if (current_size == 0) {
    // 满了，拒绝写入
    return 0;
}

// 读取时检测数据量
if (tail == head) {
    if (mirror) return fifo_size;  // 满
    /* else */  return 0;          // 空
}
```

## 3. DMA 接收 + IDLE 中断的工作流程

硬件配置：DMA 工作在 **Circular 模式**（环形模式），使能 **IDLE 中断**（空闲中断）。

```
DMA Circular Mode: 持续将 UART 数据写入 data[]
    ↓ 总线空闲触发 IDLE 中断
IDLE ISR:
    ① 计算本次接收长度 recv_len
    ② 组装事件 event = EC_SERIAL_EVENT_RX_DMADONE | (recv_len << 8)
    ③ 调用 drv_serial_isr(dev, event)
```

### 3.1 中断服务函数

```c
case EC_SERIAL_EVENT_RX_DMADONE:
    uint16_t rx_lenth = (event & (~0xff)) >> 8;  // DMA 写入的字节数
    if (rx_lenth)
        ec_serial_update_write_index(serial, rx_lenth);  // 推进 tail
    else
        ec_serial_push_one_data(serial);                  // IT 模式：逐字节写入

    rx_lenth = ec_fifo_data_len(serial);                  // FIFO 中可读数据量
    rx_fifo->lenth = rx_lenth;

    if (serial->rx_indicate != NULL)
        serial->rx_indicate(serial_dev, rx_lenth);        // 回调通知上层
```

## 4. Bug 分析：FIFO 满时的行为

### 4.1 问题场景

假设 FIFO 大小 `fifo_size=8`，缓冲区已满，DMA 又接收了 3 字节：

```
步骤 | 操作                              | head | tail | mirror | data[]
------|-----------------------------------|------|------|--------|--------
  1   | 缓冲区填满 [A B C D E F G H]      |  0   |  0   |   1    | 全部有效
  2   | DMA 又写入 X Y Z 到 data[0][1][2] |  0   |  0   |   1    | [X Y Z D E F G H]
  3   | IDLE 中断触发, recv_len=3         |      |      |        |
      | ec_serial_update_write_index(3):  |      |      |        |
      | tail==head && mirror==1 → 返回 0  |  0   |  0   |   1    | tail 没推进！
  4   | ec_fifo_data_len = 8              |      |      |        | 认为还有 8 字节
  5   | 消费者读 data[0..7]                | →?   |  0   |        | 读到 [X Y Z D E F G H]
```

### 4.2 问题本质

| 问题 | 说明 |
|------|------|
| **数据丢失** | `[A B C]`（最旧的 3 字节）被 DMA 覆写，丢失 |
| **指针不同步** | `tail` 未推进，但实际数据已变 |
| **镜像位不一致** | `mirror` 应翻转但未翻转 |
| **根源** | `ec_serial_update_write_index` 在满时返回 0，但 DMA 硬件已写入 |

### 4.3 这不是一个 Bug，而是 FIFO 溢出的固有特性

任何环形缓冲区在满溢时都必须做出选择：

| 策略 | 行为 | 适用场景 |
|------|------|----------|
| **丢弃新数据** | 返回 0 拒绝写入 | 数据完整 > 实时性 |
| **覆盖旧数据** | 允许写入，覆盖最旧数据 | 实时性 > 数据完整 |

当前代码选择了"丢弃新数据"策略——但问题是 DMA 硬件**不受软件控制**，它已经写入了数据。所以实际效果是：

> 丢旧数据（被覆盖）+ 保留新数据 + 状态不一致

## 5. 修复方案：借助回调函数"即时排空"

### 5.1 思路

既然满溢无法避免，不如让上层立即把数据取走，清空 FIFO，让后续写入恢复正常。

### 5.2 技术细节

在 IDLE/DMA_DONE 中断的回调中，立即读取所有数据：

```c
static int usart1_rx_indicate(ESERIAL_DEV serial_dev, uint16_t size)
{
    uint8_t temp[64];
    uint16_t total_read = 0;

    while (total_read < size) {
        uint16_t chunk = MIN(size - total_read, sizeof(temp));
        uint16_t read_len = drv_fifo_data_get(serial_dev, temp, chunk);
        if (read_len == 0) break;

        for (uint16_t i = 0; i < read_len; i++)
            rx_buf_push(temp[i]);

        total_read += read_len;
    }
    return 0;
}
```

`drv_fifo_data_get` 在内核读取后会推进 `head` 指针并翻转 `mirror`，FIFO 状态自动恢复。

### 5.3 数据流架构

```
┌─────────────────────────────────────────────────────────────┐
│                       硬件层                                │
│  UART RX → DMA Circular Mode → data[] (内核 FIFO)           │
└──────────────────────────┬──────────────────────────────────┘
                           │ IDLE 中断
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                       驱动层                                │
│  drv_serial_isr → ec_serial_update_write_index              │
│                → ec_fifo_data_len                            │
│                → rx_indicate(dev, size)                      │
└──────────────────────────┬──────────────────────────────────┘
                           │ 回调
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                       应用层                                │
│  usart1_rx_indicate → drv_fifo_data_get → temp[64]          │
│                    → rx_buf_push → receive_buffer[512]       │
│                    → shellTask → User_Shell_Read             │
└─────────────────────────────────────────────────────────────┘
```

## 6. 中间层：静态环形缓冲区

为什么需要第二个缓冲区？因为 shell 的读取操作是在任务上下文中执行，而非中断上下文。需要一个中间缓冲区暂存数据。

```c
static uint8_t receive_buffer[512];       // 静态环形缓冲区
static volatile uint16_t receive_head;     // 读指针
static volatile uint16_t receive_tail;     // 写指针
#define RX_BUF_MASK (512 - 1)

// 生产者：中断中调用
static void rx_buf_push(uint8_t data)
{
    uint16_t next = (receive_tail + 1) & RX_BUF_MASK;
    if (next == receive_head) return;      // 满则丢弃
    receive_buffer[receive_tail] = data;
    receive_tail = next;
}

// 消费者：任务中调用
signed short User_Shell_Read(char* buff, unsigned short len)
{
    uint16_t i;
    for (i = 0; i < len; i++) {
        if (receive_head == receive_tail) break;
        buff[i] = receive_buffer[receive_head];
        receive_head = (receive_head + 1) & RX_BUF_MASK;
    }
    return i;
}
```

### 6.1 为什么是 512（2 的幂）？

使用 `& 511` 替代 `% 512`，编译后是一条位与指令，比取模快数倍。

## 7. IT 模式 vs DMA 模式对比

| 特性 | IT 中断模式 | DMA + IDLE 中断模式 |
|------|-------------|-------------------|
| 谁写 data[] | CPU: `ec_serial_push_one_data` 逐字节 | DMA 硬件: 批量自动写入 |
| CPU 负载 | 高（每字节一次中断） | 低（一批数据一次中断） |
| 回调频率 | 每字节触发一次 | 每次 IDLE 空闲触发一次 |
| 回调逻辑 | 完全相同 | 完全相同 |
| 适用场景 | 低速通信、shell 交互 | 高速通信、大数据量 |

**关键结论：回调函数无需关心数据来源。** `drv_fifo_data_get` 统一从 `data[]` 中读取，无论数据是谁写入的。

## 8. IT 模式在 921600bps 下的丢数问题与优化

### 8.1 为什么普通终端模式会"接不全"？

当用户将 [`User_Shell_Init()`](code/app/components/letter_shell/shell_port.c:133) 中的模式从 `ESERIAL_MODE_DMA_RX` 切换为 `ESERIAL_MODE_IT` 时，921600bps 下会出现严重的丢数现象。本节从时序角度分析根因。

#### 8.1.1 时间预算分析

921600bps、8N1 格式下：

| 参数 | 数值 |
|------|------|
| 每字节位数 | 1 start + 8 data + 1 stop = 10 bit |
| 每字节时间 | 10 / 921600 ≈ **10.85 μs** |
| 连续数据流速率 | ~92 KB/s |
| 内核 FIFO (64B) 填满时间 | 64 × 10.85 ≈ **0.7 ms** |
| 应用层 receive_buffer (512B) 填满时间 | 512 × 10.85 ≈ **5.5 ms** |

#### 8.1.2 IT 模式的 ISR 调用路径

IT 模式下，**每个字节**触发一次 `USART_INT_RXDNE` 中断，ISR 执行路径如下：

```
USART1_IRQHandler
  → uart_isr                              // 判断中断源
    → drv_serial_isr(EC_SERIAL_EVENT_RX_IND)
      → ec_serial_push_one_data           // 从 DR 读1字节写入内核 FIFO
        → ec32_uart_getc                  // 读 USART->DAT
        → ec_serial_update_write_index    // 推进 tail，翻转 mirror
      → ec_fifo_data_len                  // 查询可读字节数
      → rx_indicate(dev, size)            // 回调 → usart1_rx_indicate
        → drv_fifo_data_get               // 从内核 FIFO 读出
        → rx_buf_push                     // 推入 receive_buffer[512]
```

在 72MHz N32G452 上，上述路径保守估计需 **5~8 μs**。乍看之下 < 10.85μs 似乎可行，但：

#### 8.1.3 丢数的三个根因

**根因一：高优先级中断抢占导致 OREF（硬件溢出）**

系统中存在多个更高/同级优先级的 DMA 中断和定时器中断：

| 中断源 | 抢占优先级 | 子优先级 |
|--------|-----------|---------|
| DMA1_CH5 (RX done) | 0 | 7 |
| UART1 (RXDNE) | 0 | 可配(默认7) |
| TIM4 | 0 | ~ |

当 DMA TX 完成中断（逐字节 DMA 发送产生大量中断）、PWM 输入捕获中断、或 SysTick 等抢占 UART1 ISR 时，ISR 延迟可能超过 10.85μs。UART 硬件只有 1 字节的接收移位寄存器缓冲（加上 DR），若前一个字节未被及时读取，下一个字节到达时硬件置位 [`USART_FLAG_OREF`](code/app/driver/drv_usart.c:587) —— **该字节永久丢失**。

当前 OREF 处理仅是丢弃性读取（[`drv_usart.c:587-590`](code/app/driver/drv_usart.c:587)），不会恢复数据。

**根因二：`shellTaskPort` 在 idle hook 中执行，消费不及时**

```
idle_hook (最低优先级线程)
  → shellTaskPort
    → shellTask → User_Shell_Read
      → 从 receive_buffer[512] 逐字节读取
```

`receive_buffer[512]` 在 921600bps 下仅 **~5.5ms** 即可填满。而 `idle_hook` 只在没有其他就绪线程时才会执行。如果系统中有任何持续运行的任务（如 heater PID 控制、BLE 数据处理、ADC 采样等），`shellTaskPort` 可能数毫秒甚至数十毫秒得不到调度，导致 `rx_buf_push` 静默丢弃数据（[`shell_port.c:92-93`](code/app/components/letter_shell/shell_port.c:92)）。

**根因三：回调逐字节触发，开销放大**

IT 模式下 `rx_indicate` 回调**每字节触发一次**。对比 DMA 模式的"每帧触发一次"：

| 模式 | 每帧(假设 100 字节)回调次数 | 回调总开销 |
|------|---------------------------|-----------|
| DMA + IDLE | 1 次 | ~O(1) |
| IT (RXDNE) | 100 次 | ~O(n) × 每次调用的固定开销 |

`drv_fifo_data_get` → `rx_buf_push` 的逐字节循环开销在高速率下累积显著。

### 8.2 数据流瓶颈全景图

```
921600bps 数据流 (10.85μs/byte)
        │
        ▼
┌──────────────────────────────────────┐
│  UART 硬件 RX Shift Reg → DR         │  ← 仅1字节缓冲！
│  若 DR 未被及时读取 → OREF → 丢字节  │
└──────────────┬───────────────────────┘
               │ RXDNE ISR (每字节)
               ▼
┌──────────────────────────────────────┐
│  内核 FIFO (64B)                      │  ← 0.7ms 填满
│  ec_serial_push_one_data             │
│  满时 tail 不推进，但硬件已覆盖旧数据  │
└──────────────┬───────────────────────┘
               │ rx_indicate (每字节!）
               ▼
┌──────────────────────────────────────┐
│  receive_buffer[512]                  │  ← 5.5ms 填满
│  rx_buf_push → 满则静默丢弃           │
└──────────────┬───────────────────────┘
               │ shellTaskPort (idle_hook)
               ▼
┌──────────────────────────────────────┐
│  shell_buffer[8192]                   │
│  shellTask → User_Shell_Read          │
└──────────────────────────────────────┘
```

瓶颈从硬件层逐级传导：UART DR（1B）→ 内核 FIFO（64B）→ receive_buffer（512B），每一级都在高速率下成为新的短板。

### 8.3 注意事项

| # | 注意点 | 说明 |
|---|--------|------|
| 1 | **IT 模式不适用于 ≥460800bps** | 460800bps 下字节间隔 ~21.7μs，尚有余量；921600bps 下 ~10.85μs 已接近临界值 |
| 2 | **IDLE 中断在 IT 模式默认未开启** | IT 模式下只使能 `USART_INT_RXDNE`，无法利用 IDLE 来减少回调频率 |
| 3 | **OREF 不可恢复** | 硬件溢出标志仅表示"至少丢失 1 字节"，无法知道丢失了多少，数据流完整性已破坏 |
| 4 | **`receive_buffer[512]` 可能不够用** | 在高速率 + 低优先级消费场景下，512B 可能还需增大（如改为 1024 或 2048） |
| 5 | **shell 缓冲区大小影响** | `shell_buffer[8192]` 足够大，但数据必须先经过 receive_buffer 才能到达这里 |

### 8.4 优化建议

#### 方案一（推荐）：坚持使用 DMA + IDLE 模式

当前 [`User_Shell_Init()`](code/app/components/letter_shell/shell_port.c:137) 使用的 `ESERIAL_MODE_DMA_RX` 已经是正确选择：

```c
// ✅ 推荐配置 —— 已经在用
drv_usart_init(ESERIAL_1, ESERIAL_MODE_DMA_RX | ESERIAL_MODE_DMA_TX, &config);
```

DMA 模式优势：硬件自动搬数据到 `data[]`，IDLE 中断一批回调一次，大幅降低 ISR 频率。

#### 方案二：若必须使用 IT 模式，做以下优化

**2a. 提升 UART 中断优先级**

```c
// 将 UART1 中断子优先级设为最高 (0)，高于其他外设
config.nvic = 0;  // 子优先级 0，抢占优先级保持 0
```

**2b. 增大内核 FIFO**

```c
// drv_usart.h 中修改默认值，或在初始化前 #define
#define EC_SERIAL_RB_BUFSZ  256   // 从 64 增大到 256
```

256 字节在 921600bps 下可缓冲 ~2.8ms，给 ISR 延迟更多余量。

**2c. 增大应用层 receive_buffer**

```c
static uint8_t receive_buffer[1024];  // 从 512 增大到 1024
#define RX_BUF_MASK (1024 - 1)
```

但需注意这只能延缓溢出，不能根治——如果消费端长期得不到调度，仍会溢出。

**2d. 将 shellTask 移至独立线程**

```c
// 不要依赖 idle_hook，创建一个中等优先级的线程专门消费数据
rt_thread_t shell_thread = rt_thread_create(
    "shell", shell_task_entry, RT_NULL,
    2048, RT_THREAD_PRIORITY_MAX / 3, 10);
```

这样 `shellTask` 不会因为 idle 线程的低优先级而被饿死。

**2e. 在 rx_indicate 中合并批量处理**

当前 IT 模式下每个字节回调一次，可以将小批量数据在 `temp[64]` 中积攒到一定数量再推入 `receive_buffer`，但需要权衡延迟——这属于微观优化的范畴，不推荐在没有实测 profiler 数据的情况下盲目实施。

#### 方案三：折中——降低波特率

如果业务场景不要求 921600bps 的吞吐量：

| 推荐波特率 | 字节间隔 | 适用范围 |
|-----------|---------|---------|
| 115200 | ~86.8 μs | 通用调试 |
| 230400 | ~43.4 μs | 适中速率 |
| 460800 | ~21.7 μs | IT 模式上限 |
| 921600 | ~10.85 μs | **仅推荐 DMA 模式** |

### 8.5 总结

| 结论 | 说明 |
|------|------|
| **IT 模式 921600bps 不推荐** | 字节间隔 10.85μs 逼近 ISR 处理极限，任何中断延迟都会导致 OREF 丢字节 |
| **DMA + IDLE 是正确的解决方案** | 当前项目已经在使用，无需修改 |
| **若必须 IT 模式** | 至少提升中断优先级 + 增大缓冲区 + shell 独立线程 |
| **实在不好改就别改** | DMA 模式已经是最优解 |

## 9. 完整初始化

```c
void User_Shell_Init(void)
{
    struct serial_configure config = EC_SERIAL_CONFIG_DEFAULT;
    config.baud_rate = BAUD_RATE_921600;

    // DMA 接收 + DMA 发送（推荐组合，921600bps 下避免丢数）
    drv_usart_init(ESERIAL_1, ESERIAL_MODE_DMA_RX | ESERIAL_MODE_DMA_TX, &config);
    drv_device_set_rx_indicate(ESERIAL_1, usart1_rx_indicate);

    shell.write = User_Shell_Write;
    shell.read = User_Shell_Read;
    shellInit(&shell, shell_buffer, sizeof(shell_buffer));
}
```

## 10. 总结

| 要点 | 说明 |
|------|------|
| **镜像位技巧** | 1-bit mirror 区分环形缓冲区空/满，简洁高效 |
| **FIFO 溢出** | 在 DMA Circular 模式下，满溢后软件指针与硬件数据不一致 |
| **回调排空策略** | 在中断回调中立即读取所有数据，恢复 FIFO 状态 |
| **双层缓冲** | 内核 FIFO + 应用静态环形缓冲区，解耦中断和任务 |
| **IT/DMA 兼容** | 回调函数统一使用 `drv_fifo_data_get`，不依赖数据来源 |
