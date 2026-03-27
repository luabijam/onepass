# Sync Protocol Specification

This document describes the OnePass sync protocol for cross-device synchronization over local networks.

## Overview

OnePass uses a bidirectional sync protocol between a desktop server (macOS) and mobile clients (Android) over the local network. The protocol is designed for:

- **LAN-only operation** - No cloud services required
- **Offline-first** - Each device has a complete vault copy
- **Incremental sync** - Only changes since last sync are transferred
- **Conflict resolution** - Deterministic merge algorithm

## Architecture

```
┌─────────────────┐                    ┌─────────────────┐
│  Desktop (macOS)│                    │ Mobile (Android)│
│                 │                    │                 │
│  ┌───────────┐  │     mDNS Discovery    │  ┌───────────┐  │
│  │ mDNS      │◄─┼────────────────────────┼──│ Discovery │  │
│  │ Advertiser│  │                    │  │  │  Client   │  │
│  └───────────┘  │                    │  └───────────┘  │
│                 │                    │                 │
│  ┌───────────┐  │    HTTP over LAN       │  ┌───────────┐  │
│  │ HTTP      │◄─┼────────────────────────┼──│ Sync      │  │
│  │ Server    │  │                    │  │  │ Client    │  │
│  └───────────┘  │                    │  └───────────┘  │
│                 │                    │                 │
│  ┌───────────┐  │                    │  ┌───────────┐  │
│  │ Vault DB  │  │                    │  │ Vault DB  │  │
│  └───────────┘  │                    │  └───────────┘  │
└─────────────────┘                    └─────────────────┘
```

## Service Discovery (mDNS)

### Service Advertisement (Desktop)

The desktop app advertises itself via mDNS/Bonjour:

| Property | Value                |
| -------- | -------------------- |
| Service  | `_onepass._tcp`      |
| Name     | `onepass-sync`       |
| Port     | 47200 (configurable) |
| Protocol | TCP                  |

**TXT Record:**

| Key     | Value                 |
| ------- | --------------------- |
| `token` | Bearer token for auth |

### Service Discovery (Mobile)

The mobile client discovers the desktop server:

1. Broadcast mDNS query for `_onepass._tcp`
2. Wait for response (timeout: configurable, default 5s)
3. Extract IP address, port, and token from TXT record
4. Connect to `http://<ip>:<port>`

### Implementation

**Desktop (Advertiser):** `packages/desktop/src/sync/mdns.ts`

```typescript
const service = bonjour.publish({
  name: 'onepass-sync',
  type: 'onepass',
  port: port,
  protocol: 'tcp',
  txt: { token: this.token },
});
```

**Mobile (Discovery):** `packages/mobile/src/services/MdnsDiscovery.ts`

```typescript
const service = await bonjour.findOne(
  {
    type: 'onepass',
    protocol: 'tcp',
  },
  timeout
);
```

## Authentication

### Token Derivation

The sync token is derived from the vault encryption key:

```
token = HMAC-SHA256(key, "onepass-sync-token")
token_hex = token.toString('hex')
```

**Implementation:** `packages/vault-core/src/crypto/index.ts`

```typescript
export function computeSyncToken(key: Buffer): Buffer {
  return createHash('sha256').update(key).update('onepass-sync-token').digest();
}
```

### Token Usage

All sync requests include the token in the Authorization header:

```
Authorization: Bearer <token_hex>
```

**Example:**

```
Authorization: Bearer a1b2c3d4e5f6...
```

## HTTP Endpoints

### GET /sync

Retrieve entries and categories modified since a timestamp.

**Request:**

```
GET /sync?since=<timestamp_ms> HTTP/1.1
Host: <server_ip>:<port>
Authorization: Bearer <token>
Accept: application/json
```

**Query Parameters:**

| Parameter | Type   | Required | Description                              |
| --------- | ------ | -------- | ---------------------------------------- |
| `since`   | number | No       | Unix timestamp (ms) for incremental sync |

**Response (200 OK):**

```json
{
  "entries": [...],
  "categories": [...],
  "serverTs": 1709827200000
}
```

**Response Fields:**

| Field        | Type       | Description                                      |
| ------------ | ---------- | ------------------------------------------------ |
| `entries`    | Entry[]    | Array of entry objects modified since `since`    |
| `categories` | Category[] | Array of category objects modified since `since` |
| `serverTs`   | number     | Server timestamp at response time (Unix ms)      |

**Error Responses:**

| Status | Description              |
| ------ | ------------------------ |
| 401    | Missing or invalid token |
| 500    | Internal server error    |

### POST /sync

Push local changes and receive merged results.

**Request:**

```
POST /sync HTTP/1.1
Host: <server_ip>:<port>
Authorization: Bearer <token>
Content-Type: application/json

{
  "entries": [...],
  "categories": [...]
}
```

**Request Body:**

| Field        | Type       | Description                     |
| ------------ | ---------- | ------------------------------- |
| `entries`    | Entry[]    | Array of local entry changes    |
| `categories` | Category[] | Array of local category changes |

**Response (200 OK):**

```json
{
  "entries": [...],
  "categories": [...],
  "serverTs": 1709827200000
}
```

The response contains the merged state after applying local changes.

**Error Responses:**

| Status | Description                      |
| ------ | -------------------------------- |
| 400    | Invalid payload (missing fields) |
| 401    | Missing or invalid token         |
| 500    | Internal server error            |

## Data Types

### Entry

```typescript
interface Entry {
  id: string; // UUID v4
  title: string;
  username: string;
  password: string;
  url?: string; // Optional
  notes?: string; // Optional
  categoryId: string; // References Category.id
  isFavorite: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  deletedAt?: string; // ISO 8601, for soft-delete
}
```

### Category

```typescript
interface Category {
  id: string; // UUID v4 or "uncategorized"
  name: string;
  icon: string; // Emoji
  color: string; // Hex color (e.g., "#FF5722")
  updatedAt: string; // ISO 8601
  deletedAt?: string; // ISO 8601, for soft-delete
}
```

### Serialization

Dates are serialized as ISO 8601 strings with UTC timezone:

```json
{
  "createdAt": "2026-01-15T10:30:45.123Z",
  "updatedAt": "2026-01-20T14:22:33.456Z"
}
```

Optional fields (`url`, `notes`, `deletedAt`) are omitted when undefined, not null.

## Sync Flow

### Full Sync (First Time)

```
┌────────┐                              ┌────────┐
│ Mobile │                              │Desktop │
└───┬────┘                              └───┬────┘
    │                                       │
    │  1. GET /sync (no since param)        │
    │──────────────────────────────────────►│
    │                                       │
    │  2. Response: all entries/categories  │
    │◄──────────────────────────────────────│
    │                                       │
    │  3. Merge with local data             │
    │  ────                                 │
    │                                       │
    │  4. POST /sync (local changes)        │
    │──────────────────────────────────────►│
    │                                       │
    │  5. Response: merged state            │
    │◄──────────────────────────────────────│
    │                                       │
    │  6. Save merged state                 │
    │  Store serverTs as lastSyncTs         │
    │  ────                                 │
    │                                       │
```

### Incremental Sync (Subsequent)

```
┌────────┐                              ┌────────┐
│ Mobile │                              │Desktop │
└───┬────┘                              └───┬────┘
    │                                       │
    │  1. GET /sync?since=<lastSyncTs>      │
    │──────────────────────────────────────►│
    │                                       │
    │  2. Response: changes since timestamp │
    │◄──────────────────────────────────────│
    │                                       │
    │  3. Merge remote changes with local   │
    │  ────                                 │
    │                                       │
    │  4. POST /sync (local changes since   │
    │              lastSyncTs)              │
    │──────────────────────────────────────►│
    │                                       │
    │  5. Response: merged state            │
    │◄──────────────────────────────────────│
    │                                       │
    │  6. Save merged state                 │
    │  Update lastSyncTs to serverTs        │
    │  ────                                 │
    │                                       │
```

### Implementation

**Mobile Sync Flow:** `packages/mobile/src/services/SyncFlow.ts`

```typescript
async sync(): Promise<SyncResult> {
  const lastSync = await this.config.getLastSyncTimestamp();

  // 1. Pull remote changes
  const pullResponse = await this.pull(lastSync);

  // 2. Merge with local data
  const merged = this.merge(pullResponse, localData);

  // 3. Save merged data
  await this.save(merged);

  // 4. Push local changes
  const pushResponse = await this.push(localChanges);

  // 5. Update sync timestamp
  await this.setLastSyncTimestamp(pushResponse.serverTs);

  return { ... };
}
```

## Merge Algorithm

### Conflict Resolution Strategy

OnePass uses **Last-Write-Wins with Delete-Wins**:

1. **Compare `updatedAt` timestamps** - Newer wins
2. **Delete takes precedence** - If either side has `deletedAt`, the merged result is deleted
3. **Earlier deletion wins** - Use the earlier `deletedAt` timestamp

### Entry Merge

**Implementation:** `packages/vault-core/src/sync/merge.ts`

```typescript
export function mergeEntries(local: Map<string, Entry>, remote: Entry[]): MergeEntriesResult {
  const result = new Map(local);
  const conflicts: MergeConflict<Entry>[] = [];

  for (const remoteEntry of remote) {
    const localEntry = result.get(remoteEntry.id);

    if (!localEntry) {
      // New remote entry - accept it
      result.set(remoteEntry.id, remoteEntry);
      continue;
    }

    if (localEntry.deletedAt || remoteEntry.deletedAt) {
      // Delete wins - use earlier deletion timestamp
      const deletedAt = earlierNonNull(localEntry.deletedAt, remoteEntry.deletedAt);
      const winner = localEntry.updatedAt >= remoteEntry.updatedAt ? localEntry : remoteEntry;
      result.set(remoteEntry.id, { ...winner, deletedAt });
      continue;
    }

    // Last-write-wins
    if (remoteEntry.updatedAt > localEntry.updatedAt) {
      result.set(remoteEntry.id, remoteEntry);
    }
  }

  return { entries: result, conflicts };
}
```

### Category Merge

Categories follow the same merge algorithm as entries.

### Conflict Reporting

The merge functions return both the merged data and any detected conflicts:

```typescript
interface MergeConflict<T> {
  id: string;
  type: 'entry' | 'category';
  localVersion: T;
  remoteVersion: T;
  resolution: 'local' | 'remote';
}
```

Conflicts are informational only - the resolution is deterministic based on timestamps.

## Error Handling

### Client Error Handling

**Implementation:** `packages/mobile/src/services/SyncClient.ts`

```typescript
export class SyncError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly retryCount?: number
  ) {
    super(message);
    this.name = 'SyncError';
  }

  get isRetryable(): boolean {
    return ['network', 'timeout', 'server_error'].includes(this.code);
  }
}
```

### Error Codes

| Code           | HTTP Status | Description                   | Retryable |
| -------------- | ----------- | ----------------------------- | --------- |
| `network`      | -           | Network error (no response)   | Yes       |
| `timeout`      | -           | Request timeout               | Yes       |
| `unauthorized` | 401         | Invalid or missing token      | No        |
| `forbidden`    | 403         | Token valid but access denied | No        |
| `not_found`    | 404         | Endpoint not found            | No        |
| `server_error` | 5xx         | Server-side error             | Yes       |
| `http_error`   | Other       | Other HTTP errors             | No        |

### Retry Logic

The client supports configurable retry with exponential backoff:

```typescript
interface SyncClientConfig {
  baseUrl: string;
  token: string;
  timeout?: number; // Default: 30000ms
  maxRetries?: number; // Default: 0
  retryDelay?: number; // Default: 1000ms
}
```

Retry delays use exponential backoff:

```
delay = retryDelay * 2^attempt
```

Example with `retryDelay: 1000`:

- Attempt 0: No delay (first try)
- Attempt 1: 1000ms delay
- Attempt 2: 2000ms delay
- Attempt 3: 4000ms delay

### Partial Sync Recovery

If push fails after a successful pull, the sync flow reports partial results:

```typescript
export class SyncFlowError extends Error {
  public readonly partialResult?: PartialSyncResult;
  public readonly phase: 'pull' | 'push' | 'merge';
}

interface PartialSyncResult {
  pulledEntries: number;
  pulledCategories: number;
}
```

This allows the UI to inform the user that pull succeeded but push failed.

## Security Considerations

### Transport Security

- **LAN-only**: The sync server only binds to local network interfaces
- **Token authentication**: All requests require a valid Bearer token
- **Token derivation**: Token is derived from vault key, not stored separately

### Token Security

1. The token is computed from the vault encryption key using HMAC-SHA256
2. The same key derives the token deterministically on both devices
3. The token is never stored - it's computed on-demand during unlock
4. Token validity proves the client knows the vault password

### Known Limitations

1. **No TLS**: Communication is unencrypted HTTP over LAN
   - Mitigation: Only works on trusted local networks
   - Future: Add optional TLS with self-signed certificates

2. **No rate limiting**: Server accepts all valid requests
   - Mitigation: LAN-only access limits attack surface

3. **Token in mDNS TXT record**: Token is visible on the network
   - Mitigation: Token changes with vault password
   - Future: Move to challenge-response authentication

## Implementation Reference

### Desktop Server

**File:** `packages/desktop/src/sync/server.ts`

```typescript
export interface SyncServerConfig {
  token: string;
  getEntries: (since?: Date) => Promise<Entry[]>;
  getCategories: (since?: Date) => Promise<Category[]>;
  mergeChanges: (payload: SyncPayload) => Promise<{
    entries: Entry[];
    categories: Category[];
  }>;
}

export function createSyncServer(config: SyncServerConfig): Server;
```

### Mobile Client

**File:** `packages/mobile/src/services/SyncClient.ts`

```typescript
export class SyncClient {
  constructor(config: SyncClientConfig);

  async pull(since?: Date): Promise<SyncResponse>;
  async push(payload: SyncPayload): Promise<SyncResponse>;
}
```

**File:** `packages/mobile/src/services/SyncFlow.ts`

```typescript
export class SyncFlow {
  constructor(config: SyncFlowConfig);

  async sync(): Promise<SyncResult>;
}
```

### Core Types

**File:** `packages/vault-core/src/sync/protocol.ts`

```typescript
export interface SyncPayload {
  entries: Entry[];
  categories: Category[];
}

export interface SyncResponse {
  entries: Entry[];
  categories: Category[];
  serverTs: number;
}

export function serializeSyncPayload(payload: SyncPayload): string;
export function deserializeSyncPayload(json: string): SyncPayload;
export function serializeSyncResponse(response: SyncResponse): string;
export function deserializeSyncResponse(json: string): SyncResponse;
```

**File:** `packages/vault-core/src/sync/merge.ts`

```typescript
export function mergeEntries(local: Map<string, Entry>, remote: Entry[]): MergeEntriesResult;

export function mergeCategories(
  local: Map<string, Category>,
  remote: Category[]
): MergeCategoriesResult;
```

## Testing

### Integration Tests

Integration tests verify the complete sync flow:

**File:** `packages/desktop/__tests__/sync-integration.test.ts`

Tests include:

- Server startup and mDNS advertisement
- GET /sync with and without `since` parameter
- POST /sync with payload validation
- Authentication middleware
- Error handling

**File:** `packages/desktop/__tests__/mobile-desktop-sync.test.ts`

Tests include:

- Full sync between mobile and desktop
- Incremental sync with `since` parameter
- Conflict resolution scenarios
- Delete propagation

### Unit Tests

**File:** `packages/vault-core/__tests__/sync/merge.test.ts`

Tests the merge algorithm with various scenarios:

- New entry from remote
- New entry from local
- Update conflict (remote newer)
- Update conflict (local newer)
- Delete conflict
- Category merge

## Protocol Version

Current protocol version: **1**

The protocol version is implicit in the API structure. Future versions may:

- Add a version field to requests/responses
- Introduce backward-incompatible changes
- Require version negotiation during discovery

## Changelog

### Version 1 (2026-03)

- Initial protocol design
- GET /sync with optional `since` parameter
- POST /sync for bidirectional sync
- Bearer token authentication
- mDNS service discovery
- Last-write-wins with delete-wins merge
