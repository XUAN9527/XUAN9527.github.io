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

注意：组件目录`components`名字不能改，其下的组件名可以随意取。build目录是编译时生成的，编译的结果都放在其中。`dependencies.lock`是随原来的项目复制过来的不要改。`sdkconfig`文件可以用`idf.py menuconfig`命令修改。

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
**基本外设**：OV3660（camera） + ILI9341（LCD）
- 当前`IDF5.4`版本在配置时可以连接下载组件，但是有时候网络不好，连接超时。

1. 修改 `Git` 的 `URL` 为镜像源（如 `Gitee`）
``` shell
# 修改 Git 的 URL 为镜像源（如 Gitee）
git config --global url."https://gitee.com/espressif/esp32-camera.git".insteadOf "https://github.com/espressif/esp32-camera.git"
# 发现没这个连接,自己去找别的镜像

# 查看当前 Git 的 URL 替换规则
git config --global --get-regexp "url\..*\.insteadOf"
# 删除 Gitee 镜像的替换规则
git config --global --unset url."https://gitee.com/espressif/esp32-camera.git".insteadOf
# 或者直接修改回 GitHub 官方源（可选）
git config --global url."https://github.com/espressif/esp32-camera.git".insteadOf "https://gitee.com/espressif/esp32-camera.git"
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