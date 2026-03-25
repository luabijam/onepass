import { Entry } from '../models/entry.js';
import { Category } from '../models/category.js';

export function mergeEntries(local: Map<string, Entry>, remote: Entry[]): Map<string, Entry> {
  const result = new Map(local);

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
      continue;
    }

    if (remoteEntry.updatedAt > localEntry.updatedAt) {
      result.set(remoteEntry.id, remoteEntry);
    }
  }

  return result;
}

export function mergeCategories(
  local: Map<string, Category>,
  remote: Category[]
): Map<string, Category> {
  const result = new Map(local);

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
      continue;
    }

    if (remoteCat.updatedAt > localCat.updatedAt) {
      result.set(remoteCat.id, remoteCat);
    }
  }

  return result;
}

function earlierNonNull(a: Date | undefined, b: Date | undefined): Date | undefined {
  if (!a) return b;
  if (!b) return a;
  return a < b ? a : b;
}
