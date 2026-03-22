# DevContainer CLI 开发环境实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `onepass_app/.devcontainer/` 创建可复现的 DevContainer 环境，支持 Flutter Android 端完整开发周期（编码、分析、构建、ADB 真机调试）。

**Architecture:** 自定义 Dockerfile（ubuntu:22.04 x86_64），烘焙 Flutter 3.41.4 + Android SDK（NDK 28.2.13676358，build-tools 35.0.0，platform-36）及开发工具；ADB 包装脚本透明转发到宿主机 ADB Server；devcontainer.json 挂载宿主 nvim 配置并在 attach 时自动生成 `local.properties`。

**Tech Stack:** DevContainer CLI, Docker Desktop, Flutter 3.41.4, Android SDK cmdline-tools, Neovim v0.10.x tar.gz, tmux, ripgrep, fd-find

---

## 文件结构

```
onepass_app/
└── .devcontainer/
    ├── Dockerfile          ← 自定义镜像（所有层）
    └── devcontainer.json   ← DevContainer CLI 配置
```

不新增其他文件。`local.properties` 由 `postAttachCommand` 在容器运行时生成，不进入 git。

---

## Task 1：写 Dockerfile — 基础层（系统依赖 + 开发工具）

**Files:**
- Create: `onepass_app/.devcontainer/Dockerfile`

- [ ] **Step 1：确认目标目录存在**

```bash
ls /path/to/onepass_app
# 应看到 pubspec.yaml android/ lib/ 等
mkdir -p onepass_app/.devcontainer
```

- [ ] **Step 2：写 Dockerfile 系统依赖层**

创建 `onepass_app/.devcontainer/Dockerfile`，内容如下（**完整文件，后续步骤将追加**）：

```dockerfile
FROM --platform linux/amd64 ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# ── Layer 1: 系统依赖 ──────────────────────────────────────────
RUN apt-get update && apt-get install -y \
    curl git unzip xz-utils zip wget ca-certificates \
    clang cmake ninja-build libgtk-3-dev pkg-config \
    openjdk-17-jdk \
    gcc g++ \
    tmux zsh ripgrep fd-find \
    && ln -sf /usr/bin/fdfind /usr/local/bin/fd \
    && rm -rf /var/lib/apt/lists/*
```

> `fd-find` 的二进制名是 `fdfind`，软链到 `fd` 供正常使用。`ripgrep` 的二进制名是 `rg`（无需软链）。

- [ ] **Step 3：构建并验证系统依赖层**

```bash
cd onepass_app
docker build --platform linux/amd64 -t onepass-dev:test -f .devcontainer/Dockerfile .
```

预期：构建成功，无报错。

```bash
docker run --rm onepass-dev:test java -version
```

预期输出：`openjdk version "17.x.x" ...`

```bash
docker run --rm onepass-dev:test bash -c "gcc --version && tmux -V && rg --version && fd --version"
```

预期：每行都有版本输出，无 `command not found`。

---

## Task 2：Dockerfile — Neovim 层

**Files:**
- Modify: `onepass_app/.devcontainer/Dockerfile`

> **确认 Neovim 版本：** 在 https://github.com/neovim/neovim/releases 找最新 stable release，记下版本号（如 `v0.10.4`）。下方使用 `NVIM_VERSION` 替代，请替换为实际版本。

- [ ] **Step 1：追加 Neovim 层**

在 Dockerfile 末尾追加：

```dockerfile
# ── Layer 2: Neovim ───────────────────────────────────────────
ARG NVIM_VERSION=v0.10.4
RUN wget "https://github.com/neovim/neovim/releases/download/${NVIM_VERSION}/nvim-linux-x86_64.tar.gz" \
        -O /tmp/nvim.tar.gz \
    && tar -xzf /tmp/nvim.tar.gz -C /opt/ \
    && ln -sf /opt/nvim-linux-x86_64/bin/nvim /usr/local/bin/nvim \
    && rm /tmp/nvim.tar.gz
```

- [ ] **Step 2：构建并验证**

```bash
docker build --platform linux/amd64 -t onepass-dev:test -f .devcontainer/Dockerfile .
docker run --rm onepass-dev:test nvim --version
```

预期首行：`NVIM v0.10.x`（或你选择的版本）。

---

## Task 3：Dockerfile — Flutter SDK 层

**Files:**
- Modify: `onepass_app/.devcontainer/Dockerfile`

- [ ] **Step 1：追加 Flutter 层**

在 Dockerfile 末尾追加：

```dockerfile
# ── Layer 3: Flutter SDK 3.41.4 ───────────────────────────────
RUN wget https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_3.41.4-stable.tar.xz \
        -O /tmp/flutter.tar.xz \
    && tar -xf /tmp/flutter.tar.xz -C /opt/ \
    && rm /tmp/flutter.tar.xz

ENV FLUTTER_HOME=/opt/flutter \
    PATH=/opt/flutter/bin:$PATH

# 预热 Android 引擎缓存（需构建时网络，约 300 MB，Docker Desktop 默认可用）
RUN flutter precache --android
```

- [ ] **Step 2：构建并验证**

```bash
docker build --platform linux/amd64 -t onepass-dev:test -f .devcontainer/Dockerfile .
```

> 此步耗时较长（下载 Flutter + precache），首次约 5-10 分钟，后续层有 Docker 缓存。

```bash
docker run --rm onepass-dev:test flutter --version
```

预期首行：`Flutter 3.41.4 • channel stable ...`

```bash
docker run --rm onepass-dev:test dart --version
```

预期：`Dart SDK version: 3.11.1 ...`

---

## Task 4：Dockerfile — Android SDK 层

**Files:**
- Modify: `onepass_app/.devcontainer/Dockerfile`

> **确认 cmdline-tools 下载 URL：** 访问 https://developer.android.com/studio#command-line-tools-only，找 "Command line tools only" 的 Linux 下载链接（形如 `commandlinetools-linux-XXXXXXXX_latest.zip`），记下完整 URL。下方使用 `CMDTOOLS_URL` 占位，请替换。

- [ ] **Step 1：追加 Android SDK 层**

在 Dockerfile 末尾追加（替换 URL）：

```dockerfile
# ── Layer 4: Android SDK ──────────────────────────────────────
ARG CMDTOOLS_URL=https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip

RUN mkdir -p /opt/android-sdk/cmdline-tools \
    && wget "${CMDTOOLS_URL}" -O /tmp/cmdtools.zip \
    && unzip -q /tmp/cmdtools.zip -d /tmp/cmdtools-extract \
    # 关键：必须重命名为 latest，sdkmanager 要求路径含版本名
    && mv /tmp/cmdtools-extract/cmdline-tools /opt/android-sdk/cmdline-tools/latest \
    && rm -rf /tmp/cmdtools.zip /tmp/cmdtools-extract

ENV ANDROID_HOME=/opt/android-sdk \
    ANDROID_SDK_ROOT=/opt/android-sdk \
    JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 \
    PATH=/opt/android-sdk/cmdline-tools/latest/bin:/opt/android-sdk/platform-tools:$PATH

RUN yes | sdkmanager --licenses \
    && sdkmanager \
        "platform-tools" \
        "build-tools;35.0.0" \
        "platforms;android-36" \
        "ndk;28.2.13676358"
```

> `build-tools;35.0.0` 与 `platforms;android-36` 版本号不同是正常的：AGP 8.11.1 管理 build-tools 版本，compileSdk=36 是 API 级别，两者独立。

- [ ] **Step 2：构建并验证**

```bash
docker build --platform linux/amd64 -t onepass-dev:test -f .devcontainer/Dockerfile .
```

```bash
docker run --rm onepass-dev:test sdkmanager --list_installed
```

预期输出包含以下各行：
```
  build-tools;35.0.0
  ndk;28.2.13676358
  platform-tools
  platforms;android-36
```

```bash
docker run --rm onepass-dev:test flutter doctor --android-licenses 2>&1 | head -5
```

预期：显示 "All SDK package licenses accepted." 或类似提示，无 "SDK not found" 错误。

---

## Task 5：Dockerfile — ADB 包装脚本 + 最终 ENV

**Files:**
- Modify: `onepass_app/.devcontainer/Dockerfile`

- [ ] **Step 1：追加 ADB 包装层**

在 Dockerfile 末尾追加：

```dockerfile
# ── Layer 5: ADB 包装脚本 ─────────────────────────────────────
# ANDROID_ADB_SERVER_ADDRESS 在部分 adb 版本不被识别，改用包装脚本。
# Flutter 内部调用 $ANDROID_HOME/platform-tools/adb，包装对 flutter 命令同样生效。
RUN mv /opt/android-sdk/platform-tools/adb \
       /opt/android-sdk/platform-tools/adb.real \
    && printf '#!/bin/bash\nexec /opt/android-sdk/platform-tools/adb.real -H host.docker.internal -P 5037 "$@"\n' \
       > /opt/android-sdk/platform-tools/adb \
    && chmod +x /opt/android-sdk/platform-tools/adb

# ── 最终 ENV（覆盖/合并前面各层的 ENV）──────────────────────────
ENV FLUTTER_HOME=/opt/flutter \
    ANDROID_HOME=/opt/android-sdk \
    ANDROID_SDK_ROOT=/opt/android-sdk \
    JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 \
    PATH=/opt/flutter/bin:/opt/android-sdk/platform-tools:/opt/android-sdk/cmdline-tools/latest/bin:$PATH

WORKDIR /workspace
```

- [ ] **Step 2：最终构建**

```bash
docker build --platform linux/amd64 -t onepass-dev:latest -f .devcontainer/Dockerfile .
```

构建成功，无报错。

- [ ] **Step 3：验证 ADB 包装脚本**

```bash
docker run --rm onepass-dev:latest cat /opt/android-sdk/platform-tools/adb
```

预期输出：
```
#!/bin/bash
exec /opt/android-sdk/platform-tools/adb.real -H host.docker.internal -P 5037 "$@"
```

```bash
docker run --rm onepass-dev:latest /opt/android-sdk/platform-tools/adb.real version
```

预期：`Android Debug Bridge version X.X.X` （真实 adb 可执行）

```bash
docker run --rm onepass-dev:latest adb version
```

预期：同上（包装脚本透传 `version` 子命令，但会尝试连接 host 5037；若宿主机有 adb server 则成功；若无则报错但 `version` 子命令不依赖 server 连接，仍应输出版本号）

- [ ] **Step 4：完整 flutter doctor 检查**

```bash
docker run --rm onepass-dev:latest flutter doctor
```

预期：`[✓] Flutter`、`[✓] Android toolchain` 均通过。`[!] Android Studio` 可忽略（未安装 IDE 是预期的）。

---

## Task 6：写 devcontainer.json

**Files:**
- Create: `onepass_app/.devcontainer/devcontainer.json`

- [ ] **Step 1：创建 devcontainer.json**

创建 `onepass_app/.devcontainer/devcontainer.json`，内容：

```json
{
  "name": "OnePass Android Dev",
  "build": { "dockerfile": "Dockerfile" },
  "workspaceMount": "source=${localWorkspaceFolder},target=/workspace,type=bind",
  "workspaceFolder": "/workspace",
  "mounts": [
    "source=${localEnv:HOME}/.config/nvim,target=/root/.config/nvim,type=bind,consistency=cached"
  ],
  "containerEnv": {
    "ANDROID_ADB_SERVER_PORT": "5037"
  },
  "postAttachCommand": "printf 'flutter.sdk=/opt/flutter\\nsdk.dir=/opt/android-sdk\\n' > /workspace/android/local.properties && flutter pub get && /opt/android-sdk/platform-tools/adb.real -H host.docker.internal -P 5037 devices || true",
  "remoteUser": "root"
}
```

**字段说明（不要修改）：**

| 字段 | 说明 |
|------|------|
| `workspaceMount` + `workspaceFolder` | bind-mount `onepass_app/` 到容器 `/workspace` |
| `mounts[0]` | 宿主 `~/.config/nvim` → 容器 `/root/.config/nvim`（共享 nvim 配置） |
| `~/.local/share/nvim` | **不挂载**：macOS `.dylib` Treesitter parser 无法在 Linux 容器加载；nvim-treesitter 会自动用容器内 gcc 重编译 |
| `postAttachCommand` | ① 写 `local.properties`（`android/.gitignore` 排除此文件，但 `settings.gradle.kts` 启动时硬要求 `flutter.sdk`）② `flutter pub get` ③ ADB 可达性检查（`|| true` 确保无设备时不阻断 attach） |

- [ ] **Step 2：验证 JSON 语法**

```bash
cat onepass_app/.devcontainer/devcontainer.json | python3 -m json.tool > /dev/null && echo "JSON valid"
```

预期：`JSON valid`

---

## Task 7：端到端 devcontainer 测试

**前提：** 宿主机已安装 `devcontainer` CLI（`npm install -g @devcontainers/cli`）。

- [ ] **Step 1：启动容器**

```bash
cd onepass_app
devcontainer up --workspace-folder .
```

预期：`{"outcome":"success",...}` 或类似 JSON 输出，无错误。

- [ ] **Step 2：验证 postAttachCommand 产物**

```bash
devcontainer exec --workspace-folder . -- cat /workspace/android/local.properties
```

预期输出：
```
flutter.sdk=/opt/flutter
sdk.dir=/opt/android-sdk
```

- [ ] **Step 3：验证 flutter pub get 成功**

```bash
devcontainer exec --workspace-folder . -- flutter pub get
```

预期：`Resolving dependencies... Got dependencies!`，无 SDK version mismatch 报错。

- [ ] **Step 4：验证 flutter analyze**

```bash
devcontainer exec --workspace-folder . -- flutter analyze
```

预期：`No issues found!` 或仅有代码层面的 lint 提示（无环境错误）。

- [ ] **Step 5：验证 nvim 配置挂载**

```bash
devcontainer exec --workspace-folder . -- ls /root/.config/nvim
```

预期：列出你宿主机 `~/.config/nvim/` 下的文件（如 `init.lua`）。

- [ ] **Step 6：（可选）验证 ADB，需设备已连接宿主机**

宿主机先确认：
```bash
adb devices   # 宿主机侧，应看到设备
```

容器内：
```bash
devcontainer exec --workspace-folder . -- adb devices
```

预期：与宿主机 `adb devices` 输出相同的设备列表。

- [ ] **Step 7：（可选）完整 Android 构建冒烟测试**

```bash
devcontainer exec --workspace-folder . -- flutter build apk --debug
```

预期：构建成功，输出 `Built build/app/outputs/flutter-apk/app-debug.apk`。

---

## Task 8：提交

**Files:**
- `onepass_app/.devcontainer/Dockerfile`
- `onepass_app/.devcontainer/devcontainer.json`

- [ ] **Step 1：确认无意外文件**

```bash
git status
```

应只看到 `.devcontainer/Dockerfile` 和 `.devcontainer/devcontainer.json` 为 untracked。`android/local.properties` 不应出现（已被 `.gitignore` 排除）。

- [ ] **Step 2：提交**

```bash
git add onepass_app/.devcontainer/Dockerfile onepass_app/.devcontainer/devcontainer.json
git commit -m "feat: add DevContainer CLI setup for Android development

- Ubuntu 22.04 (linux/amd64), Flutter 3.41.4, Dart 3.11.1
- Android SDK: platform-36, build-tools 35.0.0, NDK 28.2.13676358
- ADB wrapper forwards to host.docker.internal:5037
- postAttachCommand auto-generates android/local.properties
- bind-mounts ~/.config/nvim for shared Neovim config"
```

---

## 参考：日常工作流速查

```bash
# 启动/重建容器
devcontainer up --workspace-folder onepass_app

# 进入 shell（终端主入口）
devcontainer exec --workspace-folder onepass_app -- zsh

# 容器内推荐 tmux 布局
tmux new-session -s dev
# win 1: nvim .
# win 2: flutter analyze --watch
# win 3: flutter build apk --debug && adb install <apk>
# win 4: adb logcat

# macOS 构建（宿主机，另开终端）
cd onepass_app && flutter build macos

# 重建镜像（Flutter/SDK 版本升级后）
devcontainer build --workspace-folder onepass_app --no-cache
devcontainer up --workspace-folder onepass_app --remove-existing-container
```
