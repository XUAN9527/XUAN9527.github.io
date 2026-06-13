---
title: WSL2 网络不通 Windows 代理的排查与修复（NAT → Mirrored 网络模式）
date: 2026-06-13
tags: [WSL2, 代理, Clash, Copilot, 网络, 踩坑]
---

## 现象

WSL2 内几乎所有需要联网的工具都失败——`git clone` 超时、`apt update` 卡死、`npm install` 报错、`curl` 不通。VS Code (Remote-WSL) 中 GitHub Copilot 显示 **"Language model unavailable"**，模型列表只剩 "Auto"。

然而 Windows 侧浏览器翻墙一切正常，Clash 代理也在运行。

## 诊断过程

### 1. 确认代理进程状态

Windows 侧 Clash 已启动，浏览器可翻墙，说明代理服务正常。但 WSL2 内测试：

```bash
# 测试端口连通性（WSL2 支持 /dev/tcp）
timeout 2 bash -c "echo > /dev/tcp/127.0.0.1/7897" 2>&1
# 输出: Connection refused
```

### 2. 确认端口是否在监听

```bash
ss -tlnp | grep 7897
# 无任何输出——Windows 的 127.0.0.1:7897 在 WSL2 侧不可见
```

### 3. 测试不同地址

WSL2 通过 NAT 与 Windows 通信，Windows 在 WSL2 视角下有一个网关 IP：

```bash
WIN_IP=$(ip route show default | awk '{print $3}')
echo $WIN_IP        # 例: 172.25.80.1

# 分别测试 localhost 和 Windows 网关 IP
curl -x http://127.0.0.1:7897 https://api.github.com    # 不通
curl -x http://172.25.80.1:7897 https://api.github.com   # 也不通（Clash 未开 Allow LAN）
```

### 4. 查看 Copilot 日志

VS Code `Ctrl+Shift+P` → `GitHub Copilot: Show Logs`：

```
PROXY 127.0.0.1:7897
FetcherService: node-fetch failed with error: fetch failed
connect ECONNREFUSED 127.0.0.1:7897
Failed to get copilot token. reason: RequestFailed
GitHub Copilot could not connect to server. Extension activation failed
```

## 根因分析

**WSL2 默认使用 NAT 网络模式**，WSL2 是一个独立的虚拟网络。Windows 的 `127.0.0.1`（localhost）只对 Windows 自己可见，WSL2 有自己的 `127.0.0.1`，两者不共享。

```
┌─────────────────────────────────────────────┐
│                   Windows                    │
│                                               │
│  Clash ← 127.0.0.1:7897                      │
│    ↓ (外部网络)                               │
│  浏览器 ✅ 可用                                │
│                                               │
│  ┌─────────────────────────────┐             │
│  │           WSL2               │             │
│  │                              │             │
│  │  127.0.0.1:7897 → ❌ 不存在   │             │
│  │  172.25.80.1:7897 → ❌ 被拒  │             │
│  │                              │             │
│  │  git / curl / apt / npm /   │             │
│  │  pip / VS Code Remote 全挂   │             │
│  └─────────────────────────────┘             │
└─────────────────────────────────────────────┘
```

所以**不仅是 Copilot**，所有在 WSL2 内通过代理访问网络的工具都会出问题——只是因为 Copilot 的报错最显眼，容易被首先注意到。

受影响的典型场景：
- `git clone/push/pull`（通过 HTTPS 代理）
- `apt update/install`
- `npm install / yarn add`
- `pip install`
- `curl / wget`
- VS Code Remote 侧各种联网扩展（Copilot、Marketplace 等）

## 解决方案

### 方案一：Windows 当前用户目录下创建 `.wslconfig`（推荐，一劳永逸）

**是什么：** `.wslconfig` 是 WSL2 的全局配置文件，对所有 WSL 发行版生效，位于 Windows 用户目录 `%USERPROFILE%\.wslconfig`。

**为什么推荐：** 开启 `networkingMode=mirrored` 后，Windows 和 WSL2 共享 localhost，`127.0.0.1` 在两边等价。从此不再需要为 WSL 单独配置代理地址。

**与 WSL 安装路径无关：** `.wslconfig` 始终在 `C:\Users\<你的Windows用户名>\` 下，即便 WSL2 装在 D 盘也不影响。

#### 编辑 `.wslconfig`

在 Windows PowerShell/CMD 中查看当前配置（如果存在）：

```powershell
notepad $env:USERPROFILE\.wslconfig
```

或从 WSL2 内通过 `powershell.exe` 写（避免权限问题）：

```bash
powershell.exe -Command 'Set-Content -Path "$env:USERPROFILE\.wslconfig" -Value "[wsl2]`nnetworkingMode=mirrored"'
```

文件内容：

```ini
[wsl2]
networkingMode=mirrored
```

#### 使配置生效

**必须完全关闭 WSL 再重启：**

```powershell
wsl --shutdown
```

> ⚠️ `wsl --shutdown` 会关闭所有 WSL2 实例，请注意保存未持久化的数据。平常终端关掉窗口只是注销，WSL VM 还在后台跑，所以配置不会加载。

#### 验证

重新进入 WSL2 后：

```bash
# 1. 端口可连
timeout 2 bash -c "echo > /dev/tcp/127.0.0.1/7897" && echo "✅" || echo "❌"

# 2. 通过代理能访问外网
curl -x http://127.0.0.1:7897 https://api.github.com
# HTTP 200 = 正常

# 3. 查看网络模式确认
# mirrored 模式下可以发现 WSL2 的 IP 和 Windows 一致
ip addr show eth0
```

#### 对 VS Code

重启 WSL 后，VS Code `Ctrl+Shift+P` → `Developer: Reload Window`，Copilot 恢复。

### 方案二：Clash 开启 Allow LAN + 使用 Windows 网关 IP（不想改全局配置时用）

如果不想改 WSL 网络模式，可以：

1. Clash 设置中开启 **Allow LAN**（允许局域网连接），使 Clash 监听 `0.0.0.0` 而非仅 `127.0.0.1`
2. 获取 Windows 在 WSL2 中的网关 IP：

   ```bash
   ip route show default | awk '{print $3}'
   # 输出类似 172.25.80.1
   ```

3. 将 WSL2 内的所有代理环境变量指向该 IP：

   ```bash
   export HTTP_PROXY=http://172.25.80.1:7897
   export HTTPS_PROXY=http://172.25.80.1:7897
   export ALL_PROXY=socks5://172.25.80.1:7897
   ```

   VS Code Remote 设置中 `http.proxy` 也改为 `http://172.25.80.1:7897`。

**缺点：** 网关 IP 在每次 WSL 重启后会变化，需要重新获取。不如方案一彻底。

## 踩坑总结

- WSL2 默认 NAT 模式下，**WSL 访问不了 Windows 的 `127.0.0.1`**——这是最常见但最容易被忽视的坑
- 浏览器能翻墙 ≠ WSL2 能翻墙——两种网络环境
- Clash 开了但 `ss` 看不到端口监听——正常的，它是跑在 Windows 侧，WSL 侧当然看不到
- `.wslconfig` 永远在 `%USERPROFILE%`（即 `C:\Users\<用户名>\`），与 WSL 发行版装在哪个盘无关
- 从 WSL 操作 Windows 侧文件遇到权限问题时，用 `powershell.exe -Command` 绕过去
- `wsl --shutdown` 才是真正重启 WSL 虚拟机，关终端窗口只是注销 session
- `networkingMode=mirrored` 不仅解决代理问题，还能让 WSL2 内启动的服务在 Windows 侧通过 `localhost` 直接访问

## 参考

- [WSL 高级设置配置 | Microsoft Learn](https://learn.microsoft.com/zh-cn/windows/wsl/wsl-config)
