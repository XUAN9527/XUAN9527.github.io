---
title: CMake学习笔记
date: 2024-5-8 14:56:40
#updated: 2023-12-04
tags: 
- [CMake]
- [Linux]
categories: 
- [自动编译工具]
description: CMake 是一个项目构建工具，并且是跨平台的。可以自动生成本地化的Makefile和工程文件，最后用户只需make编译即可，所以可以把CMake看成一款自动生成 Makefile的工具。
---

## CMake学习教程

- [参考资料1] : https://subingwen.cn/cmake/CMake-primer
- [参考资料2] : https://subingwen.cn/cmake/CMake-advanced/
- [参考资料3] : https://zhuanlan.zhihu.com/p/534439206

<br>

## 编写一个简单的CMakeLists.txt文件

### 1. 示例文件的目录结构如下：
``` c
$ tree
.
├── add.c
├── div.c
├── head.h
├── main.c
├── mult.c
└── sub.c
```

<br>

### 2. 添加 CMakeLists.txt 文件
在上述源文件所在目录下添加一个新文件 CMakeLists.txt，文件内容如下：

```c
cmake_minimum_required(VERSION 3.0)
project(CALC)
add_executable(app add.c div.c main.c mult.c sub.c)
```

- `cmake_minimum_required`：指定使用的 cmake 的最低版本。
	- 可选，非必须，如果不加可能会有警告。

- `project`：定义工程名称，并可指定工程的版本、工程描述、web主页地址、支持的语言（默认情况支持所有语言），如果不需要这些都是可以忽略的，只需要指定出工程名字即可。

- `add_executable`：定义工程会生成一个可执行程序。
```c
add_executable(可执行程序名 源文件名称)
```

- 这里的可执行程序名和`project`中的项目名没有任何关系
- 源文件名可以是一个也可以是多个，如有多个可用空格或`;`间隔
```c
# 样式1
add_executable(app add.c div.c main.c mult.c sub.c)
# 样式2
add_executable(app add.c;div.c;main.c;mult.c;sub.c)
```

<br>

### 3. 执行CMake命令
``` shell
# cmake 命令原型
$ cmake CMakeLists.txt 文件所在路径
```
执行示例 (当前`CMakeLists.txt`路径) ：
``` shell
$ cmake .
```
当执行`cmake`命令之后，`CMakeLists.txt` 中的命令就会被执行，所以一定要注意给`cmake`命令指定路径的时候一定不能出错。

执行命令之后，看一下源文件所在目录中是否多了一些文件：

``` shell
$ tree -L 1
.
├── add.c
├── CMakeCache.txt         # new add file
├── CMakeFiles             # new add dir
├── cmake_install.cmake    # new add file
├── CMakeLists.txt
├── div.c
├── head.h
├── main.c
├── Makefile               # new add file
├── mult.c
└── sub.c
```

我们可以看到在对应的目录下生成了一个`makefile`文件，此时再执行`make`命令，就可以对项目进行构建得到所需的可执行程序了。

<br>

### 4. 头文件及指定宏

- `CMakeLists.txt` 示例代码文件：
``` shell
cmake_minimum_required(VERSION 3.0)
project(CALC)
set(CMAKE_CXX_STANDARD 11)
set(HOME /home/robin/Linux/calc)
set(EXECUTABLE_OUTPUT_PATH ${HOME}/bin/)
include_directories(${PROJECT_SOURCE_DIR}/include)
file(GLOB SRC_LIST ${CMAKE_CURRENT_SOURCE_DIR}/src/*.cpp)
add_executable(app  ${SRC_LIST})
```

<br>

#### 4.1 通过参数`-std=c++11`指定出要使用c++11标准编译程序,对应宏`DCMAKE_CXX_STANDARD`: 
``` c++ 
# 增加-std=c++11
set(CMAKE_CXX_STANDARD 11)
```
``` shell
# 增加-std=c++11
cmake (CMakeLists.txt文件路径) -DCMAKE_CXX_STANDARD=11
```

<br>

#### 4.2 指定输出的路径(EXECUTABLE_OUTPUT_PATH)：
``` shell
set(HOME /home/robin/Linux/Sort)
set(EXECUTABLE_OUTPUT_PATH ${HOME}/bin)
```
如果这个路径中的子目录不存在，会自动生成，无需自己手动创建。

<br>

#### 4.3 头文件的路径(include_directories)
``` c
include_directories(headpath)
```
其中，第六行指定就是头文件的路径，PROJECT_SOURCE_DIR宏对应的值就是我们在使用cmake命令时，后面紧跟的目录，一般是工程的根目录。

<br>

#### 4.4 搜索文件(aux_source_directory)
- `aux_source_directory(< dir > < variable >)` 示例：
``` cmake
aux_source_directory(${CMAKE_CURRENT_SOURCE_DIR}/src SRC_LIST)
```

- `file(GLOB/GLOB_RECURSE 变量名 要搜索的文件路径和文件类型)`示例：
``` cmake
file(GLOB MAIN_SRC ${CMAKE_CURRENT_SOURCE_DIR}/src/*.cpp)
file(GLOB MAIN_HEAD ${CMAKE_CURRENT_SOURCE_DIR}/include/*.h)
```

- `CMAKE_CURRENT_SOURCE_DIR` 宏表示当前访问的 `CMakeLists.txt` 文件所在的路径

<br>

### 5. 制作动态库或静态库

有些时候我们编写的源代码并不需要将他们编译生成可执行程序，而是生成一些静态库或动态库提供给第三方使用，下面来讲解在cmake中生成这两类库文件的方法。

#### 5.1 静态库：

##### 5.1.1 cmake生成规则：

``` cmake
add_library(库名称 STATIC 源文件1 [源文件2] ...) 
```

- 在Linux中，静态库名字分为三部分：`lib + 库名字 + .a`，示例：
``` cmake
cmake_minimum_required(VERSION 3.0)
project(CALC)
include_directories(${PROJECT_SOURCE_DIR}/include)
file(GLOB SRC_LIST "${CMAKE_CURRENT_SOURCE_DIR}/src/*.cpp")
add_library(calc STATIC ${SRC_LIST})
```
这样最终就会生成对应的静态库文件 `libcalc.a`

<br>

##### 5.1.2 gcc生成规则：

``` shell
gcc -c add.c div.c mult.c sub.c -I ./include/
```

- 生成 `.o` 编译文件

``` shell
# 查看目录中的文件
$ tree
.
├── add.c
├── add.o            # 目标文件
├── div.c
├── div.o            # 目标文件
├── include
│   └── head.h
├── main.c
├── mult.c
├── mult.o           # 目标文件
├── sub.c
└── sub.o            # 目标文件
```
- 将生成的目标文件通过 ar工具打包生成静态库

``` shell
# 将生成的目标文件 .o 打包成静态库
$ ar rcs libcalc.a add.o div.o mult.o sub.o    #在同一个目录中可以写成 *.o

# 查看目录中的文件
$ tree
.
├── add.c
├── add.o
├── div.c
├── div.o
├── include
│   └── `head.h  ===> 和静态库一并发布
├── `libcalc.a   ===> 生成的静态库
├── main.c
├── mult.c
├── mult.o
├── sub.c
└── sub.o
```

- 将生成的的静态库 libcalc.a和库对应的头文件head.h一并发布给使用者就可以了。

``` shell
# 3. 发布静态库
	1. head.h    => 函数声明
	2. libcalc.a => 函数定义(二进制格式)
```
<br>

##### 5.1.3 gcc静态库的使用:

``` shell
# 首先拿到了发布的静态库
	`head.h` 和 `libcalc.a`
	
# 将静态库, 头文件, 测试程序放到一个目录中准备进行测试
.
├── head.h          # 函数声明
├── libcalc.a       # 函数定义（二进制格式）
└── main.c          # 函数测试
```

- 编译测试程序, 得到可执行文件。

``` shell
# 编译的时候指定库信息
 	-I: 指定头文件所在的目录(相对或者绝对路径)
	-L: 指定库所在的目录(相对或者绝对路径)
	-l: 指定库的名字, 掐头(lib)去尾(.a) ==> calc
# -L -l, 参数和参数值之间可以有空格, 也可以没有  -L./ -lcalc
$ gcc main.c -o app -I./ -L./ -lcalc

# 查看目录信息, 发现可执行程序已经生成了
$ tree
.
├── app   		# 生成的可执行程序
├── head.h
├── libcalc.a
└── main.c
```

<br>

#### 5.2 动态库：

##### 5.2.1 cmake生成规则：

``` cmake
add_library(库名称 SHARED 源文件1 [源文件2] ...)
```

- 在Linux中，动态库名字分为三部分：`lib + 库名字 + .so` ，示例：
``` cmake
add_library(calc SHARED ${SRC_LIST})
```
这样最终就会生成对应的动态库文件 `libcalc.so`

<br>

##### 5.1.2 gcc生成规则：

- 生成动态链接库是直接使用`gcc`命令并且需要添加`-fPIC(-fpic)` 以及`-shared` 参数。
	- `-fPIC` 或 `-fpic` 参数的作用是使得 `gcc` 生成的代码是与位置无关的，也就是使用相对位置。
	- `-shared`参数的作用是告诉编译器生成一个动态链接库。

``` shell
# 1. 将.c汇编得到.o, 需要额外的参数 -fpic/-fPIC
$ gcc -c -fpic add.c div.c mult.c sub.c -I ./include/
```

- 生成 `.o` 编译文件

``` shell
# 查看目录文件信息, 检查是否生成了目标文件
$ tree
.
├── add.c
├── add.o                # 生成的目标文件
├── div.c
├── div.o                # 生成的目标文件
├── include
│   └── head.h
├── main.c
├── mult.c
├── mult.o               # 生成的目标文件
├── sub.c
└── sub.o                # 生成的目标文件
```
- 使用`gcc`将得到的目标文件打包生成动态库, 需要使用参数 `-shared`

``` shell
# 2. 将得到 .o 打包成动态库, 使用gcc , 参数 -shared
$ gcc -shared add.o div.o mult.o sub.o -o libcalc.so  

# 检查目录中是否生成了动态库
$ tree
.
├── add.c
├── add.o
├── div.c
├── div.o
├── include
│   └── `head.h   ===> 和动态库一起发布
├── `libcalc.so   ===> 生成的动态库
├── main.c
├── mult.c
├── mult.o
├── sub.c
└── sub.o
```

- 将生成的的动态库 libcalc.so和库对应的头文件head.h一并发布给使用者就可以了。

``` shell
# 发布库文件和头文件
	1. head.h
	2. libcalc.so
```

##### 5.1.3 gcc静态库的使用:

``` shell
# 1. 拿到发布的动态库
	`head.h   libcalc.so
# 2. 基于头文件编写测试程序, 测试动态库中提供的接口是否可用
	`main.c`
# 示例目录:
.
├── head.h          ==> 函数声明
├── libcalc.so      ==> 函数定义
└── main.c          ==> 函数测试
```

- 编译测试程序, 得到可执行文件。

``` shell
# 在编译的时候指定动态库相关的信息: 头文件路径-I 库的路径 -L, 库的名字 -l
$ gcc main.c -o app -I./ -L./ -lcalc

# 查看是否生成了可执行程序
$ tree
.
├── app 			# 生成的可执行程序
├── head.h
├── libcalc.so
└── main.c

# 执行生成的可执行程序, 错误提示 ==> 可执行程序执行的时候找不到动态库
$ ./app 
./app: error while loading shared libraries: libcalc.so: cannot open shared object file: No such file or directory
```

**修改解决动态库链接编译问题**

方案 1: 将库路径添加到环境变量`LD_LIBRARY_PATH`中

1. 找到相关的配置文件

- 用户级别: ~/.bashrc —> 设置对当前用户有效
- 系统级别: /etc/profile —> 设置对所有用户有效

2. 使用 vim 打开配置文件, 在文件最后添加这样一句话

``` shell
# 自己把路径写进去就行了
export LD_LIBRARY_PATH =$LD_LIBRARY_PATH :动态库的绝对路径
```

3. 让修改的配置文件生效

- 修改了用户级别的配置文件, 关闭当前终端, 打开一个新的终端配置就生效了
- 修改了系统级别的配置文件, 注销或关闭系统, 再开机配置就生效了
- 不想执行上边的操作, 可以执行一个命令让配置重新被加载

``` shell
# 修改的是哪一个就执行对应的那个命令
# source 可以简写为一个 . , 作用是让文件内容被重新加载
$ source ~/.bashrc          (. ~/.bashrc)
$ source /etc/profile       (. /etc/profile)
```

方案 2: 更新 /etc/ld.so.cache 文件

1. 找到动态库所在的绝对路径（不包括库的名字）比如：/home/robin/Library/

2. 使用vim 修改 /etc/ld.so.conf 这个文件, 将上边的路径添加到文件中(独自占一行)

``` shell
# 1. 打开文件
$ sudo vim /etc/ld.so.conf

# 2. 添加动态库路径, 并保存退出
```

3. 更新 /etc/ld.so.conf中的数据到 /etc/ld.so.cache 中

``` shell
# 必须使用管理员权限执行这个命令
$ sudo ldconfig   
```

方案 3: 拷贝动态库文件到系统库目录 /lib/ 或者 /usr/lib 中 (或者将库的软链接文件放进去)

``` shell
# 库拷贝
sudo cp /xxx/xxx/libxxx.so /usr/lib

# 创建软连接
sudo ln -s /xxx/xxx/libxxx.so /usr/lib/libxxx.so
```

验证执行命令：

``` shell
# 语法:
$ ldd 可执行程序名

# 举例:
$ ldd app
	linux-vdso.so.1 =>  (0x00007ffe8fbd6000)
    libcalc.so => /home/robin/Linux/3Day/calc/test/libcalc.so (0x00007f5d85dd4000)
    libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f5d85a0a000)
    /lib64/ld-linux-x86-64.so.2 (0x00007f5d85fd6000)  ==> 动态链接器, 操作系统提供
```

<br>

#### 5.3 指定输出的路径：

- 方式1 - 适用于动态库
``` cmake
set(EXECUTABLE_OUTPUT_PATH ${PROJECT_SOURCE_DIR}/lib)
```

- 方式2 - 都适用
``` cmake
# 设置动态库/静态库生成路径
set(LIBRARY_OUTPUT_PATH ${PROJECT_SOURCE_DIR}/lib)
```

<br>

#### 5.4 包含库文件：

##### 5.4.1 链接静态库：

``` shell
src
├── add.cpp
├── div.cpp
├── main.cpp
├── mult.cpp
└── sub.cpp
```
现在我们把上面`src`目录中的`add.cpp`、`div.cpp`、`mult.cpp`、`sub.cpp`编译成一个静态库文件`libcalc.a`。通过命令制作并使用静态链接库。

测试目录结构如下：

``` shell
$ tree 
.
├── build
├── CMakeLists.txt
├── include
│   └── head.h
├── lib
│   └── libcalc.a     # 制作出的静态库的名字
└── src
    └── main.cpp

4 directories, 4 files
```

在cmake中，链接静态库的命令如下：
``` cmake
link_libraries(<static lib> [<static lib>...])
```

- 参数1：指定出要链接的静态库的名字
	- 可以是全名 libxxx.a
	- 也可以是掐头（lib）去尾（.a）之后的名字 xxx
- 参数2-N：要链接的其它静态库的名字

如果该静态库不是系统提供的（自己制作或者使用第三方提供的静态库）可能出现静态库找不到的情况，此时可以将静态库的路径也指定出来：

``` cmake
link_directories(<lib path>)
``` 

这样，修改之后的CMakeLists.txt文件内容如下:

``` cmake
cmake_minimum_required(VERSION 3.0)
project(CALC)
# 搜索指定目录下源文件
file(GLOB SRC_LIST ${CMAKE_CURRENT_SOURCE_DIR}/src/*.cpp)
# 包含头文件路径
include_directories(${PROJECT_SOURCE_DIR}/include)
# 包含静态库路径
link_directories(${PROJECT_SOURCE_DIR}/lib)
# 链接静态库
link_libraries(calc)
add_executable(app ${SRC_LIST})
``` 
<br>

##### 5.4.2 链接动态库：

动态库的链接和静态库是完全不同的：

- 静态库会在生成可执行程序的链接阶段被打包到可执行程序中，所以可执行程序启动，静态库就被加载到内存中了。
- 动态库在生成可执行程序的链接阶段不会被打包到可执行程序中，当可执行程序被启动并且调用了动态库中的函数的时候，动态库才会被加载到内存

因此，在`cmake`中指定要链接的动态库的时候，`应该将命令写到生成了可执行文件之后`：

``` cmake
cmake_minimum_required(VERSION 3.0)
project(TEST)
file(GLOB SRC_LIST ${CMAKE_CURRENT_SOURCE_DIR}/*.cpp)
# 添加并指定最终生成的可执行程序名
add_executable(app ${SRC_LIST})
# 指定可执行程序要链接的动态库名字
target_link_libraries(app pthread)
```

在`target_link_libraries(app pthread)`中：

- `app`: 对应的是最终生成的可执行程序的名字
- `pthread`：这是可执行程序要加载的动态库，这个库是系统提供的线程库，全名为`libpthread.so`，在指定的时候一般会掐头`（lib）`去尾`（.so）`。

``` cmake
cmake_minimum_required(VERSION 3.0)
project(TEST)
file(GLOB SRC_LIST ${CMAKE_CURRENT_SOURCE_DIR}/*.cpp)
include_directories(${PROJECT_SOURCE_DIR}/include)
add_executable(app ${SRC_LIST})
target_link_libraries(app pthread calc)
```

在第六行中，pthread、calc都是可执行程序app要链接的动态库的名字。当可执行程序app生成之后并执行该文件，会提示有如下错误信息：

``` shell
$ ./app 
./app: error while loading shared libraries: libcalc.so: cannot open shared object file: No such file or directory
```

在 `CMake` 中可以在生成可执行程序之前，通过命令指定出要链接的动态库的位置，指定静态库位置使用的也是这个命令：

``` cmake
link_directories(path)
```

所以修改之后的CMakeLists.txt文件应该是这样的：

``` cmake
cmake_minimum_required(VERSION 3.0)
project(TEST)
file(GLOB SRC_LIST ${CMAKE_CURRENT_SOURCE_DIR}/*.cpp)
# 指定源文件或者动态库对应的头文件路径
include_directories(${PROJECT_SOURCE_DIR}/include)
# 指定要链接的动态库的路径
link_directories(${PROJECT_SOURCE_DIR}/lib)
# 添加并生成一个可执行程序
add_executable(app ${SRC_LIST})
# 指定要链接的动态库
target_link_libraries(app pthread calc)
```

通过link_directories指定了动态库的路径之后，在执行生成的可执行程序的时候，就不会出现找不到动态库的问题了。

**温馨提示：使用 target_link_libraries 命令就可以链接动态库，也可以链接静态库文件。**

<br>

### 6. 日志

在`CMake`中可以用用户显示一条消息，该命令的名字为`message`：

```cmake
message([STATUS|WARNING|AUTHOR_WARNING|FATAL_ERROR|SEND_ERROR] "message to display" ...)
```

- `(无)` ：重要消息
- `STATUS` ：非重要消息
- `WARNING`：CMake 警告, 会继续执行
- `AUTHOR_WARNING`：CMake 警告 (dev), 会继续执行
- `SEND_ERROR`：CMake 错误, 继续执行，但是会跳过生成的步骤
- `FATAL_ERROR`：CMake 错误, 终止所有处理过程

`CMake`的命令行工具会在`stdout`上显示S`TATUS`消息，在`stderr`上显示其他所有消息。`CMake`的`GUI`会在它的`log`区域显示所有消息。

`CMake`警告和错误消息的文本显示使用的是一种简单的标记语言。文本没有缩进，超过长度的行会回卷，段落之间以新行做为分隔符。

``` cmake
# 输出一般日志信息
message(STATUS "source path: ${PROJECT_SOURCE_DIR}")
# 输出警告信息
message(WARNING "source path: ${PROJECT_SOURCE_DIR}")
# 输出错误信息
message(FATAL_ERROR "source path: ${PROJECT_SOURCE_DIR}")
```

<br>

### 7. 变量操作

#### 7.1 追加

有时候项目中的源文件并不一定都在同一个目录中，但是这些源文件最终却需要一起进行编译来生成最终的可执行文件或者库文件。如果我们通过`file`命令对各个目录下的源文件进行搜索，最后还需要做一个字符串拼接的操作，关于字符串拼接可以使用`set`命令也可以使用`list`命令。

<br>

##### 7.1.1 使用set拼接

如果使用`set`进行字符串拼接，对应的命令格式如下：

``` cmake
set(变量名1 ${变量名1} ${变量名2} ...)
```

关于上面的命令其实就是将从第二个参数开始往后所有的字符串进行拼接，最后将结果存储到第一个参数中，如果第一个参数中原来有数据会对原数据就行覆盖。


``` cmake
cmake_minimum_required(VERSION 3.0)
project(TEST)
set(TEMP "hello,world")
file(GLOB SRC_1 ${PROJECT_SOURCE_DIR}/src1/*.cpp)
file(GLOB SRC_2 ${PROJECT_SOURCE_DIR}/src2/*.cpp)
# 追加(拼接)
set(SRC_1 ${SRC_1} ${SRC_2} ${TEMP})
message(STATUS "message: ${SRC_1}")
```

<br>

##### 7.1.2 使用list拼接
`list`命令的功能比`set`要强大，字符串拼接只是它的其中一个功能，所以需要在它第一个参数的位置指定出我们要做的操作，`APPEND`表示进行数据追加，后边的参数和`set`就一样了。

``` cmake
list(APPEND <list> [<element> ...])
```

<br>

#### 7.2 字符串移除

使用`list`命令，`REMOVE_ITEM`表示对数据进行移除
``` cmake
list(REMOVE_ITEM <list> <value> [<value> ...])
```

例子：
``` cmake
cmake_minimum_required(VERSION 3.0)
project(TEST)
set(TEMP "hello,world")
file(GLOB SRC_1 ${PROJECT_SOURCE_DIR}/*.cpp)
# 移除前日志
message(STATUS "message: ${SRC_1}")
# 移除 main.cpp
list(REMOVE_ITEM SRC_1 ${PROJECT_SOURCE_DIR}/main.cpp)
# 移除后日志
message(STATUS "message: ${SRC_1}")
```

<br>

### 8. 宏定义

在`CMake`中，对应的命令叫做`add_definitions`:
``` cmake
add_definitions(-D宏名称)
```

例子：
``` cmake
cmake_minimum_required(VERSION 3.0)
project(TEST)
# 自定义 DEBUG 宏
add_definitions(-DDEBUG)
add_executable(app ./test.c)
```

<br>

### 9. 预定义宏

下面的列表中为大家整理了一些`CMake`中常用的宏：

| 宏 | 功能 |
|---|---|
| PROJECT_SOURCE_DIR | 使用`cmake`命令后紧跟的目录，一般是工程的根目录|
| PROJECT_BINARY_DIR | 执行`cmake`命令的目录|
| CMAKE_CURRENT_SOURCE_DIR | 当前处理的`CMakeLists.txt`所在的路径|
| CMAKE_CURRENT_BINARY_DIR | `target` 编译目录|
| EXECUTABLE_OUTPUT_PATH | 重新定义目标二进制可执行文件的存放位置|
| LIBRARY_OUTPUT_PATH | 重新定义目标链接库文件的存放位置|
| PROJECT_NAME | 返回通过`PROJECT`指令定义的项目名称|
| CMAKE_BINARY_DIR | 项目实际构建路径，假设在`build`目录进行的构建，那么得到的就是这个目录的路径|

<br>

### 10. 嵌套的CMake

如果项目很大，或者项目中有很多的源码目录，在通过CMake管理项目的时候如果只使用一个CMakeLists.txt，那么这个文件相对会比较复杂，有一种化繁为简的方式就是给每个源码目录都添加一个CMakeLists.txt文件（头文件目录不需要），这样每个文件都不会太复杂，而且更灵活，更容易维护。

先来看一下下面的这个的目录结构：

``` shell
$ tree
.
├── build
├── calc
│   ├── add.c
│   ├── CMakeLists.txt
│   ├── div.c
│   ├── mult.c
│   └── sub.c
├── CMakeLists.txt
├── include
│   ├── calc.h
│   └── sort.h
├── sort
│   ├── CMakeLists.txt
│   ├── insert.c
│   └── select.c
├── test1
│   ├── calc.cpp
│   └── CMakeLists.txt
└── test2
    ├── CMakeLists.txt
    └── sort.c

6 directories, 15 files
```

- `include 目录`：头文件目录
- `calc 目录`：目录中的四个源文件对应的加、减、乘、除算法
	- 对应的头文件是`include`中的`calc.h`
- `sort 目录` ：目录中的两个源文件对应的是插入排序和选择排序算法
	- 对应的头文件是i`nclude`中的`sort.h`
- `test1 目录`：测试目录，对加、减、乘、除算法进行测试
- `test2 目录`：测试目录，对排序算法进行测试

可以看到各个源文件目录所需要的`CMakeLists.txt`文件现在已经添加完毕了。接下来庖丁解牛，我们依次分析一下各个文件中需要添加的内容。

<br>

### 10.1 节点关系

众所周知，`Linux`的目录是树状结构，所以`嵌套的 CMake 也是一个树状结构，最顶层的 CMakeLists.txt 是根节点，其次都是子节点。`因此，我们需要了解一些关于 `CMakeLists.txt` 文件变量作用域的一些信息：

- 根节点`CMakeLists.txt`中的变量全局有效
- 父节点`CMakeLists.txt`中的变量可以在子节点中使用
- 子节点`CMakeLists.txt`中的变量只能在当前节点中使用

<br>

### 10.2 添加子目录

``` cmake
add_subdirectory(source_dir [binary_dir] [EXCLUDE_FROM_ALL])
```

- `source_dir`：指定了`CMakeLists.txt`源文件和代码文件的位置，其实就是指定子目录
- `binary_dir`：指定了输出文件的路径，一般不需要指定，忽略即可。
- `EXCLUDE_FROM_ALL`：在子路径下的目标默认不会被包含到父路径的`ALL`目标里，并且也会被排除在IDE工程文件之外。用户必须显式构建在子路径下的目标。

通过这种方式`CMakeLists.txt`文件之间的父子关系就被构建出来了。

### 10.3 编写CMakeLists.txt文件

#### 10.3.1 根目录

根目录中的 `CMakeLists.txt`文件内容如下：
```
cmake_minimum_required(VERSION 3.0)
project(test)
# 定义变量
# 静态库生成的路径
set(LIB_PATH ${CMAKE_CURRENT_SOURCE_DIR}/lib)
# 测试程序生成的路径
set(EXEC_PATH ${CMAKE_CURRENT_SOURCE_DIR}/bin)
# 头文件目录
set(HEAD_PATH ${CMAKE_CURRENT_SOURCE_DIR}/include)
# 静态库的名字
set(CALC_LIB calc)
set(SORT_LIB sort)
# 可执行程序的名字
set(APP_NAME_1 test1)
set(APP_NAME_2 test2)
# 添加子目录
add_subdirectory(calc)
add_subdirectory(sort)
add_subdirectory(test1)
add_subdirectory(test2)
```

在根节点对应的文件中主要做了两件事情：定义全局变量和添加子目录。

- 定义的全局变量主要是给子节点使用，目的是为了提高子节点中的`CMakeLists.txt`文件的可读性和可维护性，避免冗余并降低出差的概率。
- 一共添加了四个子目录，每个子目录中都有一个`CMakeLists.txt`文件，这样它们的父子关系就被确定下来了。


#### 10.3.2 calc 目录

`calc` 目录中的 `CMakeLists.txt`文件内容如下：

``` cmake
cmake_minimum_required(VERSION 3.0)
project(CALCLIB)
aux_source_directory(./ SRC)
include_directories(${HEAD_PATH})
set(LIBRARY_OUTPUT_PATH ${LIB_PATH})
add_library(${CALC_LIB} STATIC ${SRC})
```
- 第3行`aux_source_directory`：搜索当前目录（calc目录）下的所有源文件
- 第4行`include_directories`：包含头文件路径，HEAD_PATH是在根节点文件中定义的
- 第5行`set`：设置库的生成的路径，LIB_PATH是在根节点文件中定义的
- 第6行`add_library`：生成静态库，静态库名字CALC_LIB是在根节点文件中定义的

#### 10.3.2 sort 目录

sort 目录中的 CMakeLists.txt文件内容如下：

``` cmake
cmake_minimum_required(VERSION 3.0)
project(CALCLIB)
aux_source_directory(./ SRC)
include_directories(${HEAD_PATH})
set(LIBRARY_OUTPUT_PATH ${LIB_PATH})
add_library(${CALC_LIB} SHARED ${SRC})
```
- 第6行`add_library`：生成动态库，动态库名字SORT_LIB是在根节点文件中定义的

这个文件中的内容和`calc`节点文件中的内容类似，只不过这次生成的是动态库。

#### 10.3.3 test1 目录

test1 目录中的 CMakeLists.txt文件内容如下：

``` cmake
cmake_minimum_required(VERSION 3.0)
project(CALCTEST)
aux_source_directory(./ SRC)
include_directories(${HEAD_PATH})
link_directories(${LIB_PATH})
link_libraries(${CALC_LIB})
set(EXECUTABLE_OUTPUT_PATH ${EXEC_PATH})
add_executable(${APP_NAME_1} ${SRC})
```
- 第4行include_directories：指定头文件路径，HEAD_PATH变量是在根节点文件中定义的
- 第6行link_libraries：指定可执行程序要链接的静态库，CALC_LIB变量是在根节点文件中定义的
- 第7行set：指定可执行程序生成的路径，EXEC_PATH变量是在根节点文件中定义的
- 第8行add_executable：生成可执行程序，APP_NAME_1变量是在根节点文件中定义的

此处的可执行程序链接的是静态库，最终静态库会被打包到可执行程序中，可执行程序启动之后，静态库也就随之被加载到内存中了。

#### 10.3.4 test2 目录

test2 目录中的 CMakeLists.txt文件内容如下：

``` cmake
cmake_minimum_required(VERSION 3.0)
project(SORTTEST)
aux_source_directory(./ SRC)
include_directories(${HEAD_PATH})
set(EXECUTABLE_OUTPUT_PATH ${EXEC_PATH})
link_directories(${LIB_PATH})
add_executable(${APP_NAME_2} ${SRC})
target_link_libraries(${APP_NAME_2} ${SORT_LIB})
```
- 第四行`include_directories`：包含头文件路径，HEAD_PATH变量是在根节点文件中定义的
- 第五行`set`：指定可执行程序生成的路径，EXEC_PATH变量是在根节点文件中定义的
- 第六行`link_directories`：指定可执行程序要链接的动态库的路径，LIB_PATH变量是在根节点文件中定义的
- 第七行`add_executable`：生成可执行程序，APP_NAME_2变量是在根节点文件中定义的
- 第八行`target_link_libraries`：指定可执行程序要链接的动态库的名字

在生成可执行程序的时候，动态库不会被打包到可执行程序内部。当可执行程序启动之后动态库也不会被加载到内存，只有可执行程序调用了动态库中的函数的时候，动态库才会被加载到内存中，且多个进程可以共用内存中的同一个动态库，所以动态库又叫共享库。

**注意：引用变量要使用{},不要用成()**
- set(EXECUTABLE_OUTPUT_PATH `${EXEC_PATH}`) 写成如下就会出错：
- set(EXECUTABLE_OUTPUT_PATH `$(EXEC_PATH)`) 就会出错

<br>

#### 10.3.4 构建项目

``` shell
xuan@DESKTOP-A52B6V9:~/linux/demos/cpro$ cd build/
xuan@DESKTOP-A52B6V9:~/linux/demos/cpro/build$ cmake ..
-- The C compiler identification is GNU 11.4.0
-- The CXX compiler identification is GNU 11.4.0
-- Detecting C compiler ABI info
-- Detecting C compiler ABI info - done
-- Check for working C compiler: /usr/bin/cc - skipped
-- Detecting C compile features
-- Detecting C compile features - done
-- Detecting CXX compiler ABI info
-- Detecting CXX compiler ABI info - done
-- Check for working CXX compiler: /usr/bin/c++ - skipped
-- Detecting CXX compile features
-- Detecting CXX compile features - done
-- Configuring done
-- Generating done
-- Build files have been written to: /home/xuan/linux/demos/cpro/build

xuan@DESKTOP-A52B6V9:~/linux/demos/cpro/build$ make
[  8%] Building C object calc/CMakeFiles/calc.dir/add.c.o
[ 16%] Building C object calc/CMakeFiles/calc.dir/div.c.o
[ 25%] Building C object calc/CMakeFiles/calc.dir/mult.c.o
[ 33%] Building C object calc/CMakeFiles/calc.dir/sub.c.o
[ 41%] Linking C static library ../../lib/libcalc.a
[ 41%] Built target calc
[ 50%] Building C object sort/CMakeFiles/sort.dir/insert.c.o
[ 58%] Building C object sort/CMakeFiles/sort.dir/select.c.o
[ 66%] Linking C shared library ../../lib/libsort.so
[ 66%] Built target sort
[ 75%] Building C object test2/CMakeFiles/test2.dir/sort.c.o
[ 83%] Linking C executable ../../bin/test2
[ 83%] Built target test2
[ 91%] Building C object test1/CMakeFiles/test1.dir/calc.c.o
[100%] Linking C executable ../../bin/test1
[100%] Built target test1
```

通过上述`log`可以得到如下信息：

- 在项目根目录的`lib目录`中生成了静态库`libcalc.a`
- 在项目根目录的`lib目录`中生成了动态库`libsort.so`
- 在项目根目录的`bin目录`中生成了可执行程序`test1`
- 在项目根目录的`bin目录`中生成了可执行程序`test2`

以下是生成的树状图：

``` shell
$ tree bin/ lib/
bin/
├── test1
└── test2
lib/
├── libcalc.a
└── libsort.so
```

- 在项目中，如果将程序中的某个模块制作成了动态库或者静态库并且在`CMakeLists.txt` 中指定了库的输出目录，而后其它模块又需要加载这个生成的库文件，此时直接使用就可以了。
- 如果没有指定库的输出路径或者需要直接加载外部提供的库文件，此时就需要使用`link_directories(${LIB_PATH})`将库文件路径指定出来,然后链接库的名字`link_libraries(${CALC_LIB})`。

<br>

### 11. 流程控制

#### 11.1 条件判断

``` cmake
if(<condition>)
  <commands>
elseif(<condition>) # 可选快, 可以重复
  <commands>
else()              # 可选快
  <commands>
endif()
```

##### 11.1.1 基本表达式

- `if(<expression>)`: `expression` 有以下三种情况：常量、变量、字符串。

	- 如果是`1`, `ON`, `YES`, `TRUE`, `Y`, `非零值`，`非空字符串`时，条件判断返回`True`
	- 如果是 `0`, `OFF`, `NO`, `FALSE`, `N`, `IGNORE`, `NOTFOUND`，`空字符串`时，条件判断返回`False`

<br>

##### 11.1.2 逻辑判断

- if(NOT <condition>)
- if(<cond1> AND <cond2>)
- if(<cond1> OR <cond2>)

<br>

##### 11.1.3 比较

- `if(<variable|string> <COMMAND> <variable|string>)`
- <`COMMAND`>为如下值的解释：
	- `LESS`：如果左侧数值/字符串`小于`右侧，返回`True`
	- `GREATER`：如果左侧数值/字符串`大于`右侧，返回`True`
	- `EQUAL`：如果左侧数值/字符串`等于`右侧，返回`True`
	- `LESS_EQUAL`：如果左侧数值/字符串`小于等于`右侧，返回`True`
	- `GREATER_EQUAL`：如果左侧数值/字符串`大于等于`右侧，返回`True`

<br>

##### 11.1.4 文件操作

**存在/是**返回`True`，**不存在/否**返回`False`
- 判断文件或者目录是否存在：`if(EXISTS path-to-file-or-directory)`
- 判断是不是目录：`if(IS_DIRECTORY path)`
	- 此处目录的 `path` 必须是绝对路径
- 判断是不是软连接：`if(IS_SYMLINK file-name)`
	- 此处的 `file-name` 对应的路径必须是绝对路径
	- 软链接相当于 `Windows` 里的快捷方式
- 判断是不是绝对路径：`if(IS_ABSOLUTE path)`
	- 如果绝对路径是Linux，该路径需要从根目录开始描述
	- 如果绝对路径是Windows，该路径需要从盘符开始描述

<br>

##### 11.1.5 其他

- 判断某个元素是否在列表中：`if(<variable|string> IN_LIST <variable>)`
- 比较两个路径是否相等：`if(<variable|string> PATH_EQUAL <variable|string>)`

<br>

#### 11.2 循环
在 `CMake` 中循环有两种方式，分别是：`foreach`和`while`。

##### 11.2.1 foreach
使用 foreach 进行循环，语法格式如下：
``` cmake
foreach(<loop_var> <items>)
    <commands>
endforeach()
```

- `foreach(<loop_var> RANGE <stop>)`
	- `RANGE`：关键字，表示要遍历范围
	- `stop`：这是一个正整数，表示范围的结束值，在遍历的时候从 0 开始，最大值为 `stop`。
	- `loop_var`：存储每次循环取出的值

``` cmake
cmake_minimum_required(VERSION 3.2)
project(test)
# 循环
foreach(item RANGE 10)
    message(STATUS "当前遍历的值为: ${item}" )
endforeach()
```
上面例子输出`0~10`

<br>

- `foreach(<loop_var> RANGE <start> <stop> [<step>])`
	- `RANGE`：关键字，表示要遍历范围
	- `start`：这是一个正整数，表示范围的起始值，也就是说最小值为 `start`
	- `stop`：这是一个正整数，表示范围的结束值，也就是说最大值为 `stop`
	- `step`：控制每次遍历的时候以怎样的步长增长，默认为`1`，可以不设置
	-`loop_var`：存储每次循环取出的值

``` cmake
cmake_minimum_required(VERSION 3.2)
project(test)

foreach(item RANGE 10 30 2)
    message(STATUS "当前遍历的值为: ${item}" )
endforeach()
```
上面例子输出`10~30`,从`10`开始,每次增长`2`。

<br>

- `foreach(<loop_var> IN [LISTS [<lists>]] [ITEMS [<items>]])`
	- `IN`：关键字，表示在 `xxx` 里边
	- `LISTS`：关键字，对应的是列表`list`，通过`set`、`list`可以获得
	- `ITEMS`：关键字，对应的也是列表
	- `loop_var`：存储每次循环取出的值

``` cmake
cmake_minimum_required(VERSION 3.2)
project(test)
# 创建 list
set(WORD a b c d)
set(NAME ace sabo luffy)
# 遍历 list
foreach(item IN LISTS WORD NAME)
    message(STATUS "当前遍历的值为: ${item}" )
endforeach()
```
在上面的例子中，创建了两个 `list` 列表，在遍历的时候对它们两个都进行了遍历（可以根据实际需求选择同时遍历多个或者只遍历一个）

``` cmake
cmake_minimum_required(VERSION 3.2)
project(test)

set(WORD a b c "d e f")
set(NAME ace sabo luffy)
foreach(item IN ITEMS ${WORD} ${NAME})
    message(STATUS "当前遍历的值为: ${item}" )
endforeach()
```
在上面的例子中，遍历过程中将关键字`LISTS`改成了`ITEMS`，后边跟的还是一个或者多个列表，只不过此时需要通过`${}`将列表中的值取出。其输出的信息和上一个例子是一样的：
``` shell
$ cd build/
$ cmake ..
-- 当前遍历的值为: a
-- 当前遍历的值为: b
-- 当前遍历的值为: c
-- 当前遍历的值为: d e f
-- 当前遍历的值为: ace
-- 当前遍历的值为: sabo
-- 当前遍历的值为: luffy
-- Configuring done
-- Generating done
-- Build files have been written to: /home/robin/abc/a/build
```

小细节：在通过 set 组织列表的时候，如果某个字符串中有空格，可以通过双引号将其包裹起来，具体的操作方法可以参考上面的例子。

<br>

- `foreach(<loop_var>... IN ZIP_LISTS <lists>)`
	- `loop_var`：存储每次循环取出的值，可以根据要遍历的列表的数量指定多个变量，用于存储对应的列表当前取出的那个值。
		- 如果指定了多个变量名，它们的数量应该和列表的数量相等
		- 如果只给出了一个 `loop_var`，那么它将一系列的 `loop_var_N` 变量来存储对应列表中的当前项，也就是说 `loop_var_0` 对应第一个列表，`loop_var_1` 对应第二个列表，以此类推......
		- 如果遍历的多个列表中一个列表较短，当它遍历完成之后将不会再参与后续的遍历（因为其它列表还没有遍历完）。
	- `IN`：关键字，表示在 `xxx` 里边
	- `ZIP_LISTS`：关键字，对应的是列表`list`，通过`set` 、`list`可以获得

``` cmake
cmake_minimum_required(VERSION 3.17)
project(test)
# 通过list给列表添加数据
list(APPEND WORD hello world "hello world")
list(APPEND NAME ace sabo luffy zoro sanji)
# 遍历列表
foreach(item1 item2 IN ZIP_LISTS WORD NAME)
    message(STATUS "当前遍历的值为: item1 = ${item1}, item2=${item2}" )
endforeach()

message("=============================")
# 遍历列表
foreach(item  IN ZIP_LISTS WORD NAME)
    message(STATUS "当前遍历的值为: item1 = ${item_0}, item2=${item_1}" )
endforeach()
```
在这个例子中关于列表数据的添加是通过`list`来实现的。在遍历列表的时候一共使用了两种方式，一种提供了多个变量来存储当前列表中的值，另一种只有一个变量，但是实际取值的时候需要通过`变量名_0、变量名_1、变量名_N` 的方式来操作，`注意事项：第一个列表对应的编号是0，第一个列表对应的编号是0，第一个列表对应的编号是0。`

上面的例子输出的结果如下：

``` shell
$ cd build/
$ cmake ..
-- 当前遍历的值为: item1 = hello, item2=ace
-- 当前遍历的值为: item1 = world, item2=sabo
-- 当前遍历的值为: item1 = hello world, item2=luffy
-- 当前遍历的值为: item1 = , item2=zoro
-- 当前遍历的值为: item1 = , item2=sanji
=============================
-- 当前遍历的值为: item1 = hello, item2=ace
-- 当前遍历的值为: item1 = world, item2=sabo
-- 当前遍历的值为: item1 = hello world, item2=luffy
-- 当前遍历的值为: item1 = , item2=zoro
-- 当前遍历的值为: item1 = , item2=sanji
-- Configuring done (0.0s)
-- Generating done (0.0s)
-- Build files have been written to: /home/robin/abc/a/build
```

<br>

##### 11.2.2 while

``` cmake
while(<condition>)
    <commands>
endwhile()
```
`while` 比较简单就不做描述了。

<br>

### 12. cmake设置编译器

#### 12.1 命令行

在命令行中指定编译器，你可以在调用 `cmake` 命令时使用 `-DCMAKE_C_COMPILER` 和 `-DCMAKE_CXX_COMPILER` 选项来分别为`C`和`C++`设置编译器。例如：

``` shell
cmake -DCMAKE_C_COMPILER=gcc -DCMAKE_CXX_COMPILER=g++ /path/to/source
```

<br>

#### 12.2 CMakeLists.txt

在项目的 `CMakeLists.txt` 文件中，你可以使用 `set` 命令来指定编译器：

``` cmake
set(CMAKE_C_COMPILER /user/bin/gcc)
set(CMAKE_CXX_COMPILER /user/bin/g++)
```

<br>

#### 12.3 工具链文件

`CMake`允许使用所谓的“工具链文件”（toolchain file）来指定编译器和工具链设置。这在跨平台构建时非常有用。工具链文件是一个普通的`CMake`脚本，它设置了构建系统所需的编译器和工具链选项。例如，创建一个名为 `toolchain.cmake` 的文件，并在其中设置编译器：

	set(CMAKE_C_COMPILER gcc)
	set(CMAKE_CXX_COMPILER g++)

然后在调用 `cmake` 命令时指定工具链文件：

	cmake -DCMAKE_TOOLCHAIN_FILE=path/to/toolchain.cmake /path/to/source

请记住，一旦`CMake`缓存生成，更改编译器的设置就需要清理`CMake`缓存并重新运行`CMake`配置。这是因为`CMake`在第一次运行时会将编译器和工具链的信息缓存起来，以便后续构建使用。