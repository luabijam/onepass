import type { Entry, Category, SyncPayload, SyncResponse } from '@onepass/vault-core';

export interface MergeConflict<T> {
  id: string;
  type: 'entry' | 'category';
  localVersion: T;
  remoteVersion: T;
  resolution: 'local' | 'remote';
}

export interface MergeEntriesResult {
  entries: Map<string, Entry>;
  conflicts: MergeConflict<Entry>[];
}

export interface MergeCategoriesResult {
  categories: Map<string, Category>;
  conflicts: MergeConflict<Category>[];
}

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

function earlierNonNull(a: Date | undefined, b: Date | undefined): Date | undefined {
  if (!a) return b;
  if (!b) return a;
  return a < b ? a : b;
}

function hasEntryChanged(local: Entry, remote: Entry): boolean {
  return (
    local.title !== remote.title ||
    local.username !== remote.username ||
    local.password !== remote.password ||
    local.url !== remote.url ||
    local.notes !== remote.notes ||
    local.categoryId !== remote.categoryId ||
    local.isFavorite !== remote.isFavorite ||
    local.deletedAt?.getTime() !== remote.deletedAt?.getTime()
  );
}

function hasCategoryChanged(local: Category, remote: Category): boolean {
  return (
    local.name !== remote.name ||
    local.icon !== remote.icon ||
    local.color !== remote.color ||
    local.deletedAt?.getTime() !== remote.deletedAt?.getTime()
  );
}

export function mergeEntries(local: Map<string, Entry>, remote: Entry[]): MergeEntriesResult {
  const result = new Map(local);
  const conflicts: MergeConflict<Entry>[] = [];

  for (const remoteEntry of remote) {
    const localEntry = result.get(remoteEntry.id);

    if (!localEntry) {
      result.set(remoteEntry.id, remoteEntry);
      continue;
    }

    if (localEntry.deletedAt || remoteEntry.deletedAt) {
      const deletedAt = earlierNonNull(localEntry.deletedAt, remoteEntry.deletedAt);
      const winner = localEntry.updatedAt >= remoteEntry.updatedAt ? localEntry : remoteEntry;
      result.set(remoteEntry.id, { ...winner, deletedAt });

      if (hasEntryChanged(localEntry, remoteEntry)) {
        conflicts.push({
          id: remoteEntry.id,
          type: 'entry',
          localVersion: localEntry,
          remoteVersion: remoteEntry,
          resolution: localEntry.updatedAt >= remoteEntry.updatedAt ? 'local' : 'remote',
        });
      }
      continue;
    }

    if (remoteEntry.updatedAt > localEntry.updatedAt) {
      result.set(remoteEntry.id, remoteEntry);
      if (hasEntryChanged(localEntry, remoteEntry)) {
        conflicts.push({
          id: remoteEntry.id,
          type: 'entry',
          localVersion: localEntry,
          remoteVersion: remoteEntry,
          resolution: 'remote',
        });
      }
    } else if (localEntry.updatedAt > remoteEntry.updatedAt) {
      if (hasEntryChanged(localEntry, remoteEntry)) {
        conflicts.push({
          id: remoteEntry.id,
          type: 'entry',
          localVersion: localEntry,
          remoteVersion: remoteEntry,
          resolution: 'local',
        });
      }
    }
  }

  return { entries: result, conflicts };
}

export function mergeCategories(
  local: Map<string, Category>,
  remote: Category[]
): MergeCategoriesResult {
  const result = new Map(local);
  const conflicts: MergeConflict<Category>[] = [];

  for (const remoteCat of remote) {
    const localCat = result.get(remoteCat.id);

    if (!localCat) {
      result.set(remoteCat.id, remoteCat);
      continue;
    }

    if (localCat.deletedAt || remoteCat.deletedAt) {
      const deletedAt = earlierNonNull(localCat.deletedAt, remoteCat.deletedAt);
      const winner = localCat.updatedAt >= remoteCat.updatedAt ? localCat : remoteCat;
      result.set(remoteCat.id, { ...winner, deletedAt });

      if (hasCategoryChanged(localCat, remoteCat)) {
        conflicts.push({
          id: remoteCat.id,
          type: 'category',
          localVersion: localCat,
          remoteVersion: remoteCat,
          resolution: localCat.updatedAt >= remoteCat.updatedAt ? 'local' : 'remote',
        });
      }
      continue;
    }

    if (remoteCat.updatedAt > localCat.updatedAt) {
      result.set(remoteCat.id, remoteCat);
      if (hasCategoryChanged(localCat, remoteCat)) {
        conflicts.push({
          id: remoteCat.id,
          type: 'category',
          localVersion: localCat,
          remoteVersion: remoteCat,
          resolution: 'remote',
        });
      }
    } else if (localCat.updatedAt > remoteCat.updatedAt) {
      if (hasCategoryChanged(localCat, remoteCat)) {
        conflicts.push({
          id: remoteCat.id,
          type: 'category',
          localVersion: localCat,
          remoteVersion: remoteCat,
          resolution: 'local',
        });
      }
    }
  }

  return { categories: result, conflicts };
}
