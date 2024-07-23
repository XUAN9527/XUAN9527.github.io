---
title: I.MX6ULL开发指南
date: 2024-7-13 11:07:00
#updated: 2023-12-04
tags:
- [I.MX6ULL]
- [NXP]
- [Linux]
categories: 
- [嵌入式]
- [环境搭建]
description: I.MX6ULL开发环境搭建，uboot移植，基于Linux版本为Ubuntu 20.04虚拟机开发，记录关键步骤，遇到的问题及解决方法。
---

## 开发环境搭建

### 虚拟机安装

1. 下载安装VMware Workstation Pro工具。
2. 下载安装ubuntu 20.04 LTS系统镜像。
3. 快速创建虚拟机。
4. 配置虚拟机环境。
- 虚拟机-设置(见以下图片)：
![ubuntu配置](../pictures/ubuntu配置1.png)
![ubuntu配置](../pictures/ubuntu配置2.png)
![ubuntu配置](../pictures/ubuntu配置3.png)

- 网络适配器可按自己需要设置。
![ubuntu配置](../pictures/ubuntu配置4.png)

5. 启动虚拟机，进入`ubuntu`系统。
- 进入系统后会自动弹出`DVD`, 里面有`VMware Tools`的压缩包。
- 复制压缩包到`Donwnloads`目录下，解压。
- 执行`sudo ./vmware-install.pl`安装。 
- 解决Windows和Ubuntu之间复制粘贴问题。

	- 输入安装命令：sudo apt install open-vm-tools
	- 输入命令：sudo apt install open-vm-tools-desktop

**注意**：输入第一条命令后，等待安装，遇到选择`Y/N`，选择`Y`；第一条安装完成后，输入第二条命令，同样遇到选择`Y/N`，选择`Y`。
安装完毕后，切记：一定要**重新启动Linux系统**才可以双向复制粘贴。

### 虚拟机安装配置遇到的问题

- 无法使用桥接上网
	- 虚拟网络编辑器-还原默认设置（该过程会卸载虚拟网卡，重新安装适配器）

[参考资料1](https://segmentfault.com/a/1190000039918994)
[参考资料2](https://blog.csdn.net/baidu_41666198/article/details/97619962?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522172120535416800227445869%2522%252C%2522scm%2522%253A%252220140713.130102334..%2522%257D&request_id=172120535416800227445869&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~blog~sobaiduend~default-1-97619962-null-null.nonecase&utm_term=NAT%E6%A8%A1%E5%BC%8F%E4%B8%8A%E4%B8%8D%E4%BA%86%E7%BD%91&spm=1018.2226.3001.4450)

- 虚拟机右下角的USB是灰的，不能链接/断开。

[参考资料](https://blog.csdn.net/weixin_44259058/article/details/127639566)

### Uboot移植

- 将`uboot`压缩文件`uboot-imx-rel_imx_4.1.15_2.1.1_ga_alientek_v2.4.tar.bz2`放到`/home/xuan/linux/`目录下。

- 将`uboot`文件`tar -xjvf uboot-imx-rel_imx_4.1.15_2.1.1_ga_alientek_v2.4.tar.bz2` 解压到该目录下。

- `cd /home/xuan/linux/uboot-imx-rel_imx_4.1.15_2.1.1_ga_alientek_v2.4`

- 编写以下脚本：(`mx6ull_14x14_evk_emmc.sh`)
``` shell
#!/bin/bash
make ARCH=arm CROSS_COMPILE=arm-linux-gnueabihf- distclean
make ARCH=arm CROSS_COMPILE=arm-linux-gnueabihf- mx6ull_alientek_emmc_defconfig
make ARCH=arm CROSS_COMPILE=arm-linux-gnueabihf- V=1 -j12
```
- 执行脚本：`./mx6ull_14x14_evk_emmc.sh`

- 插上`SD卡`，启动`uboot`, `SD`卡和`EMMC`驱动检查:
``` shell
mmc dev 0
mmc info

mmc dev 1
mmc info
```
- 烧写验证与驱动测试
	- 挂载`SD卡`，不做描述，挂载上之后`ls /dev/sd*`显示。
	- 执行以下`shell`指令。
``` shell
chmod 777 imxdownload 				//给予 imxdownload 可执行权限
./imxdownload u-boot.bin /dev/sdd 	//烧写到 SD 卡中，不能烧写到/dev/sda 或 sda1 里面
```

- `U-Boot` 图形化配置

``` shell
sudo apt-get install build-essential
sudo apt-get install libncurses5-dev

make mx6ull_alientek_emmc_defconfig
make menuconfig
```


### Linux内核移植

- 将内核压缩文件`linux-imx-rel_imx_4.1.15_2.1.1_ga_alientek_v2.4.tar.bz2`放到`/home/xuan/linux/linux-imx-rel_imx_4.1.15_2.1.1_ga_alientek_v2.4`目录下。

- 将内核文件`tar -xjvf linux-imx-rel_imx_4.1.15_2.1.1_ga_alientek_v2.4.tar.bz2` 解压到该目录下。

按以下步骤进行编译：
``` shell
make clean 					//第一次编译 Linux 内核之前先清理一下
make imx_v7_mfg_defconfig 	//配置 Linux 内核
make -j16					//编译 Linux 内核
```
发现编译报错：
``` shell
  LZO     arch/arm/boot/compressed/piggy.lzo
/bin/sh: 1: lzop: not found
make[2]: *** [arch/arm/boot/compressed/Makefile:180：arch/arm/boot/compressed/piggy.lzo] 错误 1
make[1]: *** [arch/arm/boot/Makefile:52：arch/arm/boot/compressed/vmlinux] 错误 2
make: *** [arch/arm/Makefile:316：zImage] 错误 2
make: *** 正在等待未完成的任务....
```
解决方法：
1. 安装lzop：sudo apt install lzop
2. 添加lzop到环境变量：export PATH=$PATH:/usr/bin(直接安装的不需要添加环境变量)
3. 重新编译：make -j16

<br>

- 若执行 `./mx6ull_alientek_emmc.sh`

发现编译报错：
``` shell
<command-line>: fatal error: curses.h: 没有那个文件或目录
```
解决方法：
- 执行 `make ARCH=arm CROSS_COMPILE=arm-linux-gnueabihf- menuconfig` 后报错 `fatal error:curses.h:`没有那个文件或目录，这个是少了某个库，执行如下指令安装库：
```
sudo apt-get install libncurses*
```