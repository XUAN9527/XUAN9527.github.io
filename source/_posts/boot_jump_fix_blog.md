---
title: bootloader 跳转 APP 跑飞问题
date: 2026-06-01 14:00:02
tags:
- [MCU]
categories: 
- [嵌入式]
description: 记录Bootloader 跳转 APP 跑飞问题排查与修复过程
---

# Bootloader 跳转 APP 跑飞问题排查与修复实录

## 一、问题背景

**硬件平台**：N32G45x (Cortex-M4)  
**软件架构**：Bootloader + APP 双固件模式  
**复位方式**：VECTRESET（内核复位，保持 GPIO 引脚状态不变）

### 问题现象

| 场景 | 结果 |
|------|------|
| 直接烧录 APP | ✅ 正常启动 |
| 新旧 APP 大小**相同**，通过 Ymodem 下载 → Bootloader 搬运 → 跳转 | ✅ 正常启动 |
| 新旧 APP 大小**不同**，通过 Ymodem 下载 → Bootloader 搬运 → 跳转 | ❌ 跳转后卡死，串口无任何输出 |

### 数据流

```
┌──────────────────────────────────────────────────────────────┐
│                     Flash 布局 (512K)                          │
├──────────┬────────────────────┬───────────────────┬─────┬─────┤
│ Boot     │ APP 运行区          │ 临时下载区          │升级标志│ DCD │
│ 0x08000000│ 0x08002800/0x4000  │ 0x0803E800         │...│...│
│ 10/16KB  │ 240KB              │ 240KB              │...│...│
└──────────┴────────────────────┴───────────────────┴─────┴─────┘

流程: APP Ymodem下载到临时区 → 清除 ICACHE → kernel_reset(VECTRESET) → Bootloader搬运到APP区 → jump2app() → ✅ 正常启动
```

---

## 二、排查历程

### 尝试 1：ICACHE 复位（位置错误 — 无效）

最初怀疑 ICACHE 缓存了旧 APP 的指令。在 `iap_load_app()` 的 `jump2app()` 之前加了一行 `FLASH->AC |= FLASH_AC_ICAHRST`：

```c
// ❌ 错误位置 — ICACHE 复位在读取 jump2app 之后!
jump2app = (iapfun)*(vu32*)(appxaddr+4);
MSR_MSP(*(vu32*)appxaddr);
FLASH->AC |= FLASH_AC_ICAHRST;  // 太晚了
__DSB(); __ISB();
jump2app();
```

**结论**：无效。但原因是位置错误，而非方向错误。

### 尝试 2：IWDG 喂狗（排除）

怀疑 VECTRESET 后 IWDG 继续倒计时，在 Bootloader 搬运大固件时超时复位。

**结论**：排除。IWDG 超时设为 10 秒，不会触发。

### 尝试 3：SYSRESETREQ（排除）

怀疑 VECTRESET 不复位外设状态导致问题。

**结论**：不可用。设备端 GPIO 控制外部供电，SYSRESETREQ 会导致 GPIO 回到默认状态使外部设备掉电。

### 尝试 4：GPIO 诊断定位（关键突破）

在 Bootloader 跳转前和 APP 启动链路的 4 个位置操作 GPIO 来控制 LED：

| 位置 | LED 操作 | 实测结果 |
|------|----------|----------|
| Bootloader 跳转前 | 关 LED | ✅ LED 灭 |
| APP Reset_Handler 第一条指令 | 开 LED | ❌ **未执行** |
| APP SystemInit 完成 | 关 LED | ❌ 未执行 |
| APP main 入口 | 开 LED | ❌ 未执行 |

**结论**：APP 的 Reset_Handler 从未被执行！`jump2app()` 跳到了错误位置。

### 尝试 5：打印 jump2app 地址（关键证据）

在 `jump2app()` 前加入 `printf` 打印跳转地址：

```c
jump2app = (iapfun)*(vu32*)(appxaddr+4);
printf("jump2app addr = 0x%08X\r\n", (unsigned int)jump2app);
jump2app();
```

输出：
```
jump2app addr = 0x0800D129    ← 与 map 文件中 Reset_Handler = 0x0800D128 | Thumb(1) 完全一致!
```

**关键矛盾出现**：地址完全正确，但 Reset_Handler 的 LED 还是没亮！

---

## 三、根因分析

### 为什么地址正确但跳转失败？

这是本次排查中最关键的认识突破：

```
Cortex-M4 有两条独立的总线:
  ┌─────────────────────────────────────────────┐
  │  D-Bus (数据总线) → *(vu32*)addr 数据读取     │
  │    → Flash 数据读取不走 ICACHE ✅             │
  │                                               │
  │  I-Bus (指令总线) → CPU 取指                   │
  │    → 指令取指走 ICACHE！⚡                     │
  └─────────────────────────────────────────────┘
```

**过程还原**：

```
1. jump2app = *(vu32*)(appxaddr+4)
   → D-Bus 数据读取，不走 ICACHE
   → 返回值: 0x0800D129 ✅ 正确！

2. printf(...) 打印 0x0800D129 ✅

3. jump2app() → CPU 跳转到 0x0800D128 取指令
   → I-Bus 指令取指，走 ICACHE
   → ICACHE 命中！返回旧 APP 在 0x0800D128 处的过期指令
   → CPU 执行垃圾代码 ❌
   → Reset_Handler 的 movs r1,#0 从未执行
   → LED 不亮
```

### 为什么大小相同没问题？

当新旧 APP 大小完全相同时，ICACHE 中的旧指令恰好与 Flash 中的新指令一致，即使 ICACHE 命中也不会出错。

### 更之前 ICACHE 复位为什么无效？

之前加的 `FLASH->AC |= FLASH_AC_ICAHRST` 位置在 `jump2app` **读取之后**。此时 ICACHE 中需要被清除的是**即将被取指的指令内容**（不是数据），单纯复位 ICACHE 确实无效。**正确做法是先禁用 ICACHE、再复位**：

```c
FLASH->AC &= ~FLASH_AC_ICAHEN;  // 先禁用
FLASH->AC |= FLASH_AC_ICAHRST;  // 再复位
```

---

## 四、最终修复

### 推荐方案：在 `kernel_reset` (VECTRESET) 之前清除 ICACHE

问题的根源是 VECTRESET 不复位 ICACHE，导致 Bootloader 搬运完新固件后，旧固件的指令仍然残留在 ICACHE 中。既然 VECTRESET 是 ICACHE 未清除的**唯一入口**，最合理的修复位置就是 `kernel_reset()` 调用之前——在复位发起前把 ICACHE 清空，复位后 ICACHE 就是干净的，后续 Bootloader 取指不再受旧缓存影响。

**文件**：调用 `kernel_reset()` 的位置（具体文件视项目而定）

```c
/* 关键修复：内核复位前必须清除 ICACHE！
 * VECTRESET 不复位 ICACHE 硬件，旧 APP 的指令仍残留在缓存中。
 * 复位前先禁用再复位 ICACHE，确保复位后 Bootloader 运行在干净的缓存环境。
 * 这样后续 jump2app() 取指时 I-Cache 未命中，从 Flash 获取真实指令 */
FLASH->AC &= ~FLASH_AC_ICAHEN;  // 禁用 ICACHE
FLASH->AC |= FLASH_AC_ICAHRST;  // 复位 ICACHE（硬件自动清零）
__DSB();
__ISB();
kernel_reset();                  // 发起内核复位
```

### 备选方案：在 `jump2app()` 之前清除 ICACHE

如果无法在 `kernel_reset()` 前插入清除逻辑，也可以在 `iap_load_app()` 的 `jump2app()` 之前清除 ICACHE，效果相同。

**文件**：`code/bootloader/user/iap.c`

```c
void iap_load_app(u32 appxaddr)
{
    if(((*(vu32*)appxaddr)&0x2FFE0000)==0x20000000)
    {
        jump2app = (iapfun)*(vu32*)(appxaddr+4);
        MSR_MSP(*(vu32*)appxaddr);

        FLASH->AC &= ~FLASH_AC_ICAHEN;  // 禁用 ICACHE
        FLASH->AC |= FLASH_AC_ICAHRST;  // 复位 ICACHE（硬件自动清零）
        __DSB();
        __ISB();

        jump2app();
    }
}
```

### 方案对比

| 方案 | 修复位置 | 优点 | 缺点 |
|------|----------|------|------|
| **推荐** | `kernel_reset()` 前 | 根因处修复，不侵入 Bootloader 跳转逻辑 | 需要找到 kernel_reset 调用点 |
| 备选 | `jump2app()` 前 | 改动集中在一个函数内 | 修复位置离根因较远 |

---

## 五、经验总结

1. **D-Bus 和 I-Bus 分离是诊断关键**：数据读取走 D-Bus，指令取指走 I-Bus，两者缓存行为不同。用 `printf` 打印地址验证时发现地址正确，容易误判"取指没问题"。

2. **ICACHE 复位需要先禁用再复位**：仅写 `ICAHRST` 位可能不够。

3. **GPIO/LED 诊断是最可靠的定位手段**：在没有 JTAG 的情况下，通过在 Reset_Handler 最初加 GPIO 操作，精确定位了"跳转成功但未执行第一条指令"这个关键事实。

4. **MSP 的值不影响取指**：`MSR_MSP` 设置的是堆栈指针，不影响第一条指令的取指路径，之前的排查一直没有混淆这一点。

5. **修复应放在根因入口处**：ICACHE 未被清除的根因是 VECTRESET 不复位 ICACHE，因此在 `kernel_reset()` 之前清除 ICACHE 是最自然、最推荐的修复位置。放在 `jump2app()` 之前也能工作，但不如前者直观。

# Bootloader 跳转 APP 跑飞问题 — 通俗解释

## 一个比喻：图书馆找书

把 CPU 想象成一个人，Flash 存储器是一个**图书馆**。

### CPU 有两条独立的通道去图书馆：

```
通道1：数据通道（D-Bus）— 查书号、读数据
通道2：指令通道（I-Bus）— 把书的内容读出来执行

ICACHE 是"指令通道"的一个快速缓存 — 它只缓存"书的内容"，
不缓存"书号"。
```

### 问题是怎么发生的

```
第1步：旧APP在运行
        CPU 通过"指令通道"把 Flash 中旧APP的代码全部读进了 ICACHE 缓存
        ICACHE 里现在装满了旧APP的指令

第2步：APP 复位，Bootloader 启动
        Bootloader 擦除了旧APP的 Flash，写入了新APP的代码
        但 ICACHE 里的旧内容没有被清除！
        Flash 中的代码已经更新了，但 ICACHE 缓存还是旧的

第3步：Bootloader 读取跳转地址
        jump2app = *(APP区 + 4)
        ↑ 这是"数据通道"的读取操作，不走 ICACHE
        ↑ 直接从 Flash 读到了正确的新地址：0x0800D129

第4步：printf 打印跳转地址
        printf("jump2app = 0x0800D129")
        ↑ 打印出来是正确的！因为地址是从"数据通道"读的，没经过 ICACHE

第5步：jump2app() 跳转执行
        CPU 跳到 0x0800D128 去取指令执行
        ↑ 这是"指令通道"的取指操作，走 ICACHE！
        ↑ ICACHE 说："0x0800D128 这里我缓存过了，给你旧数据"
        ↑ CPU 拿到了旧APP在 0x0800D128 处的过期指令
        ↑ 执行垃圾代码 → 卡死
```

### 一句话总结

```
数据读取 → D-Bus → 不走 ICACHE → 地址是对的 ✅
指令取指 → I-Bus →   走 ICACHE  → 指令是旧的 ❌

printf 打印地址是"数据读取"，所以地址正确。
但 jump2app() 之后 CPU 取指令是"指令取指"，被 ICACHE 坑了。
```

### 修复方法

**推荐：在内核复位之前，先把 ICACHE 清空**（只有内核复位才会出现此问题，不用改动 Bootloader 跳转逻辑）：

```c
FLASH->AC &= ~FLASH_AC_ICAHEN;  // 关闭 ICACHE
FLASH->AC |= FLASH_AC_ICAHRST;  // 清空 ICACHE 内容
__DSB(); __ISB();               // 确保操作完成
kernel_reset();                 // 复位后 ICACHE 干净，取指令不会命中旧缓存
```

**备选：在跳转之前，先把 ICACHE 清空：**

```c
FLASH->AC &= ~FLASH_AC_ICAHEN;  // 关闭 ICACHE
FLASH->AC |= FLASH_AC_ICAHRST;  // 清空 ICACHE 内容
__DSB(); __ISB();               // 确保操作完成
jump2app();                     // 现在取指令不会命中旧缓存了
```

### 为什么大小相同时不出问题？

新旧 APP 大小相同 → 同一个物理地址上写的是相同数据 → ICACHE 中的旧内容碰巧和新 Flash 内容一致 → 缓存命中也不会出错。

### 为什么 printf 加上后看起来"好了一次"？

`printf` 本身会执行大量代码，可能在内部触发了某些缓存行的替换，偶然把关键地址的旧缓存行替换掉了。但这是不可靠的偶然行为。
