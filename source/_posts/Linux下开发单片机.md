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

安装 Windows Terminal

### 编译环境配置

- `gcc-arm-none-eabi`工具链安装
	- 手动安装：[官方链接地址](https://developer.arm.com/downloads/-/gnu-rm) 下载所需版本；
	```bash
	sudo apt install bzip2
	sudo tar -xvf ~/n32_gcc/software_package/gcc-arm-none-eabi-9-2019-q4-major-x86_64-linux.tar.bz2 -C ~/n32_gcc
	```
	- 自动安装：`sudo apt-get install gcc-arm-none-eabi`
	- 打开 `~/.bashrc`
	- 添加`export PATH=$PATH:~/n32_gcc/gcc-arm-none-eabi-9-2019-q4-major/bin`
	- 添加`alias open-file='explorer.exe .'`
	- 使能用户环境变量`source ~/.bashrc`

- Make
	- `sudo apt-get install make`

### Winodows Gcc + Make 环境搭建

- 安装software_package目录下的`gcc-arm-none-eabi-9-2019-q4-major-win32-sha2.exe`和`make-3.81.exe`
- 分别将其安装目录下的 `./bin`添加到系统环境变量，重启生效
- 复制裸机工程至Windows下，修改部分Makefile的linux指令以适配Windows即可

### 裸机工程编译

- cd n32g452_gcc
- make

<br>

## makefile问题汇总

### 修改.h文件没有重新编译

- `$(BUILD_DIR)`为编译文件目录，跟进自身makefile修改，原来的编译规则：
``` c
-include $(wildcard $(BUILD_DIR)/*/*.d)	# 包含所有生成的依赖文件，避免重复编译、提高效率
```
`/*/*.d` 为当前目录下的二级所有文件检索。

<br>

- 修改为以下编译规则：
``` c
# 找到所有的 .d 文件
DEP_FILES := $(shell find $(BUILD_DIR) -type f -name '*.d')# 包含所有生成的依赖文件，避免重复编译、提高效率

# 包含所有的 .d 文件
-include $(DEP_FILES)
```
或者：
``` c
-include $(wildcard $(BUILD_DIR)/**/*.d)
-include $(wildcard $(BUILD_DIR)/*/*/*.d)
```
`/**/*.d` 为当前目录下的二级所有文件检索，根据具体情况修改。
`/*/*/*.d` 为当前目录下的三级所有文件检索，根据具体情况修改。

<br>

## windows子系统wsl

###打开新终端 ~/.bashrc不会自动刷新

解决linux每次打开新终端都要重新`source ~/.bashrc`问题
执行以下代码：

	vi ~/.bash_profile

有可能此文件是空白新建的，无所谓。然后在此文件末尾加入：
```c
if [ -f ~/.bashrc ];then
source ~/.bashrc
fi
```
然后`:wq`保存即可。
此时打开新终端可以自动执行`source ~/.bashrc`

<br>

### arm-none-eabi-gcc工具链问题

- arm-none-eabi-gcc工具链需加入用户变量：
```c
export PATH=/home/xuan/OpenHarmony/install-software/gcc-arm-none-eabi-9-2019-q4-major/bin:$PATH
```

注意：需确认路径，否则找不到用户路径会搜索系统自带编译链 `/usr/lib/gcc/arm-none-eabi/10.3.1`

<br>

## Linux下编写Python合并脚本

### 合并 bootloader + app  = mix

**1. 安装 PyInstaller**

	pip install pyinstaller

<br>

**2. 编写Python合并程序**
	
[代码链接](https://github.com/XUAN9527/script)

<br>

**3. 打包 Python 程序**

**参数说明：**

- `-F`：生成单一可执行文件。
- `-D`：生成包含所有依赖项的目录。
- `-n`：指定可执行文件名。
- `--distpath`：指定可执行文件输出目录。
- `--noconfirm`：覆盖输出文件时无需确认。

**以下是一些常用的高级选项：**

- `--hidden-import`：指定要隐藏导入的模块。
- `--exclude-module`：指定要排除的模块。
- `--onefile`：将所有文件打包成一个可执行文件。
- `--runtime`：指定 Python 运行时版本。

**执行规则:**

	cd new_file,copy file.py and file.ico
	pyinstaller -F -w (-i icofile) 文件名.py

**example:**

	pyinstaller -F file.py
	pyinstaller -F -w -i file.ico file.py

<br>

**4. 运行可执行文件**

	./dist/file

<br>

**5. 例程**

[代码链接](https://github.com/XUAN9527/script)

<br>

**6. 实际应用场景**

- 单独使用：Linux环境下单独执行使用。
- 集成在`makefile`中，使用`make`编译自动生成文件：
	- 将`papp_up`和`mix_10K`打包至`tools`文件夹，放在`makefile`同一目录下。
	- 需要`bootloder.bin`在`../bootloader`目录下。
	- 修改makefile生成规则。
	- `$(BUILD_DIR)`为编译文件目录，跟进自身makefile修改。
``` c
.PHONY : clean all

all: $(TARGET).bin $(TARGET).list $(TARGET).hex
	$(SZ) $(TARGET).elf
	@make copy
	@make mix

.PHONY: copy

copy: $(TARGET).bin
	cp $(TARGET).bin app.bin
	cp ../bootloader/bootloader.bin bootloader.bin
#	cp $(TARGET).hex app.hex

mix:
	./tools/papp_up
	./tools/mix_10K
	$(OC) -I binary -O ihex --change-addresses 0x8000000 mix.bin mix.hex
	rm bootloader.bin
	rm app.bin
	rm mix.bin

clean:
	rm -rf $(BUILD_DIR)
	rm papp.bin
	rm mix.hex
```

<br>



