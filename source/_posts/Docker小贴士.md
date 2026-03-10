---
title: Docker简介
date: 2025-12-12 12:12:00
#updated: 2025-12-12
tags:
- [Docker]
- [Linux]
- [Ubuntu]
categories: 
- [Docker]
description: Docker 介绍 + 本地环境搭建 + 应用部署示例
---

## Docker介绍
`Docker` 是轻量级容器化平台，把应用及其依赖（库、环境、配置）打包成镜像 (`Image`) ，运行时生成容器 (`Container`)。

- **镜像 Image**：应用模板，类似系统盘 `.iso`  
- **容器 Container**：镜像运行后的实例，可启动/停止/删除  
- **Dockerfile**：构建镜像的脚本  
- **Registry**：镜像仓库（Docker Hub / 私有 Registry）

## Docker环境搭建
- `Linux`（`Ubuntu`）安装
``` bash
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

sudo mkdir -p /etc/docker
sudo nano /etc/docker/daemon.json

sudo service docker start
sudo usermod -aG docker $USER
```

- `daemon.json`文件(国内代理转发)
``` json
{
  "registry-mirrors": [
    "https://docker.1ms.run"
  ]
}
```

- 保存退出
``` bash
Ctrl + O
Enter
Ctrl + X
```

- 打开`powershell`，重启`wsl`
```
wsl --shutdown
```

- 测试运行容器
``` bash
docker run hello-world
```

- 如显示如下日志，则表示`Docker`已经完全正常工作了
``` bash
Hello from Docker!
```

## 常用 Docker 命令
``` bash
# 容器相关
docker ps
docker ps -a
docker info

# 镜像相关
docker images
docker pull nginx
docker build -t my-hello:latest .
docker save -o my-hello.tar my-hello:latest
docker load -i my-hello.tar

# 启动/停止
docker run -d -p 8080:80 nginx
docker start <name>
docker stop <name>
docker rm <id>
docker rmi <id>
```

## Docker 使用示例：hello-algo

1. 拉取源码
``` bash
git clone git@github.com:krahets/hello-algo.git
cd hello-algo
docker compose up -d
```
- 打开浏览器访问：
``` bash
open http://localhost:8000  # Linux
open http://your-server-ip:8000  # 云端
```

2. 进入容器运行代码
``` bash
docker exec -it hello-algo-code bash
root@xxxx:/codes# python3 array.py
root@xxxx:/codes# g++ -std=c++17 array.cpp && ./a.out
exit
docker compose down
```
- `exit`,不用时清理: `docker compose down`

3. 定制语言环境
``` yml
# codes/docker-compose.yml
services:
  hello-algo-code:
    build:
      context: .
      args:
        LANGS: "python java"
```

- 重新构建 & 启动
``` bash
docker compose build
docker compose up -d
```

## ESP-IDF v5.4 Docker 使用记录

### 一、前置条件

* 已安装 Docker（Linux / WSL / macOS）
* 已拉取 ESP-IDF v5.4 官方镜像：

```bash
docker pull espressif/idf:release-v5.4
```

* 本机工程路径存在：

```text
~/esp/work/coze_ws_demo
 ├─ CMakeLists.txt
 ├─ main/
 ├─ components/
 ├─ sdkconfig
```

---

### 二、核心思想（一定要理解）

* Docker **不拷贝工程**，而是 **目录映射（volume）**
* Docker 内的 `/work/coze_ws_demo`
* 等价于宿主机的 `~/esp/work/coze_ws_demo`

---

### 三、启动 Docker 并进入工程目录 ⭐⭐⭐

```bash
docker run -it --rm \
  --device=/dev/ttyUSB0 \
  -v ~/esp/work:/work \
  -v ~/.ssh:/root/.ssh:ro \
  -w /work/coze_ws_demo \
  espressif/idf:release-v5.4 \
  bash -c "git config --global --add safe.directory /work/coze_ws_demo && bash"
```

- 遇到问题，`idf_component.yml`中包含有本地路径,链接时不会执行：
``` idf_component.yml
dependencies:
  ...
  protocol_examples_common:
    path: /home/ubuntu/esp/esp-adf/esp-idf/examples/common_components/protocol_examples_common
改为
  cp -r /opt/esp/idf/examples/common_components/protocol_examples_common components/
  path: ../components/protocol_examples_common
```

#### 参数说明

| 参数                           | 作用              |
| ---------------------------- | --------------- |
| `-it`                        | 交互终端            |
| `--rm`                       | 容器退出后自动删除       |
| `-v ~/esp/work:/work`        | 将宿主机目录映射到容器     |
| `-v ~/.ssh:/root/.ssh:ro`    | 挂载私钥				|
| `-w /work/coze_ws_demo`      | 进入工程目录          |
| `espressif/idf:release-v5.4` | ESP-IDF v5.4 镜像 |

进入后你会看到：

```text
root@xxxx:/work/coze_ws_demo#
```

---

### 四、烧录 ESP32（可选）

#### 方法一：Docker 直接烧录（推荐）

```bash
docker run -it --rm \
  --device=/dev/ttyUSB0 \
  -v ~/esp/work:/work \
  -w /work/coze_ws_demo \
  espressif/idf:release-v5.4
```

容器内执行：

```bash
idf.py flash && idf.py monitor
```

例：
```bash
idf.py -p /dev/ttyUSB0 -b 1152000 flash && idf.py -p /dev/ttyUSB0 monitor
```

> 注意：
>
> * `/dev/ttyUSB0` 根据实际串口调整

---

#### 方法二：Docker 编译 + 宿主机烧录

* Docker：

```bash
idf.py build
```

* 宿主机：

```bash
idf.py flash monitor
```

- Docker 与宿主机的 ESP-IDF 环境不一致，导致方法二失败
	- IDF 版本不一致
	- Python 虚拟环境不同
	- 工具链路径写死在 build 目录
	- Component Manager 解析结果不同

---

### 五、退出并关闭容器

在 Docker 中使用 ESP-IDF 完成编译或调试后，可以按以下方式**安全退出并关闭容器**：

#### 1️⃣ 直接退出并关闭容器（推荐）

```bash
exit  # 或 Ctrl+D
```

> 使用了 `--rm` 参数，退出后容器会自动删除

---

#### 2️⃣ 强制中断（不推荐，除非卡死）

```bash
Ctrl+C
docker ps        # 查看正在运行的容器
docker stop <container_id>
```

---

#### 3️⃣ 数据安全

✅ 因为使用 `-v ~/esp/work:/work` 映射目录，源码、build、sdkconfig 都在宿主机，不会丢失

---

### 六、常见问题排查

1. `idf.py: command not found`→ 未使用 ESP-IDF 镜像
2. Docker 无法访问工程目录 → 检查 `-v /home/用户名/esp/work:/work`
3. USB 权限问题：
```bash
ls -l /dev/ttyUSB0
sudo chmod 666 /dev/ttyUSB0
```

---

### 七、推荐长期使用的「万能启动命令」⭐⭐⭐

```bash
docker run -it --rm \
  -v ~/esp/work:/work \
  -w /work/coze_ws_demo \
  espressif/idf:release-v5.4
```

### 八、工程习惯建议⭐⭐⭐

- Docker 只负责编译 / 烧录 / menuconfig
- 工程代码始终在宿主机编辑
- 一个 Docker 对应一个 IDF 版本，避免污染系统

---

### 九、建议的工程习惯

* Docker 只负责：**编译 / 烧录 / menuconfig**
* 工程代码：始终在宿主机编辑
* 一个 Docker = 一个 IDF 版本，永不污染系统

---

### 十、适用场景

* ESP32 / ESP32-S3 / ESP32-C3
* ESP-IDF v5.4
* Audio / ESP-GMF / Coze / AFE 项目

---

> 维护者备注：
>
> * 本文档用于长期记录 Docker + ESP-IDF 标准用法
> * 如需升级 IDF，仅替换镜像版本即可

