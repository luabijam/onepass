# Vault Format Specification

This document describes the OnePass vault format for future reference and cross-platform compatibility.

## Overview

The vault uses three main storage formats:

1. **SQLite Database** - Primary storage for entries and categories
2. **Export Format** - Encrypted `.onepass` file for backup/transfer
3. **Sync Protocol** - JSON payload for cross-device synchronization

## Cryptographic Parameters

### Key Derivation

| Parameter   | Value               |
| ----------- | ------------------- |
| Algorithm   | PBKDF2-SHA256       |
| Iterations  | 100,000             |
| Key Length  | 32 bytes (256 bits) |
| Salt Length | 16 bytes (128 bits) |

The master password is derived into an encryption key using PBKDF2 with a random salt stored in `salt.bin`.

### Encryption

| Parameter       | Value               |
| --------------- | ------------------- |
| Algorithm       | AES-256-GCM         |
| IV Length       | 12 bytes (96 bits)  |
| Auth Tag Length | 16 bytes (128 bits) |

All encryption uses AES-256-GCM for authenticated encryption, providing both confidentiality and integrity.

## SQLite Database Schema

### Schema Version

Current version: `1`

Stored in `schema_version` table with a single row.

### Entries Table

```sql
CREATE TABLE entries (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  username    TEXT NOT NULL,
  password    TEXT NOT NULL,
  url         TEXT,
  notes       TEXT,
  category_id TEXT NOT NULL DEFAULT 'uncategorized',
  is_favorite INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  deleted_at  TEXT
);

CREATE INDEX idx_entries_updated_at ON entries (updated_at);
```

**Column Types:**

| Column        | Type    | Description                                     |
| ------------- | ------- | ----------------------------------------------- |
| `id`          | TEXT    | UUID v4                                         |
| `title`       | TEXT    | Entry title                                     |
| `username`    | TEXT    | Login username                                  |
| `password`    | TEXT    | Login password (encrypted at rest by SQLCipher) |
| `url`         | TEXT    | Optional website URL                            |
| `notes`       | TEXT    | Optional free-form notes                        |
| `category_id` | TEXT    | Foreign key to categories.id                    |
| `is_favorite` | INTEGER | Boolean (0=false, 1=true)                       |
| `created_at`  | TEXT    | ISO 8601 timestamp                              |
| `updated_at`  | TEXT    | ISO 8601 timestamp                              |
| `deleted_at`  | TEXT    | ISO 8601 timestamp or NULL for soft-delete      |

### Categories Table

```sql
CREATE TABLE categories (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  icon       TEXT NOT NULL,
  color      TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX idx_categories_updated_at ON categories (updated_at);
```

**Column Types:**

| Column       | Type | Description                                |
| ------------ | ---- | ------------------------------------------ |
| `id`         | TEXT | UUID v4 or "uncategorized" for default     |
| `name`       | TEXT | Display name                               |
| `icon`       | TEXT | Emoji icon (e.g., "💼")                    |
| `color`      | TEXT | Hex color code (e.g., "#FF5722")           |
| `updated_at` | TEXT | ISO 8601 timestamp                         |
| `deleted_at` | TEXT | ISO 8601 timestamp or NULL for soft-delete |

### Default Category

On database initialization, a default category is created:

```
id: "uncategorized"
name: "Uncategorized"
icon: "📁"
color: "#8E8E93"
```

## TypeScript Data Models

### Entry Interface

```typescript
interface Entry {
  id: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  categoryId: string;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
```

### Category Interface

```typescript
interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  updatedAt: Date;
  deletedAt?: Date;
}
```

## Export Format (`.onepass` file)

### Structure

The export file is a UTF-8 encoded JSON object with the following structure:

```json
{
  "version": 1,
  "salt": "<base64-encoded-16-byte-salt>",
  "iv": "<base64-encoded-12-byte-iv>",
  "data": "<base64-encoded-ciphertext-with-tag>"
}
```

### Fields

| Field     | Type   | Description                                               |
| --------- | ------ | --------------------------------------------------------- |
| `version` | number | Export format version (currently 1)                       |
| `salt`    | string | Base64-encoded 16-byte PBKDF2 salt                        |
| `iv`      | string | Base64-encoded 12-byte GCM IV                             |
| `data`    | string | Base64-encoded ciphertext (ciphertext + 16-byte auth tag) |

### Encryption Process

1. Serialize entries and categories to JSON (SyncPayload format)
2. Generate random 12-byte IV
3. Encrypt JSON plaintext with AES-256-GCM using derived key
4. Concatenate ciphertext + auth tag
5. Base64-encode all binary fields
6. Wrap in JSON structure with version

### Decryption Process

1. Parse JSON structure
2. Validate version === 1
3. Base64-decode salt, iv, and data
4. Split data into ciphertext (data[:-16]) and tag (data[-16:])
5. Decrypt with AES-256-GCM
6. Parse resulting JSON as SyncPayload

### Version Compatibility

The `version` field must equal `1`. Future versions may introduce breaking changes and should be rejected by importers.

## Sync Protocol

### SyncPayload Format

```typescript
interface SyncPayload {
  entries: Entry[];
  categories: Category[];
}
```

### Serialization

All Date fields are serialized as ISO 8601 strings:

```json
{
  "entries": [
    {
      "id": "uuid-string",
      "title": "Entry Title",
      "username": "user@example.com",
      "password": "secret",
      "url": "https://example.com",
      "notes": "Optional notes",
      "categoryId": "category-uuid",
      "isFavorite": true,
      "createdAt": "2026-01-15T10:30:45.123Z",
      "updatedAt": "2026-01-20T14:22:33.456Z",
      "deletedAt": "2026-02-01T00:00:00.000Z"
    }
  ],
  "categories": [
    {
      "id": "category-uuid",
      "name": "Category Name",
      "icon": "💼",
      "color": "#FF5722",
      "updatedAt": "2026-01-15T10:30:45.123Z",
      "deletedAt": null
    }
  ]
}
```

### Optional Fields

- `url` - Omitted if undefined (not null)
- `notes` - Omitted if undefined (not null)
- `deletedAt` - Omitted if undefined (not null)

### Sync Response Format

```typescript
interface SyncResponse {
  entries: Entry[];
  categories: Category[];
  serverTs: number; // Unix timestamp in milliseconds
}
```

## Sync Authentication Token

The sync server uses a Bearer token derived from the encryption key:

```
token = HMAC-SHA256(key, "onepass-sync-token")
```

This token is computed client-side and sent in the `Authorization: Bearer <token>` header.

## Merge Algorithm

When syncing, changes are merged using **last-write-wins with delete-wins**:

### Conflict Resolution

1. **Remote newer**: Remote `updatedAt` > Local `updatedAt` → Accept remote
2. **Local newer**: Local `updatedAt` > Remote `updatedAt` → Keep local
3. **Same timestamp**: Accept remote (arbitrary, but consistent)

### Delete Wins Rule

If either side has `deletedAt` set, the merged result always has `deletedAt` set to the earlier deletion timestamp.

```
merged.deletedAt = min(local.deletedAt, remote.deletedAt) if either is set
```

### Incremental Sync

- Client stores `lastSyncTs` locally
- GET `/sync?since=<lastSyncTs>` returns entries/categories updated since timestamp
- POST `/sync` pushes local changes and receives merged results

## Cross-Platform Compatibility

### String Encoding

- All strings are UTF-8 encoded
- JSON serialization uses standard JSON escaping
- Unicode characters (including emoji) are fully supported in all text fields

### Timestamp Format

- ISO 8601 with milliseconds: `YYYY-MM-DDTHH:mm:ss.sssZ`
- Always UTC (Z suffix)
- Stored as TEXT in SQLite for portability

### Binary Encoding

- All binary data (salt, IV, ciphertext) is Base64-encoded in JSON
- Standard Base64 with `=` padding

### Boolean Representation

- TypeScript/JSON: `true` / `false`
- SQLite: `1` / `0` (INTEGER)

### Null Handling

- Optional fields are omitted from JSON when undefined
- SQLite stores NULL for missing optional fields

## File Locations

| Platform | Location                                         |
| -------- | ------------------------------------------------ |
| Android  | `Context.getFilesDir()}/vault.db`                |
| macOS    | `~/Library/Application Support/OnePass/vault.db` |
| Export   | User-selected path (`.onepass` extension)        |

## Security Considerations

1. **Never store the master password** - Only the derived key is used for operations
2. **Salt is stored unencrypted** - Required for key derivation on unlock
3. **Auth tag verification** - AES-GCM provides integrity; failed decryption indicates wrong password or corrupted data
4. **Soft delete** - Entries are marked deleted but retained for sync propagation
5. **Sync token is deterministic** - Same key always produces same token, enabling re-authentication without storing the password
