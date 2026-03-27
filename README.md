# OnePass

A cross-platform, open-source password manager built with React Native for Android and macOS. Features end-to-end encryption, local-first storage, and LAN-based sync between devices.

## Features

- **Cross-Platform**: Native apps for Android and macOS
- **End-to-End Encryption**: AES-256-GCM encryption with PBKDF2 key derivation
- **Local-First**: Your data stays on your devices
- **LAN Sync**: Sync between devices over local network (no cloud required)
- **Biometric Unlock**: Fingerprint/Face ID on mobile, Touch ID on macOS
- **Password Generator**: Built-in secure password generator
- **Categories**: Organize entries with custom categories
- **Import/Export**: Encrypted backup and restore

## Prerequisites

- **Node.js** 20.0.0 or higher
- **pnpm** 8.0.0 or higher
- **Android Studio** (for Android development)
  - Android SDK 34+
  - Android NDK (for native modules)
- **Xcode** 15+ (for macOS development, macOS only)
- **CocoaPods** (macOS only)

## Quick Start

### Option 1: Devcontainer (Recommended)

The easiest way to get started is using the devcontainer, which provides a complete development environment.

**Requirements:**

- Docker Desktop
- VS Code with Dev Containers extension

**Steps:**

```bash
# In VS Code:
# 1. Open the project folder
# 2. Press Cmd/Ctrl + Shift + P
# 3. Select "Dev Containers: Reopen in Container"

# Or via CLI:
devcontainer open .
```

The container includes:

- Node.js 20
- pnpm
- Android SDK
- neovim, tmux, ripgrep, fd-find

### Option 2: Local Development

```bash
# Clone the repository
git clone <repository-url>
cd onepass

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

## Development

### Project Structure

```
onepass/
├── packages/
│   ├── vault-core/     # Core encryption, database, and sync logic
│   ├── mobile/         # React Native Android app
│   └── desktop/        # React Native macOS app
├── .devcontainer/      # Devcontainer configuration
├── openspec/           # Change management and specs
└── docs/               # Documentation
```

### Available Commands

| Command           | Description                  |
| ----------------- | ---------------------------- |
| `pnpm install`    | Install all dependencies     |
| `pnpm build`      | Build all packages           |
| `pnpm test`       | Run all tests                |
| `pnpm test:vault` | Run vault-core tests only    |
| `pnpm lint`       | Run ESLint                   |
| `pnpm lint:fix`   | Fix ESLint issues            |
| `pnpm format`     | Format code with Prettier    |
| `pnpm typecheck`  | Run TypeScript type checking |
| `pnpm clean`      | Clean all build artifacts    |

### Mobile App (Android)

```bash
# Start Metro bundler
pnpm dev:mobile

# In another terminal, run on Android
pnpm android

# Build debug APK
pnpm build:android:debug

# Build release APK
pnpm build:android
```

### Desktop App (macOS)

```bash
# Install CocoaPods dependencies (first time only)
cd packages/desktop/macos && pod install && cd ../../..

# Start development
pnpm dev:desktop

# In another terminal, run on macOS
pnpm macos

# Build release app
pnpm build:macos:release
```

### Vault Core Package

```bash
# Development mode with watch
pnpm dev:vault

# Run tests
pnpm test:vault

# Type check
cd packages/vault-core && pnpm typecheck
```

## Architecture

### Encryption

- **Algorithm**: AES-256-GCM for authenticated encryption
- **Key Derivation**: PBKDF2 with SHA-256, 100,000 iterations
- **Salt**: Random 16-byte salt per vault

### Database

- **Engine**: SQLite via sql.js (in-memory with persistence)
- **Schema**: Entries, categories, and metadata tables
- **Format**: Encrypted binary blob stored on disk

### Sync Protocol

The sync system allows devices to synchronize vaults over the local network:

1. **Discovery**: Desktop app advertises via mDNS (Bonjour)
2. **Connection**: Mobile app discovers and connects over HTTP
3. **Protocol**: REST API with bearer token authentication
4. **Merge**: CRDT-inspired merge for conflict resolution

#### Sync Endpoints

| Endpoint | Method | Description                          |
| -------- | ------ | ------------------------------------ |
| `/sync`  | GET    | Get entries modified since timestamp |
| `/sync`  | POST   | Push local changes and merge         |
| `/auth`  | POST   | Authenticate and get token           |

### Storage

- **Android**: Android Keystore via react-native-keychain
- **macOS**: macOS Keychain via keytar

## Configuration

### TypeScript

The project uses strict TypeScript configuration. See `tsconfig.base.json` for shared settings.

### Code Style

- ESLint for linting
- Prettier for formatting
- Pre-commit hooks via husky and lint-staged

## Testing

```bash
# Run all tests
pnpm test

# Run vault-core tests with watch mode
cd packages/vault-core && pnpm test:watch
```

## Building for Production

### Android

```bash
# Build release APK
pnpm build:android

# Output: packages/mobile/android/app/build/outputs/apk/release/app-release.apk
```

See `packages/mobile/android/SIGNING.md` for code signing configuration.

### macOS

```bash
# Build release app
pnpm build:macos:release

# Sign and notarize (requires Apple Developer certificate)
pnpm macos:distribute
```

## Troubleshooting

### Metro Bundler Issues

```bash
# Clear Metro cache
pnpm --filter @onepass/mobile start -- --reset-cache

# Or for desktop
pnpm --filter @onepass/desktop start -- --reset-cache
```

### Android Build Issues

```bash
# Clean Android build
cd packages/mobile && pnpm android:clean
```

### macOS CocoaPods Issues

```bash
# Reinstall pods
cd packages/desktop/macos
pod deintegrate
pod install
```

### Node Modules Issues

```bash
# Clean and reinstall
pnpm clean
rm -rf node_modules
pnpm install
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`pnpm test && pnpm lint`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Security

If you discover a security vulnerability, please email security@example.com instead of opening an issue.

## License

MIT License - see [LICENSE](LICENSE) for details.
