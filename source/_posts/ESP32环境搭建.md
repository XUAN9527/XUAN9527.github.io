---
title: ESP32开发环境搭建
date: 2024-2-19 18:12:00
#updated: 2023-12-04
tags:
- [ESP32]
- [Linux]
categories: 
- [嵌入式]
- [环境搭建]
- [Bluetooth]
description: ESP32 是一款由乐鑫科技开发的低成本、低功耗、具有 Wi-Fi 和蓝牙功能的 SoC 芯片，广泛应用于物联网领域，如智能家居、可穿戴设备、工业控制等。本教程基于windows子系统WSL，官方开发环境ESP-IDF/ESP-ADF。
---

## 开发环境搭建

[ESP-ADF快速上手连接](https://espressif-docs.readthedocs-hosted.com/projects/esp-adf/zh-cn/latest/get-started/index.html#quick-start)
[ESP-IDF快速上手连接](https://docs.espressif.com/projects/esp-idf/zh_CN/stable/esp32/get-started/linux-macos-setup.html#get-started-linux-macos-first-steps)

### 获取ESP-ADF
打开Linux or macOS终端,新建搭建环境所需文件夹。

	mkdir ~/esp
	cd ~/esp

编译 ESP-IDF 需要以下软件包。请根据使用的 Linux 发行版本，选择合适的安装：
Ubuntu 和 Debian:

	sudo apt-get install git wget flex bison gperf python3 python3-pip python3-venv cmake ninja-build ccache libffi-dev libssl-dev dfu-util libusb-1.0-0

CentOS 7 & 8:

	sudo yum -y update && sudo yum install git wget flex bison gperf python3 python3-setuptools cmake ninja-build ccache dfu-util libusbx

Arch:

	sudo pacman -S --needed gcc git make flex bison gperf python cmake ninja ccache dfu-util libusb

克隆最新版ESP-ADF：

	git clone --recursive https://github.com/espressif/esp-adf.git

若克隆失败，尝试以下指令：

	git clone --recursive git@github.com:espressif/esp-adf.git

若子模块拉取失败，尝试手动逐个拉取子模块：

	cd ~/esp/esp-adf/components
	git clone git@github.com:espressif/esp-adf-libs.git

	cd ~/esp/esp-adf/components
	git clone git@github.com:espressif/esp-sr.git

	cd ~/esp/esp-adf
	git clone git@github.com:espressif/esp-idf.git

### 设置环境变量
按自己实际路径，可按自己喜好设置，也可不配置，手动敲指令也可。

`vi ~/.bashrc`
在后面加上以下代码：
```bash
#开启ESP32编译环境
alias get-idf='. $HOME/esp/esp-adf/esp-idf/export.sh'
alias get-adf='. $HOME/esp/esp-adf/export.sh'
#打开本地文件夹（wsl）
alias open-file='explorer.exe .'
#烧录到设备，并打开监视器，/dev/ttyS15为USB挂载端口，需测试后填写，115200为监视器波特率，与设备UART0波特率对应
alias esp-download='idf.py -p /dev/ttyS15 -b 115200 flash monitor'
export PATH=/home/qx_song/esp/esp-adf/esp-idf/tools:$PATH
export IDF_PATH=/home/qx_song/esp/esp-adf/esp-idf
export ADF_PATH=/home/qx_song/esp/esp-adf
```
保存退出 `:wq`

### 设置工具
除了 ESP-IDF 本身，还需要为支持 ESP32 的项目安装 ESP-IDF 使用的各种工具，比如编译器、调试器、Python 包等。

	cd ~/esp/esp-adf/esp-idf

安装esp32，esp32s2工具，运行以下指令：（按需求安装）

	./install.sh esp32,esp32s2

若需要安装所有工具，运行以下指令：

	./install.sh all

以下为ESP-IDF编译所需环境，请在需要运行ESP-IDF的终端窗口运行以下命令：

	. $HOME/esp/esp-adf/esp-idf/export.sh   

或者使用快捷指令：

	get-idf

## ESP32工程示例

### 开始创建工程
现在，可以准备开发 ESP32 应用程序了。
从 ESP-IDF 中 examples 目录下的 `get-started/hello_world` 工程开始，将 `get-started/hello_world` 工程复制至本地的 ~/esp 目录下：

	cd ~/esp
	get-idf
	cp -r $IDF_PATH/examples/get-started/hello_world .

### 配置工程
	cd ~/esp/hello_world
	idf.py set-target esp32

由于ESP32是单核，默认配置是双核模式，需要配置参数：

	idf.py menuconfig
	Component config -> FreeRTOS ->  [*]Run FreeRTOS only on first core

保存退出

### 编译工程
	idf.py build

### 烧录工程
	idf.py -p PORT flash

请将 PORT 替换为 ESP32 开发板的串口名称。如果 PORT 未经定义，`idf.py` 将尝试使用可用的串口自动连接。

### 合并执行构建、烧录和监视过程：

	idf.py -p PORT [-b BAUD] flash monitor

注：[-b BAUD] 和 monitor 配合使用，BAUD为程序中UART0的波特率	

	idf.py -p /dev/ttyS15 -b  115200  flash monitor	
	idf.py -p [挂载端口]   -b [波特率] flash monitor

### 擦除flash
	idf.py -p PORT erase-flash

若存在需要擦除的 OTA 数据，请运行以下命令：

	idf.py -p PORT erase-otadata

### 挂载端口

#### windows 子系统 wsl
输入烧录指令：

	idf.py flash

观察终端设备是挂载在哪个端口上，有ERROR忽略，选择端口例如 `/dev/ttyS15`，程序中`UART0`的波特率115200，下次就可以直接输此端口就可以烧录啦。

	idf.py -p /dev/ttyS15 -b 115200 flash monitor	

如果 ESP-IDF 监视器在烧录后很快发生错误，或打印信息全是乱码（如下），很有可能是因为开发板采用了 26 MHz 晶振，而 ESP-IDF 默认支持大多数开发板使用的 40 MHz 晶振。

	x���ff�f�����`�~�~���f���x��f�f�����ff��`���f����`��~x������ff�f�����`�~�~�f����f����f`���x��f�f�����ff��`���f

此时，可以：
1、退出监视器。
2、返回 idf.py menuconfig。
3、进入 Component config --> Hardware Settings --> Main XTAL Config --> Main XTAL frequency 进行配置，将 CONFIG_XTAL_FREQ_SEL 设置为 26 MHz。
4、重新编译和烧录应用程序。

#### 总结
启动终端ESP32编译只需要进行以下步骤：

	. $HOME/esp/esp-adf/esp-idf/export.sh	//开启编译环境
	idf.py set-target esp32			//首次搭建项目时配置
	idf.py menuconfig   			//选择需要的配置
	idf.py build
	idf.py flash

快捷方式：

	get-idf
	idf.py set-target esp32
	idf.py menuconfig
	idf.py build
	esp-download