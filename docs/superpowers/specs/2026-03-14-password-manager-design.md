# OnePass 密码管理 App 设计文档

**日期：** 2026-03-14
**平台：** Android + macOS
**技术栈：** Flutter (Dart)

---

## 1. 项目概述

一款个人使用的密码管理 app，支持 Android 手机和 Mac 电脑，界面风格参考 1Password。数据完全本地化，通过局域网在两端之间同步，不依赖任何云服务。

**目标用户：** 个人使用，单一用户
**核心价值：** 安全、私密、跨设备可用

---

## 2. 功能范围（基础版）

### 包含功能
- 密码条目管理：创建、查看、编辑、删除（软删除）
- 条目字段：自定义名称、用户名、密码、网址（可选）、备注（可选）
- 分类管理：自定义分类（名称、emoji 图标、颜色）
- 收藏标记
- 全文搜索
- 密码生成器（长度、大小写、数字、特殊符号可配置，至少一类字符必须启用）
- 主密码解锁 + 生物识别（指纹 / Touch ID）
- 局域网同步（Mac 作主端，Android 作客户端）
- 导入 / 导出（加密 JSON 格式，详见第 6 节）

### 不包含功能
- TOTP 两步验证
- 文件附件
- 密码健康检查
- 自动填充
- 多用户 / 共享密码库
- 云同步

---

## 3. 架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    共享 Flutter 代码                      │
│  UI 层 / 业务逻辑 / Vault 层 / Crypto 层 / 数据模型        │
└──────────────┬──────────────────────┬───────────────────┘
               │                      │
    ┌──────────▼──────────┐  ┌────────▼────────────┐
    │    macOS App         │  │   Android App        │
    │  ┌───────────────┐  │  │  ┌───────────────┐  │
    │  │ SQLite 加密库  │  │  │  │ SQLite 加密库  │  │
    │  │ (SQLCipher)   │  │  │  │ (SQLCipher)   │  │
    │  └───────────────┘  │  │  └───────────────┘  │
    │  ┌───────────────┐  │  │  ┌───────────────┐  │
    │  │ HTTP 同步服务  │◄─┼──┼──│ 同步客户端     │  │
    │  │ (shelf 包)    │  │  │  │ mDNS 发现     │  │
    │  └───────────────┘  │  │  └───────────────┘  │
    └─────────────────────┘  └─────────────────────┘
              局域网（同一 WiFi）
```

### 核心组件及边界

| 组件 | 职责 | 接口 | 技术 |
|------|------|------|------|
| Crypto 层 | 密钥派生（PBKDF2）、提供 SQLCipher 所需的原始密钥字节 | `deriveKey(password, salt) → Uint8List` | `pointycastle` |
| Vault 层 | 接收来自 Crypto 层的密钥字节，用其初始化 SQLCipher，执行 Entry/Category CRUD | `open(keyBytes)`, `getEntries()`, `upsertEntry()` 等 | `sqflite_sqlcipher` |
| Auth 层 | 主密码验证、生物识别、将密钥存入/取出系统安全区域 | `unlock(password)`, `unlockWithBiometric()`, `storeKey(keyBytes)`, `loadKey()` | `local_auth`, Keystore/Keychain |
| Sync Server | 局域网 HTTP 服务（Mac 专属），mDNS 广播，处理同步请求 | HTTP endpoints（见第 6 节） | `shelf`, `shelf_router`, `multicast_dns` |
| Sync Client | mDNS 发现 Mac，触发双向增量同步（Android 专属） | `sync(sinceTs) → void` | `multicast_dns`, `http` |
| UI 层 | 跨平台界面，通过 Riverpod 访问 Vault 层 | — | Flutter Widgets, `go_router`, `riverpod` |

**层间数据流：**

```
用户输入主密码
    │
Auth 层 → Crypto 层（派生 keyBytes）
    │
Vault 层（用 keyBytes 初始化 SQLCipher，持有已解锁数据库连接）
    │
UI 层 / Sync 层（通过 Vault 层接口读写数据）
```

解锁后，keyBytes 仅在内存中，由 Vault 层持有；Sync 层通过 Vault 层接口操作数据，不直接接触密钥。

---

## 4. 数据模型

### Entry（密码条目）

```dart
class Entry {
  String id;           // UUID
  String title;        // 用户自定义名称，如 "Google 工作"
  String username;     // 用户名 / 邮箱
  String password;     // 明文存储于 SQLCipher 加密数据库中
  String? url;         // 网址（可选）
  String? notes;       // 备注（可选）
  String categoryId;   // 所属分类 ID（"uncategorized" 为默认值）
  bool isFavorite;     // 是否收藏
  DateTime createdAt;
  DateTime updatedAt;  // 用于增量同步，使用服务端时间（见第 6 节）
  DateTime? deletedAt; // 软删除时间；非 null 时条目视为已删除
}
```

### Category（分类）

```dart
class Category {
  String id;           // UUID
  String name;         // 分类名称
  String icon;         // emoji 图标
  String color;        // 颜色十六进制值，如 "#0A84FF"
  DateTime updatedAt;  // 用于同步
  DateTime? deletedAt; // 软删除
}
```

**关于多账号处理：** 同一服务的多个账号通过自定义 `title` 区分（如"Google 工作"、"Google 个人"），不做自动分组，与 1Password 保持一致。

**默认分类：** 系统内置一个 id 为 `"uncategorized"` 的默认分类，不可删除，用于未分类条目。

---

## 5. 安全模型

### 密钥派生与组件边界

```
主密码（用户输入）+ 随机 salt（首次设置时生成，存于本地明文）
    │
    ▼  Crypto 层
PBKDF2（100,000 次迭代，SHA-256）
    │
    ▼
256-bit keyBytes（Uint8List）
    │
    ├──► Vault 层：作为 SQLCipher 的数据库加密密钥
    │
    └──► Auth 层：存入系统安全区域（仅用于生物识别快捷解锁）
           ├── Android: Android Keystore（AES-256-GCM 包装）
           └── macOS:   Keychain（kSecAttrAccessibleWhenUnlockedThisDeviceOnly）
```

### 同步鉴权 Token 派生

Android 向 Mac 发送同步请求时，需在 HTTP Header 中携带 Bearer token：

```
token = HMAC-SHA256(key=keyBytes, message="onepass-sync-token")
编码为 Base64，放入 Authorization: Bearer <token>
```

Mac 同步服务启动时，用本地 keyBytes 预计算同一 token，收到请求后做字符串比较验证。token 不含时间戳，依赖局域网环境的信任假设；token 在每次解锁时重新计算，不持久化。

### 生物识别解锁流程

1. 用户触发生物识别（指纹 / Touch ID）
2. `local_auth` 验证通过后，Auth 层从 Keystore/Keychain 取出 keyBytes
3. Vault 层用 keyBytes 打开 SQLCipher 数据库
4. 主密码不存储，忘记主密码即无法恢复数据（设计如此）

### 冲突解决中的删除优先原则

当同一条目在一端被编辑、在另一端被删除时：**删除优先**。即若任一端的 `deletedAt` 非 null，则视该条目为已删除，不论另一端的 `updatedAt` 是否更新。

---

## 6. 同步协议

### 设备发现

- Mac 通过 mDNS 广播服务（服务名：`_onepass._tcp`，固定端口 **47200**）
- Android 通过 `multicast_dns` 监听并自动发现 Mac 的 IP 地址
- Mac HTTP 服务仅绑定局域网 IP（不绑定 `0.0.0.0`），不对外网暴露

### 增量同步流程（双向）

Android 主动发起同步，分两步完成双向交换。同步使用**服务端时间**（Mac 的 `serverTs`）作为下次同步的 `since` 基准，避免设备时钟偏差导致遗漏。

```
Android                              Mac (HTTP Server, port 47200)
  │                                        │
  │  Authorization: Bearer <token>         │
  │── GET /sync?since=<lastSyncTs> ───────►│
  │                                        │ 返回 Mac 端所有 updatedAt > since
  │                                        │ 的 Entry 和 Category（含软删除）
  │◄── {                                   │
  │      entries: [...],                   │
  │      categories: [...],                │
  │      serverTs: <Mac当前时间戳>          │
  │    } ─────────────────────────────────│
  │                                        │
  │  Android 将收到的变更写入本地数据库      │
  │  （删除优先：deletedAt 非 null 则删除） │
  │                                        │
  │  Authorization: Bearer <token>         │
  │── POST /sync {                         │
  │     entries: [...],   // Android 的本地变更（updatedAt > lastSyncTs）
  │     categories: [...]                  │
  │   } ──────────────────────────────────►│
  │                                        │ Mac 将收到的变更写入本地数据库
  │◄── { ok: true } ──────────────────────│
  │                                        │
  │  Android 保存 serverTs 作为下次同步基准 │
```

**同步触发方式：** Android 打开 app 时自动同步一次；设置页提供手动同步按钮；Mac 不主动推送（Android 是唯一发起方）。

**Token 验证失败：** 服务端返回 HTTP 401，客户端显示"同步鉴权失败，请确认两端使用相同主密码"。

---

## 7. 导入 / 导出

### 格式：加密 JSON

导出文件为 `.onepass` 扩展名，内容为 JSON，用主密码派生的密钥加密（AES-256-GCM）：

```json
{
  "version": 1,
  "salt": "<base64-encoded PBKDF2 salt>",
  "iv":   "<base64-encoded AES-GCM nonce>",
  "data": "<base64-encoded encrypted JSON payload>"
}
```

解密后的 `payload` 结构：

```json
{
  "entries":    [ /* Entry 对象数组，含所有字段 */ ],
  "categories": [ /* Category 对象数组 */ ]
}
```

- **导出：** 用当前主密码加密整个 Vault，保存为 `.onepass` 文件
- **导入：** 输入导出时的主密码解密，将条目合并（以 `updatedAt` 为准）到当前 Vault

---

## 8. UI 设计

### macOS — 三栏布局

```
┌──────────────┬───────────────────┬──────────────────────────┐
│  左侧栏       │    列表区          │      详情区               │
│  (160px)     │    (200px)        │      (剩余宽度)           │
│              │                   │                          │
│  密码库       │  🔍 搜索框         │  [图标] Google 工作       │
│  ├ 全部       │  ─────────────── │  分类: 社交媒体            │
│  ├ 收藏       │  Google 工作      │                          │
│  └ 已删除     │  work@gmail.com   │  用户名  [复制]           │
│              │  Google 个人       │  密码    [显示] [复制]    │
│  分类         │  personal@...     │  网址                    │
│  ├ 社交媒体   │  GitHub           │  备注                    │
│  ├ 金融       │  Apple ID         │                          │
│  └ 工作       │  支付宝           │              [编辑] [删除]│
└──────────────┴───────────────────┴──────────────────────────┘
```

### Android — 单栏布局

- **列表页**：顶部搜索栏 + 条目列表 + 底部导航栏（密码 / 分类 / 设置）
- **详情页**：返回按钮 + 条目信息 + 复制按钮
- **新建/编辑页**：表单 + 密码生成器入口

### 视觉规范

- 主题：深色（Dark）为主，与 1Password 风格一致
- 主色调：蓝色（`#0A84FF`）
- 背景：`#1C1C1E`（主）、`#2C2C2E`（次）、`#3A3A3C`（边框/输入）
- 字体：系统字体（macOS: SF Pro，Android: Roboto）

---

## 9. 页面结构

```
解锁页（启动入口）
    │ 验证成功
    ▼
密码列表（主界面）
    ├── 点击条目 ──► 条目详情 ──► 编辑条目 ──► 密码生成器
    ├── 点击 + ──────────────► 新建条目 ──► 密码生成器
    └── 点击设置 ─────────────► 设置页
                                  ├── 修改主密码
                                  ├── 管理分类
                                  ├── 同步状态 / 手动同步
                                  └── 导入 / 导出
```

### 密码生成器参数

- 长度：8–64 位（默认 16）
- 选项：大写字母、小写字母、数字、特殊符号（各自可开关，至少启用一类）
- 生成结果一键填入当前编辑的密码字段

---

## 10. 技术依赖（Flutter 包）

| 功能 | 选定包 |
|------|--------|
| 加密数据库 | `sqflite_sqlcipher` |
| 生物识别 | `local_auth` |
| HTTP 服务（Mac）| `shelf` + `shelf_router` |
| mDNS 发现 | `multicast_dns` |
| 状态管理 | `riverpod` |
| 路由 | `go_router` |
| UUID | `uuid` |
| 密码学（PBKDF2/HMAC）| `pointycastle` |
| HTTP 客户端 | `http` |

---

## 11. 测试策略

- **单元测试**：Crypto 层（密钥派生、HMAC token 计算）、同步冲突/删除优先逻辑、密码生成器（边界：全关时报错）
- **集成测试**：Vault 层 CRUD 操作、同步协议双向完整流程（含 401 错误情况）
- **Widget 测试**：核心 UI 组件（列表、详情、表单、密码生成器弹窗）
- **平台测试**：在真实 Android 设备和 macOS 上验证生物识别和局域网同步
