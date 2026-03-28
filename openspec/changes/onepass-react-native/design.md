## Context

OnePass is a personal password manager with local-only encrypted storage and LAN sync. The original implementation uses Flutter/Dart targeting Android and macOS. This design proposes a React Native/TypeScript rewrite while preserving:

1. **Vault format compatibility** - AES-256-GCM encrypted SQLite with identical schema
2. **Sync protocol** - HTTP + mDNS bidirectional sync unchanged
3. **Security model** - PBKDF2 key derivation, Keychain/Keystore for biometric unlock

The rewrite targets developers more comfortable with JavaScript/TypeScript ecosystem and reduces native code complexity.

## Goals / Non-Goals

**Goals:**

- Implement full OnePass feature parity using React Native + Node.js
- Create a shared `vault-core` package usable by both mobile and desktop apps
- Set up devcontainer with neovim + tmux for reproducible development
- Maintain 100% vault format and sync protocol compatibility
- Reduce native code to minimum (only keychain/biometrics/mDNS)

**Non-Goals:**

- iOS support (can be added later but out of initial scope)
- Cloud sync (keeping LAN-only as per original design)
- Web app (React Native targets native platforms only)
- Breaking vault format changes

## Decisions

### 1. Monorepo Structure

**Decision**: Use a pnpm workspace monorepo with three packages.

```
onepass/
├── packages/
│   ├── vault-core/     # Shared Node.js crypto + sync logic
│   ├── mobile/         # React Native Android app
│   └── desktop/        # React Native macOS app
├── .devcontainer/
├── pnpm-workspace.yaml
└── package.json
```

**Rationale**:

- Shared `vault-core` eliminates code duplication between platforms
- Each app can have platform-specific dependencies (react-native-keychain vs keytar)
- pnpm workspaces are fast and handle native modules well

**Alternatives Considered**:

- Single React Native project: Won't work - macOS requires separate react-native-macos
- Turborepo: Overkill for 3 packages, pnpm workspaces sufficient

### 2. Encrypted Database Layer

**Decision**: Use `better-sqlite3` with `@journeyapps/sqlcipher` extension.

```typescript
// vault-core/src/database.ts
import Database from 'better-sqlite3';
import sqlcipher from '@journeyapps/sqlcipher';

sqlcipher(Database);
const db = new Database('onepass.db');
db.pragma(`key = "x'${hexKey}'"`);
```

**Rationale**:

- `better-sqlite3` is synchronous, fast, and well-maintained
- `@journeyapps/sqlcipher` provides SQLCipher bindings for Node.js
- Same SQLCipher format as Flutter implementation (compatible)

**Alternatives Considered**:

- `sql.js`: WebAssembly, slower, memory-only
- `react-native-quick-sqlite`: Mobile-specific, no desktop support
- Keep Flutter SQLCipher: Would require separate native module anyway

### 3. Cryptography

**Decision**: Use Node.js built-in `crypto` module.

```typescript
// vault-core/src/crypto.ts
import { createHash, pbkdf2Sync, randomBytes } from 'crypto';

export function deriveKey(password: string, salt: Buffer): Buffer {
  return pbkdf2Sync(password, salt, 100000, 32, 'sha256');
}

export function computeSyncToken(key: Buffer): Buffer {
  return createHash('sha256').update(key).update('onepass-sync-token').digest();
}
```

**Rationale**:

- Node.js `crypto` is native, fast, and well-tested
- No external dependencies needed
- PBKDF2, AES-GCM, HMAC all available

**Alternatives Considered**:

- `tweetnacl`: Pure JS, slower
- `libsodium.js`: More features but larger dependency

### 4. Secure Storage & Biometrics

**Decision**: Platform-specific packages with shared interface.

```
vault-core/src/keychain/
├── index.ts           # Shared interface
├── mobile.ts          # react-native-keychain + react-native-biometrics
└── desktop.ts         # keytar (macOS Keychain)
```

**Rationale**:

- `react-native-keychain`: Secure storage for React Native
- `react-native-biometrics`: Biometric prompt integration
- `keytar`: Node.js Keychain integration for macOS
- Shared interface allows vault-core to abstract platform differences

**Alternatives Considered**:

- Expo secure store: Expo-specific, not for bare React Native
- Custom native modules: More maintenance burden

### 5. LAN Sync Architecture

**Decision**:

- **macOS desktop**: Run HTTP server (Express/Fastify) + mDNS advertisement (bonjour-service)
- **Android mobile**: mDNS discovery + HTTP client (axios)

```typescript
// desktop/src/sync/server.ts
import express from 'express';
import bonjour from 'bonjour-service';

const app = express();
// ... sync endpoints

const service = bonjour.publish({
  name: 'OnePass',
  type: 'onepass',
  port: 47200,
});
```

**Rationale**:

- Same protocol as Flutter implementation
- `bonjour-service` is a pure JS mDNS library (no native deps for macOS)
- Express is familiar and well-documented

**Alternatives Considered**:

- `multicast-dns`: Lower-level, more manual work
- React Native mDNS module: Would need custom native module

### 6. State Management

**Decision**: Use Zustand with React Query for async state.

```typescript
// mobile/src/stores/vault.ts
import { create } from 'zustand';

interface VaultState {
  entries: Entry[];
  isUnlocked: boolean;
  unlock: (password: string) => Promise<void>;
  // ...
}

export const useVaultStore = create<VaultState>((set, get) => ({
  // ...
}));
```

**Rationale**:

- Zustand is simple, no boilerplate, TypeScript-first
- React Query handles async state (entries, sync status) well
- Less complexity than Redux or MobX

**Alternatives Considered**:

- Redux Toolkit: More boilerplate, overkill
- Jotai: Good but less ecosystem
- React Context only: Doesn't scale well

### 7. Development Environment

**Decision**: Devcontainer with:

- Node.js 20 LTS
- pnpm
- Android SDK (command-line tools)
- Xcode command-line tools (for macOS development)
- neovim + tmux via dotfiles

```json
// .devcontainer/devcontainer.json
{
  "image": "mcr.microsoft.com/devcontainers/base:ubuntu-22.04",
  "features": {
    "ghcr.io/devcontainers/features/node:1": { "version": "20" },
    "ghcr.io/devcontainers/features/android:1": {}
  },
  "postCreateCommand": "pnpm install",
  "dotfiles": {
    "repository": "<user's dotfiles repo>",
    "installPath": "~/dotfiles"
  }
}
```

**Rationale**:

- Devcontainer ensures reproducible environment
- User has existing dotfiles for neovim + tmux
- Android SDK for mobile development
- No need for full Xcode (command-line tools sufficient for React Native macOS)

**Alternatives Considered**:

- Full Xcode in devcontainer: Not possible (macOS only)
- Local development only: Harder to reproduce across machines

## Risks / Trade-offs

### Risk: SQLCipher compilation on different platforms

**Mitigation**: Use `@journeyapps/sqlcipher` which provides prebuilt binaries for major platforms. Test in devcontainer early.

### Risk: React Native macOS maturity

**Mitigation**: React Native macOS is maintained by Microsoft and used in production (e.g., Office apps). Start with minimal features and test early.

### Risk: Biometric authentication differences

**Mitigation**: Abstract behind shared interface in `vault-core`. Test on real devices early.

### Trade-off: Synchronous DB (better-sqlite3) vs async

**Choice**: Synchronous - simpler code, better performance for local DB
**Cost**: Blocks main thread on heavy operations - acceptable for local-only app

### Trade-off: Monorepo complexity vs separate repos

**Choice**: Monorepo - shared code is valuable
**Cost**: Slightly more complex build, but pnpm handles it well

## Open Questions

1. **Testing strategy**: Should we use Jest + React Native Testing Library, or Detox for E2E?
   - _Decision_: Jest + RNTL for unit/widget tests, Detox deferred to later if needed

2. **React Native CLI vs Expo**: Expo would simplify some things but adds constraints.
   - _Decision_: React Native CLI for full control, especially for mDNS and SQLCipher

3. **CI/CD**: GitHub Actions for builds?
   - _Decision_: Yes, but out of initial scope - can be added after core implementation
