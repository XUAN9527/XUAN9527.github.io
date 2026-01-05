---
title: MCU搭载C++算法
date: 2025-01-31 12:11:02
tags:
- [MCU]
- [C]
- [C++]
categories: 
- [嵌入式]
description: C++算法编译打包成.a文件，配合.h接口供给MCU使用。
---

## 开发环境

- wsl1 ubuntu 20.04
- gcc-arm-none-eabi-9-2019-q4-major
- N32G452REL7开发板(rt-thread nano)

## C++端配置和打包

- **文件夹结构**
```shell
my_math
    ├── build
    │   ├── libmy_math.a
    │   └── my_math.o
    ├── include
    │   └── my_math.h
    ├── Makefile
    └── src
        └── my_math.cpp
```

- `my_math.h`
```c
#ifndef MY_MATH_H
#define MY_MATH_H

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief 对输入数组执行处理并返回浮点结果
 * @param data 输入数组
 * @param len  数组长度
 * @return 浮点结果
 */
float my_process(const float* data, int len);

#ifdef __cplusplus
}
#endif

#endif // MY_MATH_H
```

- `my_math.cpp`
```cpp
#include "my_math.h"
#include <vector>
#include <cmath>

/**
 * 思想：输入数组 -> 拷贝到动态buffer -> 处理 -> 输出平均值(示例)
 */
float my_process(const float* data, int len) {
    if (data == nullptr || len <= 0) {
        return 0.0f;
    }

    // 动态容器（内部malloc）
    std::vector<float> buf;
    buf.reserve(len);

    // 拷贝
    for (int i = 0; i < len; i++) {
        buf.push_back(data[i]);
    }

    // 浮点运算示例：计算均方根
    float sum = 0.0f;
    for (int i = 0; i < len; i++) {
        sum += buf[i] * buf[i];
    }
    float rms = std::sqrt(sum / (float)len);

    return rms;
}
```

- `Makefile` 文件，关键配置：`-mfpu=fpv4-sp-d16` `-mfloat-abi=hard` `-std=c++11`
```makefile
# ======= 编译器选项 =======
CC = arm-none-eabi-g++
AR = arm-none-eabi-ar

# ======= FPU & 优化 =======
CFLAGS = -mcpu=cortex-m4 \
         -mthumb \
         -mfloat-abi=hard \
         -mfpu=fpv4-sp-d16 \
         -Os \
         -ffunction-sections \
         -fdata-sections \
         -std=c++11 \
         -Wall

INCLUDE = -Iinclude

# ======= 路径定义 =======
SRC_DIR = src
BUILD_DIR = build

# ======= 自动扫描所有源文件 =======
SOURCES := $(wildcard $(SRC_DIR)/*.cpp)

# ======= 自动生成对应对象文件名 =======
OBJECTS := $(patsubst $(SRC_DIR)/%.cpp,$(BUILD_DIR)/%.o,$(SOURCES))

# ======= 输出静态库 =======
LIB = $(BUILD_DIR)/libmy_math.a

# ======= 默认目标 =======
all: $(LIB)

# ======= 创建静态库 =======
$(LIB): $(OBJECTS)
	$(AR) rcs $@ $^

# ======= 编译 .cpp 到 .o =======
$(BUILD_DIR)/%.o: $(SRC_DIR)/%.cpp | $(BUILD_DIR)
	$(CC) $(CFLAGS) $(INCLUDE) -c $< -o $@

# ======= 创建 build 目录 =======
$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

# ======= 清理 =======
clean:
	rm -rf $(BUILD_DIR)

.PHONY: all clean
```

## MCU端配置和打包

- **添加文件夹**
```shell
lib
 ├── libmy_math.a
 └── my_math.h
```

- `Makefile`中添加
```makefile
# mcu中添加配置
MCU = -mcpu=cortex-m4 -mthumb \
	-mfpu=fpv4-sp-d16 -mfloat-abi=hard \ # 增加硬浮点编译
	-ffunction-sections \
	-fdata-sections \
	--specs=nosys.specs \
	-Os -ggdb

# 头文件路径加上lib
INCLUDE += -Ilib

# 最后链接添加lib
TARGET_LIBS += -Llib -lmy_math -lstdc++ -lsupc++ -lm		# 找到 libmy_math.a, C++ runtime lib, math lib

# 增加链接规则
$(TARGET).elf: $(OBJECTS)
	$(CC) $(ASM_OBJECTS) $(C_OBJECTS) $(LDFLAGS) $(TARGET_LIBS) -Wl,-Map=$(TARGET).map -o $(TARGET).elf
```

- `rt-thread nano`需要修改`context_gcc.S`
``` assembly
#if defined (__VFP_FP__) && !defined(__SOFTFP__)
    TST     lr, #0x10           /* if(!EXC_RETURN[4]) */
    IT      EQ					/* 新增适配硬浮点适配：下面一条指令仅在 Z=1 时执行 */
    VSTMDBEQ r1!, {d8 - d15}    /* push FPU register s16~s31 */
#endif

#if defined (__VFP_FP__) && !defined(__SOFTFP__)
    MOV     r4, #0x00           /* flag = 0 */

    TST     lr, #0x10           /* if(!EXC_RETURN[4]) */
    IT      EQ					/* 新增适配硬浮点适配：下面一条指令仅在 Z=1 时执行 */
    MOVEQ   r4, #0x01           /* flag = 1 */

#if defined (__VFP_FP__) && !defined(__SOFTFP__)
    CMP     r3,  #0             /* if(flag_r3 != 0) */
    IT      NE					/* 新增适配硬浮点，下一条指令在 Z=0（比较结果不相等）时执行。 */
    VLDMIANE  r1!, {d8 - d15}   /* pop FPU register s16~s31 */
#endif

    MSR psp, r1                 /* update stack pointer */

#if defined (__VFP_FP__) && !defined(__SOFTFP__)
    ORR     lr, lr, #0x10       /* lr |=  (1 << 4), clean FPCA. */
    CMP     r3,  #0             /* if(flag_r3 != 0) */
    IT      NE					/* 新增适配硬浮点，下一条指令在 Z=0（比较结果不相等）时执行。 */
    BICNE   lr, lr, #0x10       /* lr &= ~(1 << 4), set FPCA. */
#endif
```

## 使用例程

- 使用例程及堆栈
```c
#include "my_math.h"
// 打印rtthread heap的数据信息
static void print_heap(const char* tag)
{
    rt_uint32_t total = 0, used = 0, max_used = 0;
    rt_memory_info(&total, &used, &max_used);
    rt_uint32_t free = total - used;
    logDebug("[%s] heap total=%u used=%u free=%u max_used=%u",
              tag, total, used, free, max_used);
}

#include <unistd.h>  // _sbrk

extern char end;      // 链接器脚本定义的 end，heap 起点
extern char _estack;  // 链接器脚本定义的 stack 顶

// 打印标准heap的数据信息
void print_libc_heap(void)
{
    void* heap_end = _sbrk(0);            // 当前 heap top
    size_t used = (char*)heap_end - &end; // 已用 heap
    size_t free = &_estack - (char*)heap_end; // 剩余给 heap 的空间（理论上）
    
    logDebug("libc heap used=%u, free=%u, heap_start=%p, heap_end=%p, stack_top=%p",
             (unsigned int)used, (unsigned int)free, &end, heap_end, &_estack);
}

void my_test_cpp(int array0)
{
	float arr[1024] = {1,2,3,4,5};
	arr[0] = (float)array0;
	print_heap("before my_process");
	print_libc_heap();
	float out = my_process(arr, sizeof(arr)/sizeof(arr[0]));
	print_heap("after my_process");
	print_libc_heap();
	logDebug("my_test_cpp out = [%f]", out);
}
SHELL_EXPORT_CMD(SHELL_CMD_PERMISSION(0)|SHELL_CMD_TYPE(SHELL_TYPE_CMD_FUNC)|SHELL_CMD_DISABLE_RETURN, my_test_cpp, my_test_cpp, my_test_cpp 1 or 0);

void my_rt_heap_test(void)
{
	for (int i = 0; i < 10; i++)
	{
		int size = 128 * (i + 1);
		print_heap("before my_process");
		void *p = rt_malloc(size);
		if (p)
		{
			logDebug("my_heap_test malloc size = [%d] success, addr = [%p]", size, p);
			rt_memset(p, 0xA5, size);
			rt_free(p);
			print_heap("before my_process");
			logDebug("my_heap_test free addr = [%p]", p);
		}
		else
		{
			logError("my_heap_test malloc size = [%d] failed!", size);
		}
		print_heap("after my_process");
	}
}
SHELL_EXPORT_CMD(SHELL_CMD_PERMISSION(0)|SHELL_CMD_TYPE(SHELL_TYPE_CMD_FUNC)|SHELL_CMD_DISABLE_RETURN, rt_heap_test, my_rt_heap_test, my_rt_heap_test);

void my_heap_test(void)
{
	for (int i = 0; i < 10; i++)
	{
		int size = 128 * (i + 1);
		print_libc_heap();
		void *p = malloc(size);
		if (p)
		{
			logDebug("my_heap_test malloc size = [%d] success, addr = [%p]", size, p);
			memset(p, 0xA5, size);
			free(p);
			print_libc_heap();
			logDebug("my_heap_test free addr = [%p]", p);
		}
		else
		{
			logError("my_heap_test malloc size = [%d] failed!", size);
		}
		print_heap("after my_process");
	}
}
SHELL_EXPORT_CMD(SHELL_CMD_PERMISSION(0)|SHELL_CMD_TYPE(SHELL_TYPE_CMD_FUNC)|SHELL_CMD_DISABLE_RETURN, heap_test, my_heap_test, my_heap_test);
```