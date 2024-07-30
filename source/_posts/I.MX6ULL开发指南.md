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

[桥接模式资料(仅供参考)](https://segmentfault.com/a/1190000039918994)

- 尝试解决无法使用桥接使用与PC机相同IP上网
	- 虚拟网络编辑器-还原默认设置（该过程会卸载虚拟网卡，重新安装适配器）
	- 桥接模式启动
	- 笔试还不能关闭网络服务，`ubuntu`内部配置`IPv4`（先打开`PC主机`以太网，按下图所示手动填写`地址`和`DNS`）,重新启动网络服务。

![虚拟网络](../pictures/虚拟网络编辑器.png)
![PC以太网配置](../pictures/PC机IPv4配置.png)
![ubuntu网络配置](../pictures/ubuntu网络配置.png)

- 虚拟机右下角的USB是灰的，不能链接/断开。

[参考资料](https://blog.csdn.net/weixin_44259058/article/details/127639566)
<br>

## Uboot移植

[参考资料](https://www.eet-china.com/mp/a68264.html)

### I.MX6ULL启动模式

![IMX6ULL启动拨码图](../pictures/IMX6ULL启动拨码图.png)

### Uboot编译烧录

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

#### Uboot烧录到SD卡

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

<br>

- `U-Boot` 图形化配置

``` shell
sudo apt-get install build-essential
sudo apt-get install libncurses5-dev

make mx6ull_alientek_emmc_defconfig
make menuconfig
```

- 配置网口的环境变量，开发板上的`ENET2`,上电进入`uboot`,打开的`USB_TTL`对应的串口控制台。
``` shell
setenv ipaddr 192.168.104.130		//开发板 ip 地址
setenv ethaddr b8:ae:1d:01:00:00	//开发板的MAC地址，一定要设置, 如有多块开发板，MAC需不一致
setenv gatewayip 192.168.104.129	//网关地址
setenv netmask 255.255.240.0		//子网掩码
setenv serverip 192.168.104.29		//服务器 IP 地址，也就是 Ubuntu 主机 IP 地址，用于调试代码。
saveenv
```

<br>

## Linux内核移植

### 移植步骤

**1. Ubuntu下搭建网络传输环境**

**1.1 搭建网络tftp服务**

- 执行以下指令，安装`xinetd`: 
``` shell
sudo apt-get install xinetd
```

- 查询`/etc/`下是否存在 `xinetd.conf` 文件，没有的话则自己新建一个。
``` shell
ls /etc/xinetd.conf
sudo vi /etc/xinetd.conf
```

- 创建出来的文件是空白的， 修改 `xinetd.conf` 文件内容如下：
``` shell
# Simple configuration file for xinetd
#
# Some defaults, and include /etc/xinetd.d/
defaults
{
# Please note that you need a log_type line to be able to use log_on_success
# and log_on_failure. The default is the following :
# log_type = SYSLOG daemon info
}
includedir /etc/xinetd.d
```

- 新建 `TFTP` 目录，这里建立在/home/xuan/linux 目录下，目录名为 tftp。将 tftp 目录赋予可读可写可执行权限。

``` shell
mkdir -p /home/xuan/linux/tftp
sudo chmod 777 /home/xuan/linux/tftp/
cd /home/xuan/linux/
ls
```

- 执行以下程序安装 `tftp-hpa` 和 `tftpd-hpa` 服务程序
``` shell
sudo apt-get install tftp-hpa tftpd-hpa
sudo vi /etc/default/tftpd-hpa
```

- 执行以下指令创建`/etc/xinetd.d/tftp`配置文件。（如果没有 `xinetd.d` 这个目录，可以先自己手动创建）,注意 `server_args = -s` 后面要添加自己的 `tftp` 工作路径。
``` shell
server tftp
{
socket_type = dgram
wait = yes
disable = no
user = root
protocol = udp
server = /usr/sbin/in.tftpd
server_args = -s /home/xuan/linux/tftp -c
#log_on_success += PID HOST DURATION
#log_on_failure += HOST
per_source = 11
cps =100 2
flags =IPv4
}
```

- 修改/添加 `tftp` 文件后， 执行以下指令重启 `tftpd-hpa`, 重启 `xinetd` 服务。
``` shell
sudo service tftpd-hpa restart
sudo service xinetd restart
```

- 确保网络环境正常，`Ubuntu`、`Windows`和`开发板`能相互 `ping` 通。
	- 开发板 IP： 192.168.104.130
	- 虚拟机 IP： 192.168.104.129
	- 电脑网口的 IP： 192.168.104.29

<br>

**1.2 搭建网络nfs服务**

- 在 `Ubuntu` 终端执行以下指令安装 `NFS`
``` shell
sudo apt-get install nfs-kernel-server
```

- 新建 `NFS` 共享目录，并给予 `NFS` 目录可读可写可执行权限。
``` shell
sudo mkdir /home/xuan/linux/nfs
sudo chmod 777 /home/xuan/linux/nfs/
```

- 执行以下指令打开 `etc/exports` 文件
``` shell
sudo vi /etc/exports
```

- 进入 `etc/exports` 文件，在最后添加如下内容
``` shell
/home/alientek/linux/nfs *(rw,sync,no_root_squash)
```

`/home/alientek/linux/nfs` 表示 `NFS` 共享的目录
`*`表示允许所有的网络段访问
`rw` 表示访问者具有可读写权限
`sync` 表示将缓存写入设备中，可以说是同步缓存的意思
`no_root_squash` 表示访问者具有 `root` 权限。

- 执行以下指令重启 `NFS` 服务器, 查看 `NFS` 共享目录。
``` shell
sudo /etc/init.d/nfs-kernel-server restart
showmount -e
```

- 测试 `NFS` 服务，执行以下指令设置开发板 `IP`，创建一个 `get` 目录，将虚拟机（`192.168.104.129`） `NFS` 共享目
录挂载到到开发板的 `get` 目录中。
``` shell
mkdir get
mount -t nfs -o nolock,nfsvers=3 192.168.104.129:/home/xuan/linux/nfs get/
```

- 查看挂载的 `NFS` 目录：`df`, 显示如下：
``` shell
192.168.104.129:/home/xuan/linux/nfs 204795392 14416896 179902464   8% /home/root/get
```
- 卸载 `NFS` 目录：`umount get`

<br>

**2. 拷贝内核文件**

- 将内核压缩文件`linux-imx-rel_imx_4.1.15_2.1.1_ga_alientek_v2.4.tar.bz2`放到`/home/xuan/linux/linux-imx-rel_imx_4.1.15_2.1.1_ga_alientek_v2.4`目录下。

- 将内核文件`tar -xjvf linux-imx-rel_imx_4.1.15_2.1.1_ga_alientek_v2.4.tar.bz2` 解压到该目录下。

**3. 编译内核文件**

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

<br>

**4. 整理编译后的镜像文件**

`Linux` 内核编译完成以后会在 `arch/arm/boot` 目录下生成 `zImage` 镜像文件，如果使用设备树
的话还会在 `arch/arm/boot/dts` 目录下开发板对应的.dtb(设备树)文件，比如 `imx6ull-alientek-emmc.dtb`
就是 `NXP` 官方的 `I.MX6ULL EVK开发板`对应的设备树文件。至此我们得到两个文件：
- `Linux` 内核镜像文件： `zImage。`
- `NXP`官方`I.MX6ULL EVK开发板`对应的设备树文件： imx6ull-alientek-emmc.dtb。

<br>

**5. 内核启动测试**

- 修改`uboot` 中的环境变量 `bootargs`
``` shell
console=ttymxc0,115200 root=/dev/mmcblk1p2 rootwait rw
```

- 将上一小节编译出来的 `zImage` 和 `imx6ull-alientek-emmc.dtb` 复制到 `Ubuntu` 中的 `tftp` 目录下，
因为我们要在 `uboot` 中使用 `tftp` 命令将其下载到开发板中，拷贝命令如下：
``` shell
cp arch/arm/boot/zImage /home/xuan/linux/tftpboot/ -f
cp arch/arm/boot/dts/imx6ull-alientek-emmc.dtb /home/xuan/linux/tftpboot/ -f
```

- 拷贝完成以后就可以测试了，启动开发板，进入 `uboot` 命令行模式，然后输入如下命令将
`zImage` 和 `imx6ull-alientek-emmc.dtb` 下载到开发板中：

**从网络启动：**
``` shell
tftp 80800000 zImage
tftp 83000000 imx6ull-alientek-emmc.dtb
bootz 80800000 - 83000000
```

**从EMMC启动：**
``` shell
fatload mmc 1:1 80800000 zImage
fatload mmc 1:1 83000000 imx6ull-alientek-emmc.dtb
bootz 80800000 - 83000000
```

<br>

### 从网络启动Linux系统

- 这里使用`tftpboot`启动传输。
- 拨码到从`SD`卡启动，开发板上电/`RESET`，进入`uboot`。
- 在`uboot`配置`bootargs`和`bootcmd`参数并保存。

``` shell
setenv bootargs 'console=ttymxc0,115200 root=/dev/mmcblk1p2 rootwait rw'
=> setenv bootcmd 'tftp 80800000 zImage; tftp 83000000 imx6ull-alientek-emmc.dtb; bootz 80800000 - 83000000'
=> saveenv
```

- 输入`boot`启动

<br>