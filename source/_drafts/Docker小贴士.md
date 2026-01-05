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
`Docker` 是一个轻量级的容器化平台, 它把应用及其依赖（库、环境、配置）打包成一个镜像（`Image`），运行时成为一个容器（`Container`）。

- 镜像 `Image`: 应用模板，类似系统盘的 `.iso`
- 容器 `Container`: 镜像运行后的实例，可以启动/停止/删除
- `Dockerfile`: 描述如何构建镜像的脚本
- `Registry`: 镜像仓库（`docker hub` / 私有 `Registry）`

## Docker环境搭建
- `Linux`（`Ubuntu`）安装
``` bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg # 国外源
curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun # 国内源

docker --version
sudo usermod -aG docker $USER
newgrp docker
docker ps	# 测试

sudo systemctl enable docker # 启动Docker服务
sudo systemctl start docker

systemctl status docker
```

- 快速验证：
``` bash
docker run --rm hello-world

error:
Unable to find image 'hello-world:latest' locally
```

- 解决方法
``` bash
sudo mkdir -p /etc/docker
sudo vi /etc/docker/daemon.json
```

- `daemon.json`文件(国内代理转发)
``` json
{
  "registry-mirrors": [
    "https://docker.1ms.run"
  ]
}
```

- 常规操作
``` bash
# 打包
docker build -t my-hello:latest .
docker run --rm my-hello
docker save -o my-hello.tar my-hello:latest # 导出镜像为 .tar 文件

docker load -i my-hello.tar # 导入镜像
docker run --rm my-hello # 主要是.tar文件,也可直接拷贝,或者用github

docker export -o my-container.tar my-container # 导出容器
docker import my-container.tar my-new-image:latest
docker run --rm my-new-image:latest
```

## Docker最常用的 Docker 命令
``` bash
# 查看容器
docker ps
docker ps -a
docker info
docker images    # 镜像列表

# 启动/停止容器
docker start <name>
docker stop <name>

# 删除容器 / 镜像
docker rm <id>
docker rmi <id>

# 拉取镜像
docker pull nginx

# 运行镜像（创建容器）
docker run -d -p 8080:80 nginx
```

## hello-algo使用示例

1. 看文档
- 拉源码: `git@github.com:krahets/hello-algo.git`
- 进入文件夹: `cd hello-algo`
- 一键后台启动（自动构建镜像并跑在 `8000` 端口）: `docker compose up -d`
- 浏览器打开:
``` bash
# `Linux` 用 `xdg-open`: `Win` 用 `start`, 看完随时关掉: `docker compose down`
open http://localhost:8000`  		# 本地
open http://your-server-ip:8000		# 云
```
2. 边看边跑代码——多语言交互式环境
- 进入代码目录: `cd hello-algo/codes`              # 上一步已经 `clone` 好的仓库
- 构建并后台启动: `docker compose up -d`
- 进入容器内部: 
``` bash
docker exec -it hello-algo-code bash`             # 例程
root@xxxx:/codes# python3 array.py
root@xxxx:/codes# g++ -std=c++17 array.cpp && ./a.out
```
- `exit`,不用时清理: `docker compose down`

3. 只想“跑单个语言”——自己定制最小镜像（改一行配置，避免一次性装 12 套编译器）
- 编辑 `codes/docker-compose.yml`, 把 `LANGS` 改成自己需要的，例如只留 `python` + `java`
``` yml
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

4. 常见问题
- 端口被占: 改 `docker-compose.yml` 中的 `ports`, 如 "`8080:8000`"
- 构建慢: 确认 `Dockerfile` 已用国内源(阿里、清华、淘宝), 或 `DOCKER_BUILDKIT=1 docker compose build`
- 中文乱码: 容器里 `apt-get install -y fonts-wqy-zenhei`
- 权限报错: `chmod -R 755 codes`