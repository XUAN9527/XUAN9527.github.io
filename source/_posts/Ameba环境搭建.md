---
title: Ameba环境搭建
date: 2026-04-14 14:00:02
tags:
- [MCU]
categories: 
- [嵌入式]
description: 记录Ameba环境搭建学习的笔记，以及在开发过程中遇到的问题，思路以及解决方法。
---

## 环境搭建
- 下载`Ameba SDK`，解压到本地。
- 安装`Ameba SDK`依赖的工具链和`IDE`。
- 配置环境变量，确保`Ameba SDK`的工具链和`IDE`能够正常使用
- 创建一个新的`Ameba`项目，选择合适的模板。
- 编写代码，编译并烧录到`Ameba`开发板上。
- 进行调试，查看串口输出，确保程序正常运行。
``` bash
mkdir ~/ameba-AIoT
cd ~/ameba-AIoT/
git clone --depth=5 git@github.com:Ameba-AIoT/ameba-rtos.git
cd ameba-rtos/example/peripheral/raw/GPIO/
mkdir ~/ameba-AIoT/work
cp -r raw_gpio_rw/ ~/ameba-AIoT/work/

# ~/.bashrc 添加
alias get-ameba='source ~/ameba-AIoT/ameba-rtos/env.sh'
alias ameba-u0='ameba.py flash -p /dev/ttyUSB0 -b 1500000 && ameba.py monitor -p /dev/ttyUSB0 -b 1500000'
alias ameba-u1='ameba.py flash -p /dev/ttyUSB1 -b 1500000 && ameba.py monitor -p /dev/ttyUSB1 -b 1500000'
export RTK_TOOLCHAIN_DIR="~/ameba-AIoT/tools/rtk-toolchain"

cd ~/ameba-AIoT/work/raw_gpio_rw/
get-ameba
ameba.py build -D USE_ALIYUN_URL=True # ali云地址，国内访问更快

# windows环境powershell
usipd list # 查看设备列表，找到对应的设备
usipd bind --busid 2-3 # 绑定设备，例如设备路径为2-3

# linux环境bash
sudo modprobe vhci-hcd	# 加载USB/IP内核模块
sudo usbip attach -r 192.168.104.29 -b 2-3 # 绑定设备，例如服务器IP地址为192.168.104.29，设备路径为2-3
ls -l /dev/ttyUSB*	# 查看设备列表，如/dev/ttyUSB1
ameba-u1 # 烧录固件并监控串口输出
```

- 若下载很慢，可以创建`~/.ssh/config`, 用`433`端口访问`github.com`，加速下载。
``` bash
Host github.com
    Hostname ssh.github.com
    Port 443
    User git
```
- 也可编写烧录脚本`auto_burned.sh`，简化烧录流程。
``` bash
#!/bin/bash

# --- 配置 ---
AMEBA_TOOL="/home/ubuntu/ameba-AIoT/ameba-rtos/ameba.py"
PORT="/dev/ttyUSB1"
IMAGE_PATH="ota_all.bin"
CHIP="RTL8713E"

# 检查权限（如果需要）
# sudo chmod 666 $PORT

echo "正在炼化 $CHIP..."

# 执行指令：加入了芯片型号和 Flash 地址区间
python3 "$AMEBA_TOOL" flash \
    -dev $CHIP \
    -p "$PORT" \
    -b 1500000  \
	&& \
python3 "$AMEBA_TOOL" monitor\
	-p "$PORT" \
	-b 1500000
# -i "$IMAGE_PATH" 0x08000000 0xFFFFFFFF
```
- 运行脚本，完成烧录。

## 遇到的问题

- `PL2303GC`驱动：在`Windows`系统上，`PL2303GC`芯片的驱动可能不兼容最新的`Windows`版本，导致无法识别设备。解决方法是下载并安装适用于当前`Windows`版本的`PL2303GC`驱动程序，需要找合适的驱动，当前使用P`L23XX Driver Installer v4.0.0`。
- `ameba.py` + `flash` + `-p` [PORT] + `-b` [BAUDRATE]：烧录时需要指定正确的串口和波特率，否则会导致烧录失败。
- `ameba.py` + `monitor` + `-b` [BAUDRATE]：监控台需要指定正确的波特率，否则无法正确显示串口输出。
- 注意关键指令需接`ameba.py`后面规则。
- 烧录的波特率为`115200/460800/1500000`，目前试了这几个波特率可以，其他可能会失败，比如`1152000`。
- 系统`main`函数在`SDK`的里面，默认`SHELL`波特率为`1500000`。