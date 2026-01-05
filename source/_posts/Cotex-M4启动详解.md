---
title: Cotex-M4启动详解
date: 2024-05-29 14:05:00
tags:
- [MCU]
categories: 
- [嵌入式]
- [启动文件]
description: 记录 Cotex-M4 启动文件的一些细节详解，以及遇到内核相关的问题和解决方法。
---

## 启动文件

`startup_n32l40x_gcc.s` 文件为例，以下是源代码：

```asm
/**
  ****************************************************************************
  Copyright (c) 2019, Nations Technologies Inc.

  All rights reserved.
  ****************************************************************************

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice,
  this list of conditions and the disclaimer below.

  Nations' name may not be used to endorse or promote products derived from
  this software without specific prior written permission.

  DISCLAIMER: THIS SOFTWARE IS PROVIDED BY NATIONS "AS IS" AND ANY EXPRESS OR
  IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT ARE
  DISCLAIMED. IN NO EVENT SHALL NATIONS BE LIABLE FOR ANY DIRECT, INDIRECT,
  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
  ****************************************************************************
 **/
 
/*
* Amount of memory (in bytes) allocated for Stack
* Tailor this value to your application needs
* <h> Stack Configuration
*   <o> Stack Size (in Bytes) <0x0-0xFFFFFFFF:8>
* </h>
*/

/**
******************************************************************************
* @file      startup_n32l40x_gcc.s
******************************************************************************
*/
    
  .syntax unified
  .cpu cortex-m4
  .fpu softvfp
  .thumb

.global  g_pfnVectors
.global  Default_Handler

/* start address for the initialization values of the .data section. 
defined in linker script */
.word  _sidata
/* start address for the .data section. defined in linker script */  
.word  _sdata
/* end address for the .data section. defined in linker script */
.word  _edata
/* start address for the .bss section. defined in linker script */
.word  _sbss
/* end address for the .bss section. defined in linker script */
.word  _ebss
/* stack used for SystemInit_ExtMemCtl; always internal RAM used */

/**
 * @brief  This is the code that gets called when the processor first
 *          starts execution following a reset event. Only the absolutely
 *          necessary set is performed, after which the application
 *          supplied main() routine is called. 
 * @param  None
 * @retval : None
*/

  .section  .text.Reset_Handler
  .weak  Reset_Handler
  .type  Reset_Handler, %function
  Reset_Handler:  

/* Copy the data segment initializers from flash to SRAM */  
  movs  r1, #0
  b  LoopCopyDataInit

CopyDataInit:
  ldr  r3, =_sidata
  ldr  r3, [r3, r1]
  str  r3, [r0, r1]
  adds  r1, r1, #4
    
LoopCopyDataInit:
  ldr  r0, =_sdata
  ldr  r3, =_edata
  adds  r2, r0, r1
  cmp  r2, r3
  bcc  CopyDataInit
  ldr  r2, =_sbss
  b  LoopFillZerobss
/* Zero fill the bss segment. */  
FillZerobss:
  movs  r3, #0
  str  r3, [r2], #4
    
LoopFillZerobss:
  ldr  r3, = _ebss
  cmp  r2, r3
  bcc  FillZerobss

/* Call the clock system intitialization function.*/
  bl  SystemInit   
/* Call static constructors */
  bl __libc_init_array
/* Call the application's entry point.*/
  bl  main
  bx  lr    
.size  Reset_Handler, .-Reset_Handler

/**
 * @brief  This is the code that gets called when the processor receives an 
 *         unexpected interrupt.  This simply enters an infinite loop, preserving
 *         the system state for examination by a debugger.
 * @param  None     
 * @retval None       
*/
    .section  .text.Default_Handler,"ax",%progbits
Default_Handler:
Infinite_Loop:
  b  Infinite_Loop
  .size  Default_Handler, .-Default_Handler
/******************************************************************************
*
* The minimal vector table for a Cortex M3. Note that the proper constructs
* must be placed on this to ensure that it ends up at physical address
* 0x0000.0000.
* 
*******************************************************************************/
   .section  .isr_vector,"a",%progbits
  .type  g_pfnVectors, %object
  .size  g_pfnVectors, .-g_pfnVectors
    
    
g_pfnVectors:
  .word  _estack
  .word  Reset_Handler
  .word  NMI_Handler
  .word  HardFault_Handler
  .word  MemManage_Handler
  .word  BusFault_Handler
  .word  UsageFault_Handler
  .word  0
  .word  0
  .word  0
  .word  0
  .word  SVC_Handler
  .word  DebugMon_Handler
  .word  0
  .word  PendSV_Handler
  .word  SysTick_Handler
  
  /* External Interrupts */
  .word     WWDG_IRQHandler                     /* Window WatchDog                      */                                        
  .word     PVD_IRQHandler                      /* PVD through EXTI Line detection      */                        
  .word     TAMPER_IRQHandler                   /* Tamper                               */            
  .word     RTC_WKUP_IRQHandler                 /* RTC Wakeup                           */                      
  .word     FLASH_IRQHandler                    /* FLASH                                */                                          
  .word     RCC_IRQHandler                      /* RCC                                  */                                            
  .word     EXTI0_IRQHandler                    /* EXTI Line0                           */                        
  .word     EXTI1_IRQHandler                    /* EXTI Line1                           */                          
  .word     EXTI2_IRQHandler                    /* EXTI Line2                           */                          
  .word     EXTI3_IRQHandler                    /* EXTI Line3                           */                          
  .word     EXTI4_IRQHandler                    /* EXTI Line4                           */                          
  .word     DMA_Channel1_IRQHandler            /* DMA1 Channel 1                       */                  
  .word     DMA_Channel2_IRQHandler            /* DMA1 Channel 2                       */                   
  .word     DMA_Channel3_IRQHandler            /* DMA1 Channel 3                       */                   
  .word     DMA_Channel4_IRQHandler            /* DMA1 Channel 4                       */                   
  .word     DMA_Channel5_IRQHandler            /* DMA1 Channel 5                       */                   
  .word     DMA_Channel6_IRQHandler            /* DMA1 Channel 6                       */                   
  .word     DMA_Channel7_IRQHandler            /* DMA1 Channel 7                       */       
  .word     DMA_Channel8_IRQHandler             /* DMA1 Channel 8                       */ 
  .word     ADC_IRQHandler                      /* ADC                                  */                   
  .word     USB_HP_IRQHandler                   /* USB High Priority                    */                         
  .word     USB_LP_IRQHandler                   /* USB Low  Priority                    */                          
  .word     COMP_1_2_IRQHandler                 /* COMP1 & COMP2 through EXTI line 21/22    */                          
  .word     EXTI9_5_IRQHandler                  /* EXTI Line 9..5                       */                          
  .word     TIM1_BRK_IRQHandler                 /* TIM1 Break                           */
  .word     TIM1_UP_IRQHandler                  /* TIM1 Update                          */         
  .word     TIM1_TRG_COM_IRQHandler             /* TIM1 Trigger and Commutation         */
  .word     TIM1_CC_IRQHandler                  /* TIM1 Capture Compare                 */                          
  .word     TIM2_IRQHandler                     /* TIM2                                 */                   
  .word     TIM3_IRQHandler                     /* TIM3                                 */                   
  .word     TIM4_IRQHandler                     /* TIM4                                 */                   
  .word     I2C1_EV_IRQHandler                  /* I2C1 Event                           */                          
  .word     I2C1_ER_IRQHandler                  /* I2C1 Error                           */                          
  .word     I2C2_EV_IRQHandler                  /* I2C2 Event                           */                          
  .word     I2C2_ER_IRQHandler                  /* I2C2 Error                           */                            
  .word     SPI1_IRQHandler                     /* SPI1                                 */                   
  .word     SPI2_IRQHandler                     /* SPI2                                 */                   
  .word     USART1_IRQHandler                   /* USART1                               */                   
  .word     USART2_IRQHandler                   /* USART2                               */                   
  .word     USART3_IRQHandler                   /* USART3                               */                   
  .word     EXTI15_10_IRQHandler                /* EXTI Line 15..10                     */                          
  .word     RTCAlarm_IRQHandler                 /* RTC Alarm through EXTI Line          */                 
  .word     USBWakeUp_IRQHandler                /* USB Wakeup from suspend              */                       
  .word     TIM8_BRK_IRQHandler                 /* TIM8 Break                           */         
  .word     TIM8_UP_IRQHandler                  /* TIM8 Update                          */         
  .word     TIM8_TRG_COM_IRQHandler             /* TIM8 Trigger and Commutation         */
  .word     TIM8_CC_IRQHandler                  /* TIM8 Capture Compare                 */                          
  .word     UART4_IRQHandler                    /* UART4                                */                   
  .word     UART5_IRQHandler                    /* UART5                                */       
  .word     LPUART_IRQHandler                   /* LPUART                               */
  .word     TIM5_IRQHandler                     /* TIM5                                 */   
  .word     TIM6_IRQHandler                     /* TIM6                                 */                   
  .word     TIM7_IRQHandler                     /* TIM7                                 */
  .word     CAN_TX_IRQHandler                   /* CAN TX                               */                          
  .word     CAN_RX0_IRQHandler                  /* CAN RX0                              */                          
  .word     CAN_RX1_IRQHandler                  /* CAN RX1                              */                          
  .word     CAN_SCE_IRQHandler                  /* CAN SCE                              */                          
  .word     LPUART_WKUP_IRQHandler              /* LPUART_WKUP                          */                   
  .word     LPTIM_WKUP_IRQHandler               /* LPTIM_WKUP                           */                   
  .word     LCD_IRQHandler                      /* LCD                                  */                   
  .word     SAC_IRQHandler                      /* SAC                                  */                   
  .word     MMU_IRQHandler                      /* MMU                                  */
  .word     TSC_IRQHandler                      /* TSC                                  */
  .word     RAMC_PERR_IRQHandler                /* RAMC ERR                             */
  .word     TIM9_IRQHandler                     /* TIM9                                 */
  .word     UCDR_IRQHandler                     /* UCDR ERR                             */

/*******************************************************************************
*
* Provide weak aliases for each Exception handler to the Default_Handler. 
* As they are weak aliases, any function with the same name will override 
* this definition.
* 
*******************************************************************************/
   .weak      NMI_Handler
   .thumb_set NMI_Handler,Default_Handler
  
   .weak      HardFault_Handler
   .thumb_set HardFault_Handler,Default_Handler
  
   .weak      MemManage_Handler
   .thumb_set MemManage_Handler,Default_Handler
  
   .weak      BusFault_Handler
   .thumb_set BusFault_Handler,Default_Handler

   .weak      UsageFault_Handler
   .thumb_set UsageFault_Handler,Default_Handler

   .weak      SVC_Handler
   .thumb_set SVC_Handler,Default_Handler

   .weak      DebugMon_Handler
   .thumb_set DebugMon_Handler,Default_Handler

   .weak      PendSV_Handler
   .thumb_set PendSV_Handler,Default_Handler

   .weak      SysTick_Handler
   .thumb_set SysTick_Handler,Default_Handler              
  
   .weak      WWDG_IRQHandler                   
   .thumb_set WWDG_IRQHandler,Default_Handler      
                  
   .weak      PVD_IRQHandler      
   .thumb_set PVD_IRQHandler,Default_Handler
               
   .weak      TAMPER_IRQHandler            
   .thumb_set TAMPER_IRQHandler,Default_Handler
            
   .weak      RTC_WKUP_IRQHandler                  
   .thumb_set RTC_WKUP_IRQHandler,Default_Handler
            
   .weak      FLASH_IRQHandler         
   .thumb_set FLASH_IRQHandler,Default_Handler
                  
   .weak      RCC_IRQHandler      
   .thumb_set RCC_IRQHandler,Default_Handler
                  
   .weak      EXTI0_IRQHandler         
   .thumb_set EXTI0_IRQHandler,Default_Handler
                  
   .weak      EXTI1_IRQHandler         
   .thumb_set EXTI1_IRQHandler,Default_Handler
                     
   .weak      EXTI2_IRQHandler         
   .thumb_set EXTI2_IRQHandler,Default_Handler 
                 
   .weak      EXTI3_IRQHandler         
   .thumb_set EXTI3_IRQHandler,Default_Handler
                        
   .weak      EXTI4_IRQHandler         
   .thumb_set EXTI4_IRQHandler,Default_Handler
                  
   .weak      DMA_Channel1_IRQHandler               
   .thumb_set DMA_Channel1_IRQHandler,Default_Handler
         
   .weak      DMA_Channel2_IRQHandler               
   .thumb_set DMA_Channel2_IRQHandler,Default_Handler
                  
   .weak      DMA_Channel3_IRQHandler               
   .thumb_set DMA_Channel3_IRQHandler,Default_Handler
                  
   .weak      DMA_Channel4_IRQHandler               
   .thumb_set DMA_Channel4_IRQHandler,Default_Handler 
                 
   .weak      DMA_Channel5_IRQHandler              
   .thumb_set DMA_Channel5_IRQHandler,Default_Handler
                  
   .weak      DMA_Channel6_IRQHandler               
   .thumb_set DMA_Channel6_IRQHandler,Default_Handler
                  
   .weak      DMA_Channel7_IRQHandler               
   .thumb_set DMA_Channel7_IRQHandler,Default_Handler

   .weak      DMA_Channel8_IRQHandler               
   .thumb_set DMA_Channel8_IRQHandler,Default_Handler
   
   .weak      ADC_IRQHandler      
   .thumb_set ADC_IRQHandler,Default_Handler
               
   .weak      USB_HP_IRQHandler   
   .thumb_set USB_HP_IRQHandler,Default_Handler
            
   .weak      USB_LP_IRQHandler                  
   .thumb_set USB_LP_IRQHandler,Default_Handler

   .weak      COMP_1_2_IRQHandler                  
   .thumb_set COMP_1_2_IRQHandler,Default_Handler
 
   .weak      EXTI9_5_IRQHandler   
   .thumb_set EXTI9_5_IRQHandler,Default_Handler
            
   .weak      TIM1_BRK_IRQHandler            
   .thumb_set TIM1_BRK_IRQHandler,Default_Handler
            
   .weak      TIM1_UP_IRQHandler            
   .thumb_set TIM1_UP_IRQHandler,Default_Handler
      
   .weak      TIM1_TRG_COM_IRQHandler      
   .thumb_set TIM1_TRG_COM_IRQHandler,Default_Handler
      
   .weak      TIM1_CC_IRQHandler   
   .thumb_set TIM1_CC_IRQHandler,Default_Handler
                  
   .weak      TIM2_IRQHandler            
   .thumb_set TIM2_IRQHandler,Default_Handler
                  
   .weak      TIM3_IRQHandler            
   .thumb_set TIM3_IRQHandler,Default_Handler
                  
   .weak      TIM4_IRQHandler            
   .thumb_set TIM4_IRQHandler,Default_Handler
                  
   .weak      I2C1_EV_IRQHandler   
   .thumb_set I2C1_EV_IRQHandler,Default_Handler
                     
   .weak      I2C1_ER_IRQHandler   
   .thumb_set I2C1_ER_IRQHandler,Default_Handler
                     
   .weak      I2C2_EV_IRQHandler   
   .thumb_set I2C2_EV_IRQHandler,Default_Handler
                  
   .weak      I2C2_ER_IRQHandler   
   .thumb_set I2C2_ER_IRQHandler,Default_Handler
                           
   .weak      SPI1_IRQHandler            
   .thumb_set SPI1_IRQHandler,Default_Handler
                        
   .weak      SPI2_IRQHandler            
   .thumb_set SPI2_IRQHandler,Default_Handler
                  
   .weak      USART1_IRQHandler      
   .thumb_set USART1_IRQHandler,Default_Handler
                     
   .weak      USART2_IRQHandler      
   .thumb_set USART2_IRQHandler,Default_Handler
                     
   .weak      USART3_IRQHandler      
   .thumb_set USART3_IRQHandler,Default_Handler
                  
   .weak      EXTI15_10_IRQHandler               
   .thumb_set EXTI15_10_IRQHandler,Default_Handler
               
   .weak      RTCAlarm_IRQHandler               
   .thumb_set RTCAlarm_IRQHandler,Default_Handler
            
   .weak      USBWakeUp_IRQHandler         
   .thumb_set USBWakeUp_IRQHandler,Default_Handler
            
   .weak      TIM8_BRK_IRQHandler         
   .thumb_set TIM8_BRK_IRQHandler,Default_Handler
         
   .weak      TIM8_UP_IRQHandler            
   .thumb_set TIM8_UP_IRQHandler,Default_Handler
         
   .weak      TIM8_TRG_COM_IRQHandler      
   .thumb_set TIM8_TRG_COM_IRQHandler,Default_Handler
      
   .weak      TIM8_CC_IRQHandler   
   .thumb_set TIM8_CC_IRQHandler,Default_Handler
                  
   .weak      UART4_IRQHandler         
   .thumb_set UART4_IRQHandler,Default_Handler
                  
   .weak      UART5_IRQHandler         
   .thumb_set UART5_IRQHandler,Default_Handler
   
   .weak      LPUART_IRQHandler         
   .thumb_set LPUART_IRQHandler,Default_Handler
                  
   .weak      TIM5_IRQHandler            
   .thumb_set TIM5_IRQHandler,Default_Handler
                  
   .weak      TIM6_IRQHandler                  
   .thumb_set TIM6_IRQHandler,Default_Handler
               
   .weak      TIM7_IRQHandler            
   .thumb_set TIM7_IRQHandler,Default_Handler
            
   .weak      CAN_TX_IRQHandler   
   .thumb_set CAN_TX_IRQHandler,Default_Handler
                           
   .weak      CAN_RX0_IRQHandler                  
   .thumb_set CAN_RX0_IRQHandler,Default_Handler
                           
   .weak      CAN_RX1_IRQHandler                  
   .thumb_set CAN_RX1_IRQHandler,Default_Handler
                           
   .weak      CAN_SCE_IRQHandler                  
   .thumb_set CAN_SCE_IRQHandler,Default_Handler
                           
   .weak      LPUART_WKUP_IRQHandler      
   .thumb_set LPUART_WKUP_IRQHandler,Default_Handler
                     
   .weak      LPTIM_WKUP_IRQHandler               
   .thumb_set LPTIM_WKUP_IRQHandler,Default_Handler

   .weak      LCD_IRQHandler            
   .thumb_set LCD_IRQHandler,Default_Handler
   
   .weak      SAC_IRQHandler            
   .thumb_set SAC_IRQHandler,Default_Handler
               
   .weak      MMU_IRQHandler                  
   .thumb_set MMU_IRQHandler,Default_Handler   

   .weak      TSC_IRQHandler                  
   .thumb_set TSC_IRQHandler,Default_Handler  
    
   .weak      RAMC_PERR_IRQHandler                  
   .thumb_set RAMC_PERR_IRQHandler,Default_Handler  
    
   .weak      TIM9_IRQHandler                  
   .thumb_set TIM9_IRQHandler,Default_Handler  
   
   .weak      UCDR_IRQHandler                  
   .thumb_set UCDR_IRQHandler,Default_Handler  
   
/************************ (C) COPYRIGHT Nations Technologies Inc *****END OF FILE****/

```

**以下为这段`assembly`代码的注释**：

	.syntax unified
指定统一的`ARM`和`Thumb`指令集语法。

	.cpu cortex-m4
	.fpu softvfp
	.thumb
指定目标`CPU`为`Cortex-M4`，浮点单元为软件实现（`softvfp`），并使用`Thumb`指令集。

	.global  g_pfnVectors
	.global  Default_Handler
声明全局符号`g_pfnVectors`和`Default_Handler`，使其在其他汇编文件或`C`代码中也可访问。

	.section  .text.Reset_Handler
	.weak  Reset_Handler
	.type  Reset_Handler, %function
定义了一个名为`.text.Reset_Handler`的代码段，并声明`Reset_Handler`函数较弱，意味着如果有其他同名函数，将覆盖此声明。

	Reset_Handler:	
定义`Reset_Handler`函数的开始。

	movs  r1, #0
	b  LoopCopyDataInit
将寄存器r1清零，并跳转到`LoopCopyDataInit`标签。

	CopyDataInit:
	ldr  r3, =_sidata
	ldr  r3, [r3, r1]
	str  r3, [r0, r1]
	adds  r1, r1, #4
定义`CopyDataInit`代码块，从`_sidata`地址开始复制初始化数据到数据段(`_sdata`至`_edata`)。

	LoopCopyDataInit:
	ldr  r0, =_sdata
	ldr  r3, =_edata
	adds  r2, r0, r1
	cmp  r2, r3
	bcc  CopyDataInit
创建一个循环，将初始化数据从`_sidata`复制到`_sdata`，直到`_edata`。

	ldr  r2, =_sbss
	b  LoopFillZerobss
将`r2`寄存器加载到`BSS`段的起始地址，并跳转到`LoopFillZerobss`。

	FillZerobss:
	movs  r3, #0
	str  r3, [r2], #4
将`BSS`段的每个位置初始化为`0`。

	LoopFillZerobss:
	ldr  r3, = _ebss
	cmp  r2, r3
	bcc  FillZerobss
创建一个循环，将`BSS`段从`_sbss`到`_ebss`的所有字节初始化为`0`。

	bl  SystemInit   
	bl __libc_init_array
	bl  main
	bx  lr    
调用系统初始化函数`SystemInit`，调用`C++`静态对象构造函数`__libc_init_array`，然后调用`main`函数，并从`Reset_Handler`返回。

	.size  Reset_Handler, .-Reset_Handler
指定`Reset_Handler`函数的大小。

	.section  .text.Default_Handler,"ax",%progbits
定义一个新的代码段，用于默认的中断处理函数。

Default_Handler:
Infinite_Loop:
  b  Infinite_Loop
定义`Default_Handler`函数，如果处理器接收到未处理的中断，则进入无限循环。

	.size  Default_Handler, .-Default_Handler
指定`Default_Handler`函数的大小。

	.section  .isr_vector,"a",%progbits
定义中断向量表的代码段。

	g_pfnVectors:
定义中断向量表的开始。

	.word  _estack
	.word  Reset_Handler
	...
中断向量表包含了系统堆栈的顶端、重置处理程序的地址和其他中断处理程序的地址。

	.weak      NMI_Handler
	.thumb_set NMI_Handler,Default_Handler
声明`NMI_Handler`为弱引用，并将其默认地址设置为`Default_Handler`。
这段代码的其余部分继续定义中断向量表和提供中断处理程序的弱引用，以便在没有提供特定中断处理程序时使用默认处理程序。