---
title: Linux下开发单片机
date: 2024-3-28 11:07:00
#updated: 2023-12-04
tags:
- [Wsl]
- [Linux]
categories: 
- [嵌入式]
- [环境搭建]
description: Linux环境搭建Arm-gcc平台，使用Make编译，方便代码移植。此教程使用Windows10系统的Wsl+Vscode开发，Linux版本为Ubuntu 20.04。
---

## Ubuntu Wsl环境搭建

### Windows10系统安装子系统Wsl

**1. 通过 Microsoft Store 安装**

- 打开 Microsoft Store。
- 搜索 “适用于 Linux 的 Windows 子系统”。
- 选择 “Ubuntu” 或您喜欢的其他 Linux 发行版。
- 点击 “获取”。
- 安装完成后，点击 “启动”。

**2. 通过命令行**

- 打开 PowerShell 或 命令提示符 以管理员身份运行。
- 输入以下命令:
```bash
wsl --install
```

- 重启您的计算机。
- 安装完成后，您可以通过以下命令启动 WSL：

```bash
wsl
```

**注意:**
- WSL 需要 Windows 10 版本 1709 或更高版本。
- 您可以通过以下命令检查您的 Windows 版本：

```bash
winver
```

- 如果您使用的是 Windows 10 家庭版，您需要启用 “**适用于 Linux 的 Windows 子系统**” 功能：
```bash
控制面板->程序和功能->启用或关闭 Windows 功能->适用于 Linux 的 Windows 子系统->确定
```

- 您可以通过以下命令启用 “**适用于 Linux 的 Windows 子系统**” 功能：
```bash
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux
```

- 重启您的计算机后，您就可以通过上述方法安装 WSL 了。

安装Windows Terminal

### 编译环境配置

- gcc-arm-none-eabi工具链安装
	- 手动安装：[官方链接地址](https://developer.arm.com/downloads/-/gnu-rm) 下载所需版本；
	```bash
	sudo apt install bzip2
	sudo tar -xvf ~/n32_gcc/software_package/gcc-arm-none-eabi-9-2019-q4-major-x86_64-linux.tar.bz2 -C ~/n32_gcc
	```
	- 自动安装：sudo apt-get install gcc-arm-none-eabi
	- 打开 ~/.bashrc
	- 添加export PATH=$PATH:~/n32_gcc/gcc-arm-none-eabi-9-2019-q4-major/bin
	- 添加alias open-file='explorer.exe .'
	- 使能用户环境变量source ~/.bashrc

- Make
	- sudo apt-get install make

### Winodows Gcc + Make 环境搭建

- 安装software_package目录下的gcc-arm-none-eabi-9-2019-q4-major-win32-sha2.exe和make-3.81.exe
- 分别将其安装目录下的 ./bin添加到系统环境变量，重启生效
- 复制裸机工程至Windows下，修改部分Makefile的linux指令以适配Windows即可

### 裸机工程编译

- cd n32g452_gcc
- make

