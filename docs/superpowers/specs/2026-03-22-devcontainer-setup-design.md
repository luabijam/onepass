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
- Flutter SDK 3.41.4 stable（满足 `pubspec.lock` 要求 `>=3.38.4`，携带 Dart 3.11.1）
- Android SDK（cmdline-tools、platform-tools、build-tools;35.0.0、platforms;android-36、ndk;28.2.13676358）
- Neovim（tar.gz 发行版，非 AppImage）+ Tmux + ripgrep + fd + gcc
- Dart Language Server（随 Flutter SDK 附带）
- ADB 包装脚本（透明转发到宿主机 ADB Server）

**宿主机负责：**
- `flutter build macos`（macOS SDK 不可在 Linux 容器内使用）
- ADB Server + USB 设备连接（需先运行 `adb start-server`）
- Neovim 配置（`~/.config/nvim` bind-mount 进容器）

**版本来源（从宿主机 flutter 3.41.4 提取）：**

| 字段 | 值 |
|------|----|
| Flutter | 3.41.4 stable |
| Dart | 3.11.1 |
| compileSdkVersion | 36 |
| targetSdkVersion | 36 |
| minSdkVersion | 24 |
| ndkVersion | 28.2.13676358 |

---

## 3. 架构

```
宿主机 macOS
├── Docker Desktop (Linux VM)
│   └── DevContainer (ubuntu:22.04)
│       ├── Flutter SDK 3.41.4 → /opt/flutter
│       ├── Android SDK → /opt/android-sdk
│       │   ├── platform-tools/adb  ← 包装脚本
│       │   ├── build-tools;35.0.0
│       │   ├── platforms;android-36
│       │   └── ndk;28.2.13676358
│       ├── Neovim + tmux + ripgrep + fd + gcc
│       └── /workspace   ← bind-mount → onepass_app/
│
├── ADB Server (:5037)  ← 容器 adb 包装脚本通过 host.docker.internal:5037 转发
│   └── Android 真机 (USB)
│
├── 宿主机 Flutter SDK 3.41.4  ← flutter build macos
└── ~/.config/nvim              ← bind-mount → 容器 /root/.config/nvim
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

`.devcontainer/` 目录提交到 git（保证团队/重建环境一致性）。无需额外 `.gitignore` 条目。

---

## 5. Dockerfile 设计

**基础镜像：** `--platform linux/amd64 ubuntu:22.04`

在 Dockerfile `FROM` 行显式指定 `--platform linux/amd64`：Apple Silicon Mac 上 Docker Desktop 默认以 Rosetta 2 模拟运行 x86_64 容器，Neovim tarball 和 Android NDK 均下载 x86_64 版本，与此平台一致。Intel Mac 行为相同。

### 5.1 构建层次

**层 1：系统依赖**
```
curl, git, unzip, xz-utils, zip, wget
clang, cmake, ninja-build, libgtk-3-dev, pkg-config
openjdk-17-jdk（Android 构建工具要求 Java 17）
gcc, g++（Treesitter parser 编译所需）
```

**层 2：开发工具**

- **Neovim**：使用 tar.gz 发行版（非 AppImage）

  AppImage 依赖 FUSE，Docker 容器默认无 FUSE 内核模块。使用 tarball 避免此问题：
  ```
  下载 nvim-linux-x86_64.tar.gz → 解压到 /opt/nvim → 软链 /usr/local/bin/nvim
  ```

- **其他工具**：`tmux`, `zsh`, `ripgrep`, `fd-find`

**层 3：Flutter SDK 3.41.4**
```
下载 URL: https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_3.41.4-stable.tar.xz
安装路径: /opt/flutter
初始化:   flutter precache --android
```

`flutter precache --android` 在 `docker build` 阶段执行，需要构建时网络（Docker Desktop 默认允许，无需额外配置）。下载约 300 MB，完成后缓存在镜像层内，容器启动时无需重复下载。

**层 4：Android SDK**

cmdline-tools 的安装有一个关键重命名步骤：

```
1. 下载 cmdline-tools-latest-linux.zip
2. 解压：得到 cmdline-tools/ 目录
3. 创建: mkdir -p /opt/android-sdk/cmdline-tools
4. 重命名移动: mv cmdline-tools /opt/android-sdk/cmdline-tools/latest
   ↑ 此步不可省略：sdkmanager 要求路径中包含版本名称，否则报错
5. sdkmanager --licenses（自动 accept 所有 license）
6. sdkmanager 安装：
   - platform-tools
   - build-tools;35.0.0
   - platforms;android-36
   - ndk;28.2.13676358

**注：** `build-tools;35.0.0` 与 `platforms;android-36` 版本号不同是正确的。Android Gradle Plugin（此项目 AGP 8.11.1）内部管理 build-tools 版本，`compileSdk=36` 指平台 API 级别，build-tools 版本独立。AGP 8.11.1 使用 build-tools 35.x，无需安装 `build-tools;36.0.0`。
```

**层 5：ADB 包装脚本**

`ANDROID_ADB_SERVER_ADDRESS` 在部分 adb 版本中不被识别，不可靠。改用包装脚本：

```bash
# 将真实 adb 重命名
mv /opt/android-sdk/platform-tools/adb \
   /opt/android-sdk/platform-tools/adb.real

# 创建包装脚本，硬编码 -H 和 -P
cat > /opt/android-sdk/platform-tools/adb <<'EOF'
#!/bin/bash
exec /opt/android-sdk/platform-tools/adb.real \
  -H host.docker.internal -P 5037 "$@"
EOF
chmod +x /opt/android-sdk/platform-tools/adb
```

Flutter 内部调用 adb 时走 `ANDROID_HOME/platform-tools/adb`，因此包装脚本对 flutter 命令同样透明生效。

### 5.2 环境变量（Dockerfile ENV）

```dockerfile
ENV FLUTTER_HOME=/opt/flutter \
    ANDROID_HOME=/opt/android-sdk \
    ANDROID_SDK_ROOT=/opt/android-sdk \
    JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 \
    PATH=/opt/flutter/bin:/opt/android-sdk/platform-tools:/opt/android-sdk/cmdline-tools/latest/bin:$PATH
```

PATH 值为单一连续字符串（无换行），以避免 Dockerfile ENV 指令中字符串延续语法的歧义。

---

## 6. devcontainer.json 设计

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

**mount 说明：**

| 挂载 | 说明 |
|------|------|
| `~/.config/nvim` | nvim 配置（init.lua 等），bind-mount 实时同步 |
| `~/.local/share/nvim` | **不挂载**（见下方说明） |

**为何不挂载 `~/.local/share/nvim`：**

该目录包含 Treesitter parser 的编译产物（macOS 为 `.dylib`，Linux 为 `.so`）。将 macOS 二进制挂载到 Linux 容器会导致加载失败。nvim-treesitter 会在容器内自动重编译，Dockerfile 已安装 `gcc` 支持此操作。插件数据首次启动时重建，后续容器重启不受影响（数据保存在容器层）。

**`postAttachCommand` 说明：**

1. **生成 `local.properties`**：`android/local.properties` 被 `.gitignore` 排除，不随代码库携带。`settings.gradle.kts` 在 Gradle 配置阶段硬要求 `flutter.sdk` 存在，否则抛出异常。每次 attach 时写入容器内的正确路径（`/opt/flutter` 和 `/opt/android-sdk`），确保 `flutter build apk` 时 Gradle 可正确定位 Flutter SDK。

2. **`flutter pub get`**：同步 Dart 依赖。

3. **`adb.real ... devices || true`**：验证宿主机 ADB Server 可达。`|| true` 确保未连接设备时命令失败不影响容器 attach（ADB 检查是辅助诊断，非开发前提）。

**`remoteUser: root` 说明：**

选择 root 简化权限配置（个人开发项目）。注意：在容器内创建的文件（如 build 产物）在 macOS 宿主机侧所有者为 root，但 Docker Desktop 通过其 VM 层屏蔽了此差异，实际使用无影响。

---

## 7. ADB 转发机制

**原理：** Docker Desktop 在宿主机注入 `host.docker.internal` 指向宿主机 IP。容器内的 adb 包装脚本通过 `-H host.docker.internal -P 5037` 连接宿主机的 ADB Server，USB 设备对容器完全透明。

**前提条件（宿主机）：**
1. Android 手机以 USB 调试模式连接 Mac
2. 宿主机运行 `adb start-server`（插入设备后自动触发）
3. `adb devices` 在宿主机侧可见设备

**验证：** 容器内执行 `adb devices`，应显示与宿主机相同的设备列表。

---

## 8. 日常工作流

### 启动/重建容器
```bash
cd onepass_app
devcontainer up --workspace-folder .          # 首次或重建后启动
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
- `~/.local/share/nvim` 挂载（避免跨平台 Treesitter 二进制冲突）
