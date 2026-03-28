## Why

The original Flutter-based OnePass implementation requires Flutter SDK, Dart knowledge, and platform-specific native code (Kotlin/Swift). This creates a barrier for developers familiar with JavaScript/TypeScript and adds complexity to the build pipeline. By migrating to React Native with a Node.js core, we leverage a larger ecosystem, faster iteration cycles, and a more familiar tech stack while maintaining cross-platform capability (Android + macOS).

## What Changes

- **Replace Flutter/Dart with React Native/TypeScript** for cross-platform UI
- **Replace SQLCipher (Flutter plugin) with better-sqlite3 + sqlcipher** via native Node.js bindings
- **Replace pointycastle with Node.js crypto** for encryption primitives
- **Replace platform channels (Kotlin/Swift) with react-native-keychain** and **react-native-biometrics** for secure storage
- **Keep the same data model and sync protocol** - no breaking changes to vault format
- **Add devcontainer configuration** for reproducible development environment with neovim + tmux

**BREAKING**: Development environment changes from Flutter SDK to React Native CLI + Node.js

## Capabilities

### New Capabilities

- `react-native-setup`: Project structure, TypeScript configuration, and devcontainer setup for React Native development
- `vault-core`: Platform-agnostic Node.js module for encrypted storage, cryptography, and sync protocol
- `mobile-ui`: React Native screens and components for Android
- `desktop-ui`: React Native macOS screens and components
- `dev-environment`: Devcontainer + dotfiles integration for neovim + tmux workflow

### Modified Capabilities

None - this is a greenfield implementation. The Flutter codebase will remain in `docs/superpowers/plans/` as reference.

## Impact

**Affected Areas**:

- `onepass/` → New React Native project root
- `packages/vault-core/` → Shared Node.js encryption and sync logic
- `packages/mobile/` → React Native Android app
- `packages/desktop/` → React Native macOS app
- `.devcontainer/` → Development environment configuration

**Dependencies Added**:

- React Native 0.73+
- React Native macOS 0.73+
- better-sqlite3 + @journeyapps/sqlcipher
- react-native-keychain
- react-native-biometrics
- react-native-mdns (or bonjour-service for desktop)
- Express/Fastify (sync server on macOS)

**Dependencies Removed**:

- Flutter SDK
- Dart packages (riverpod, go_router, shelf, pointycastle, sqflite_sqlcipher)
- Kotlin/Swift platform channel code

**Migration Notes**:

- Vault format remains 100% compatible - existing `.onepass` exports will work
- Sync protocol unchanged - React Native Android can sync with Flutter macOS (during transition)
