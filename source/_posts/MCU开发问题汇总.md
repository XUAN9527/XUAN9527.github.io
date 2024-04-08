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

- 打开UART7接收为DMA IDLE中断，申请一个超时定时器，发送/接受各一个任务，发送/接受两个队列,以下是错误信息：

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

- 问题定位到指针变量p_srx_mq[0]和&p_srx_mq[0]的区别，代码如下：

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
