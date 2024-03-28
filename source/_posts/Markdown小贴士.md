---
title: Markdown小贴士
date: 2024-2-19 14:56:40
#updated: 2023-12-04
tags: Markdown
categories: 
- [文本编辑工具]
description: Markdown 是一种轻量级标记语言，它允许人们使用易读易写的纯文本格式编写文档。Markdown 语言在2004 由约翰·格鲁伯（英语：John Gruber）创建。Markdown 编写的文档可以导出 HTML 、Word、图像、PDF、Epub 等多种格式的文档。
---

### Markdown 的基本语法
Markdown 的语法非常简单，常用的标记符号不超过十个，用于日常写作记录绰绰有余，不到半小时就能完全掌握。以下是一些常用的 Markdown 标记符号：

#### 标题
	# 一级标题
	## 二级标题
	### 三级标题
	#### 四级标题
	##### 五级标题
	###### 六级标题	

#### 文本
	普通文本
	**加粗文本**
	* 斜体文本*
	**~删除线文本~**

#### 列表
	* 无序列表
	1. 有序列表
		* 嵌套列表

#### 代码块
```c
#include <stdio.h>

int main() {
printf("Hello, world!\n");
return 0;
}
```

#### 链接
	链接文本: [https://www.example.com](https://www.example.com)

#### 图片
	网络地址: ![这是一张示例图片](https://www.example.com/example.png)
	本地文件路径：![这是一张示例图片](../pictures/这是一张示例图片.png)
	图片链接跳转: ![这是一张示例图片](example.png) {link=https://www.example.com/}
	图片标题: ![这是一张示例图片](example.png) {title=这是一张示例图片}
	图片居中: ![这是一张示例图片](example.png) {align=center}

	示例：
	![这是一张示例图片](example.png)
	![这是一张 200x100 像素的图片](example.png) {width=200 height=100}
	![这是一张居中的图片](example.png) {align=center}
	![点击图片跳转到 https://www.example.com/](example.png) {link=https://www.example.com/}
	![这是一张示例图片](example.png) {title=这是一张示例图片}


#### 表格
| 头部1 | 头部2 | 头部3 |
|---|---|---|
| 内容1 | 内容2 | 内容3 |
| 内容4 | 内容5 | 内容6 |

### Markdown 的应用
	博客文章
	技术文档
	README 文件
	演示文稿
	电子书

### 总结
	Markdown 是一种易于学习和使用的标记语言，非常适合编写各种文档。如果您还没有使用过 Markdown，建议您尝试一下。
	
以下是 Markdown 官方教学网站：
[Markdown 官方网站](https://markdown.com.cn/basic-syntax/headings.html)