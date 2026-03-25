/**
 * A password entry in the vault.
 */
export interface Entry {
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

/**
 * Creates a new entry with default values.
 */
export function createEntry(
  id: string,
  title: string,
  username: string,
  password: string,
  categoryId: string
): Entry {
  const now = new Date();
  return {
    id,
    title,
    username,
    password,
    categoryId,
    isFavorite: false,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Checks if an entry is soft-deleted.
 */
export function isEntryDeleted(entry: Entry): boolean {
  return entry.deletedAt !== undefined;
}

/**
 * Marks an entry as soft-deleted.
 */
export function softDeleteEntry(entry: Entry): Entry {
  return {
    ...entry,
    deletedAt: new Date(),
  };
}

/**
 * Restores a soft-deleted entry.
 */
export function restoreEntry(entry: Entry): Entry {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { deletedAt, ...rest } = entry;
  return rest;
}
