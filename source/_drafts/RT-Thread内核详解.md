---
title: RT-Thread内核详解
date: 2024-05-30 14:05:00
tags:
- [MCU]
- [RT-Thread]
categories: 
- [嵌入式]
- [RTOS]
description: RT-Thread 是一款嵌入式实时操作系统（RTOS），同时也是一款优秀的物联网操作系统，相对于裸机的轮询调度算法，它使用的线程（任务）调度算法是基于优先级的全抢占式多线程调度算法，该算法大大增强了系统的实时响应，大大扩展了系统的应用场景。
---

## 

### RT-Thread的内核调度算法

[参考链接]：https://www.cnblogs.com/shirleyxu/p/9468080.html



