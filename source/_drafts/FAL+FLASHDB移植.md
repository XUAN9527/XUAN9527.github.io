---
title: FAL+FLASHDB移植
date: 2025-03-25 10:02:02
tags:
- [MCU]
categories: 
- [嵌入式]
description: 在嵌入式开发中，持久化存储数据是一个常见的需求。FlashDB 是一个轻量级的嵌入式数据库，非常适合资源受限的嵌入式设备。而 fal (Flash Abstraction Layer) 则提供了一个统一的接口来操作不同的 Flash 设备，简化了 Flash 管理的复杂性。本文将详细介绍如何在微控制器上移植 fal 和 FlashDB。
---

## 组件链接

[FlashDB GitHub 仓库](https://github.com/armink/FlashDB)
[fal GitHub 仓库](https://github.com/armink/fal)
