---
title: Codex `/` 指令大全
date: 2026-06-01 14:00:02
tags:
- [Linux]
categories: 
- [嵌入式]
description: Codex `/` 指令大全
---

# Codex `/` 指令大全

> 适用范围：Codex CLI / Codex IDE Extension / Codex Desktop App。  
> 注意：不同端的 `/` 指令不完全一致；以当前环境输入 `/` 后弹出的菜单为准。  
> 本文按“CLI 终端为主，IDE / App 单独补充”的方式整理。

---

## 1. 先记最常用的

| 指令 | 适用端 | 用途 |
|---|---|---|
| `/init` | CLI | 在当前目录生成 `AGENTS.md` 项目规则 |
| `/status` | CLI / IDE / App | 查看线程、上下文、速率限制、状态信息 |
| `/permissions` | CLI | 调整 Codex 权限/审批模式 |
| `/clear` | CLI | 清屏并开始新对话 |
| `/new` | CLI | 在同一个 CLI 会话里开启新对话 |
| `/compact` | CLI | 压缩当前上下文，释放 token |
| `/diff` | CLI | 查看 Git diff，包括未跟踪文件 |
| `/review` | CLI / IDE / App | 审查当前工作区改动 |
| `/model` | CLI | 切换模型 |
| `/fast` | CLI | 开关 Fast mode |
| `/personality` | CLI | 调整回答风格 |
| `/mention` | CLI | 指定文件/目录加入对话 |
| `/mcp` | CLI / App | 查看 MCP 工具/服务状态 |
| `/skills` | CLI | 浏览和使用 skills |
| `/goal` | CLI / IDE / App | 设置持续目标 |
| `/plan` | App | 进入/切换计划模式 |
| `/resume` | CLI | 恢复历史会话 |
| `/quit` / `/exit` | CLI | 退出 Codex CLI |

---

## 2. Codex CLI 内置 `/` 指令

### 2.1 会话 / 上下文类

| 指令 | 说明 | 建议使用场景 |
|---|---|---|
| `/clear` | 清理终端并开始 fresh chat | 当前上下文混乱，想彻底重新开始 |
| `/new` | 在同一个 CLI 会话中开启新对话 | 不退出 Codex，但切换到新任务 |
| `/compact` | 总结当前对话，释放上下文 token | 长任务、上下文快满、改动阶段结束 |
| `/copy` | 复制最近一次 Codex 输出 | 复制计划、总结、命令、代码片段 |
| `/resume` | 从历史 session 列表恢复会话 | 回到之前未完成的任务 |
| `/quit` | 退出 CLI | 结束当前 Codex |
| `/exit` | `/quit` 的别名 | 结束当前 Codex |

### 2.2 项目 / 文件 / 代码改动类

| 指令 | 说明 | 建议使用场景 |
|---|---|---|
| `/init` | 在当前目录生成 `AGENTS.md` 脚手架 | 新项目第一次使用 Codex |
| `/mention` | 把指定文件或目录附加到对话 | 明确让 Codex 看某几个文件 |
| `/diff` | 显示 Git diff，包括未跟踪文件 | 每轮修改后检查改动 |
| `/review` | 让 Codex 审查当前 working tree | 改完后做二次审查 |
| `/ide` | 引入 IDE 打开的文件、选区等上下文 | 在 VSCode 里选中代码后让 Codex 分析 |

### 2.3 权限 / 安全 / 沙箱类

| 指令 | 说明 | 建议使用场景 |
|---|---|---|
| `/permissions` | 设置 Codex 不用询问即可执行哪些操作 | 调整 Read Only / Auto / Agent 等权限 |
| `/approve` | 对最近一次被自动审查拒绝的动作批准重试 | 命令被 auto review 拦截，但你确认安全 |
| `/sandbox-add-read-dir` | 给沙箱额外增加可读目录，Windows only | 命令需要读当前工作区外的绝对路径 |

### 2.4 模型 / 速度 / 风格类

| 指令 | 说明 | 建议使用场景 |
|---|---|---|
| `/model` | 切换当前模型 | 轻任务用快模型，复杂重构用强模型 |
| `/fast on` | 开启 Fast mode | 轻量修改、快速问答 |
| `/fast off` | 关闭 Fast mode | 复杂分析、深度审查 |
| `/fast status` | 查看 Fast mode 状态 | 不确定当前模式时 |
| `/personality` | 切换回答风格 | 想要更简洁/更解释型/默认风格 |
| `/status` | 查看当前状态 | 查模型、上下文、rate limit、线程信息 |

### 2.5 MCP / 插件 / Skills / Hooks 类

| 指令 | 说明 | 建议使用场景 |
|---|---|---|
| `/mcp` | 列出已配置的 MCP 工具 | 检查外部工具是否可用 |
| `/mcp verbose` | 查看 MCP server 细节 | 排查 MCP 连接或权限问题 |
| `/skills` | 浏览和使用 skills | 调用特定任务能力 |
| `/plugins` | 浏览已安装和可发现插件 | 查看插件工具、安装或管理插件 |
| `/apps` | 浏览 connectors/apps 并插入 prompt | 需要连接外部 app/context |
| `/hooks` | 查看和管理生命周期 hooks | hooks 有风险、需要信任/禁用时 |
| `/memories` | 配置 memory 注入和生成 | 控制 Codex 是否使用/生成记忆 |

### 2.6 Agent / 后台 / 实验功能类

| 指令 | 说明 | 建议使用场景 |
|---|---|---|
| `/agent` | 切换当前 active agent thread | 查看或继续子 agent 线程 |
| `/goal` | 设置、暂停、恢复、查看或清除持续目标 | 长任务、迁移、反复验证类工作 |
| `/ps` | 查看实验性后台终端及近期输出 | 有后台命令在跑时查看状态 |
| `/experimental` | 开关实验功能 | 需要启用 subagents 等实验能力 |

### 2.7 UI / 输入体验类

| 指令 | 说明 | 建议使用场景 |
|---|---|---|
| `/keymap` | 重映射 TUI 快捷键 | 自定义快捷键 |
| `/vim` | 切换 composer 的 Vim 模式 | 习惯 Vim 输入 |
| `/theme` | 选择语法高亮主题 | 调整终端显示 |
| `/title` | 配置终端窗口/标签标题字段 | 想在标题栏显示项目、分支、模型等 |

### 2.8 反馈 / 登录类

| 指令 | 说明 | 建议使用场景 |
|---|---|---|
| `/feedback` | 给 Codex 维护者发送反馈和日志 | 报 bug、提交诊断信息 |
| `/logout` | 退出 Codex 登录 | 共用机器、账号切换 |

---

## 3. Codex IDE Extension `/` 指令

IDE 扩展里的 slash commands 比 CLI 少，主要用于切换运行模式和查看状态。

| 指令 | 用途 |
|---|---|
| `/auto-context` | 开关 Auto Context，自动包含最近文件和 IDE 上下文 |
| `/cloud` | 切换到 cloud mode，远程运行任务 |
| `/cloud-environment` | 选择 cloud mode 使用的云环境 |
| `/feedback` | 打开反馈窗口，可附带日志 |
| `/goal` | 设置持续目标 |
| `/local` | 切换到 local mode，在本地 workspace 运行 |
| `/review` | 进入代码审查模式，审查未提交改动或和 base branch 对比 |
| `/status` | 显示 thread ID、上下文占用、rate limits |

如果 `/goal` 没显示，可能需要在 `~/.codex/config.toml` 开启：

```toml
[features]
goals = true
```

也可以在命令行执行：

```bash
codex features enable goals
```

---

## 4. Codex Desktop App `/` 指令

Codex App 的 `/` 指令更偏向线程控制、计划、审查和 MCP 状态。

| 指令 | 用途 |
|---|---|
| `/feedback` | 打开反馈窗口，可附带日志 |
| `/goal` | 设置持续目标，建议先用 `/plan` 梳理目标 |
| `/mcp` | 打开 MCP 状态，查看已连接 server |
| `/plan` | 切换 plan mode，用于多步骤规划 |
| `/review` | 进入代码审查模式 |
| `/status` | 查看 thread ID、上下文占用、rate limits |

---

## 5. 常用 CLI 启动参数，不是 `/` 指令，但很实用

这些是在终端启动 Codex 时用的参数，不是在 Codex 交互界面里输入的 `/` 指令。

| 参数 | 用途 |
|---|---|
| `codex -C <path>` | 指定工作目录 |
| `codex --cd <path>` | 同上，指定工作目录 |
| `codex -m <model>` | 指定模型 |
| `codex --model <model>` | 同上 |
| `codex -a <mode>` | 指定审批模式 |
| `codex --ask-for-approval <mode>` | 指定审批模式 |
| `codex -s <policy>` | 指定 sandbox 策略 |
| `codex --sandbox <policy>` | 指定 sandbox 策略 |
| `codex --add-dir <path>` | 额外授权目录 |
| `codex -i <image>` | 初始 prompt 附带图片 |
| `codex --image <image>` | 同上 |
| `codex --search` | 开启 live web search |
| `codex -c key=value` | 临时覆盖配置项 |
| `codex --profile <name>` | 使用指定 profile |
| `codex --oss` | 使用本地 OSS provider，例如 Ollama |
| `codex --remote <endpoint>` | 连接远程 app-server |
| `codex --no-alt-screen` | 禁用 alternate screen TUI |
| `codex --yolo` | 跳过 approvals 和 sandbox，风险很高，不建议日常使用 |

审批模式常见值：

```text
untrusted
on-request
never
```

sandbox 常见值：

```text
read-only
workspace-write
danger-full-access
```

---

## 6. 自定义 Prompt / Skills 说明

### 6.1 旧的 custom prompts

Codex 曾支持把 `~/.codex/prompts/*.md` 作为可调用 slash command，例如：

```text
/prompts:draftpr FILES="src/main.c" PR_TITLE="Fix UART DMA"
```

但官方现在标注：**Custom prompts 已废弃，建议使用 Skills。**

旧 prompt 文件示例：

```bash
mkdir -p ~/.codex/prompts
vim ~/.codex/prompts/draftpr.md
```

```markdown
---
description: Prep a branch, commit, and open a draft PR
argument-hint: [FILES=<paths>] [PR_TITLE="<title>"]
---

Create a branch named dev/<feature_name>.
If files are specified, stage them first: $FILES.
Commit the staged changes with a clear message.
Open a draft PR. Use $PR_TITLE when supplied.
```

### 6.2 现在更推荐 Skills

建议把长期复用的工作流改成 Codex Skill，例如：

- 嵌入式 DMA 接收审查
- RT-Thread 队列/中断安全检查
- 状态机架构分析
- IAP/Bootloader 跳转检查
- 协议栈解析边界检查
- 代码最小改动审查

---

## 7. 嵌入式工程推荐使用方式

### 7.1 新项目初始化

```text
/init
```

然后检查生成的：

```text
AGENTS.md
```

建议你的全局规则保持通用，项目内 `AGENTS.md` 写具体工程约束。

### 7.2 只读分析，不直接改

```text
先只读分析，不要修改代码。
请梳理这个问题涉及的模块、调用链、关键状态变量、并发风险、内存风险。
最后输出最小修改方案、涉及文件和风险点。
```

如果要指定文件：

```text
/mention application/uart_dma.c
/mention application/protocol_parser.c
```

### 7.3 修改前先看上下文/文件

```text
/mention <相关文件>
```

然后提示：

```text
基于这些文件分析，不要猜测未读取的代码。
如果缺少调用链文件，先告诉我需要补充哪些文件。
```

### 7.4 确认方案后再改

```text
按刚才方案修改，保持最小改动。
不要大面积重构，不要修改无关格式和注释。
修改后说明改了哪些文件、为什么这样改、风险点是什么。
```

### 7.5 改完查看 diff

```text
/diff
```

重点检查：

- 是否改了无关文件
- 是否大面积格式化
- 是否引入隐藏依赖
- 是否修改了公共接口
- 是否破坏 ISR / task 并发边界
- 是否有内存越界风险
- 是否把阻塞逻辑放进中断

### 7.6 改完做 review

```text
/review
```

可以追加要求：

```text
重点审查嵌入式 C 风险：
1. ISR 里是否有阻塞调用
2. 队列/环形缓冲是否有并发问题
3. DMA 接收是否可能覆盖未解析数据
4. 半包/粘包/超时处理是否正确
5. 是否有栈溢出、堆分配失败、越界访问
6. 修改是否保持最小化
```

### 7.7 长对话压缩

```text
/compact
```

建议压缩前补一句：

```text
压缩时保留：
1. 工程背景
2. 已读取文件
3. 已确认结论
4. 已修改文件
5. 未解决问题
6. 下一步计划
```

---

## 8. 适合嵌入式工程的 Codex 工作流

### 8.1 常规 bug 修复

```text
/mention <问题相关文件>

先只读分析，不要修改代码。
请输出：
1. 问题可能原因
2. 涉及文件和调用链
3. 最小修改方案
4. 修改风险
5. 需要我确认的点
```

确认后：

```text
按方案修改，保持最小改动。
```

修改后：

```text
/diff
/review
```

### 8.2 架构优化 / 状态机重构

不要一上来让 Codex 直接重构。推荐：

```text
先只读分析当前状态机架构，不要修改代码。
重点梳理：
1. 事件来源
2. 队列流向
3. 状态变量
4. 当前事件与历史事件的比较逻辑
5. 模块耦合点
6. 哪些逻辑适合抽象成 adapter
7. 哪些逻辑不建议改

输出 2~3 个重构方案，分别比较：
- 改动量
- 风险
- 收益
- 对现有调试习惯的影响
- 是否适合当前项目阶段
```

确认后再让它按阶段改：

```text
只实施第一阶段，目标是降低耦合，但不改变外部行为。
保持可回退，禁止大面积格式化。
```

### 8.3 DMA / 串口协议解析专项审查

```text
/mention <uart_dma_file>
/mention <protocol_parser_file>

只读审查 UART DMA + 空闲中断 + 队列 + 协议解析链路。
重点检查：
1. DMA 缓冲是否可能被覆盖
2. idle 中断和任务解析是否有并发风险
3. 拷贝数据是否需要临界区
4. 队列传递的是指针还是数据副本
5. 半包超时如何处理
6. 粘包 while 解析是否正确
7. 长帧/异常帧是否会卡死解析状态机
8. 是否有栈/堆/数组越界风险
不要修改代码，先输出结论。
```

### 8.4 Bootloader / IAP 跳转专项审查

```text
只读分析 Bootloader 到 APP 跳转流程。
重点检查：
1. 中断是否关闭
2. SysTick 是否关闭
3. 外设中断是否清理
4. NVIC pending 是否清理
5. MSP/PC 设置是否正确
6. VTOR 是否设置
7. Cache 是否需要关闭或失效
8. APP 起始地址和向量表是否合法
9. reset 与 power cycle 行为差异
不要修改代码，先输出风险点和最小修复方案。
```

---

## 9. 推荐记忆：最核心的一套

不用记所有命令，先记这几个就够：

```text
/init
/mention
/status
/permissions
/compact
/diff
/review
/resume
/quit
```

如果使用 Codex App，再补：

```text
/plan
/goal
/mcp
```

如果使用 IDE 扩展，再补：

```text
/local
/cloud
/auto-context
```

---

## 10. 和 Claude Code 指令的差异

| 维度 | Codex | Claude Code |
|---|---|---|
| 项目规则文件 | `AGENTS.md` | `CLAUDE.md` |
| 初始化 | `/init` 生成 `AGENTS.md` | `/init` 生成 `CLAUDE.md` |
| 上下文压缩 | `/compact` | `/compact` |
| 查看改动 | `/diff` | `/diff` |
| 代码审查 | `/review` | `/code-review` / `/review` |
| 权限管理 | `/permissions` | `/permissions` |
| 文件指定 | `/mention` | 常见是 `@file` 或相关上下文机制 |
| Skills | `/skills` | `/skills` |
| MCP | `/mcp` | `/mcp` |
| 计划模式 | App 有 `/plan`；CLI 主要靠自然语言规划 | `/plan` 更常用 |
| 自定义 prompts | 已废弃，推荐 Skills | slash/custom command 机制更像一等功能 |

---

## 11. 注意事项

1. `/` 指令必须以你当前端实际弹出的菜单为准。
2. Codex CLI、IDE 扩展、Desktop App 的命令不完全相同。
3. `custom prompts` 已不推荐，长期复用工作流建议做成 skills。
4. `/permissions` 不要随便开太大权限，尤其不要日常使用 `--yolo`。
5. 嵌入式项目要优先使用“只读分析 → 最小改动 → diff → review”的流程。
6. 大重构不要一次性全放开，分阶段执行更稳。
7. 长对话要主动 `/compact`，否则上下文会变脏，后续容易改偏。
8. `/diff` 和 `/review` 是防止 agent 乱改的关键步骤。

---

## 12. 推荐嵌入式固定流程

```text
/init
/mention <相关文件>
先只读分析，不要修改代码，输出调用链、原因、最小修改方案和风险点
确认方案后让 Codex 修改
/diff
/review
/compact
```

核心原则：

```text
先分析，再修改；先小改，再验证；先看 diff，再 review。
```

---

## 13. 参考来源

- OpenAI Developers：Codex CLI Slash Commands
- OpenAI Developers：Codex IDE Extension Slash Commands
- OpenAI Developers：Codex App Commands
- OpenAI Developers：Codex CLI Command Line Options
- OpenAI Developers：Codex Custom Prompts / Skills 说明