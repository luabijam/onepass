# DevContainer CLI 开发环境设计文档

**日期：** 2026-03-22
**项目：** onepass_app（Flutter 跨平台密码管理器）
**开发环境：** DevContainer CLI + Docker Desktop + Tmux + Neovim

---

## 1. 目标

为 `onepass_app` 提供可复现的 DevContainer 开发环境，满足：

- 终端驱动工作流（Tmux + Neovim）
- Android 端完整开发周期：编码、分析、构建、ADB 真机调试
- macOS 端构建保留在宿主机 Flutter（容器不承担 macOS 构建）
- Neovim 配置从宿主机 bind-mount，不维护两套 dotfiles

---

## 2. 范围

**容器内：**
- Flutter SDK（stable channel，固定版本）
- Android SDK（cmdline-tools、platform-tools、build-tools;34.0.0、platforms;android-34）
- Neovim + Tmux + ripgrep + fd（开发工具）
- Dart Language Server（随 Flutter SDK 附带）
- ADB 通过 `host.docker.internal` 转发到宿主机

**宿主机负责：**
- `flutter build macos`（macOS SDK 不可在 Linux 容器内使用）
- ADB Server + USB 设备连接
- Neovim 配置（bind-mount 进容器）

---

## 3. 架构

```
宿主机 macOS
├── Docker Desktop (Linux VM)
│   └── DevContainer (ubuntu:22.04)
│       ├── Flutter SDK → /opt/flutter
│       ├── Android SDK → /opt/android-sdk
│       ├── Neovim + tmux + ripgrep + fd
│       └── /workspace   ← bind-mount → onepass_app/
│
├── ADB Server (:5037)  ← 容器通过 host.docker.internal:5037 复用
│   └── Android 真机 (USB)
│
├── 宿主机 Flutter SDK  ← flutter build macos
└── ~/.config/nvim      ← bind-mount → 容器 /root/.config/nvim
```

### 职责分配

| 任务 | 执行位置 |
|------|---------|
| `flutter analyze / test / build apk` | 容器内 |
| `adb install / logcat` | 容器内（经由宿主机 ADB） |
| `flutter build macos` | 宿主机 |
| Neovim 编辑 / Dart LSP | 容器内（mount 宿主 nvim 配置） |
| Tmux 会话管理 | 容器内 |

---

## 4. 文件结构

```
onepass_app/
└── .devcontainer/
    ├── devcontainer.json
    └── Dockerfile
```

---

## 5. Dockerfile 设计

**基础镜像：** `ubuntu:22.04`

**构建层次（从下到上）：**

1. **系统依赖**
   - `curl`, `git`, `unzip`, `xz-utils`, `zip`
   - `clang`, `cmake`, `ninja-build`, `libgtk-3-dev`, `pkg-config`
   - `openjdk-17-jdk`（Android 构建工具依赖）

2. **开发工具**
   - Neovim（AppImage，固定稳定版本）
   - `tmux`, `zsh`, `ripgrep`, `fd-find`

3. **Flutter SDK**
   - 安装路径：`/opt/flutter`
   - Channel：stable，固定版本（需满足 `sdk: ^3.11.1`）
   - `flutter precache --android`

4. **Android SDK**
   - cmdline-tools 安装路径：`/opt/android-sdk/cmdline-tools/latest`
   - 自动 accept licenses
   - 安装：`platform-tools`, `build-tools;34.0.0`, `platforms;android-34`

5. **环境变量**
   - `FLUTTER_HOME=/opt/flutter`
   - `ANDROID_HOME=/opt/android-sdk`
   - `PATH` 包含 flutter/bin、android-sdk/platform-tools、android-sdk/cmdline-tools/latest/bin

---

## 6. devcontainer.json 设计

**关键字段：**

```json
{
  "name": "OnePass Android Dev",
  "build": { "dockerfile": "Dockerfile" },
  "workspaceMount": "source=${localWorkspaceFolder},target=/workspace,type=bind",
  "workspaceFolder": "/workspace",
  "mounts": [
    "source=${localEnv:HOME}/.config/nvim,target=/root/.config/nvim,type=bind,consistency=cached",
    "source=${localEnv:HOME}/.local/share/nvim,target=/root/.local/share/nvim,type=bind,consistency=cached"
  ],
  "containerEnv": {
    "ANDROID_ADB_SERVER_ADDRESS": "host.docker.internal",
    "ANDROID_ADB_SERVER_PORT": "5037"
  },
  "postAttachCommand": "flutter pub get && adb devices",
  "remoteUser": "root"
}
```

**mounts 说明：**
- `~/.config/nvim` → nvim 配置（init.lua / init.vim 等）
- `~/.local/share/nvim` → 插件数据、treesitter parsers（避免容器内重新安装）

**postAttachCommand：**
每次 attach 容器后自动执行：
1. `flutter pub get`——确保依赖最新
2. `adb devices`——验证 ADB 转发正常，真机可见

---

## 7. ADB 转发机制

Docker Desktop 在宿主机注入 `host.docker.internal` 域名。

容器内设置：
```
ANDROID_ADB_SERVER_ADDRESS=host.docker.internal
ANDROID_ADB_SERVER_PORT=5037
```

所有 `adb` 命令自动连接宿主机 ADB Server，USB 设备对容器完全透明。

**前提：** 宿主机需先运行 `adb start-server`（插入设备后自动触发）。

---

## 8. 日常工作流

### 启动/重建容器
```bash
cd onepass_app
devcontainer up --workspace-folder .          # 首次 or 重建
```

### 进入开发环境
```bash
devcontainer exec --workspace-folder . -- zsh
```

### 容器内 Tmux 布局
```
tmux new-session -s dev

window 1: nvim .                              # 编辑（Dart LSP 自动启动）
window 2: flutter analyze --watch            # 持续静态检查
window 3: flutter build apk --debug && \
          adb install <apk-path>             # 构建 + 刷机
window 4: adb logcat                         # 日志
```

### macOS 构建（宿主机另开终端）
```bash
cd onepass_app
flutter build macos
```

### 常用命令
```bash
flutter test                    # 单元测试
flutter analyze                 # lint
flutter pub get                 # 依赖同步
flutter build apk --release     # release 包
adb devices                     # 确认真机连接
```

### 重建镜像（SDK 升级）
```bash
devcontainer build --workspace-folder . --no-cache
devcontainer up --workspace-folder . --remove-existing-container
```

---

## 9. 不包含内容

- Android 模拟器（用真机，规避 KVM 复杂度）
- VS Code 任何扩展或 GUI 集成
- CI/CD 流水线配置
- macOS 任何构建工具
- SSH 密钥挂载（代码已通过 bind-mount 可用）
