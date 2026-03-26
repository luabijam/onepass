## 1. Project Setup and Devcontainer

- [x] 1.1 Create monorepo structure with pnpm workspace
- [x] 1.2 Configure root package.json with shared dev dependencies (TypeScript, ESLint, Prettier, Jest)
- [x] 1.3 Create tsconfig.base.json with strict settings
- [x] 1.4 Create .devcontainer/devcontainer.json with Node.js 20, pnpm, and Android SDK
- [x] 1.5 Add dotfiles integration to devcontainer configuration
- [x] 1.6 Configure git hooks with lint-staged and husky
- [x] 1.7 Add VS Code settings and recommended extensions

## 2. Vault Core Package

- [x] 2.1 Create packages/vault-core with package.json and tsconfig.json
- [x] 2.2 Implement src/crypto.ts with deriveKey, computeSyncToken, generateSalt functions
- [x] 2.3 Implement src/database/schema.ts with SQL DDL constants
- [x] 2.4 Implement src/database/vault.ts with VaultService class (open, close, CRUD methods)
- [x] 2.5 Implement src/models/entry.ts and src/models/category.ts with TypeScript interfaces
- [x] 2.6 Implement src/sync/merge.ts with mergeEntries and mergeCategories functions
- [x] 2.7 Implement src/sync/protocol.ts with SyncPayload and SyncResponse types
- [x] 2.8 Implement src/export/crypto.ts with AES-256-GCM encryption/decryption
- [x] 2.9 Implement src/export/service.ts with export and import functions
- [x] 2.10 Write unit tests for crypto functions (Jest)
- [x] 2.11 Write unit tests for database operations (in-memory SQLite)
- [x] 2.12 Write unit tests for sync merge logic

## 3. Mobile App (React Native Android)

- [x] 3.1 Initialize React Native project in packages/mobile with TypeScript template
- [x] 3.2 Configure react-native-keychain for secure storage
- [x] 3.3 Configure react-native-biometrics for fingerprint/face unlock
- [x] 3.4 Install and configure react-native-vector-icons
- [x] 3.5 Set up Zustand stores (vault, auth, sync)
- [x] 3.6 Implement src/screens/unlock/UnlockScreen.tsx
- [x] 3.7 Implement src/screens/entries/EntryListScreen.tsx
- [x] 3.8 Implement src/screens/entries/EntryDetailScreen.tsx
- [x] 3.9 Implement src/screens/entries/EntryFormScreen.tsx
- [x] 3.10 Implement src/components/PasswordGenerator.tsx
- [x] 3.11 Implement src/screens/categories/CategoryListScreen.tsx
- [x] 3.12 Implement src/screens/categories/CategoryFormScreen.tsx
- [x] 3.13 Implement src/screens/settings/SettingsScreen.tsx
- [x] 3.14 Implement src/screens/settings/SyncSettingsScreen.tsx
- [x] 3.15 Implement src/screens/settings/ImportExportScreen.tsx
- [x] 3.16 Implement src/navigation/AppNavigator.tsx with React Navigation
- [x] 3.17 Implement dark theme and apply globally
- [x] 3.18 Write widget tests for key screens (React Native Testing Library)

## 4. Desktop App (React Native macOS)

- [x] 4.1 Initialize React Native macOS project in packages/desktop
- [x] 4.2 Configure react-native-macos dependencies
- [x] 4.3 Implement keychain integration using keytar
- [x] 4.4 Implement Touch ID / Face ID integration for macOS
- [x] 4.5 Implement three-column layout component
- [x] 4.6 Implement sync server with Express (src/sync/server.ts)
- [x] 4.7 Implement mDNS advertisement with bonjour-service
- [x] 4.8 Implement GET /sync endpoint (return entries since timestamp)
- [x] 4.9 Implement POST /sync endpoint (merge incoming changes)
- [x] 4.10 Implement Bearer token authentication middleware
- [x] 4.11 Implement menu bar and keyboard shortcuts
- [x] 4.12 Implement system tray / Dock integration
- [ ] 4.13 Implement light/dark mode adaptation
- [ ] 4.14 Reuse mobile screens adapted for desktop layout
- [ ] 4.15 Write integration tests for sync server

## 5. Mobile Sync Client

- [ ] 5.1 Implement mDNS discovery for finding desktop server
- [ ] 5.2 Implement sync client with axios (GET and POST)
- [ ] 5.3 Implement bidirectional sync flow (pull then push)
- [ ] 5.4 Handle sync conflicts and errors gracefully
- [ ] 5.5 Store last sync timestamp for incremental sync
- [ ] 5.6 Show sync status in UI (syncing, success, error)

## 6. Cross-Package Integration

- [ ] 6.1 Wire vault-core into mobile app
- [ ] 6.2 Wire vault-core into desktop app
- [ ] 6.3 Ensure vault format compatibility (test import/export between platforms)
- [ ] 6.4 Test sync between mobile and desktop
- [ ] 6.5 Verify biometric unlock works on both platforms

## 7. Build and Deployment

- [ ] 7.1 Configure Android build (release APK)
- [ ] 7.2 Configure macOS build (release .app bundle)
- [ ] 7.3 Set up code signing for Android
- [ ] 7.4 Set up code signing for macOS (Developer ID)
- [ ] 7.5 Create build scripts in root package.json

## 8. Documentation and Finalization

- [ ] 8.1 Write README.md with setup instructions
- [ ] 8.2 Document devcontainer setup for new developers
- [ ] 8.3 Document vault format for future reference
- [ ] 8.4 Document sync protocol for future reference
- [ ] 8.5 Add MIT LICENSE file
