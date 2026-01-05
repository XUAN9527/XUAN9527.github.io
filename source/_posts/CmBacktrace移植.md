---
title: CmBacktrace移植
date: 2024-4-19 14:27:00
#updated: 2023-12-04
tags:
- [Cortex-M]
- [Linux]
categories: 
- [嵌入式]
- [错误追踪]
description: CmBacktrace是一款针对 ARM Cortex-M 系列 MCU 的错误代码自动追踪、定位，错误原因自动分析的开源库，作者armink，目前收获 611 个 star，遵循 MIT 开源许可协议。
---

## CmBacktrace 简介

- 支持断言（`assert`）和故障（`Hard Fault`）
- 故障原因自动诊断
- 输出错误现场的函数调用栈
- 适配 `Cortex-M0`/`M3`/`M4`/`M7` 等 `MCU`
- 支持 `IAR`、`KEIL`、`GCC` 编译器

---

## 原理（简述）

CmBacktrace 的核心思路基于 `Cortex-M` 架构的压栈特性和指令分析。

### 1) 压栈特性

- `Cortex-M` 在发生异常或函数调用时，会自动将相关寄存器（如 `R0-R3`、`R12`、`LR`、`PC`、`PSR` 等）压入栈中。
- CmBacktrace 通过分析栈中的数据来还原调用栈。

### 2) 指令分析与函数调用栈还原

- 当程序出现异常时，CmBacktrace 会获取当前的栈顶指针（`SP`）和栈的起始地址及大小。
- 从栈顶开始遍历，每次读取一个地址值：若其符合 `Thumb` 指令模式（地址带 Thumb bit）且对应指令是 `BL/BLX`（函数调用指令），则认为是有效的调用返回地址。

### 3) 错误现场信息保存

- 异常发生时保存 `CPU` 寄存器状态（`R0-R12`、`LR`、`PC`、`PSR` 等）。
- 同时保存故障状态寄存器（如 `HFSR`、`BFSR`、`MMFSR` 等），辅助定位异常原因。

---

## 参考链接

- 官方源码：<https://github.com/armink/CmBacktrace>
- 示例项目：<https://github.com/XUAN9527/cmbacktrace-demo>
- 说明文档：<https://xuan9527.github.io/2024/04/19/CmBacktrace%E7%A7%BB%E6%A4%8D/>

---

## 移植步骤（以 bare metal + GCC 为例）

### 1) 拷贝源码与示例

![cmbacktrace目录](../pictures/cmbacktrace目录.png)

- 将源码拷贝到工程目录（示例：`~/work/cmbacktrace-demo/code/components`）
- 添加头文件：`cm_backtrace.h`、`cmb_cfg.h`、`cmb_def.h`
- 添加源文件：`cm_backtrace.c`
- 添加 demo 文件：`demos/non_os/stm32f10x/app/src/fault_test.c`

### 2) Makefile 添加汇编文件（cmb_fault）

#### 方法一：直接用 `.s`

将 `fault_handler/gcc/cmb_fault.S` 改为 `fault_handler/gcc/cmb_fault.s`，并加入编译列表。

```makefile
ASM_SOURCES =  \
CMSIS/device/startup/startup_n32l40x_gcc.s \
components/cm_backtrace/fault_handler/gcc/cmb_fault.s  # 添加这一行
```

#### 方法二：让 Makefile 支持 `.S`

```makefile
ASM_SOURCES = CMSIS/device/startup/startup_n32l40x_gcc.s
ASM_SOURCES2 = components/cm_backtrace/fault_handler/gcc/cmb_fault.S  # 新增

# C 源文件、汇编源文件的目标文件路径
C_OBJECTS = $(addprefix $(OUTPUT_DIR)/, $(C_SOURCES:.c=.o))
ASM_OBJECTS = $(addprefix $(OUTPUT_DIR)/, $(ASM_SOURCES:.s=.o)) \
	      $(addprefix $(OUTPUT_DIR)/, $(ASM_SOURCES2:.S=.o))

$(OUTPUT_DIR)/%.o: %.s
	mkdir -p $(dir $@)
	$(CC) $(INCLUDE) $(CFLAGS) -c $< -o $@

$(OUTPUT_DIR)/%.o: %.S
	mkdir -p $(dir $@)
	$(CC) $(INCLUDE) $(CFLAGS) -c $< -o $@
```

### 3) printf 重定向（示例）

```c
int _write(int fd, char* pBuffer, int size)
{
    // 添加自己的发送函数
    return drv_serial_dma_write(ESERIAL_1, pBuffer, size);
}
```

### 4) 配置 `cmb_cfg.h`

```c
#ifndef _CMB_CFG_H_
#define _CMB_CFG_H_

#include "log.h"

/* print line, must config by user */
#define cmb_println(...)  printf(__VA_ARGS__);printf("\r\n")

/* enable bare metal(no OS) platform */
#define CMB_USING_BARE_METAL_PLATFORM

/* cpu platform type, must config by user */
#define CMB_CPU_PLATFORM_TYPE   CMB_CPU_ARM_CORTEX_M4

/* enable dump stack information */
#define CMB_USING_DUMP_STACK_INFO

/* language of print information */
#define CMB_PRINT_LANGUAGE    CMB_PRINT_LANGUAGE_ENGLISH

#endif /* _CMB_CFG_H_ */
```

### 5) 链接脚本增加必要符号（示例）

你的链接脚本需要能够让 CmBacktrace 拿到“代码段范围”和“栈范围”。不同工程写法不同，下面给一个示例：

```ld
/* 代码段起始（示例：放在 .text 之前） */
_stext = .;

/* ... .text ... */

/* 栈相关符号（示例：放在 RAM 段附近） */
_sstack = .;
```

> 更推荐的写法是使用 `PROVIDE(...)`（见本文后面的“linker script 配置”）。

### 6) 保存/读取错误信息到 Flash（可选）

在 `cm_backtrace.c` 中添加读写 Flash 的逻辑（按你项目的 Flash 驱动接口调整）。

```c
// 添加读写 flash 的地址
#include "dcd_user.h"

#define ERRORLOG_FLASH_BASIC_ADDR   USER_DATA_ADDR
#define ERRORLOG_FLASH_OFFSET       (0 * 1024)
#define ERRORLOG_FLASH_TARGET_ADDR  (ERRORLOG_FLASH_BASIC_ADDR + ERRORLOG_FLASH_OFFSET)
#define ERRORLOG_FLASH_TARGET_SIZE  (2 * 1024)

static void print_call_stack(uint32_t sp)
{
    size_t i, cur_depth = 0;
    uint32_t call_stack_buf[CMB_CALL_STACK_MAX_DEPTH] = {0};

    cur_depth = cm_backtrace_call_stack(call_stack_buf, CMB_CALL_STACK_MAX_DEPTH, sp);

    for (i = 0; i < cur_depth; i++) {
        sprintf(call_stack_info + i * (8 + 1), "%08lx", (unsigned long)call_stack_buf[i]);
        call_stack_info[i * (8 + 1) + 8] = ' ';
    }

    if (cur_depth) {
        call_stack_info[cur_depth * (8 + 1) - 1] = '\0';
        cmb_println(print_info[PRINT_CALL_STACK_INFO], fw_name, CMB_ELF_FILE_EXTENSION_NAME, call_stack_info);

        // 可选：把回溯字符串写到 flash
        uint8_t buff[512] = {0};
        snprintf((char *)buff, sizeof(buff), print_info[PRINT_CALL_STACK_INFO], fw_name,
                 CMB_ELF_FILE_EXTENSION_NAME, call_stack_info);
        dcd_port_erase(ERRORLOG_FLASH_TARGET_ADDR, ERRORLOG_FLASH_TARGET_SIZE);
        dcd_port_write(ERRORLOG_FLASH_TARGET_ADDR, (const uint32_t *)buff, strlen((char *)buff) + 1);
    } else {
        cmb_println(print_info[PRINT_CALL_STACK_ERR]);
    }
}

static void fault_read_string(void)
{
    uint8_t buff[512] = {0};
    dcd_port_read(ERRORLOG_FLASH_TARGET_ADDR, (uint32_t *)buff, sizeof(buff));
    buff[512 - 1] = 0;
    logPrintln("CmBacktrace hard fault = %s", buff);
}
```

### 7) 注释掉工程原有 `HardFault_Handler`（避免冲突）

```c
// void HardFault_Handler(void)
// {
//     while (1)
//     {
//     }
// }
```

### 8) 主函数例程

```c
#include "cm_backtrace.h"

#define HARDWARE_VERSION "V1.0.0"
#define SOFTWARE_VERSION "V0.1.0"

extern void fault_test_by_unalign(void);
extern void fault_test_by_div0(void);

int main(void)
{
    main_system_init();
    // 在开启时钟、打印和看门狗之后初始化
    cm_backtrace_init("CmBacktrace", HARDWARE_VERSION, SOFTWARE_VERSION);

    fault_test_by_unalign();  // 字节对齐异常示例
    fault_test_by_div0();     // 除零异常示例

    while (1) {
    }
}
```

### 9) 现场输出与 `addr2line` 定位

示例输出（节选）：

```text
  addr: 20004ee8    data: 23d4e51e
  addr: 20004eec    data: 8527b7c0
  addr: 20004ef0    data: fd9d41f7
  addr: 20004ef4    data: f539e421
  addr: 20004ef8    data: 4ad52963
  addr: 20004efc    data: 4587b423
  addr: 20004f00    data: e000ed00
  addr: 20004f04    data: 00000000
  addr: 20004f08    data: 00000000
  addr: 20004f0c    data: 00000000
```

在 Linux 环境下执行（`app.elf` 为工程产物，需在当前目录下）：

```bash
addr2line -e app.elf -a -f 080154c2 0800a3b3 08009092
```

输出解析示例：

```text
0x080154c2
fault_test_by_unalign
/home/xuan/work/n5-mini-s-plus/code/app/components/cm_backtrace/fault_test.c:18
0x0800a3b3
main
/home/xuan/work/n5-mini-s-plus/code/app/application/main.c:30
0x08009092
LoopFillZerobss
/home/xuan/work/n5-mini-s-plus/code/app/CMSIS/device/startup/startup_n32l40x_gcc.s:113
```

### 10) 小结

- CmBacktrace 能快速定位偶现的程序跑飞问题。
- 全功能打印 + 存储的代码占用约 `8K`；去掉打印仅保留基本功能占用约 `4K`（以你的工程实测为准）。
- 存储部分可进一步优化（例如 Flash 擦写均衡）。

---

## CmBacktrace 调用栈追溯问题分析报告

> 场景：HardFault 追溯时无法追溯到最后一个（叶子）函数。

### 1) 问题描述

在使用 CmBacktrace 组件进行 HardFault 异常追溯时，发现**无法追溯到最后一个（叶子）函数**。

#### 1.1 测试环境

| 项目 | 配置 |
|------|------|
| MCU | YC3122 (ARM Cortex-M0) |
| 编译器 | arm-none-eabi-gcc 7.3.1 |
| 优化等级 | -Os |
| 测试命令 | `fault_test_by_div0`（通过 letter_shell 调用） |

#### 1.2 问题现象

执行 `fault_test_by_div0` 触发 HardFault 后，CmBacktrace 输出的调用栈缺少最后触发异常的函数。

修复前：

```text
addr2line -e app.elf -a -f 00000010 0101e328 0101e4e2 ...
```

- 第一个地址 `0x00000010` 是无效地址（不在代码区域）
- 缺少 `fault_test_by_div0` 函数

修复后：

```text
addr2line -e app.elf -a -f 0101f812 0101e328 0101e4e2 ...
```

- 第一个地址 `0x0101f812` 正确指向 `fault_test_by_div0`

---

### 2) 根因分析

#### 2.1 Cortex-M0 平台限制

Cortex-M0 相比 M3/M4/M7 有以下限制：

| 特性 | Cortex-M0 | Cortex-M3/M4/M7 |
|------|-----------|-----------------|
| SCB->CCR DIV_0_TRP | ❌ 不支持 | ✅ 支持 |
| SCB->CCR UNALIGN_TRP | ❌ 不支持 | ✅ 支持 |
| 除零异常 | 返回 0，不触发异常 | 可配置触发 UsageFault |
| Fault 类型 | 只有 HardFault | HardFault + UsageFault + BusFault + MemManage |

**注意**：GCC 在 `-Os` 优化下检测到确定的除零操作时，会生成 `UDF` (未定义指令) 来触发 HardFault。

#### 2.2 函数指针调用问题

letter_shell 通过**函数指针**调用命令函数，使用的是 `BLX Rm` 指令（寄存器间接调用），而不是直接的 `BL` 指令。

反汇编验证：

```asm
0101f7b8 <fault_test_by_div0>:
 101f7b8:       2310            movs    r3, #16
 101f7ba:       4a02            ldr     r2, [pc, #8]
 101f7bc:       6811            ldr     r1, [r2, #0]
 101f7be:       430b            orrs    r3, r1
 101f7c0:       6013            str     r3, [r2, #0]
 101f7c2:       deff            udf     #255    ; ← HardFault 在此触发
```

#### 2.3 CmBacktrace 原始逻辑的问题

**原始代码**（`cm_backtrace_call_stack` 函数）：

```c
if (on_fault) {
    if (!stack_is_overflow) {
        /* first depth is PC */
        buffer[depth++] = regs.saved.pc;  // ← 直接使用异常时保存的 PC
        ...
    }
}
```

**问题**：
- 当通过函数指针调用触发异常时，`regs.saved.pc` 的值可能被破坏
- 实际观察到 `regs.saved.pc = 0x00000010`（无效地址）
- 真正的出错地址 `0x0101f812` 保存在栈上，但未被正确提取


---

### 3) 解决方案

#### 3.1 修改 cm_backtrace.c

在 `cm_backtrace_call_stack` 函数中增加 PC 有效性检测和栈扫描逻辑：

```c
if (on_fault) {
    if (!stack_is_overflow) {
        /* first depth is PC */
        pc = regs.saved.pc;
        /* If PC is invalid (not in code section), try to find from stack top */
        if ((pc < code_start_addr) || (pc > code_start_addr + code_size)) {
            /* Scan first few stack entries for a valid code address */
            for (uint32_t scan_sp = sp; 
                 scan_sp < sp + 16 * sizeof(size_t) && scan_sp < stack_start_addr + stack_size; 
                 scan_sp += sizeof(size_t)) {
                uint32_t stack_val = *((uint32_t *)scan_sp);
                /* Check both odd (with thumb bit) and even addresses */
                uint32_t check_pc = (stack_val & 1) ? (stack_val - 1) : stack_val;
                if ((check_pc >= code_start_addr) && (check_pc <= code_start_addr + code_size)) {
                    pc = check_pc;
                    break;
                }
            }
        }
        buffer[depth++] = pc;
        
        /* fix the LR address in thumb mode */
        pc = regs.saved.lr - 1;
        if ((pc >= code_start_addr) && (pc <= code_start_addr + code_size) 
            && (depth < CMB_CALL_STACK_MAX_DEPTH) && (depth < size)) {
            buffer[depth++] = pc;
            regs_saved_lr_is_valid = true;
        }
    }
}
```

#### 3.2 修改原理

1. **检测 PC 有效性**：判断 `regs.saved.pc` 是否在代码区域内
2. **栈扫描回退**：如果 PC 无效，从栈顶向下扫描前 16 个条目
3. **地址验证**：找到第一个落在代码区域内的有效地址作为出错位置
4. **兼容性**：同时检查奇数地址（带 Thumb 位）和偶数地址


---

### 4) 测试验证

#### 4.1 修复后测试结果

```
admin:/$ fault_test_by_div0

Firmware name: app, hardware version: V1.0.0, software version: V0.1.0
Fault on interrupt or bare metal(no OS) environment
...
Show more call stack info by run: addr2line -e app.elf -a -f 0101f812 0101e328 0101e4e2 0101e762 0101e8ca 0101e95c 0101ed18 01013588
```

#### 4.2 调用栈解析

```bash
addr2line -e app.elf -a -f 0101f812 0101e328 0101e4e2 0101e762 0101e8ca 0101e95c 0101ed18 01013588
```

```text
0x0101f812 → fault_test_by_div0    (fault_test.c:34)      ← 出错函数 ✅
0x0101e328 → shellRunCommand       (shell.c:1214)
0x0101e4e2 → shellExec             (shell.c:1458)
0x0101e762 → shellEnter            (shell.c:1658)
0x0101e8ca → shellHandler          (shell.c:1789)
0x0101e95c → shellTask             (shell.c:1863)
0x0101ed18 → shellTaskPort         (shell_port.c:73)
0x01013588 → main                  (main.c:36)
```

#### 4.3 完整调用链

```
main()
  └── shellTaskPort()
      └── shellTask()
          └── shellHandler()
              └── shellEnter()
                  └── shellExec()
                      └── shellRunCommand()
                          └── fault_test_by_div0()  ← HardFault 发生位置
```


---

### 5) 其他发现

#### 5.1 fault_test.c 的 Cortex-M0 兼容性问题

原始 `fault_test.c` 的测试函数使用 `SCB->CCR` 的 `DIV_0_TRP` 和 `UNALIGN_TRP` 位，这些在 Cortex-M0 上**不存在**。

但由于 GCC `-Os` 优化会将确定的除零操作编译为 `UDF` 指令，所以 `fault_test_by_div0` 仍能触发 HardFault（非预期行为，但可用于测试）。

#### 5.2 linker script 配置

确保 `yc3122.ld` 中定义了 CmBacktrace 需要的符号：

```ld
/* cmbacktrace required */
PROVIDE(_stext = .);    /* 代码段起始地址 */
PROVIDE(_etext = .);    /* 代码段结束地址 */
PROVIDE(_sstack = __StackLimit);   /* 栈底地址 */
PROVIDE(_estack = __StackTop);     /* 栈顶地址 */
```


---

### 6) 总结

| 项目 | 修复前 | 修复后 |
|------|--------|--------|
| 第一个调用栈地址 | `0x00000010` (无效) | `0x0101f812` (正确) |
| 能否定位出错函数 | ❌ 不能 | ✅ 能 |
| 完整调用链 | 缺少叶子函数 | 完整 |

**修改文件**：`components/cm_backtrace/cm_backtrace.c`

**修改内容**：在 `cm_backtrace_call_stack` 函数中增加 PC 有效性检测，当 PC 无效时从栈顶扫描获取正确的出错地址。

---

*报告生成日期：2026年1月5日*
