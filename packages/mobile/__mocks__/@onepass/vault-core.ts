import type { Entry } from '@onepass/vault-core';
import type { Category } from '@onepass/vault-core';
import type { SyncPayload } from '@onepass/vault-core';
import type { SyncResponse } from '@onepass/vault-core';

export function serializeSyncPayload(payload: SyncPayload): string {
  return JSON.stringify({
    entries: payload.entries.map((entry) => ({
      ...entry,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
      deletedAt: entry.deletedAt?.toISOString(),
    })),
    categories: payload.categories.map((category) => ({
      ...category,
      updatedAt: category.updatedAt.toISOString(),
      deletedAt: category.deletedAt?.toISOString(),
    })),
  });
}

export function deserializeSyncPayload(json: string): SyncPayload {
  const data = JSON.parse(json);
  return {
    entries: data.entries.map((entry: Entry) => ({
      ...entry,
      createdAt: new Date(entry.createdAt),
      updatedAt: new Date(entry.updatedAt),
      deletedAt: entry.deletedAt ? new Date(entry.deletedAt) : undefined,
    })),
    categories: data.categories.map((category: Category) => ({
      ...category,
      updatedAt: new Date(category.updatedAt),
      deletedAt: category.deletedAt ? new Date(category.deletedAt) : undefined,
    })),
  };
}

export function serializeSyncResponse(response: SyncResponse): string {
  return JSON.stringify({
    entries: response.entries.map((entry) => ({
      ...entry,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
      deletedAt: entry.deletedAt?.toISOString(),
    })),
    categories: response.categories.map((category) => ({
      ...category,
      updatedAt: category.updatedAt.toISOString(),
      deletedAt: category.deletedAt?.toISOString(),
    })),
    serverTs: response.serverTs,
  });
}

export function deserializeSyncResponse(json: string): SyncResponse {
  const data = JSON.parse(json);
  return {
    entries: data.entries.map((entry: Entry) => ({
      ...entry,
      createdAt: new Date(entry.createdAt),
      updatedAt: new Date(entry.updatedAt),
      deletedAt: entry.deletedAt ? new Date(entry.deletedAt) : undefined,
    })),
    categories: data.categories.map((category: Category) => ({
      ...category,
      updatedAt: new Date(category.updatedAt),
      deletedAt: category.deletedAt ? new Date(category.deletedAt) : undefined,
    })),
    serverTs: data.serverTs,
  };
}

export { mergeEntries, mergeCategories } from '@onepass/vault-core';
