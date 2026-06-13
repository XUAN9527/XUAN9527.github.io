---
title: Claude Code `/` 指令大全
date: 2026-06-01 14:00:02
tags:
- [Linux]
categories: 
- [嵌入式]
description: Claude Code `/` 指令大全
---

# Claude Code `/` 指令大全

> 说明：实际可用指令会随 Claude Code 版本、平台、套餐、是否开启 MCP/插件/Skills 等变化。  
> 最准确的方法是在 Claude Code 里直接输入 `/` 查看当前环境可用命令。

---

## 1. 最常用指令

| 指令 | 用途 |
|---|---|
| `/help` | 查看帮助和可用命令 |
| `/init` | 给当前工程生成 `CLAUDE.md` 项目说明 |
| `/memory` | 编辑/管理 `CLAUDE.md` 记忆文件 |
| `/clear` | 开新对话，清空当前上下文 |
| `/compact` | 压缩当前上下文，长对话必用 |
| `/context` | 查看上下文占用 |
| `/model` | 切换模型 |
| `/effort` | 调整推理强度 |
| `/plan` | 进入计划模式，先规划再改代码 |
| `/diff` | 查看 Claude 改了哪些代码 |
| `/code-review` | 审查当前 diff |
| `/review` | 审查 PR |
| `/security-review` | 安全审查 |
| `/permissions` | 管理工具权限 |
| `/mcp` | 管理 MCP 服务 |
| `/agents` | 管理子 Agent |
| `/resume` | 恢复历史会话 |
| `/rewind` | 回退对话/代码到检查点 |
| `/doctor` | 诊断 Claude Code 安装和配置问题 |
| `/config` | 打开设置界面 |
| `/usage` | 查看用量/费用/限制 |

---

## 2. 项目初始化 / 记忆 / 配置类

| 指令 | 说明 |
|---|---|
| `/init` | 初始化项目，生成 `CLAUDE.md` |
| `/memory` | 编辑项目/用户记忆文件，管理 auto-memory |
| `/config` / `/settings` | 打开设置界面 |
| `/status` | 查看版本、模型、账号、连接状态 |
| `/theme` | 修改终端主题 |
| `/color` | 修改当前 prompt bar 颜色 |
| `/keybindings` | 打开或创建快捷键配置 |
| `/terminal-setup` | 配置终端快捷键，比如 Shift+Enter |
| `/statusline` | 配置状态栏 |
| `/tui` | 切换终端 UI 渲染模式 |
| `/ide` | 管理 IDE 集成 |
| `/login` / `/logout` | 登录/退出账号 |
| `/privacy-settings` | 查看/修改隐私设置，部分套餐可用 |

---

## 3. 上下文管理类

| 指令 | 说明 |
|---|---|
| `/clear [name]` | 开新会话，旧会话可从 `/resume` 找回 |
| `/reset` / `/new` | `/clear` 的别名 |
| `/compact [instructions]` | 压缩总结当前上下文，可带聚焦说明 |
| `/context [all]` | 查看上下文占用和优化建议 |
| `/btw <question>` | 问一个旁路问题，不加入主上下文 |
| `/copy [N]` | 复制最近第 N 条助手回复 |
| `/export [filename]` | 导出当前对话 |
| `/recap` | 生成当前会话一句话总结 |
| `/rename [name]` | 重命名当前会话 |
| `/resume [session]` | 恢复历史会话 |
| `/continue` | `/resume` 的别名 |
| `/branch [name]` | 从当前点分叉一个会话 |
| `/fork` | `/branch` 的别名 |
| `/rewind` | 回退对话/代码到之前检查点 |
| `/checkpoint` / `/undo` | `/rewind` 的别名 |

### 使用建议

长任务不要一直堆上下文，建议定期：

```text
/context
/compact 保留工程架构、已确认结论、修改过的文件、未解决问题
```

---

## 4. 模型 / 推理 / 速度类

| 指令 | 说明 |
|---|---|
| `/model [model]` | 切换模型 |
| `/effort [low\|medium\|high\|xhigh\|max\|auto]` | 调整推理强度 |
| `/fast [on\|off]` | 开关 fast mode |
| `/usage` | 查看用量、限制、统计 |
| `/cost` | `/usage` 别名 |
| `/stats` | `/usage` 别名 |
| `/usage-credits` | 配置额外 usage credits |
| `/upgrade` | 打开升级页面 |

---

## 5. 权限 / 目录 / MCP / 插件类

| 指令 | 说明 |
|---|---|
| `/permissions` | 管理 allow / ask / deny 工具权限 |
| `/allowed-tools` | `/permissions` 别名 |
| `/add-dir <path>` | 给当前会话增加可访问目录 |
| `/mcp` | 管理 MCP server 连接和认证 |
| `/hooks` | 查看 hooks 配置 |
| `/plugin` | 管理 Claude Code 插件 |
| `/reload-plugins` | 重载插件 |
| `/skills` | 查看可用 skills |
| `/reload-skills` | 重扫 skills/commands 目录 |
| `/fewer-permission-prompts` | 分析历史调用，减少权限弹窗 |

### MCP slash command 格式

MCP 服务器可能暴露自己的 slash command，常见格式：

```text
/mcp__<server>__<prompt>
```

---

## 6. 代码修改 / 审查 / 调试类

| 指令 | 说明 |
|---|---|
| `/plan [description]` | 进入计划模式，适合大改前使用 |
| `/diff` | 查看未提交改动和每轮改动 |
| `/code-review [low\|medium\|high\|xhigh\|max\|ultra] [--fix] [--comment] [target]` | 审查当前 diff，可自动修复 |
| `/simplify [target]` | 做代码简化/清理 review |
| `/review [PR]` | 本地审查 PR |
| `/security-review` | 安全漏洞审查 |
| `/debug [description]` | 开启 debug 日志并诊断问题 |
| `/doctor` | 诊断安装、配置和运行问题 |
| `/run` | 启动并操作项目 app 验证改动 |
| `/verify` | 构建运行项目，验证改动是否有效 |
| `/run-skill-generator` | 为项目生成 `/run`、`/verify` 所需技能 |
| `/deep-research <question>` | 多源搜索并生成带引用研究报告 |
| `/claude-api [migrate\|managed-agents-onboard]` | 加载 Claude API 参考/迁移 API 代码 |

---

## 7. 后台任务 / 并行 / 自动化类

| 指令 | 说明 |
|---|---|
| `/background [prompt]` | 当前会话转后台运行 |
| `/bg` | `/background` 别名 |
| `/tasks` | 查看和管理后台任务 |
| `/bashes` | `/tasks` 别名 |
| `/stop` | 停止当前后台会话 |
| `/batch <instruction>` | 把大型改动拆成多个子任务并行跑 |
| `/loop [interval] [prompt]` | 周期性重复执行提示 |
| `/proactive` | `/loop` 别名 |
| `/goal [condition\|clear]` | 设置持续目标，直到满足条件 |
| `/workflows` | 查看/暂停/恢复工作流 |
| `/schedule [description]` | 创建/更新/list/run routines |
| `/routines` | `/schedule` 别名 |

---

## 8. GitHub / PR / Web / 远程类

| 指令 | 说明 |
|---|---|
| `/install-github-app` | 安装 Claude GitHub Actions app |
| `/web-setup` | 连接 GitHub 到 Claude Code on the web |
| `/autofix-pr [prompt]` | 让 Web 会话盯 PR，CI 或评论有问题就修 |
| `/teleport` | 把 Claude Code on the web 会话拉到终端 |
| `/tp` | `/teleport` 别名 |
| `/remote-control` | 让当前会话可从 claude.ai 远程控制 |
| `/rc` | `/remote-control` 别名 |
| `/remote-env` | 配置远程环境 |
| `/desktop` / `/app` | 在 Claude Code Desktop app 继续当前会话 |
| `/mobile` / `/ios` / `/android` | 显示 Claude 手机 app 下载二维码 |

---

## 9. 平台 / 云服务 / 其它功能

| 指令 | 说明 |
|---|---|
| `/setup-bedrock` | 配置 Amazon Bedrock，需相关环境变量 |
| `/setup-vertex` | 配置 Google Vertex AI，需相关环境变量 |
| `/sandbox` | 切换 sandbox mode，平台支持时可用 |
| `/chrome` | 配置 Claude in Chrome |
| `/voice [hold\|tap\|off]` | 语音输入 |
| `/radio` | 打开 Claude FM lo-fi radio |
| `/stickers` | 订购 Claude Code 贴纸 |
| `/passes` | 分享免费 Claude Code 周卡，符合条件才显示 |
| `/powerup` | 功能学习/交互式演示 |
| `/team-onboarding` | 根据使用历史生成团队上手文档 |
| `/install-slack-app` | 安装 Claude Slack app |
| `/heapdump` | 导出 JS heap 快照，排查内存问题 |
| `/release-notes` | 查看版本更新日志 |
| `/feedback [report]` | 提交反馈/bug/分享对话 |
| `/bug` / `/share` | `/feedback` 别名 |
| `/exit` / `/quit` | 退出 CLI |

---

## 10. 已移除 / 变更的指令

| 指令 | 状态 |
|---|---|
| `/vim` | 已移除，改到 `/config → Editor mode` |
| `/pr-comments` | 新版本已移除，直接让 Claude 查看 PR comments |
| `/ultrareview` | 仍是别名，但官方更推荐 `/code-review ultra` |

---

## 11. 嵌入式工程推荐工作流

你做嵌入式 C 工程时，建议重点使用这组：

```text
/init
/memory
/plan
/context
/compact
/diff
/code-review high
/code-review high --fix
/simplify
/permissions
/mcp
/doctor
/resume
/rewind
```

### 推荐流程

#### 1）初始化项目

```text
/init
```

#### 2）先只读分析，不要直接改

```text
/plan 先只读分析这个串口DMA接收和协议解析链路，不要修改代码，输出涉及文件、调用链、风险点和最小修改方案
```

#### 3）确认方案后再改

```text
请按刚才方案修改，保持最小改动
```

#### 4）查看改动

```text
/diff
```

#### 5）审查改动

```text
/code-review high
```

#### 6）长对话压缩

```text
/context
/compact 保留工程架构、已确认结论、修改过的文件、未解决问题
```

---

## 12. 给 Claude Code 的嵌入式常用提示词

### 只读分析

```text
先只读分析，不要修改代码。
请判断问题涉及的模块、调用链、关键状态变量、潜在风险点。
最后输出最小修改方案和需要改动的文件。
```

### 最小改动

```text
按刚才方案修改，保持最小改动。
不要大面积重构，不要修改无关格式和注释。
修改后说明改了哪些文件、为什么这样改、风险点是什么。
```

### 代码审查

```text
/code-review high
```

### 架构优化前分析

```text
/plan 我想优化当前状态机架构。
先不要修改代码。
请先梳理当前事件来源、队列流向、状态切换逻辑、模块耦合点。
然后给出 2~3 个可选重构方案，比较改动量、风险、收益和适合当前工程的推荐方案。
```

### DMA / 串口协议分析

```text
/plan 只读分析 UART DMA 接收、空闲中断、环形缓冲、协议解析状态机。
重点检查：半包、粘包、超时、队列拷贝、ISR 与任务并发安全、缓存越界。
不要直接修改代码。
```

---

## 13. 个人建议

对于嵌入式项目，不要让 Claude Code 一上来全自动大改。更稳的方式是：

1. 先 `/plan` 只读分析。
2. 让它输出涉及文件、调用链、风险点。
3. 你确认方向。
4. 再让它最小改动。
5. 改完 `/diff`。
6. 再 `/code-review high`。
7. 长对话用 `/compact` 保留关键结论。

核心流程：

```text
/plan → 改代码 → /diff → /code-review → /compact
```
