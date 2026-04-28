---
title: TensorFlow小贴士
date: 2026-04-28 00:00:00
#updated: 2026-04-28
tags:
- [TensorFlow]
categories:
- [Linux]
- [Docker]
description: TensorFlow Jupyter 容器的快速启动与登录方法。
---

## TensorFlow小贴士

**tensorflow:latest-jupyter：**
``` shell
docker pull tensorflow/tensorflow:latest-jupyter
docker run -d --name tf_lab -p 8888:8888 tensorflow/tensorflow:latest-jupyter jupyter notebook --ip 0.0.0.0 --allow-root
docker logs tf_lab
```

- 启动后，你会看到一串日志，最后几行会显示：`http://127.0.0.1:8888/?token=xxxxxxxxxxxxxxxxxxxx`, 把这个 `token=` 后面的字符串记下来，它是你的登录密码。
- 例如： `http://127.0.0.1:8888/tree?token=b3667e3629771ec02fa09c7489b2e28a7e82281a2fcdf6d0`，在本地浏览器打开,如果你能直接访问服务器 `IP`，就在浏览器输入： `http://192.168.112.224:8888` （服务器公网`IP + 8888`）在本地浏览器打开
- 输入刚才记录的 `Token` 即可进入。
- 再次启动：`docker start tf_lab`
- 停止：`docker stop tf_lab`
- 彻底删除：`docker rm tf_lab`