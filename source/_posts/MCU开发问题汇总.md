---
title: 单片机开发问题汇总
date: 2024-01-31 08:30:02
tags:
- [MCU]
categories: 
- [嵌入式]
description: 记录日常开发单片机过程中遇到的一些小问题，以及解决方法。
---

## 内核复位（kernel reset）

### 常见通用问题

- **内核复位代码，如ADC：**

``` c
void kernel_reset(void)
{
    __DSB();
    __disable_irq();							//close irq
	drv_adc_deinit(EADC_DEV1,EDMA_CH6);			//disable adc data
    SCB->AIRCR = ((0x5FA << SCB_AIRCR_VECTKEY_Pos)      |
                  (SCB->AIRCR & SCB_AIRCR_PRIGROUP_Msk) |
                   SCB_AIRCR_VECTRESET_Msk);
    __DSB();
    while(1);
}
```

- 板级初始化前先要重置状态：
``` c
DMA_DeInit(dma_chx);		//DMA开启循环接收后会持续接收字节
ADC_DeInit(adc_handler);
```

- ADC驱动初始化/反初始化:
``` c
int drv_adc_init(EADC_DEVICE adc_dev,EDMA_CHANNEL dma_ch)
{
	drv_adc_configuration(adc_dev);
	drv_dma_configuration(adc_dev,dma_ch);
	drv_adc_enable(adc_dev,DISABLE);
	return 0;
}

int drv_adc_deinit(EADC_DEVICE adc_dev,EDMA_CHANNEL dma_ch)
{
	ADC_Module *adc_handler = drv_get_adc_device(adc_dev)->ADC_Handler;
	DMA_ChannelType * dma_chx = drv_get_dma_channel(dma_ch);
	
	drv_adc_enable(adc_dev,DISABLE);
	DMA_EnableChannel(dma_chx,DISABLE);
	return 0;
}
```	
<br>

### n32g452rc内核复位问题

#### bootloader跳转到app

- 栈大小改变后跳转成功：将ram空间数据uint16_t改为uint32_t。
- 堆大小改变后跳转成功：将队列申请长度20改为30。
- 代码大小变化后跳转失败：
	- 代码段变长，能跑进`system_init`,跑飞待查。
	- 代码段变短，不能跑进`system_init`,跑飞待查。


<br>

## MCU复位后状态

- 复位期间和刚复位后,复用功能未开启,I/O端口被配置成模拟功能模式(PCFGy[1:0]=00b, PMODEy[1:0]=00b)。
<br>
- 但有以下几个例外的信号：BOOT0、 NRST、 OSC_IN、 OSC_OUT 默认无 GPIO 功能：
	- BOOT0 引脚默认输入下拉
	- NRST 上拉输入输出
<br>
- 复位后，调试系统相关的引脚默认状态为启动 SWD-JTAG， JTAG 引脚被置于输入上拉或下拉模式：
	- PA15:JTDI 置于输入上拉模式 
	- PA14:JTCK 置于输入下拉模式 
	- PA13:JTMS 置于输入上拉模式
	- PB4:NJTRST 置于输入上拉模式
	- PB3:JTD0 置于推挽输出无上下拉
<br>
- PD0 和 PD1
	- PD0 和 PD1 在 80 及以上引脚封装默认为模拟模式
	- PD0 和 PD1 在 80 以下引脚封装复用到 OSC_IN/OUT
- PC13、 PC14、 PC15：
	- PC13～15 为备电域下的三个 IO， 备份域初次上电默认为模拟模式；
<br>
- PB2/BOOT1：
	- PB2/BOOT1 默认处于下拉输入状态；
<br>
- BOOT0 默认输入下拉，参照下表， 若 BOOT 的引脚未连接，则默认选择 Flash 主存储区。

![mcu启动选项表](../pictures/mcu启动选项表.png)
<br>

## printf重定向

- MDK版本，勾选Use MicroLIB选项：

```c
 static int is_lr_sent = 0;
 int fputc(int ch, FILE* f)
 {
    if (ch == '\r')
    {
        is_lr_sent = 1;
    }
    else if (ch == '\n')
    {
        if (!is_lr_sent)
    	{
            USART_SendData(USART1, '\r');
            while (USART_GetFlagStatus(USART1, USART_FLAG_TXDE) == RESET);
    	}
    	is_lr_sent = 0;
    }
    else
    {
    	is_lr_sent = 0;
    }
    USART_SendData(USART1, ch);
    while (USART_GetFlagStatus(USART1, USART_FLAG_TXDE) == RESET);
    return ch;
 }
```

- GCC版本

```c
int _write(int fd, char* pBuffer, int size)
{
    for (int i = 0; i < size; i++)
    {
        USART_SendData(USART1, pBuffer[i]);
        while (USART_GetFlagStatus(USART1, USART_FLAG_TXDE) == RESET);
    }
    return size;
}
```
<br>

## RT-THREAD调试问题

### 串口通信异常

- 打开UART7接收为`DMA IDLE`中断，申请一个超时定时器，发送/接受各一个任务，发送/接受两个队列,以下是错误信息：

``` bash
psr: 0x60000000
r00: 0x00000000
r01: 0x20007978
r02: 0x20007978
r03: 0x00000000
r04: 0x00000000
r05: 0x00000000
r06: 0x00000000
r07: 0x20000920
r08: 0x20005908
r09: 0x20000568
r10: 0xdeadbeef
r11: 0xdeadbeef
r12: 0x00000000
 lr: 0x0801156f
 pc: 0x00000000
hard fault on thread: timer

E [00:00:07,324] (rtt-nano/src/kservice.c) rt_assert_handler [1340]: (rt_object_get_type(&mq->parent.parent) == RT_Object_Class_MessageQueue) assertion failed at function:rt_mq_send_wait, line number:2026 

E [00:00:00,659] (rtt-nano/src/kservice.c) rt_assert_handler [1340]: (rt_object_get_type(&timer->parent) == RT_Object_Class_Timer) assertion failed at function:rt_timer_control, line number:474 

E [00:00:39,282] (rtt-nano/src/kservice.c) rt_assert_handler [1340]: (rt_object_get_type((rt_object_t)thread) == RT_Object_Class_Thread) assertion failed at function:rt_thread_resume, line number:760 
```

- 问题定位到指针变量`p_srx_mq[0]`和`&p_srx_mq[0]`的区别，代码如下：

```bash
#define COMM_MAX_NUM     3
static uint8_t *p_srx_mq[COMM_MAX_NUM];
static struct comm_serial_mq srx_mq_data[COMM_MAX_NUM];
static struct rt_timer comm_rx_stimer[COMM_MAX_NUM];

static void comm_serial_recieve_data_deinit(uint8_t num)
{
	srx_mq_data[num].size = 0;
	p_srx_mq[num] = srx_mq_data[num].data;
}

static int usart_key_rx_indicate(ESERIAL_DEV serial_dev, uint16_t size)
{
	if(p_srx_mq[0] - srx_mq_data[0].data + size > sizeof(srx_mq_data[0].data))
	{
		comm_serial_recieve_data_deinit(0);
		return -1;
	}
	rt_timer_start(&comm_rx_stimer[0]);                   // 启动定时器
	drv_fifo_data_get(serial_dev, (uint8_t *)p_srx_mq[0], size);
	logPrintln("test = [%p][%p][%p]",p_srx_mq[0],&p_srx_mq[0],srx_mq_data[0].data);
	p_srx_mq[0] += size;
	srx_mq_data[0].size += size;
	return 0;
}
```

#### 指针取址符&与取值*的区别

**1. 指针取址符(&)**

	指针取址符 & 用于获取一个变量的地址，并将该地址存储在一个指针变量中。

**具体来说:**

- & 运算符位于变量名前面。
- & 运算符的返回值是一个指针，指向该变量的内存地址。

```c
int num = 10;
int *p = &num; // p 指向 num 的地址
```

**2. 取值符(*)**

	取值符 * 用于获取指针变量所指向的变量的值。

**具体来说:**

- 运算符位于指针变量名前面。
- 运算符的返回值是该指针变量所指向变量的值。

```c
int num = 10;
int *p = &num;
int value = *p;		// 访问 num 的值
```

**总结：**

- 指针取址符 & 用于获取变量的地址，并将该地址存储在一个指针变量中。
- 取值符 * 用于获取指针变量所指向的变量的值。

**需要注意的是：**

- 不能对不存在的变量进行取址。
- **`不能对指针变量进行取址`**。
- 取址操作可能会产生空指针，需要进行空指针检查。

#### 为什么不能对指针变量进行取址

**1. 指针变量本身也是一个变量**

指针变量也是一个变量，它存储的是另一个变量的地址。与其他变量一样，**`指针变量也存在于内存中，并拥有自己的地址`**。

**2. 取址操作会产生无限循环**

**`如果对指针变量进行取址，那么就会得到该指针变量的地址`**。但是，该指针变量本身也是一个变量，所以其地址也是存储在另一个变量中的。如此循环往复，就会产生无限循环。

**3. 违背了指针的定义**

指针的定义是指向另一个变量的地址。如果对指针变量进行取址，那么就意味着指针指向了它自己的地址，这违背了指针的定义。

**4. 可能导致程序崩溃**

在大多数情况下，对指针变量进行取址会导致程序崩溃。这是因为程序会试图访问一个不存在的内存地址。
<br>
## TFT屏ST7735S调试问题

### 硬件/软件spi初始化

```c
//头文件定义
#define HARDWARE_SPI_MODE 1	//1：hardware；0：software

#define LCD_SCLK_Clr() GPIO_ResetBits(GPIOA, GPIO_PIN_5)	//SCL=SCLK
#define LCD_SCLK_Set() GPIO_SetBits(GPIOA, GPIO_PIN_5)

#define LCD_MOSI_Clr() GPIO_ResetBits(GPIOA, GPIO_PIN_7)		//SDA=MOSI
#define LCD_MOSI_Set() GPIO_SetBits(GPIOA, GPIO_PIN_7)

#define LCD_RES_Clr()  GPIO_ResetBits(GPIOB, GPIO_PIN_0)		//RES
#define LCD_RES_Set()  GPIO_SetBits(GPIOB, GPIO_PIN_0)

#define LCD_DC_Clr()   GPIO_ResetBits(GPIOB, GPIO_PIN_1)		//DC
#define LCD_DC_Set()   GPIO_SetBits(GPIOB, GPIO_PIN_1)
 		     
#define LCD_CS_Clr()   GPIO_ResetBits(GPIOA, GPIO_PIN_4)		//CS
#define LCD_CS_Set()   GPIO_SetBits(GPIOA, GPIO_PIN_4)

#define LCD_BLK_Clr()											//BLK
#define LCD_BLK_Set()

void LCD_GPIO_Init(void)
{
	GPIO_InitType GPIO_InitStructure;
	RCC_EnableAPB2PeriphClk(RCC_APB2_PERIPH_GPIOA | RCC_APB2_PERIPH_GPIOB , ENABLE);

#if HARDWARE_SPI_MODE
	SPI_InitType SPI_InitStructure;
	RCC_EnableAPB2PeriphClk(RCC_APB2_PERIPH_SPI1 | RCC_APB2_PERIPH_AFIO, ENABLE);

    GPIO_InitStruct(&GPIO_InitStructure);
    GPIO_InitStructure.Pin        = GPIO_PIN_4 | GPIO_PIN_5 | GPIO_PIN_7;
    GPIO_InitStructure.GPIO_Alternate = GPIO_AF0_SPI1;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_PP;
    GPIO_InitPeripheral(GPIOA, &GPIO_InitStructure);

    /* SPIy Config -------------------------------------------------------------*/
    SPI_InitStructure.DataDirection = SPI_DIR_SINGLELINE_TX;
    SPI_InitStructure.SpiMode       = SPI_MODE_MASTER;
    SPI_InitStructure.DataLen       = SPI_DATA_SIZE_8BITS;
    SPI_InitStructure.CLKPOL        = SPI_CLKPOL_HIGH;
    SPI_InitStructure.CLKPHA        = SPI_CLKPHA_FIRST_EDGE;
    SPI_InitStructure.NSS           = SPI_NSS_HARD;
    SPI_InitStructure.BaudRatePres  = SPI_BR_PRESCALER_2;
    SPI_InitStructure.FirstBit      = SPI_FB_MSB;
    SPI_InitStructure.CRCPoly       = 7;
    SPI_Init(SPI1, &SPI_InitStructure);

	SPI_SSOutputEnable(SPI1, ENABLE);
	SPI_EnableCalculateCrc(SPI1, DISABLE);
    /* Enable SPIy */
    SPI_Enable(SPI1, ENABLE);
#else
	GPIO_InitStruct(&GPIO_InitStructure);
	GPIO_InitStructure.Pin = GPIO_PIN_4 | GPIO_PIN_5 | GPIO_PIN_7;
	GPIO_InitStructure.GPIO_Mode = GPIO_Mode_Out_PP;
	GPIO_InitPeripheral(GPIOA, &GPIO_InitStructure);
	
	GPIO_SetBits(GPIOA, GPIO_PIN_4 | GPIO_PIN_5 | GPIO_PIN_7);
#endif
	GPIO_InitStruct(&GPIO_InitStructure);
	GPIO_InitStructure.GPIO_Mode = GPIO_Mode_Out_PP;
	GPIO_InitStructure.Pin = GPIO_PIN_0 | GPIO_PIN_1;
	GPIO_InitPeripheral(GPIOB, &GPIO_InitStructure);
	
	GPIO_SetBits(GPIOB, GPIO_PIN_0 | GPIO_PIN_1);
}

void LCD_Writ_Bus(u8 dat) 
{	
	LCD_CS_Clr();

#if HARDWARE_SPI_MODE
	SPI_I2S_TransmitData(SPI1, dat);
	while (SPI_I2S_GetStatus(SPI1, SPI_I2S_TE_FLAG) == RESET); //必须等到SPI数据发完，才能拉高CS片选，发下一次数据，否则数据会出错
#else
	u8 i;
	for(i=0;i<8;i++)
	{			  
		LCD_SCLK_Clr();
		if(dat&0x80)
		{
		   LCD_MOSI_Set();
		}
		else
		{
		   LCD_MOSI_Clr();
		}
		LCD_SCLK_Set();
		dat<<=1;
	}
#endif

   LCD_CS_Set();	
}

void LCD_WR_DATA8(u8 dat)
{
	LCD_Writ_Bus(dat);
}

void LCD_WR_DATA(u16 dat)
{
	LCD_Writ_Bus(dat>>8);
	LCD_Writ_Bus(dat);
}
```

<br>

## Cortex-M系列内核字节对齐汇总

- 4字节对齐的含义就是变量地址对4求余数为0；8字节对齐就是地址对8求余等于0，依次类推，比如：如果让p去访问0x20000001， 0x20000002，0x20000003这都是不对齐访问。

- 对于`M3和M4`而言，可以直接访问非对齐地址（注意芯片要在这个地址有对应的内存空间), 因为`M3和M4`是支持的，而`M0/M0+/M1`是不支持的，不支持的内核芯片，只要非对齐访问就会触发硬件异常。

**综上所述，我们只讨论Cortex-M3/M4内核情况。**

### 全局变量对齐问题

- `uint8_t`定义变量地址要1字节对齐。
- `uint16_t`定义变量地址要2字节对齐。
- `uint32_t`定义变量地址要4字节对齐。
- `uint64_t`定义变量地址要8字节对齐。
- `指针变量`是4字节对齐。

### 结构体成员对齐问题

#### 自然对界

**例子1**（分析结构各成员的默认字节对界条界条件和结构整体的默认字节对界条件）:

```c
struct Test
{ 
  char x1; // 成员x1为char型(其起始地址必须1字节对界)，其偏移地址为0 
  char x2; // 成员x2为char型(其起始地址必须1字节对界，其偏移地址为1 
  float x3; // 成员x3为float型(其起始地址必须4字节对界)，编译器在x2和x3之间填充了两个空字节，其偏移地址为4 
  char x4; // 成员x4为char型(其起始地址必须1字节对界)，其偏移地址为8 
};
```
在Test结构体中，最大的成员为`float` x3，因此结构体的自然对界条件为4字节对齐。则结构体长度就为12字节，内存布局为`1100 1111 1000`。

<br>

#### 指令对齐

**1. 伪指令#pragma pack**

改变缺省的对界条件(指定对界)
- 使用伪指令`#pragma pack (n)`，编译器将按照n个字节对齐。
- 使用伪指令`#pragma pack ()`，取消自定义字节对齐方式。
	- 数据成员对齐规则：结构(`struct`)(或联合(`union`))的数据成员，第一个数据成员放在offset为0的地方，以后每个数据成员的对齐按照`#pragma pack`指定的数值和这个数据成员自身长度中，比较小的那个进行。
	- 结构(或联合)的整体对齐规则：在数据成员完成各自对齐之后，结构(或联合)本身也要进行对齐，对齐将按照`#pragma pack`指定的数值和结构(或联合)最大数据成员长度中，比较小的那个进行。

结合推断：当`#pragma pack`的n值等于或超过所有数据成员长度的时候，这个n值的大小将不产生任何效果。因此，当使用伪指令`#pragma pack (2)`时，Test结构体的大小为8，内存布局为`1111 1110`。

- 需要注意一点，当结构体中包含一个子结构体时，子结构中的成员按照#pragma pack指定的数值和子结构最大数据成员长度中，比较小的那个进行进行对齐。例子如下：

```c
#pragma pack(8)
struct s1
{
  short a;
  long b;
};
 
struct s2
{
  char c;
  s1 d;
  long long e;
};
#pragma pack()
```
`sizeof(s2)`的结果为24。S1的内存布局为`1100 1111`，S2的内存布局为`1000 1100 1111 0000 1111 1111`。

**例子2**(按照2个字节对齐时)：
``` c
#include <stdio.h>
#pragma pack(2)
typedef struct
{
  int aa1; //2个字节对齐 1111
  char bb1;//1个字节对齐 1
  short cc1;//2个字节对齐 011
  char dd1; //1个字节对齐 1
} testlength1;
int length1 = sizeof(testlength1); //2个字节对齐，占用字节11 11 10 11 10,length = 10
 
typedef struct
{
  char bb2;//1个字节对齐 1
  int aa2; //2个字节对齐 01111
  short cc2;//2个字节对齐 11
  char dd2; //1个字节对齐 1
} testlength2;
int length2 = sizeof(testlength2); //2个字节对齐，占用字节10 11 11 11 10,length = 10
 
typedef struct
{
  char bb3; //1个字节对齐 1
  char dd3; //1个字节对齐 1
  int aa3; //2个字节对齐 11 11
  short cc23//2个字节对齐 11
 
} testlength3;
int length3 = sizeof(testlength3); //2个字节对齐，占用字节11 11 11 11,length = 8
 
typedef struct
{
  char bb4; //1个字节对齐 1
  char dd4; //1个字节对齐 1
  short cc4;//2个字节对齐 11
  int aa4; //2个字节对齐 11 11
} testlength4;
int length4 = sizeof(testlength4); //2个字节对齐，占用字节11 11 11 11,length = 8
#pragma pack()
int main(void)
{
  printf("length1 = %d.\n",length1);
  printf("length2 = %d.\n",length2);
  printf("length3 = %d.\n",length3);
  printf("length4 = %d.\n",length4);
  return 0;
}
```

**2. __attribute__((__aligned__(n)))**

`__attribute__`是GCC里的编译参数，用法有很多种，感兴趣可以阅读一下gcc的相关文档。这里说一下`__attribute__`对变量和结构体对齐的影响。这里的影响大概分为两个方面，对齐和本身占用的字节数的大小，即sizeof（变量）的值。

- `int a attribute((aligned(64))) = 10;`

这个修饰的影响主要是对齐，所谓对齐是存储为值的起始地址。变量a的地址&a,本来是4字节对齐，变成了64字节对齐（有的环境对最大对齐数值有限制）。64字节对齐就是`&a`的最后6位为0。
``` c
sizeof(a) = 4; 		//a 占用的字节数还是4个字节
```

- `typedef int myint attribute((aligned(64))) ;`

这样说明myint 声明的变量按照64字节对齐，大小是4字节，这样就会有一个问题，这个变量不能定义数组：
``` c
myint myarray[2]; 	//这样定义编译器会报err
```
报错的原因是数组的存储在内存中是连续的，而myint只有4字节确要64字节对齐，这样对齐和连续就不能同时保证，就会报错。

**例子1**：

``` c
typedef struct st_tag {
	int a;
	char b;
} ST1;
ST1 myst；
```

在没有对齐的情况下：`sizeof(ST1) = sizeof(myst) = 8;`
结构体对齐的原则可以总结为：

- 结构体起始地址(&myst)按最大变量字节数(sizeof(int))对齐；
- 结构体内每个变量按照自身字节数对齐；
- 结构体的大小`(sizeof(myst))`是最大变量字节数的整数倍（8/4=2）；

``` c
typedef struct st_tag {
	int a;
	char b;
}  __attribute__((__aligned__(64))) ST1;
ST1 myst；
sizeof(ST1) = sizeof(myst) = 64; 
```
对比：
``` c
typedef struct st_tag {
	int a;
	char b;
}  ST1 __attribute__((__aligned__(64)));
ST1 myst；
sizeof(ST1) = sizeof(myst) = 8 ;
```

这第二种情况可以理解为`__attribute__((aligned(64)))`作用于变量ST1 ，只影响对齐，不影响结构的大小。

**例子2**：
``` c
typedef struct __attribute__((packed))
{
    uint8_t comm_version;
    uint8_t comm_lenth;
    uint8_t device_fw_verion[];
}ble_resp_device_info_desc;
```
`__attribute__((packed))`是GCC编译器提供的一个属性,`__attribute__((packed))`其中的成员变量不会进行对齐。