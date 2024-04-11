var tipuesearch = {"pages":[{"title":"Linux下开发单片机","url":"/2024/03/28/linux-arm-gcc环境搭建/","text":"Ubuntu Wsl环境搭建Windows10系统安装子系统Wsl1. 通过 Microsoft Store 安装 打开 Microsoft Store。 搜索 “适用于 Linux 的 Windows 子系统”。 选择 “Ubuntu” 或您喜欢的其他 Linux 发行版。 点击 “获取”。 安装完成后，点击 “启动”。 2. 通过命令行 打开 PowerShell 或 命令提示符 以管理员身份运行。 输入以下命令: 1wsl --install 重启您的计算机。 安装完成后，您可以通过以下命令启动 WSL： 1wsl 注意: WSL 需要 Windows 10 版本 1709 或更高版本。 您可以通过以下命令检查您的 Windows 版本： 1winver 如果您使用的是 Windows 10 家庭版，您需要启用 “适用于 Linux 的 Windows 子系统” 功能： 1控制面板-&gt;程序和功能-&gt;启用或关闭 Windows 功能-&gt;适用于 Linux 的 Windows 子系统-&gt;确定 您可以通过以下命令启用 “适用于 Linux 的 Windows 子系统” 功能： 1dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux 重启您的计算机后，您就可以通过上述方法安装 WSL 了。 安装Windows Terminal 编译环境配置 gcc-arm-none-eabi工具链安装 手动安装：官方链接地址 下载所需版本； 12sudo apt install bzip2sudo tar -xvf ~/n32_gcc/software_package/gcc-arm-none-eabi-9-2019-q4-major-x86_64-linux.tar.bz2 -C ~/n32_gcc 自动安装：sudo apt-get install gcc-arm-none-eabi 打开 ~&#x2F;.bashrc 添加export PATH&#x3D;$PATH:~&#x2F;n32_gcc&#x2F;gcc-arm-none-eabi-9-2019-q4-major&#x2F;bin 添加alias open-file&#x3D;’explorer.exe .’ 使能用户环境变量source ~&#x2F;.bashrc Make sudo apt-get install make Winodows Gcc + Make 环境搭建 安装software_package目录下的gcc-arm-none-eabi-9-2019-q4-major-win32-sha2.exe和make-3.81.exe 分别将其安装目录下的 .&#x2F;bin添加到系统环境变量，重启生效 复制裸机工程至Windows下，修改部分Makefile的linux指令以适配Windows即可 裸机工程编译 cd n32g452_gcc make","tags":"linux wsl"},{"title":"I2C调试记录","url":"/2024/03/01/I2C调试记录/","text":"I2C基本原理介绍时序介绍参考Vishay的i2c时序图： 代码实现详解I2C协议实现有硬件I2C和软件I2C之分，这里只讲解软件I2C实现的版本。一下列出主要结构体和初始化函数。 I2C协议初始化I2C协议的scl和sda配置为开漏输出,需要外部上拉（一般为10K电阻） 123456789101112131415161718192021222324252627282930313233343536373839404142434445464748495051525354555657585960616263646566676869707172737475767778798081828384858687888990919293949596#define i2c_pin_mode(pin,mode) drv_pin_mode(pin,mode)#define i2c_pin_write(pin,level) drv_pin_write(pin,level)#define i2c_pin_read(pin) drv_pin_read(pin)#define DRV_I2C_WR 0x00#define DRV_I2C_RD (1u &lt;&lt; 0)#define DRV_I2C_ADDR_10BIT (1u &lt;&lt; 2) /* this is a ten bit chip address */#define DRV_I2C_NO_START (1u &lt;&lt; 4)#define DRV_I2C_IGNORE_NACK (1u &lt;&lt; 5)#define DRV_I2C_NO_READ_ACK (1u &lt;&lt; 6) /* when I2C reading, we do not ACK */#define DRV_I2C_NO_STOP (1u &lt;&lt; 7)typedef enum&#123; EI2C_DEV_1 = 1, EI2C_DEV_2, EI2C_DEV_3&#125;EI2C_DEVICE;struct drv_soft_i2c_config&#123; uint8_t scl; uint8_t sda; uint8_t i2c_num;&#125;;struct drv_i2c_msg&#123; uint16_t addr; uint16_t flags; uint16_t len; uint8_t reg_addr; uint8_t *buf;&#125;;struct drv_i2c_bit_ops&#123; void *data; /* private data for lowlevel routines */ void (*set_sda)(void *data, int state); void (*set_scl)(void *data, int state); int (*get_sda)(void *data); int (*get_scl)(void *data); void (*udelay)(uint32_t us); uint32_t delay_us; /* scl and sda line delay */ uint32_t timeout; /* in tick */&#125;;struct drv_i2c_bus_device&#123; struct drv_i2c_msg msg; struct drv_i2c_bit_ops ops;&#125;;static void drv_i2c_gpio_init(struct drv_soft_i2c_config *i2c)&#123; struct drv_soft_i2c_config* cfg = i2c; i2c_pin_mode(cfg-&gt;scl, I2C_PIN_MODE_OUTPUT_OD); //PIN_MODE_OUTPUT i2c_pin_mode(cfg-&gt;sda, I2C_PIN_MODE_OUTPUT_OD); i2c_pin_write(cfg-&gt;scl, I2C_PIN_HIGH); i2c_pin_write(cfg-&gt;sda, I2C_PIN_HIGH);&#125;int drv_hw_i2c_init(EI2C_DEVICE dev_e)&#123; int size = sizeof(i2c_pin_config)/sizeof(struct drv_soft_i2c_config); struct drv_i2c_bus_device *dev = get_i2c_device(dev_e); uint8_t dev_num = (uint8_t)dev_e; struct drv_soft_i2c_config *pin_cfg = NULL; struct drv_i2c_bit_ops *ops = &amp;dev-&gt;ops; for(int i=0;i&lt;size;i++) &#123; if(i2c_pin_config[i].i2c_num == dev_num) &#123; pin_cfg = (struct drv_soft_i2c_config *)&amp;i2c_pin_config[i]; break; &#125; &#125; if(pin_cfg == NULL) return -1; ops-&gt;data = (void*)pin_cfg; ops-&gt;set_sda = n32_set_sda; ops-&gt;set_scl = n32_set_scl; ops-&gt;get_sda = n32_get_sda; ops-&gt;get_scl = n32_get_scl; ops-&gt;udelay = n32_udelay; ops-&gt;delay_us = 1; ops-&gt;timeout = 5; drv_i2c_gpio_init(pin_cfg); drv_i2c_bus_unlock(pin_cfg); return 0;&#125; 接口函数12345678int drv_i2c_bit_xfer(struct drv_i2c_bit_ops *bus, struct drv_i2c_msg msgs[], uint32_t num);struct drv_i2c_bus_device *get_i2c_device(EI2C_DEVICE dev_e);static uint64_t i2c_tick_get(void);int drv_hw_i2c_init(EI2C_DEVICE dev_e);int drv_i2c_send_data(EI2C_DEVICE dev_e,uint16_t addr,uint8_t reg_addr,uint8_t *buf,uint16_t len);int drv_i2c_recv_data(EI2C_DEVICE dev_e,uint16_t addr,uint8_t reg_addr,uint8_t *buf,uint16_t len); 实战开发问题分析实际开发过程中，同样的I2C驱动程序，在不同厂家芯片的使用上出现一些问题，导致部分厂家通信异常，导致数据接收不正确，以下进行分析对比，作证并解决问题。 Vishay 和 亿光 接近传感器模块对比Vishay 使用VCNL3682S型号芯片，亿光 使用APM-16D24-U6E型号芯片，I2C协议对比。 Vishay ： 亿光： 对比波形对比协议来看基本上是一致的，用JI2C工具测的i2c波形也基本上一致，但是我自己写的软件i2c驱动，Vishay可以正常使用，亿光读取的数据就有问题，用逻辑分析仪抓一波波形分析一下。 发现每次读完都会多恢复一个ack，而协议上读完最后一个字节需要恢复nack。 修改了以下代码12345678910111213141516static int i2c_send_ack_or_nack(struct drv_i2c_bit_ops *bus, int ack)&#123; struct drv_i2c_bit_ops *ops = bus; if (ack) //if(ack &gt;= 0) 改成 if(ack) SET_SDA(ops, 0); i2c_delay(ops); if (SCL_H(ops) &lt; 0) &#123;// logVerbose(&quot;ACK or NACK timeout.&quot;); return -2; &#125; SCL_L(ops); return 0;&#125; static int i2c_send_ack_or_nack(struct drv_i2c_bit_ops *bus, int ack){}函数主要处理响应回复。 if(ack &gt;= 0)表示每次都会回复ack/nack if(ack)表示除最后一次数据不回复，其他每次都会回复ack/nack","tags":"逻辑分析仪 接近传感器"},{"title":"ESP32开发小贴士","url":"/2024/02/22/ESP32小贴士/","text":"ESP32 ESP-IDF自定义组件简介官方文档英文官方文档链接中文官方文档链接 示例说明此示例在《ESP32 smart_config和airkiss配网》https://zhuanlan.zhihu.com/p/440454542https://link.zhihu.com/?target=https%3A//blog.csdn.net/chentuo2000/article/details/121687760基础上，增加连接成功后点亮板载LED功能。实现所需功能后将各功能代码分离，再将分离后的代码构造成组件，使得项目有清晰的结构，方便功能代码移植. 开发环境《Win10启用Linux子系统安装Ubuntu》https://link.zhihu.com/?target=https%3A//blog.csdn.net/chentuo2000/article/details/112131624 《用乐鑫国内Gitee镜像搭建ESP32开发环境》https://link.zhihu.com/?target=https%3A//blog.csdn.net/chentuo2000/article/details/113424934 构建项目拷贝 &amp;&amp; 初始化例程将例子项目hello_world复制到ESP-IDF开发工具之外,更名为components_demo: cd ~/esp cp -r ~/esp/esp-adf/esp-idf/examples/get-started/hello_world ./components_demo 清空build目录: cd ~/esp/components_demo rm -r build/* 注意，每当添加了新组件就要删除build目录下的全部内容，或者执行下面这条命令： idf.py fullclean 清除以前的构建。 添加组件letter_shellidf.py -C components create-component letter_shell 该命令会创建一个新组件,新组件将包含构建组件所需的一组空文件。我们的工作就是在这一组空文件中写上我们的代码。如果熟悉了组件结构，也可以直接在项目中手工创建。 项目树构建好的项目结构如下: 注意：组件目录components名字不能改，其下的组件名可以随意取。build目录是编译时生成的，编译的结果都放在其中。dependencies.lock是随原来的项目复制过来的不要改。sdkconfig文件可以用idf.py menuconfig命令修改。 代码和说明各文件的位置关系很重要，请对照前面的项目树看代码文件。 项目的根CMakeLists.txt文件# The following lines of boilerplate have to be in your project&#39;s # CMakeLists in this exact order for cmake to work correctly cmake_minimum_required(VERSION 3.16) include($ENV&#123;IDF_PATH&#125;/tools/cmake/project.cmake) project(components_demo) 只需要修改project中的项目名称。 main目录CMakeLists.txt idf_component_register(SRCS &quot;main.c&quot; INCLUDE_DIRS &quot;.&quot;) main.c 123456789101112131415161718192021222324252627282930313233343536373839#include &lt;stdio.h&gt;#include &lt;string.h&gt;#include &quot;freertos/FreeRTOS.h&quot;#include &quot;freertos/task.h&quot;#include &quot;freertos/queue.h&quot;#include &quot;esp_log.h&quot;#include &quot;shell_port.h&quot;#include &quot;log.h&quot;#include &quot;nvs_flash.h&quot;static const char *TAG = &quot;sample test&quot;;void app_main(void)&#123; esp_err_t ret; // Initialize NVS. ret = nvs_flash_init(); if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) &#123; ESP_ERROR_CHECK(nvs_flash_erase()); ret = nvs_flash_init(); &#125; ESP_ERROR_CHECK( ret ); esp_log_level_set(TAG, ESP_LOG_INFO); ESP_LOGI(TAG,&quot;this is a test program&quot;); userShellInit(); logInfo(&quot;log info!&quot;); logDebug(&quot;log debug!&quot;); logWarning(&quot;log warning!&quot;); logError(&quot;log error!&quot;); while(1) &#123; logDebug(&quot;log loop!&quot;); vTaskDelay(pdMS_TO_TICKS(2000)); &#125;&#125; 头文件nvs_flash.h是对系统组件的引用，shell_port.h是对自定义组件的引用。 letter_shell组件CMakeLists.txt idf_component_register( SRCS &quot;shell.c&quot; &quot;shell_ext.c&quot; &quot;log.c&quot; &quot;shell_port.c&quot; INCLUDE_DIRS &quot;include&quot; LDFRAGMENTS &quot;shell.lf&quot; # PRIV_REQUIRES led REQUIRES esp_driver_uart ) 说明：1、PRIV_REQUIRES该参数指定对其它自定义组件的依赖，即私有依赖项。 PRIV_REQUIRES led表示指出在smart_config组件中要用到自定义的led组件。组件名字可以加引号，也可以不加。多个组件用空格分开。 2、 REQUIRES该参数指定对系统组件的依赖，即公共依赖项。 REQUIRES esp_driver_uart 表示在letter_shell组件中要用到系统组件esp_driver_uart。 3、系统组件的确定 对于要依赖的系统组件不像私有依赖项那样一目了然，有时我们并不清楚所要的系统组件名称。比如我们不知道需要组件wpa_supplicant，这时我们可以先编译一次，看看错误信息： 在CMakeLists.txt中添加依赖组件REQUIRES esp_driver_uart，编译通过。 关于CMakeLists.txt文件根和每个目录都有一个CMakeLists.txt文件，开始遇到的问题是不知道目录结构和怎样写CMakeLists.txt文件，要注意每一层目录中CMakeLists.txt文件的写法，本文的例子给出了一个简单的示范。对于复杂的项目还需要更多编写CMakeLists.txt文件的知识，请看简介中给出的官方文档。 ESP32移植Letter_shell问题添加shell组件及其log，编译出错可能原因: 宏使用不正确: 如果 SHELL_FREE 旨在实际释放与 companions 对象关联的内存或资源，则当前定义不正确。它应该调用内存管理函数或执行其他必要的清理任务。 编译器警告被视为错误: -Werror&#x3D;unused-value 标志已启用，它将警告视为错误。即使宏使用本身可能不是关键问题，这也可能导致编译失败。 解决方案:修复 SHELL_FREE 定义: 如果 companions 需要内存分配，请更新 shell_cfg.h 中的 SHELL_FREE 宏以调用适当的内存管理函数，例如 free()。 如果 companions 不需要内存管理，请从 shell_companion.c 中的第 57 行删除 SHELL_FREE 调用；或者将shell_cfg.h 中的第 36 行 SHELL_USING_COMPANION 的宏定义改为0。 禁用 -Werror&#x3D;unused-value (如果适用):如果您希望将未使用的值警告视为警告而不是错误，您可以暂时在编译期间禁用 -Werror&#x3D;unused-value 标志。但是，通常建议修复底层问题以避免潜在的内存泄漏或资源管理问题。 其他提示: 提供有关您的项目更多信息，例如具体的 ESP-IDF 版本、涉及的组件以及 SHELL_FREE 宏的用途。这将有助于了解根本原因并提供更定制的指导。 分享 shell_cfg.h 头文件和 shell_companion.c 文件的相关部分，以便分析代码结构和上下文。考虑使用调试器逐步执行代码并检查 companions 在 SHELL_FREE 调用之前和之后的 值，以了解其使用情况和潜在的内存管理问题。 通过遵循这些步骤并提供更多信息，我可以帮助您有效地解决编译错误并确保您的 ESP-IDF 项目成功构建。 配置shell优先级将shell的freertos优先级设置为 tskIDLE_PRIORITY，为0级，跟空闲函数优先级一样，所有其他优先级任务执行完后才会执行 tskIDLE_PRIORITY 优先级任务。 源代码例程ESP32移植letter_shell组件例程","tags":"esp32"},{"title":"ESP32开发环境搭建","url":"/2024/02/19/ESP32环境搭建/","text":"开发环境搭建ESP-ADF快速上手连接ESP-IDF快速上手连接 获取ESP-ADF打开Linux or macOS终端,新建搭建环境所需文件夹。 mkdir ~/esp cd ~/esp 编译 ESP-IDF 需要以下软件包。请根据使用的 Linux 发行版本，选择合适的安装：Ubuntu 和 Debian: sudo apt-get install git wget flex bison gperf python3 python3-pip python3-venv cmake ninja-build ccache libffi-dev libssl-dev dfu-util libusb-1.0-0 CentOS 7 &amp; 8: sudo yum -y update &amp;&amp; sudo yum install git wget flex bison gperf python3 python3-setuptools cmake ninja-build ccache dfu-util libusbx Arch: sudo pacman -S --needed gcc git make flex bison gperf python cmake ninja ccache dfu-util libusb 克隆最新版ESP-ADF： git clone --recursive https://github.com/espressif/esp-adf.git 若克隆失败，尝试以下指令： git clone --recursive git@github.com:espressif/esp-adf.git 若子模块拉取失败，尝试手动逐个拉取子模块： cd ~/esp/esp-adf/components git clone git@github.com:espressif/esp-adf-libs.git cd ~/esp/esp-adf/components git clone git@github.com:espressif/esp-sr.git cd ~/esp/esp-adf git clone git@github.com:espressif/esp-idf.git 设置环境变量按自己实际路径，可按自己喜好设置，也可不配置，手动敲指令也可。 vi ~&#x2F;.bashrc在后面加上以下代码： 12345678910#开启ESP32编译环境alias get-idf=&#x27;. $HOME/esp/esp-adf/esp-idf/export.sh&#x27;alias get-adf=&#x27;. $HOME/esp/esp-adf/export.sh&#x27;#打开本地文件夹（wsl）alias open-file=&#x27;explorer.exe .&#x27;#烧录到设备，并打开监视器，/dev/ttyS15为USB挂载端口，需测试后填写，115200为监视器波特率，与设备UART0波特率对应alias esp-download=&#x27;idf.py -p /dev/ttyS15 -b 115200 flash monitor&#x27;export PATH=/home/qx_song/esp/esp-adf/esp-idf/tools:$PATHexport IDF_PATH=/home/qx_song/esp/esp-adf/esp-idfexport ADF_PATH=/home/qx_song/esp/esp-adf 保存退出 :wq 设置工具除了 ESP-IDF 本身，还需要为支持 ESP32 的项目安装 ESP-IDF 使用的各种工具，比如编译器、调试器、Python 包等。 cd ~/esp/esp-adf/esp-idf 安装esp32，esp32s2工具，运行以下指令：（按需求安装） ./install.sh esp32,esp32s2 若需要安装所有工具，运行以下指令： ./install.sh all 以下为ESP-IDF编译所需环境，请在需要运行ESP-IDF的终端窗口运行以下命令： . $HOME/esp/esp-adf/esp-idf/export.sh 或者使用快捷指令： get-idf ESP32工程示例开始创建工程现在，可以准备开发 ESP32 应用程序了。从 ESP-IDF 中 examples 目录下的 get-started&#x2F;hello_world 工程开始，将 get-started&#x2F;hello_world 工程复制至本地的 ~&#x2F;esp 目录下： cd ~/esp get-idf cp -r $IDF_PATH/examples/get-started/hello_world . 配置工程cd ~/esp/hello_world idf.py set-target esp32 由于ESP32是单核，默认配置是双核模式，需要配置参数： idf.py menuconfig Component config -&gt; FreeRTOS -&gt; [*]Run FreeRTOS only on first core 保存退出 编译工程idf.py build 烧录工程idf.py -p PORT flash 请将 PORT 替换为 ESP32 开发板的串口名称。如果 PORT 未经定义，idf.py 将尝试使用可用的串口自动连接。 合并执行构建、烧录和监视过程：idf.py -p PORT [-b BAUD] flash monitor 注：[-b BAUD] 和 monitor 配合使用，BAUD为程序中UART0的波特率 idf.py -p /dev/ttyS15 -b 115200 flash monitor idf.py -p [挂载端口] -b [波特率] flash monitor 擦除flashidf.py -p PORT erase-flash 若存在需要擦除的 OTA 数据，请运行以下命令： idf.py -p PORT erase-otadata 挂载端口windows 子系统 wsl输入烧录指令： idf.py flash 观察终端设备是挂载在哪个端口上，有ERROR忽略，选择端口例如 &#x2F;dev&#x2F;ttyS15，程序中UART0的波特率115200，下次就可以直接输此端口就可以烧录啦。 idf.py -p /dev/ttyS15 -b 115200 flash monitor 如果 ESP-IDF 监视器在烧录后很快发生错误，或打印信息全是乱码（如下），很有可能是因为开发板采用了 26 MHz 晶振，而 ESP-IDF 默认支持大多数开发板使用的 40 MHz 晶振。 x���ff�f�����`�~�~���f���x��f�f�����ff��`���f����`��~x������ff�f�����`�~�~�f����f����f`���x��f�f�����ff��`���f 此时，可以：1、退出监视器。2、返回 idf.py menuconfig。3、进入 Component config –&gt; Hardware Settings –&gt; Main XTAL Config –&gt; Main XTAL frequency 进行配置，将 CONFIG_XTAL_FREQ_SEL 设置为 26 MHz。4、重新编译和烧录应用程序。 总结启动终端ESP32编译只需要进行以下步骤： . $HOME/esp/esp-adf/esp-idf/export.sh //开启编译环境 idf.py set-target esp32 //首次搭建项目时配置 idf.py menuconfig //选择需要的配置 idf.py build idf.py flash 快捷方式： get-idf idf.py set-target esp32 idf.py menuconfig idf.py build esp-download","tags":"esp32 linux"},{"title":"Markdown小贴士","url":"/2024/02/19/Markdown小贴士/","text":"Markdown 的基本语法Markdown 的语法非常简单，常用的标记符号不超过十个，用于日常写作记录绰绰有余，不到半小时就能完全掌握。以下是一些常用的 Markdown 标记符号： 标题# 一级标题 ## 二级标题 ### 三级标题 #### 四级标题 ##### 五级标题 ###### 六级标题 文本普通文本 **加粗文本** * 斜体文本* **~删除线文本~** 列表* 无序列表 1. 有序列表 * 嵌套列表 代码块123456#include &lt;stdio.h&gt;int main() &#123;printf(&quot;Hello, world!\\n&quot;);return 0;&#125; 链接链接文本: [https://www.example.com](https://www.example.com) 图片网络地址: ![这是一张示例图片](https://www.example.com/example.png) 本地文件路径：![这是一张示例图片](../pictures/这是一张示例图片.png) 图片链接跳转: ![这是一张示例图片](example.png) &#123;link=https://www.example.com/&#125; 图片标题: ![这是一张示例图片](example.png) &#123;title=这是一张示例图片&#125; 图片居中: ![这是一张示例图片](example.png) &#123;align=center&#125; 示例： ![这是一张示例图片](example.png) ![这是一张 200x100 像素的图片](example.png) &#123;width=200 height=100&#125; ![这是一张居中的图片](example.png) &#123;align=center&#125; ![点击图片跳转到 https://www.example.com/](example.png) &#123;link=https://www.example.com/&#125; ![这是一张示例图片](example.png) &#123;title=这是一张示例图片&#125; 表格 头部1 头部2 头部3 内容1 内容2 内容3 内容4 内容5 内容6 Markdown 的应用博客文章 技术文档 README 文件 演示文稿 电子书 总结Markdown 是一种易于学习和使用的标记语言，非常适合编写各种文档。如果您还没有使用过 Markdown，建议您尝试一下。 以下是 Markdown 官方教学网站：Markdown 官方网站","tags":"markdown"},{"title":"单片机开发问题汇总","url":"/2024/01/31/MCU开发问题汇总/","text":"内核复位（kernel reset） 内核复位代码，如ADC： 1234567891011void kernel_reset(void)&#123; __DSB(); __disable_irq(); //close irq drv_adc_deinit(EADC_DEV1,EDMA_CH6); //disable adc data SCB-&gt;AIRCR = ((0x5FA &lt;&lt; SCB_AIRCR_VECTKEY_Pos) | (SCB-&gt;AIRCR &amp; SCB_AIRCR_PRIGROUP_Msk) | SCB_AIRCR_VECTRESET_Msk); __DSB(); while(1);&#125; 板级初始化前先要重置状态： 12DMA_DeInit(dma_chx); //DMA开启循环接收后会持续接收字节ADC_DeInit(adc_handler); ADC驱动初始化&#x2F;反初始化: 1234567891011121314151617int drv_adc_init(EADC_DEVICE adc_dev,EDMA_CHANNEL dma_ch)&#123; drv_adc_configuration(adc_dev); drv_dma_configuration(adc_dev,dma_ch); drv_adc_enable(adc_dev,DISABLE); return 0;&#125;int drv_adc_deinit(EADC_DEVICE adc_dev,EDMA_CHANNEL dma_ch)&#123; ADC_Module *adc_handler = drv_get_adc_device(adc_dev)-&gt;ADC_Handler; DMA_ChannelType * dma_chx = drv_get_dma_channel(dma_ch); drv_adc_enable(adc_dev,DISABLE); DMA_EnableChannel(dma_chx,DISABLE); return 0;&#125; MCU复位后状态 复位期间和刚复位后,复用功能未开启,I&#x2F;O端口被配置成模拟功能模式(PCFGy[1:0]&#x3D;00b, PMODEy[1:0]&#x3D;00b)。 但有以下几个例外的信号：BOOT0、 NRST、 OSC_IN、 OSC_OUT 默认无 GPIO 功能： BOOT0 引脚默认输入下拉 NRST 上拉输入输出 复位后，调试系统相关的引脚默认状态为启动 SWD-JTAG， JTAG 引脚被置于输入上拉或下拉模式： PA15:JTDI 置于输入上拉模式 PA14:JTCK 置于输入下拉模式 PA13:JTMS 置于输入上拉模式 PB4:NJTRST 置于输入上拉模式 PB3:JTD0 置于推挽输出无上下拉 PD0 和 PD1 PD0 和 PD1 在 80 及以上引脚封装默认为模拟模式 PD0 和 PD1 在 80 以下引脚封装复用到 OSC_IN&#x2F;OUT PC13、 PC14、 PC15： PC13～15 为备电域下的三个 IO， 备份域初次上电默认为模拟模式； PB2&#x2F;BOOT1： PB2&#x2F;BOOT1 默认处于下拉输入状态； BOOT0 默认输入下拉，参照下表， 若 BOOT 的引脚未连接，则默认选择 Flash 主存储区。 printf重定向 MDK版本，勾选Use MicroLIB选项： 123456789101112131415161718192021222324static int is_lr_sent = 0;int fputc(int ch, FILE* f)&#123; if (ch == &#x27;\\r&#x27;) &#123; is_lr_sent = 1; &#125; else if (ch == &#x27;\\n&#x27;) &#123; if (!is_lr_sent) &#123; USART_SendData(USART1, &#x27;\\r&#x27;); while (USART_GetFlagStatus(USART1, USART_FLAG_TXDE) == RESET); &#125; is_lr_sent = 0; &#125; else &#123; is_lr_sent = 0; &#125; USART_SendData(USART1, ch); while (USART_GetFlagStatus(USART1, USART_FLAG_TXDE) == RESET); return ch;&#125; GCC版本 123456789int _write(int fd, char* pBuffer, int size)&#123; for (int i = 0; i &lt; size; i++) &#123; USART_SendData(USART1, pBuffer[i]); while (USART_GetFlagStatus(USART1, USART_FLAG_TXDE) == RESET); &#125; return size;&#125; RT-THREAD调试问题串口通信异常 打开UART7接收为DMA IDLE中断，申请一个超时定时器，发送&#x2F;接受各一个任务，发送&#x2F;接受两个队列,以下是错误信息： 1234567891011121314151617181920212223psr: 0x60000000r00: 0x00000000r01: 0x20007978r02: 0x20007978r03: 0x00000000r04: 0x00000000r05: 0x00000000r06: 0x00000000r07: 0x20000920r08: 0x20005908r09: 0x20000568r10: 0xdeadbeefr11: 0xdeadbeefr12: 0x00000000 lr: 0x0801156f pc: 0x00000000hard fault on thread: timerE [00:00:07,324] (rtt-nano/src/kservice.c) rt_assert_handler [1340]: (rt_object_get_type(&amp;mq-&gt;parent.parent) == RT_Object_Class_MessageQueue) assertion failed at function:rt_mq_send_wait, line number:2026 E [00:00:00,659] (rtt-nano/src/kservice.c) rt_assert_handler [1340]: (rt_object_get_type(&amp;timer-&gt;parent) == RT_Object_Class_Timer) assertion failed at function:rt_timer_control, line number:474 E [00:00:39,282] (rtt-nano/src/kservice.c) rt_assert_handler [1340]: (rt_object_get_type((rt_object_t)thread) == RT_Object_Class_Thread) assertion failed at function:rt_thread_resume, line number:760 问题定位到指针变量p_srx_mq[0]和&amp;p_srx_mq[0]的区别，代码如下： 12345678910111213141516171819202122232425#define COMM_MAX_NUM 3static uint8_t *p_srx_mq[COMM_MAX_NUM];static struct comm_serial_mq srx_mq_data[COMM_MAX_NUM];static struct rt_timer comm_rx_stimer[COMM_MAX_NUM];static void comm_serial_recieve_data_deinit(uint8_t num)&#123; srx_mq_data[num].size = 0; p_srx_mq[num] = srx_mq_data[num].data;&#125;static int usart_key_rx_indicate(ESERIAL_DEV serial_dev, uint16_t size)&#123; if(p_srx_mq[0] - srx_mq_data[0].data + size &gt; sizeof(srx_mq_data[0].data)) &#123; comm_serial_recieve_data_deinit(0); return -1; &#125; rt_timer_start(&amp;comm_rx_stimer[0]); // 启动定时器 drv_fifo_data_get(serial_dev, (uint8_t *)p_srx_mq[0], size); logPrintln(&quot;test = [%p][%p][%p]&quot;,p_srx_mq[0],&amp;p_srx_mq[0],srx_mq_data[0].data); p_srx_mq[0] += size; srx_mq_data[0].size += size; return 0;&#125; 指针取址符&amp;与取值*的区别1. 指针取址符(&amp;) 指针取址符 &amp; 用于获取一个变量的地址，并将该地址存储在一个指针变量中。 具体来说: &amp; 运算符位于变量名前面。 &amp; 运算符的返回值是一个指针，指向该变量的内存地址。 12int num = 10;int *p = &amp;num; // p 指向 num 的地址 2. 取值符(*) 取值符 * 用于获取指针变量所指向的变量的值。 具体来说: 运算符位于指针变量名前面。 运算符的返回值是该指针变量所指向变量的值。 123int num = 10;int *p = &amp;num;int value = *p; // 访问 num 的值 总结： 指针取址符 &amp; 用于获取变量的地址，并将该地址存储在一个指针变量中。 取值符 * 用于获取指针变量所指向的变量的值。 需要注意的是： 不能对不存在的变量进行取址。 **不能对指针变量进行取址**。 取址操作可能会产生空指针，需要进行空指针检查。 为什么不能对指针变量进行取址1. 指针变量本身也是一个变量 指针变量也是一个变量，它存储的是另一个变量的地址。与其他变量一样，**指针变量也存在于内存中，并拥有自己的地址**。 2. 取址操作会产生无限循环 **如果对指针变量进行取址，那么就会得到该指针变量的地址**。但是，该指针变量本身也是一个变量，所以其地址也是存储在另一个变量中的。如此循环往复，就会产生无限循环。 3. 违背了指针的定义 指针的定义是指向另一个变量的地址。如果对指针变量进行取址，那么就意味着指针指向了它自己的地址，这违背了指针的定义。 4. 可能导致程序崩溃 在大多数情况下，对指针变量进行取址会导致程序崩溃。这是因为程序会试图访问一个不存在的内存地址。 TFT屏ST7735S调试问题硬件&#x2F;软件spi初始化123456789101112131415161718192021222324252627282930313233343536373839404142434445464748495051525354555657585960616263646566676869707172737475767778798081828384858687888990919293949596979899100101102103104105106//头文件定义#define HARDWARE_SPI_MODE 1 //1：hardware；0：software#define LCD_SCLK_Clr() GPIO_ResetBits(GPIOA, GPIO_PIN_5) //SCL=SCLK#define LCD_SCLK_Set() GPIO_SetBits(GPIOA, GPIO_PIN_5)#define LCD_MOSI_Clr() GPIO_ResetBits(GPIOA, GPIO_PIN_7) //SDA=MOSI#define LCD_MOSI_Set() GPIO_SetBits(GPIOA, GPIO_PIN_7)#define LCD_RES_Clr() GPIO_ResetBits(GPIOB, GPIO_PIN_0) //RES#define LCD_RES_Set() GPIO_SetBits(GPIOB, GPIO_PIN_0)#define LCD_DC_Clr() GPIO_ResetBits(GPIOB, GPIO_PIN_1) //DC#define LCD_DC_Set() GPIO_SetBits(GPIOB, GPIO_PIN_1) #define LCD_CS_Clr() GPIO_ResetBits(GPIOA, GPIO_PIN_4) //CS#define LCD_CS_Set() GPIO_SetBits(GPIOA, GPIO_PIN_4)#define LCD_BLK_Clr() //BLK#define LCD_BLK_Set()void LCD_GPIO_Init(void)&#123; GPIO_InitType GPIO_InitStructure; RCC_EnableAPB2PeriphClk(RCC_APB2_PERIPH_GPIOA | RCC_APB2_PERIPH_GPIOB , ENABLE);#if HARDWARE_SPI_MODE SPI_InitType SPI_InitStructure; RCC_EnableAPB2PeriphClk(RCC_APB2_PERIPH_SPI1 | RCC_APB2_PERIPH_AFIO, ENABLE); GPIO_InitStruct(&amp;GPIO_InitStructure); GPIO_InitStructure.Pin = GPIO_PIN_4 | GPIO_PIN_5 | GPIO_PIN_7; GPIO_InitStructure.GPIO_Alternate = GPIO_AF0_SPI1; GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_PP; GPIO_InitPeripheral(GPIOA, &amp;GPIO_InitStructure); /* SPIy Config -------------------------------------------------------------*/ SPI_InitStructure.DataDirection = SPI_DIR_SINGLELINE_TX; SPI_InitStructure.SpiMode = SPI_MODE_MASTER; SPI_InitStructure.DataLen = SPI_DATA_SIZE_8BITS; SPI_InitStructure.CLKPOL = SPI_CLKPOL_HIGH; SPI_InitStructure.CLKPHA = SPI_CLKPHA_FIRST_EDGE; SPI_InitStructure.NSS = SPI_NSS_HARD; SPI_InitStructure.BaudRatePres = SPI_BR_PRESCALER_2; SPI_InitStructure.FirstBit = SPI_FB_MSB; SPI_InitStructure.CRCPoly = 7; SPI_Init(SPI1, &amp;SPI_InitStructure); SPI_SSOutputEnable(SPI1, ENABLE); SPI_EnableCalculateCrc(SPI1, DISABLE); /* Enable SPIy */ SPI_Enable(SPI1, ENABLE);#else GPIO_InitStruct(&amp;GPIO_InitStructure); GPIO_InitStructure.Pin = GPIO_PIN_4 | GPIO_PIN_5 | GPIO_PIN_7; GPIO_InitStructure.GPIO_Mode = GPIO_Mode_Out_PP; GPIO_InitPeripheral(GPIOA, &amp;GPIO_InitStructure); GPIO_SetBits(GPIOA, GPIO_PIN_4 | GPIO_PIN_5 | GPIO_PIN_7);#endif GPIO_InitStruct(&amp;GPIO_InitStructure); GPIO_InitStructure.GPIO_Mode = GPIO_Mode_Out_PP; GPIO_InitStructure.Pin = GPIO_PIN_0 | GPIO_PIN_1; GPIO_InitPeripheral(GPIOB, &amp;GPIO_InitStructure); GPIO_SetBits(GPIOB, GPIO_PIN_0 | GPIO_PIN_1);&#125;void LCD_Writ_Bus(u8 dat) &#123; LCD_CS_Clr();#if HARDWARE_SPI_MODE SPI_I2S_TransmitData(SPI1, dat); while (SPI_I2S_GetStatus(SPI1, SPI_I2S_TE_FLAG) == RESET); //必须等到SPI数据发完，才能拉高CS片选，发下一次数据，否则数据会出错#else u8 i; for(i=0;i&lt;8;i++) &#123; LCD_SCLK_Clr(); if(dat&amp;0x80) &#123; LCD_MOSI_Set(); &#125; else &#123; LCD_MOSI_Clr(); &#125; LCD_SCLK_Set(); dat&lt;&lt;=1; &#125;#endif LCD_CS_Set(); &#125;void LCD_WR_DATA8(u8 dat)&#123; LCD_Writ_Bus(dat);&#125;void LCD_WR_DATA(u16 dat)&#123; LCD_Writ_Bus(dat&gt;&gt;8); LCD_Writ_Bus(dat);&#125;","tags":"mcu"},{"title":"杂项","url":"/2024/01/31/杂项/","text":"Linux 打开端口~&#x2F;.bashrc不会自动刷新解决linux每次打开新终端都要重新source ~&#x2F;.bashrc问题执行以下代码： vi ~/.bash_profile 有可能此文件是空白新建的，无所谓。然后在此文件末尾加入： 123if [ -f ~/.bashrc ];thensource ~/.bashrcfi 然后:wq保存即可。此时打开新终端可以自动执行source ~&#x2F;.bashrc J-Link&#x2F;J-FlashJ-Flash批处理脚本配置烧录：当然，前提是要添加J-Link的可执行程序路径到$PATH环境变量中 program.bat脚本代码如下，参考修改即可：123echo start...JLink -device N32L406CB -if swd -speed 4000 -CommanderScript &quot;C:\\Users\\Breo\\Desktop\\Wireless moxibustion\\Software\\program.jlink&quot; program.jlink文件代码如下，其中目标设备、文件路径、烧录地址等根据需要配置：12345678910111213connectdevice N32L406CBsi SWDspeed 4000h // halt-停止r // 复位，可以考虑去掉erase // 或 erase 0x8002800，去掉也行，但可能会出现error fail address 0x00000000错误提示loadfile app.bin 0x8002800 // loadfile app.hex 或 loadfile app.bin 0x8000000verifybin app.bin 0x8002800rgo // r go表示reset and runq // 退出J-Link命令行工具 Ubuntu 无法更新问题Ubuntu 无法使用apt update 更改软件源编辑 &#x2F;etc&#x2F;apt&#x2F;sources.list 文件，将以下内容添加到文件末尾 deb https://mirrors.aliyun.com/ubuntu/ jammy main restricted universe multiverse deb-src https://mirrors.aliyun.com/ubuntu/ jammy main restricted universe multiverse deb https://mirrors.aliyun.com/ubuntu/ jammy-updates main restricted universe multiverse deb-src https://mirrors.aliyun.com/ubuntu/ jammy-updates main restricted universe multiverse deb https://mirrors.aliyun.com/ubuntu/ jammy-backports main restricted universe multiverse deb-src https://mirrors.aliyun.com/ubuntu/ jammy-backports main restricted universe multiverse 清除 apt 缓存sudo apt clean sudo apt autoclean 尝试更新系统sudo apt update 显示 ModuleNotFoundError: No module named ‘apt_pkg’，重新安装 “apt_pkg” 模块： sudo apt install --reinstall python3-apt 显示 ERROR： E: Could not read response to hello message from hook [ ! -f /usr/bin/snap ] || /usr/bin/snap advise-snap --from-apt 2&gt;/dev/null || true: Success 如果问题仍然存在，尝试修复 Python 包： sudo apt install --fix-broken 然后就更新系统了： sudo apt update sudo apt upgrade 执行sudo apt upgrade后显示ERROR： Errors were encountered while processing: /tmp/apt-dpkg-install-cQBLJW/626-linux-iot-tools-common_5.4.0-1030.31_all.deb E: Sub-process /usr/bin/dpkg returned an error code (1) 最后一步，修复损坏的软件包配置： sudo dpkg --configure -a sudo apt upgrade Breo蓝牙启动异常Breo蓝牙初始化蓝牙初始化没完成，透传未开启，app就连接蓝牙了。设置透传参数，开启透传的的状态中增加连接蓝牙接受指令。 心跳包回复超时现在是接收&#x2F;刷新设备数据200ms超时，延迟太长还可以缩短。 SPI级联led灯调试小助手产品名称：1209RGB幻彩雾状产品型号：XTQ-016B.RGB-2307125-20 SPI级联led灯问题汇总充电闪灯问题问题分析充电中拔掉电源，立即再次插入，会闪一下灯；若等两秒再插入则不会出现，初步判断是此款芯片有锁存功能，会保存到寄存器中，未完全掉电再次插入则会继续执行上次的寄存器数据。 解决方法充电中拔掉电源，程序不要立即断电，持续两秒反初始化spi灯珠，即给spi寄存器写全灭数据。 呼吸灯闪烁问题问题分析程序中呼吸灯会跑偶尔闪烁，影响显示效果。分析发现，代码中有电机的FG检测，此检测开启了输入捕获功能，会持续中断触发，虽然spi灯的驱动是dma发送，但是也是由CPU来调度的，并不能与中断并行。spi呼吸灯效果需要持续发送数据，且时序要求很高，中断会抢占spi的dma发送，打断spi传输数据，导致数据传输出错，造成闪灯效果。 解决方法1、提高芯片主频，n32l403KB最高主频为64MHz，如果主频提高效果会好一些。2、spi呼吸灯效果持续发送数据，不能与中断频繁的代码一起使用。 某项目充电保护仍充电修改代码： 12345678910111213141516&#123;-1, 1, PIN_CHARGE_CC_DETECT, PIN_MODE_INPUT&#125;, //input/output switchstatic void board_charge_cc_set(bool en)&#123; struct pin_status_desc *pin = pin_handle(PIN_CHARGE_CC_DETECT); if(en) &#123; pin-&gt;type = PIN_MODE_INPUT; drv_pin_mode(pin-&gt;pin_id,pin-&gt;type); pin-&gt;lvl_rt = -1; //重置lvl_rt，以防止output出问题 &#125;else&#123; pin-&gt;type = PIN_MODE_OUTPUT; drv_pin_mode(pin-&gt;pin_id,pin-&gt;type); pin_set_func(pin, PIN_HIGH); &#125;&#125; Git小贴士执行 git pull 会覆盖本地的修改吗？没有冲突的情况下，远端会直接更新至本地上，但不会改变本地未提交的变动；如果本地修改已提交，则会执行一个远端分支和本地分支的合并 git fetch 和 git pull 的区别与联系git fetch用于从远程仓库获取最新的提交，保存到本地的远程跟踪分支中（FETCH_HEAD），可以通过查看此分支了解远程仓库的更新情况 git diff FETCH_HEAD比较查看该分支和当前工作分支的内容 git pull会自动获取远程仓库的更新，并且合并到当前分支上，相当于git fetch + git merge FETCH_HEAD 将远程仓库中指定分支的最新提交 ID 保存到本地的 FETCH_HEAD 分支中 将 FETCH_HEAD 分支合并到当前工作分支中 基础非典型操作本地git配置 配置本地与远端的SSH密钥连接流程： 本地生成SSH公钥和私钥(如果没有的话，另，linux下公钥通常存放于~/.ssh/*.pub) ssh-keygen -t rsa -b 4096 -C xxx@xxx.com 复制公钥，添加至远端平台的SSH设置上 查看本地配置： git config --list查看当前项目的所有配置 git config --global --list查看全局配置 修改用户名(全局&#x2F;当前项目) 此用户名即提交日志上所展示的用户名称 修改全局用户名：git config --global user.name &quot;xxx&quot;，影响用户的所有仓库 修改当前路径项目的用户名：git config user.name &quot;xxx&quot; 查看全局用户名：git config user.name 初始化本地工程并与远端已有仓库的main分支关联： 进入工程根目录，git init初始化本地仓库 添加远程仓库：git remote add origin &lt;远程仓库地址&gt; git branch -M main将当前分支重命名为main，M即--move --force的缩写。（可以分别输入git add --all，git commit -m &quot;first commit&quot;完成对本地分支的首次提交） 使用git pull origin main，将远程仓库的main分支拉取到本地，或者git push -u origin main -f将本地的xxx分支强制推送到远端main分支，其中-u是--set-upstream的缩写，后续会保持这个跟踪关系 makefile问题汇总修改.h文件没有重新编译原来的编译规则： -include $(wildcard $(OUTPUT_DIR)/*/*.d) # 包含所有生成的依赖文件，避免重复编译、提高效率 /*/*.d 意思是当前目录下的二级所有文件检索。 修改为以下编译规则： # 找到所有的 .d 文件 DEP_FILES := $(shell find $(BUILD_DIR) -type f -name &#39;*.d&#39;)# 包含所有生成的依赖文件，避免重复编译、提高效率 # 包含所有的 .d 文件 -include $(DEP_FILES) 或者： -include $(wildcard $(OUTPUT_DIR)/**/*.d) -include $(wildcard $(OUTPUT_DIR)/*/*/*.d) /**/*.d 意思是当前目录下的二级所有文件检索，根据具体情况修改。 /*/*/*.d 意思是当前目录下的三级所有文件检索，根据具体情况修改。 windows子系统wslarm-none-eabi-gcc工具链问题arm-none-eabi-gcc工具链需加入用户变量： export PATH=/home/xuan/OpenHarmony/install-software/gcc-arm-none-eabi-9-2019-q4-major/bin:$PATH 注意：需确认路径，否则找不到用户路径会搜索系统自带编译链 &#x2F;usr&#x2F;lib&#x2F;gcc&#x2F;arm-none-eabi&#x2F;10.3.1 Linux下编写Python合并脚本合并 bootloader + app &#x3D; mix1. 安装 PyInstaller pip install pyinstaller 2. 编写Python合并程序 代码链接 3. 打包 Python 程序 参数说明： -F：生成单一可执行文件。 -D：生成包含所有依赖项的目录。 -n：指定可执行文件名。 –distpath：指定可执行文件输出目录。 –noconfirm：覆盖输出文件时无需确认。 以下是一些常用的高级选项： –hidden-import：指定要隐藏导入的模块。 –exclude-module：指定要排除的模块。 –onefile：将所有文件打包成一个可执行文件。 –runtime：指定 Python 运行时版本。 执行规则: cd new_file,copy file.py and file.ico pyinstaller -F -w (-i icofile) 文件名.py example: pyinstaller -F file.py pyinstaller -F -w -i file.ico file.py 4. 运行可执行文件 ./dist/file 5. 例程 代码链接 6. 实际应用场景 单独使用：Linux环境下单独执行使用。 集成在makefile中，使用make编译自动生成文件： 将papp_up和mix_10K打包至tools文件夹，放在makefile同一目录下。 需要bootloder.bin在..&#x2F;bootloader目录下。 修改makefile生成规则。1234567891011121314151617181920212223242526.PHONY : clean allall: $(TARGET).bin $(TARGET).list $(TARGET).hex $(SZ) $(TARGET).elf @make copy @make mix.PHONY: copycopy: $(TARGET).bin cp $(TARGET).bin app.bin cp ../bootloader/bootloader.bin bootloader.bin# cp $(TARGET).hex app.hexmix: ./tools/papp_up ./tools/mix_10K $(OC) -I binary -O ihex --change-addresses 0x8000000 mix.bin mix.hex rm bootloader.bin rm app.bin rm mix.binclean: rm -rf $(BUILD_DIR) rm papp.bin rm mix.hex 可变参数函数详解在C语言中，printf 是一个标准库函数，用于在终端或其他输出设备上打印格式化的文本。它是一个可变参数函数，接受一个格式字符串作为第一个参数，后面是可变数量的参数，用于替换格式字符串中的格式占位符。 让我们来详细解析一下可变参数函数和宏，以及如何实现一个类似于 printf 的函数。 1. 可变参数函数： 可变参数函数允许在函数定义中接受不定数量的参数。 C语言提供了 stdarg.h 头文件来支持可变参数函数的实现。 下面是一个示例代码，展示了如何实现一个可变参数函数 sum，它接受一个整数参数 count，表示接下来的可变参数的数量： 1234567891011121314151617181920#include &lt;stdio.h&gt;#include &lt;stdarg.h&gt;int sum(int count, ...) &#123; int total = 0; va_list args; va_start(args, count); for (int i = 0; i &lt; count; i++) &#123; int num = va_arg(args, int); total += num; &#125; va_end(args); return total;&#125;int main() &#123; int result = sum(4, 10, 20, 30, 40); printf(&quot;Sum: %d\\n&quot;, result); return 0;&#125; 在这个示例中，我们定义了一个可变参数函数 sum，它计算传入的整数参数的总和。 2. 可变参数宏： 可变参数宏允许在宏调用中接受可变数量的参数。 在C语言中，可变参数宏使用 VA_ARGS 表示可变参数的部分。 下面是一个示例代码，展示了如何定义一个可变参数宏 PRINT_VALUES，它使用 printf 函数来打印可变数量的值: 123456789101112#include &lt;stdio.h&gt;#define PRINT_VALUES(...) do &#123; \\ printf(&quot;Values: &quot;); \\ printf(__VA_ARGS__); \\ printf(&quot;\\n&quot;); \\&#125; while (0)int main() &#123; PRINT_VALUES(&quot;%d %s %f&quot;, 10, &quot;hello&quot;, 3.14); return 0;&#125; 在这个示例中，我们定义了一个可变参数宏 PRINT_VALUES，它使用 printf 函数来打印多个值。 3. 实现自己的 printf 函数： printf 函数接受一个格式字符串作为第一个参数，后面是可变数量的参数，用于替换格式字符串中的格式占位符。 以下是一个简化版的示例代码，展示了一个实现类似于 printf 函数的功能的函数： 123456789101112131415161718192021222324252627282930313233343536373839404142434445#include &lt;stdio.h&gt;#include &lt;stdarg.h&gt;void my_printf(const char* format, ...) &#123; va_list args; va_start(args, format); while (*format != &#x27;\\0&#x27;) &#123; if (*format == &#x27;%&#x27;) &#123; format++; // 移动到占位符的下一个字符 if (*format == &#x27;d&#x27;) &#123; int value = va_arg(args, int); printf(&quot;%d&quot;, value); &#125; else if (*format == &#x27;f&#x27;) &#123; double value = va_arg(args, double); printf(&quot;%f&quot;, value); &#125; else if (*format == &#x27;s&#x27;) &#123; char* value = va_arg(args, char*); printf(&quot;%s&quot;, value); &#125; else if (*format == &#x27;c&#x27;) &#123; int value = va_arg(args, int); printf(&quot;%c&quot;, value); &#125; else &#123; printf(&quot;Unsupported format specifier: %c&quot;, *format); &#125; &#125; else &#123; printf(&quot;%c&quot;, *format); &#125; format++; // 移动到下一个字符 &#125; va_end(args);&#125;int main() &#123; int num = 42; double pi = 3.14159; char str[] = &quot;Hello, world!&quot;; char ch = &#x27;A&#x27;; my_printf(&quot;Integer: %d\\n&quot;, num); my_printf(&quot;Float: %f\\n&quot;, pi); my_printf(&quot;Float: %s\\n&quot;, str); my_printf(&quot;Float: %c\\n&quot;, ch); return 0;&#125;","tags":""},{"title":"扎礼","url":"/schedule/notes.html","text":"","tags":""},{"title":"about","url":"/about/index.html","text":"","tags":""},{"title":"categories","url":"/categories/index.html","text":"","tags":""},{"title":"schedule","url":"/schedule/index.html","text":"","tags":""},{"title":"tags","url":"/tags/index.html","text":"","tags":""}]}