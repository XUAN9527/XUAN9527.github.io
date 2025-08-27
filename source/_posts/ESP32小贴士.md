---
title: ESP32开发小贴士
date: 2024-2-22 11:34:40
#updated: 2023-12-04
tags:
- [ESP32]
categories: 
- [ESP32解决方案]
description: ESP32 在构建工程，添加组件，编译等步骤上会遇到一些小问题，此文档会记录开发过程中遇到的一些问题，并提供自测的解决方案。
---

## ESP32 ESP-IDF自定义组件

### 简介

#### 官方文档
[英文官方文档链接](https://link.zhihu.com/?target=https%3A//docs.espressif.com/projects/esp-idf/en/latest/esp32/api-guides/build-system.html%23component-cmakelists-files)
[中文官方文档链接](https://link.zhihu.com/?target=https%3A//docs.espressif.com/projects/esp-idf/zh_CN/latest/esp32/api-guides/build-system.html%23id21)

#### 示例说明
此示例在《**ESP32 smart_config和airkiss配网**》
https://zhuanlan.zhihu.com/p/440454542
https://link.zhihu.com/?target=https%3A//blog.csdn.net/chentuo2000/article/details/121687760
基础上，增加连接成功后点亮板载LED功能。
实现所需功能后将各功能代码分离，再将分离后的代码构造成组件，使得项目有清晰的结构，方便功能代码移植.

### 开发环境

以下有三种方法：

1. 《Win10启用Linux子系统安装Ubuntu》
https://link.zhihu.com/?target=https%3A//blog.csdn.net/chentuo2000/article/details/112131624

2. 《用乐鑫国内Gitee镜像搭建ESP32开发环境》
https://link.zhihu.com/?target=https%3A//blog.csdn.net/chentuo2000/article/details/113424934

3. 《ESP32环境搭建》（自己写的环境搭建）
https://xuan9527.github.io/2024/02/19/ESP32%E7%8E%AF%E5%A2%83%E6%90%AD%E5%BB%BA/

### 构建项目

#### 拷贝 && 初始化例程

将例子项目`hello_world`复制到`ESP-IDF`开发工具之外,更名为`components_demo`:

	cd ~/esp
	cp -r ~/esp/esp-adf/esp-idf/examples/get-started/hello_world ./components_demo

清空`build`目录:

	cd ~/esp/components_demo
	rm -r build/*

注意，每当添加了新组件就要删除`build`目录下的全部内容，或者执行下面这条命令：

	idf.py fullclean

清除以前的构建。

#### 添加组件letter_shell

	idf.py -C components create-component letter_shell

该命令会创建一个新组件,新组件将包含构建组件所需的一组空文件。我们的工作就是在这一组空文件中写上我们的代码。
如果熟悉了组件结构，也可以直接在项目中手工创建。

#### 项目树
构建好的项目结构如下:

![component_demo设备树](../pictures/component_demo设备树.png)

**注意：**
- 组件目录`components`名字不能改，其下的组件名可以随意取。`build`目录是编译时生成的，编译的结果都放在其中。`dependencies.lock`是随原来的项目复制过来的不要改。`sdkconfig`文件可以用`idf.py menuconfig`命令修改。
- `idf_component.yml`是新版自动链接下载文件，以下是`esp32-camera`依赖组件，下拉在`managed_components`里。
``` 
dependencies:
  esp32-camera:
    git: git@github.com:espressif/esp32-camera.git
```
<br>

### 代码和说明
各文件的位置关系很重要，请对照前面的项目树看代码文件。

#### 项目的根CMakeLists.txt文件

	# The following lines of boilerplate have to be in your project's
	# CMakeLists in this exact order for cmake to work correctly
	cmake_minimum_required(VERSION 3.16)

	include($ENV{IDF_PATH}/tools/cmake/project.cmake)
	project(components_demo)

只需要修改`project`中的项目名称。

#### main目录

**CMakeLists.txt**

	idf_component_register(SRCS "main.c"
				INCLUDE_DIRS "."
				PRIV_REQUIRES letter_shell
				REQUIRES nvs_flash)

**main.c**
```c
#include <stdio.h>
#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/queue.h"
#include "esp_log.h"
#include "shell_port.h"
#include "log.h"
#include "nvs_flash.h"

static const char *TAG = "sample test";

void app_main(void)
{
	esp_err_t ret;

    // Initialize NVS.
    ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK( ret );

	esp_log_level_set(TAG, ESP_LOG_INFO);
	ESP_LOGI(TAG,"this is a test program");
    
	userShellInit();

	logInfo("log info!");
	logDebug("log debug!");
	logWarning("log warning!");
	logError("log error!");
	while(1)
	{
		logDebug("log loop!");
		vTaskDelay(pdMS_TO_TICKS(2000));
	}
}
```
头文件`nvs_flash.h`是对系统组件的引用，`shell_port.h`是对自定义组件的引用。

#### letter_shell组件

**CMakeLists.txt**:

``` shell
	idf_component_register(
		SRCS "shell.c"
			"shell_ext.c"
			"log.c"
			"shell_port.c"
		INCLUDE_DIRS "include"
		LDFRAGMENTS "shell.lf"
		REQUIRES driver
	)
```

##### 说明：

1、**PRIV_REQUIRES**
该参数指定对其它自定义组件的依赖，即私有依赖项。

`PRIV_REQUIRES led`表示指出在`smart_config`组件中要用到自定义的`led`组件。组件名字可以加引号，也可以不加。多个组件用空格分开。

2、 **REQUIRES**
该参数指定对系统组件的依赖，即公共依赖项。

`REQUIRES esp_driver_uart` 表示在`letter_shell`组件中要用到系统组件`esp_driver_uart`。

3、系统组件的确定

对于要依赖的系统组件不像私有依赖项那样一目了然，有时我们并不清楚所要的系统组件名称。比如我们不知道需要组件wpa_supplicant，这时我们可以先编译一次，看看错误信息：

![requires_error](../pictures/requires_error.png)

在`CMakeLists.txt`中添加依赖组件`REQUIRES esp_driver_uart`，编译通过。

#### 关于CMakeLists.txt文件
根和每个目录都有一个`CMakeLists.txt`文件，开始遇到的问题是不知道目录结构和怎样写`CMakeLists.txt`文件，要注意每一层目录中`CMakeLists.txt`文件的写法，本文的例子给出了一个简单的示范。对于复杂的项目还需要更多编写`CMakeLists.txt`文件的知识，请看简介中给出的官方文档。

<br>

## ESP32移植Letter_shell问题

### 添加shell组件及其log，编译出错

#### 可能原因:
1) 宏使用不正确: 如果 `SHELL_FREE` 旨在实际释放与 `companions` 对象关联的内存或资源，则当前定义不正确。它应该调用内存管理函数或执行其他必要的清理任务。

1) 编译器警告被视为错误: `-Werror=unused-value` 标志已启用，它将警告视为错误。即使宏使用本身可能不是关键问题，这也可能导致编译失败。

#### 解决方案:

##### 修复 SHELL_FREE 定义:

1) 如果 `companions` 需要内存分配，请更新 `shell_cfg.h` 中的 SHELL_FREE 宏以调用适当的内存管理函数，例如 `free()`。
2) 如果 `companions` 不需要内存管理，请从 `shell_companion.c` 中的第 57 行删除 `SHELL_FREE` 调用；或者将`shell_cfg.h` 中的第 36 行 `SHELL_USING_COMPANION` 的宏定义改为 0。

##### 禁用 -Werror=unused-value (如果适用):

如果您希望将未使用的值警告视为警告而不是错误，您可以暂时在编译期间禁用 `-Werror=unused-value` 标志。但是，通常建议修复底层问题以避免潜在的内存泄漏或资源管理问题。

##### 其他提示:

1) 提供有关您的项目更多信息，例如具体的 ESP-IDF 版本、涉及的组件以及 `SHELL_FREE` 宏的用途。这将有助于了解根本原因并提供更定制的指导。
2) 分享 `shell_cfg.h` 头文件和 `shell_companion.c` 文件的相关部分，以便分析代码结构和上下文。
考虑使用调试器逐步执行代码并检查 `companions` 在 `SHELL_FREE` 调用之前和之后的 值，以了解其使用情况和潜在的内存管理问题。
3) 通过遵循这些步骤并提供更多信息，我可以帮助您有效地解决编译错误并确保您的 ESP-IDF 项目成功构建。

#### 配置shell优先级
将shell的freertos优先级设置为 `tskIDLE_PRIORITY`，为`0`级，跟空闲函数优先级一样，所有其他优先级任务执行完后才会执行 `tskIDLE_PRIORITY`优先级任务。

#### 源代码例程

[ESP32移植letter_shell组件例程](https://github.com/XUAN9527/components_demo)

<br>

## ESP32启动流程解析

<br>

## ESP32-IDF组件下载安装路径

- 安装所需组件：
``` shell
cd ~/esp/esp-adf/esp-idf
./install.sh esp32,esp32s3 # 可按需求安装
```

- 若下载很慢，可按以下路径在`Windows`/`Linux`下载:
``` shell
cd ~/esp/esp-adf/esp-idf/tools
vim tools.json
{
  "tools": [
    {
      "description": "GDB for Xtensa",
      "export_paths": [
        [
          "xtensa-esp-elf-gdb",
          "bin"
        ]
      ],
      "export_vars": {},
      "info_url": "https://github.com/espressif/binutils-gdb",
      "install": "always",
      "license": "GPL-3.0-or-later",
      "name": "xtensa-esp-elf-gdb",
      "supported_targets": [
        "esp32",
        "esp32s2",
        "esp32s3"
      ],
      "version_cmd": [
        "xtensa-esp-elf-gdb-no-python",
        "--version"
      ],
      "version_regex": "GNU gdb \\(esp-gdb\\) ([a-z0-9.-_]+)",
      "versions": [
        {
          "linux-amd64": {
            "sha256": "b5f7cc3e4b5a58db655754083ed9652e4953e71c3b4922fb624e7a034ec24a64",
            "size": 26947336,
            "url": "https://github.com/espressif/binutils-gdb/releases/download/esp-gdb-v11.2_20220823/xtensa-esp-elf-gdb-11.2_20220823-x86_64-linux-gnu.tar.gz"
          },
          "linux-arm64": {
            "sha256": "816acfae38b6b443f4f1590395f68f079243539259d19c7772ae6416c6519444",
            "size": 27134508,
            "url": "https://github.com/espressif/binutils-gdb/releases/download/esp-gdb-v11.2_20220823/xtensa-esp-elf-gdb-11.2_20220823-aarch64-linux-gnu.tar.gz"
          },
          "linux-armel": {
            "sha256": "4dd1bace0633196fddfdcef3cebcc4bbfce22f5a0d2d1e3d618f3d8a6cbfcacc",
            "size": 25205239,
            "url": "https://github.com/espressif/binutils-gdb/releases/download/esp-gdb-v11.2_20220823/xtensa-esp-elf-gdb-11.2_20220823-arm-linux-gnueabi.tar.gz"
          },
          "linux-armhf": {
            "sha256": "53a142b9a508a8babe6b7edf3090bb49e3714380ba819b54052425fcf1ac6f9c",
            "size": 23491575,
            "url": "https://github.com/espressif/binutils-gdb/releases/download/esp-gdb-v11.2_20220823/xtensa-esp-elf-gdb-11.2_20220823-arm-linux-gnueabihf.tar.gz"
...
```

## ESP32网络问题

**基本外设**：`camera: OV3660` + `LCD: ILI9341`
- 当前`IDF5.4`版本在配置时可以连接下载组件，但是有时候网络不好，连接超时。

1. 修改 `Git` 的 `URL` 为镜像源（如 `Gitee`）
``` shell
# 修改 Git 的 URL 为镜像源（如 Gitee）
git config --global url."git@github.com:espressif/esp32-camera.git".insteadOf "https://github.com/espressif/esp32-camera.git"

# 查看当前 Git 的 URL 替换规则
git config --global --get-regexp "url\..*\.insteadOf"
# 删除 Gitee 镜像的替换规则
git config --global --unset url."https://gitee.com/espressif/esp32-camera.git".insteadOf
# 或者直接修改回 GitHub 官方源（可选）
git config --global url."https://github.com/espressif/esp32-camera.git".insteadOf "git@github.com:espressif/esp32-camera.git"
```

2. `GitHub` 限流：频繁克隆可能触发限流，稍后再试。

3. 下载 `esp32-camera`
- 从 `GitHub` 直接下载压缩包：https://github.com/espressif/esp32-camera/archive/refs/heads/master.zip
- 解压后放到 `ESP-IDF` 的组件目录中：
``` shell
unzip esp32-camera-master.zip
mv esp32-camera-master ~/esp/esp-adf/esp-idf/components/esp32-camera
```

修改项目的 `CMakeLists.txt`, 确保项目能找到本地组件，例如：
``` cmake
set(EXTRA_COMPONENT_DIRS ~/esp/esp-adf/esp-idf/components/esp32-camera)
```

**常见问题处理**
- 依赖未更新：修改`idf_component.yml`后需运行`idf.py reconfigure`重新解析。
- 本地组件覆盖：若同时存在本地组件和注册表同名组件，优先使用路径引用的本地版本。
- 锁文件冲突：若`dependencies.lock`被误改，删除后重新运行`reconfigure`即可恢复。

## ESP32对sdkconfig的解释

当`IDF`的版本不一样时，`sdkconfig`如果不加修改就直接用，大概率会跑飞，需要根据实际情况进行修改。

- `sdkconfig`
  - 实际构建时生成的最终配置
  - 合并了所有默认配置和`menuconfig`的修改
  - 是实际编译使用的配置文件

- `sdkconfig.defaults`
  - 项目级别的默认配置
  - 包含WiFi凭据、分区表、网络设置等应用层配置
  - 覆盖芯片特定配置中的部分设置

- `sdkconfig.defaults.esp32s3`
  - 芯片特定的默认配置（针对`ESP32-S3`）
  - 包含`PSRAM`配置、缓存设置、外设配置
  - 主要用于定义硬件相关的基础配置

## RTSP推流问题

- `VLC`可能认为`192.168.4.2`是主机`IP`，没有请求`192.168.4.1`，需要注意修改。

<br>

## ESP32S3开发摄像头模组

### 编译环境
- **Linux Ubuntu 22.04**
- **ADF v2.7-105-g4200c64d** 
- **IDF v5.4.1-851-gb3d3a82daa**

### 创建仓库，设计框架
- 复制一个`DEMO`创建仓库，有`main.c`函数，能跑通。
- 添加`components`:
``` shell
idf.py -C components create-component lcd_camera
// 下载esp32-camera组件，地址：git@github.com:espressif/esp32-camera.git
mv -rf esp32-camera ${workspaceFolder}/components
```

- `main`文件夹里注释掉注释掉`idf_component.yml`和`Kconfig.projbuild`，我们这里暂时不使用自动下载依赖工具和`idf.py menuconfig`配置，后发现其他组件如`esp32-camera`组件中也会有`.yml`文件，暂时从网上更新拉取依赖，后期再做隔离。

- 编写顶层`CmakeLists.txt`，注意，`ESP-IDF`构建系统并不会自动为每个组件添加所有依赖关系，需要显式地告诉`CMake`每个组件依赖谁，以下便是会扫描这些路径，看看里面有没有组件（`components`）,但是还需要再文件使用时添加依赖的组件，如：`REQUIRES esp_wifi`。
``` CmakeLists
cmake_minimum_required(VERSION 3.5)

include($ENV{ADF_PATH}/CMakeLists.txt)
include($ENV{IDF_PATH}/tools/cmake/project.cmake)

# file(GLOB_RECURSE SOURCES "main/*.c")
# set(EXTRA_COMPONENT_DIRS "components")

set(EXTRA_COMPONENT_DIRS
    components
)

project(camera_test)
```
- 以上可分为三步：
  - `set(EXTRA_COMPONENT_DIRS ...)`告诉`CMake`哪里有组件目录，仅是可见范围，不代表使用。
  - `idf_component_register()`声明一个组件（模块），必须有，才能被当成组件处理。
  - `PRIV_REQUIRES` / `REQUIRES`显式声明我依赖谁，必须手动写，否则链接失败或头文件找不到。

  **建议**：可以保持`EXTRA_COMPONENT_DIRS`写法用于组件扫描；但每一个`.c`文件所在组件，都必须有自己明确依赖的组件声明。

<br>

- `main`主文件夹的`CmakeLists.txt`:
``` CmakeLists
idf_component_register(
    SRCS "main.c"
    INCLUDE_DIRS "."

    REQUIRES
        lcd_camera
        wifi_softap
        rtsp_server
        http_server
        web_mjpeg_server
)
```

<br>

⚡ 为什么 `main` 里不需要 `REQUIRES`，在其他组件需要手动添加依赖？
- 因为 `main` 是特殊组件，它会自动看到整个工程的公共 `include path` 和链接库。
- 但单独组件要访问其它组件的 `API`，就必须在 `idf_component_register` 里 `REQUIRES` 指明依赖。

**自动依赖与显式依赖的区别**:
- `main`里没写 `REQUIRES/PRIV_REQUIRES`，就像“放开手脚，扫描所有能找到的组件”，所以可能包含了 `esp_http_server`。
- `main`里写了 `REQUIRES/PRIV_REQUIRES`，就像“限定只扫描你指定的组件及依赖”，没写的组件不会被扫描。

**大致查找顺序是这样**：
1. 项目本地组件目录
- 默认是项目根目录下的 `components/` 文件夹， 此目录为默认组件目录，`set(EXTRA_COMPONENT_DIRS xxx)`时可不添加。
- 如果设置了 `EXTRA_COMPONENT_DIRS`，也会优先按顺序在这些路径里查找
2. `ESP-IDF` 自带组件目录
- 即 `$IDF_PATH/components`
3. 通过 `idf.py add-dependency` 或 `dependencies.lock` 下载的 `managed_components`
- 存放在 `managed_components/` 中,这些优先级比 `IDF` 内置高，但低于项目本地组件

**现在有两种方法**：
1. 在线方法：保留`managed_components`，在编译的时候会对比网上拉取的最新固件版本，并更新，无网络时有风险。
2. 离线方法：新建`offline_components`，拷贝`managed_components`的所有数据到`offline_components`，删除`managed_components`，在顶层`CmakeLists.txt`中添加，但可能组件更新不及时，落后主分支：
``` CmakeLists
set(EXTRA_COMPONENT_DIRS
	"components"
	"offline_components"		 # 添加离线组件路径
	"$ENV{ADF_PATH}/components"  # 显式添加ESP-ADF组件路径, 上面 include($ENV{ADF_PATH}/CMakeLists.txt) 未生效
)
```

**特别的解释(解释ADF_PATH环境中的components未生效)**：
- `ADF_PATH/CMakeLists.txt` → 加载 `ADF` 的构建逻辑（不一定包含组件路径）。
- `EXTRA_COMPONENT_DIRS += ADF_PATH/components` → 确保 `ADF` 组件能被找到。
- 如果去掉 `ADF_PATH/components`，可能会导致 部分 `ADF` 组件无法被扫描到，编译时报错。

<br>

## 流媒体协议全解析：RTSP/RTP/TCP/UDP

## 摄像头推流问题汇总

1. **可能的问题点**：
- 帧率控制问题：
	- 当前实现没有稳定的帧率控制
	- 帧间隔计算不准确导致画面抖动
- RTP时间戳错误：
	- 时间戳单位不正确（应该是`90kHz`）
	- 时间戳增量不固定导致画面抖动
- JPEG头格式问题：
	- 类型特定(`type specific`)字段需要正确设置
	- `Q`因子设置不合理
- 网络稳定性:
	- `UDP`发送缓冲区不足
	- 缺少重传机制

<br>

2. **分析调试**：
- `frame2jpg(fb, 60, &jpeg_buf, &jpeg_len)`这个函数转换需要`100ms~150ms`，很慢。`PIXFORMAT_RGB565`适合LCD显示；`PIXFORMAT_JPEG`，只推流不显示速度会快很多，同时有以下问题。
<br>

- `camera`硬件解码（`PIXFORMAT_JPEG`）`VLC`显示闪屏：
	- 已排除`errno=12` 对应 `ENOMEM`，即系统内存不足（尤其是 `LWIP UDP` 发送缓冲区）。这说明 `UDP` 发送缓冲区或堆内存压力过大，导致 `RTP` 数据包发送失败，从而客户端播放时卡顿闪屏。
	- 已排除`Quant Table` 缺失`（q≠0）`
	- 已排除`VLC` 播放器问题
	- 已排除`AP/UDP` 网络不稳定
	- 已排除 `JPEG` 数据不完整
<br>

- 调试发现与`RTP JPEG Type`有很大关系，问题测试过程如下：

| 图像来源                | JPEG 类型内容    | RTP JPEG Type | 是否闪屏  | 说明   |
| ------------------- | ------------ | ------------- | ----- | ---- |
| 摄像头原生 JPEG          | 包含 DQT/DHT   | `Type = 0`    | ❌ 不闪屏 | ✅ 正确 |
| 摄像头原生 RGB565        | 无 JPEG       | `Type = 1`    | ❌ 不闪屏 | ✅ 正确 |
| JPEG → RGB565 → RTP | 原图有 DQT/DHT  | `Type = 0`    | ⚠️ 闪屏 | ❌ 错误 |
| JPEG → RGB565 → RTP | 原图有 DQT/DHT  | `Type = 1`    | ❌ 不闪屏 | ✅ 正确 |
| RGB565 → 软件 JPEG 编码 | 编码包含 DQT/DHT | `Type = 0`    | ❌ 不闪屏 | ✅ 正确 |
| RGB565 → 软件 JPEG 编码 | 编码包含 DQT/DHT | `Type = 1`    | ⚠️ 闪屏 | ❌ 错误 |

<br>

- `RTP JPEG Type` 设置错误带来的解码行为：

| Type 值     | VLC 等播放器行为                                 |
| ---------- | ------------------------------------------ |
| `Type = 0` | 播放器使用 JPEG 内嵌的 DQT/DHT 表进行解码（需 JPEG 包含完整头） |
| `Type = 1` | 播放器使用默认内置表（RFC2435 附录）进行解码，忽略图像中 DQT       |

✅**核心推论**：🚨 不管图像来源是否是 `JPEG`，如果你用 `RTP Type = 0`，就必须确保 `JPEG` 中包含 `DQT/DHT`！否则 `VLC` 会闪屏？

- 添加打印以验证分析理论：
- 前置条件：`RGB565` → 软件 `JPEG` 编码; `type = 0`。
``` c
// 检测 JPEG 是否包含 DQT 段 (0xFFDB)
static bool jpeg_has_dqt(const uint8_t *data, size_t len) {
    size_t i = 2; // 跳过 SOI 0xFFD8
    while (i + 4 <= len) {
        if (data[i] != 0xFF) {
            // 非法 marker
            break;
        }

        uint8_t marker = data[i + 1];
        // 0xFFDA 是 SOS，之后是压缩数据段，不再查找
        if (marker == 0xDA) {
            break;
        }

        // 跳过填充的 0xFF（合法 JPEG 允许多个）
        while (marker == 0xFF && i + 2 < len) {
            i++;
            marker = data[i + 1];
        }

        // marker 长度字段位于 i+2，2 字节
        if (i + 4 > len) break;
        uint16_t segment_length = (data[i + 2] << 8) | data[i + 3];
        if (segment_length < 2) break;

        if (marker == 0xDB) {
            return true; // DQT 找到了
        }

        i += 2 + segment_length;
    }

    return false;
}

... ...

// 检测是否包含 DQT，决定 RTP JPEG Type (在校验完报头时打印)
	bool has_dqt = jpeg_has_dqt(jpeg, len);
	uint8_t type = has_dqt ? 0 : 1;
	ESP_LOGI(TAG, "JPEG header: %02X %02X, has_dqt=%s → type=%d", jpeg[0], jpeg[1], has_dqt ? "YES" : "NO", type);

... ...

// 打印结果说明具有0xFFD8，包含DQT。
I (19451) RTSP_SERVER: JPEG header: FF D8, has_dqt=YES → type=0
```

<br>

- 前置条件：`RGB565` → 软件 `JPEG` 编码; `type = 1`。
``` shell
// 打印结果说明具有0xFFD8，包含DQT。
I (19451) RTSP_SERVER: JPEG header: FF D8, has_dqt=YES → type=0
```

<br>

- 结论：有 `DQT ≠` 可以用 `type=0`，只有 摄像头生成的标准 `JPEG`（完全按` MJPEG over RTP` 规范压缩的）才能稳定使用 `type=0`，否则必须使用 `type=1`。

<br>

3. **结论总结**：

<br>

## ESP32S3偶发性重启

**idf.py menuconfig**:
- Component config → LWIP → TCP -> (65535) Default send buffer size
- Component config ---> HTTP Server ---> [*] WebSocket server support (CONFIG_HTTPD_WS_SUPPORT=y)
- 会出现重启、传输时阻塞卡死、画面卡住以下是常见的`error`日志：
``` shell
I (782633) RTSP_SERVER: Streaming: 10 FPS, 50 pkts, 5619 bytes, 0 errs (0.0%)
W (782833) RTSP_SERVER: Sendto failed at offset 2760, errno=12 (Not enough space)
W (782833) RTSP_SERVER: Non-first packet failed at offset 2760, continuing
W (782843) RTSP_SERVER: Sendto failed at offset 4140, errno=12 (Not enough space)
W (782843) RTSP_SERVER: Non-first packet failed at offset 4140, continuing
W (782853) RTSP_SERVER: Sendto failed at offset 5520, errno=12 (Not enough space)
W (782863) RTSP_SERVER: Non-first packet failed at offset 5520, continuing
W (782963) RTSP_SERVER: Sendto failed at offset 0, errno=12 (Not enough space)
... ...
E (560523) RTSP_SERVER: Fatal send error: errno=-1
W (560523) RTSP_SERVER: Sendto failed at offset 0, errno=-1 ()
W (560523) RTSP_SERVER: Drop frame due to send failure at offset 0 (critical)
... ...
W (1638) cam_hal: NO-SOI
Guru Meditation Error: Core  0 panic'ed (LoadProhibited). Exception was unhandled.

Core  0 register dump:
PC      : 0x4037770b  PS      : 0x00060033  A0      : 0x8201981a  A1      : 0x3fc9e0c0  
--- 0x4037770b: ll_cam_send_event at /home/ubuntu/esp/work/camera_test/managed_components/esp32-camera/driver/cam_hal.c:107

A2      : 0x00060523  A3      : 0x00000001  A4      : 0x3fc9e0f0  A5      : 0x3fcad5f0  
A6      : 0x00060d23  A7      : 0x00000000  A8      : 0x03c9bc78  A9      : 0x01ffffff  
A10     : 0x3fc9bc78  A11     : 0x3fc9e0c0  A12     : 0x3fc9e0f0  A13     : 0x00000000  
A14     : 0x3fc9c604  A15     : 0x0000cdcd  SAR     : 0x00000000  EXCCAUSE: 0x0000001c  
EXCVADDR: 0x0006054b  LBEG    : 0x00000000  LEND    : 0x00000000  LCOUNT  : 0x00000000  


Backtrace: 0x40377708:0x3fc9e0c0 0x42019817:0x3fc9e0f0 0x40376ae1:0x3fc9e120 0x40377d3d:0x3fc9e140 0x4037b66b:0x3fcad660 0x42004db6:0x3fcad680 0x403801f1:0x3fcad6a0 0x4037f04d:0x3fcad6c0
--- 0x40377708: ll_cam_send_event at /home/ubuntu/esp/work/camera_test/managed_components/esp32-camera/driver/cam_hal.c:107
--- 0x42019817: ll_cam_vsync_isr at /home/ubuntu/esp/work/camera_test/managed_components/esp32-camera/target/esp32s3/ll_cam.c:106
--- 0x40376ae1: shared_intr_isr at /home/ubuntu/esp/esp-adf/esp-idf/components/esp_hw_support/intr_alloc.c:464
--- 0x40377d3d: _xt_lowint1 at /home/ubuntu/esp/esp-adf/esp-idf/components/xtensa/xtensa_vectors.S:1240
--- 0x4037b66b: xt_utils_wait_for_intr at /home/ubuntu/esp/esp-adf/esp-idf/components/xtensa/include/xt_utils.h:82
---  (inlined by) esp_cpu_wait_for_intr at /home/ubuntu/esp/esp-adf/esp-idf/components/esp_hw_support/cpu.c:55
--- 0x42004db6: esp_vApplicationIdleHook at /home/ubuntu/esp/esp-adf/esp-idf/components/esp_system/freertos_hooks.c:58
--- 0x403801f1: prvIdleTask at /home/ubuntu/esp/esp-adf/esp-idf/components/freertos/FreeRTOS-Kernel/tasks.c:4341 (discriminator 1)
--- 0x4037f04d: vPortTaskWrapper at /home/ubuntu/esp/esp-adf/esp-idf/components/freertos/FreeRTOS-Kernel/portable/xtensa/port.c:139

ELF file SHA256: 6ae9a007e

Rebooting...
���ESP-ROM:esp32s3-20210327
Build:Mar 27 2021
rst:0xc (RTC_SW_CPU_RST),boot:0x28 (SPI_FAST_FLASH_BOOT)
Saved PC:0x40375da1
--- 0x40375da1: esp_restart_noos at /home/ubuntu/esp/esp-adf/esp-idf/components/esp_system/port/soc/esp32s3/system_internal.c:162
... ...

W (18220) cam_hal: FB-OVF
W (18310) cam_hal: FB-OVF
W (18320) cam_hal: NO-EOI
E (18320) lcd_camera: hardware jpeg get failed!
W (18330) cam_hal: FB-OVF
W (18460) cam_hal: FB-OVF
W (18460) cam_hal: NO-EOI
W (18470) cam_hal: FB-OVF
```

- 注释法，轮流注释`camera`和`作对比`。
	- 用`JPEG`格式（`PIXFORMAT_JPEG`）采集数据会有概率重启?

- `jpeg`转换成`rgb565`，参数跟`demo`有点不同.
``` c
// jpg2rgb565原始函数显示花屏，需要.flags.swap_color_bytes = 1
static uint8_t work[3100];
bool myjpg2rgb565(const uint8_t *src, size_t src_len, uint8_t * out, esp_jpeg_image_scale_t scale)
{
    esp_jpeg_image_cfg_t jpeg_cfg = {
        .indata = (uint8_t *)src,
        .indata_size = src_len,
        .outbuf = out,
        .outbuf_size = UINT32_MAX, // @todo: this is very bold assumption, keeping this like this for now, not to break existing code
        .out_format = JPEG_IMAGE_FORMAT_RGB565,
        .out_scale = scale,
        .flags.swap_color_bytes = 1,
        .advanced.working_buffer = work,
        .advanced.working_buffer_size = sizeof(work),
    };

    esp_jpeg_image_output_t output_img = {};

    if(esp_jpeg_decode(&jpeg_cfg, &output_img) != ESP_OK){
        return false;
    }
    return true;
}
```

<br>

## ESP32系列初始化

### `NVS`（`Non-Volatile Storage`，非易失性存储）初始化：
``` c
esp_err_t ret = nvs_flash_init(); 
if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) 
{ 
	ESP_ERROR_CHECK(nvs_flash_erase()); 
	ret = nvs_flash_init(); 
}
ESP_ERROR_CHECK(ret);
```

1. 初始化 `NVS`
- `nvs_flash_init()` 会挂载 `NVS` 分区（通常是 `flash` 里一个叫 "`nvs`" 的分区）。
- `NVS` 是一个 `key-value` 存储系统，可以用来保存 `Wi-Fi` 配置、设备状态、参数等，断电不会丢失。
- ESP32 内部很多系统组件（比如 `Wi-Fi`）都依赖 `NVS` 存储。

2. 处理版本或容量异常
- `ESP_ERR_NVS_NO_FREE_PAGES`：表示 `NVS` 分区空间不足，无法再写入新的 `key-value`（可能是结构变化后旧数据无效占用空间）。
- `ESP_ERR_NVS_NEW_VERSION_FOUND`：表示固件更新后，`NVS` 的结构版本与当前 `IDF` 版本不兼容（比如升级了 `ESP-IDF`）。
- 这两种情况都需要 擦除 `NVS` 分区 再重新初始化。

3. 调用 `nvs_flash_erase()`
- 会清空整个 `NVS` 分区（相当于恢复出厂设置）。
- 然后再次调用 `nvs_flash_init()` 完成初始化。

4. `ESP_ERROR_CHECK(ret)`
- 如果 `ret` 不是 `ESP_OK`，会直接报错并终止程序（方便调试）。

💡 总结
- 这段代码的目的是：**确保 NVS 存储可用且结构版本匹配**，否则会自动清空并重新初始化。
- 这是很多 `ESP-IDF` 项目都会放在 `app_main()` 开头的“惯用初始化代码”，特别是 `Wi-Fi` 或 `BLE` 工程。
- 如果你不用 `NVS`，可以不加，但 `ESP-IDF` 内部有些 `API` 会自动依赖它，比如 `esp_wifi_init()`。