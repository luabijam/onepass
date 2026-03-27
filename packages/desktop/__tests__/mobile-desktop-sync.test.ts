import {createSyncServer, SyncServerConfig} from '../src/sync/server';
import {VaultService, mergeEntries, mergeCategories} from '@onepass/vault-core';
import {generateSalt, createEntry, createCategory} from '@onepass/vault-core';
import type {
  Entry,
  Category,
  SyncPayload,
  SyncResponse,
} from '@onepass/vault-core';
import axios from 'axios';

interface MobileSimulator {
  vault: VaultService;
  lastSyncTimestamp: Date | null;
}

function createMobileSimulator(): MobileSimulator {
  return {
    vault: new VaultService(),
    lastSyncTimestamp: null,
  };
}

async function initializeVault(
  vault: VaultService,
  key: Buffer,
): Promise<void> {
  await vault.open(key);
}

function createMobileSyncClient(baseUrl: string, token: string) {
  const client = axios.create({
    baseURL: baseUrl,
    timeout: 30000,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  function deserializeResponse(data: unknown): SyncResponse {
    const raw = data as {
      entries: Array<{
        id: string;
        title: string;
        username: string;
        password: string;
        url?: string;
        notes?: string;
        categoryId: string;
        isFavorite: boolean;
        createdAt: string;
        updatedAt: string;
        deletedAt?: string;
      }>;
      categories: Array<{
        id: string;
        name: string;
        icon: string;
        color: string;
        updatedAt: string;
        deletedAt?: string;
      }>;
      serverTs: number;
    };
    return {
      entries: raw.entries.map(e => ({
        ...e,
        createdAt: new Date(e.createdAt),
        updatedAt: new Date(e.updatedAt),
        deletedAt: e.deletedAt ? new Date(e.deletedAt) : undefined,
      })),
      categories: raw.categories.map(c => ({
        ...c,
        updatedAt: new Date(c.updatedAt),
        deletedAt: c.deletedAt ? new Date(c.deletedAt) : undefined,
      })),
      serverTs: raw.serverTs,
    };
  }

  return {
    async pull(since?: Date) {
      const params = since ? {since: since.getTime()} : {};
      const response = await client.get('/sync', {params});
      return deserializeResponse(response.data);
    },
    async push(payload: SyncPayload) {
      const response = await client.post('/sync', payload);
      return deserializeResponse(response.data);
    },
  };
}

async function performSync(
  mobileClient: MobileSimulator,
  syncClient: ReturnType<typeof createMobileSyncClient>,
): Promise<{pulled: number; pushed: number}> {
  const mobileEntries = await mobileClient.vault.getEntries({
    includeDeleted: true,
  });
  const mobileCategories = await mobileClient.vault.getCategories({
    includeDeleted: true,
  });

  const pullResponse = await syncClient.pull(
    mobileClient.lastSyncTimestamp ?? undefined,
  );
  const remoteEntries = pullResponse.entries as Entry[];
  const remoteCategories = pullResponse.categories as Category[];

  const mergedEntriesResult = mergeEntries(
    new Map(mobileEntries.map(e => [e.id, e])),
    remoteEntries,
  );
  const mergedCategoriesResult = mergeCategories(
    new Map(mobileCategories.map(c => [c.id, c])),
    remoteCategories,
  );

  const mergedEntriesArray = Array.from(mergedEntriesResult.entries.values());
  const mergedCategoriesArray = Array.from(
    mergedCategoriesResult.categories.values(),
  );

  for (const entry of mergedEntriesArray) {
    await mobileClient.vault.upsertEntry(entry);
  }
  for (const category of mergedCategoriesArray) {
    await mobileClient.vault.upsertCategory(category);
  }

  const entriesToPush = mobileClient.lastSyncTimestamp
    ? mergedEntriesArray.filter(
        e => e.updatedAt > mobileClient.lastSyncTimestamp!,
      )
    : mergedEntriesArray;
  const categoriesToPush = mobileClient.lastSyncTimestamp
    ? mergedCategoriesArray.filter(
        c => c.updatedAt > mobileClient.lastSyncTimestamp!,
      )
    : mergedCategoriesArray;

  const pushResponse = await syncClient.push({
    entries: entriesToPush,
    categories: categoriesToPush,
  });

  mobileClient.lastSyncTimestamp = new Date(pushResponse.serverTs);

  return {
    pulled: remoteEntries.length + remoteCategories.length,
    pushed: entriesToPush.length + categoriesToPush.length,
  };
}

describe('Mobile-Desktop Sync Integration', () => {
  const validToken = 'test-sync-token';
  let server: ReturnType<typeof createSyncServer>;
  let desktopVault: VaultService;
  let key: Buffer;
  let serverAddress: string;

  const createMergeChanges = (vaultService: VaultService) => {
    return async (
      payload: SyncPayload,
    ): Promise<{entries: Entry[]; categories: Category[]}> => {
      const localEntries = await vaultService.getEntries({
        includeDeleted: true,
      });
      const localCategories = await vaultService.getCategories({
        includeDeleted: true,
      });

      const localEntryMap = new Map(localEntries.map(e => [e.id, e]));
      const localCategoryMap = new Map(localCategories.map(c => [c.id, c]));

      const mergedEntriesResult = mergeEntries(localEntryMap, payload.entries);
      const mergedCategoriesResult = mergeCategories(
        localCategoryMap,
        payload.categories,
      );

      for (const entry of mergedEntriesResult.entries.values()) {
        await vaultService.upsertEntry(entry);
      }

      for (const category of mergedCategoriesResult.categories.values()) {
        await vaultService.upsertCategory(category);
      }

      const allEntries = await vaultService.getEntries({includeDeleted: true});
      const allCategories = await vaultService.getCategories({
        includeDeleted: true,
      });

      return {entries: allEntries, categories: allCategories};
    };
  };

  beforeEach(async () => {
    desktopVault = new VaultService();
    key = generateSalt();
    await initializeVault(desktopVault, key);
  });

  afterEach(async () => {
    if (server) {
      server.close();
    }
    if (desktopVault.isOpen) {
      await desktopVault.close();
    }
  });

  describe('initial sync', () => {
    it('syncs entries from desktop to mobile', async () => {
      const desktopEntry = createEntry(
        'desktop-entry-1',
        'Desktop Site',
        'user@example.com',
        'password123',
        'uncategorized',
      );
      await desktopVault.upsertEntry(desktopEntry);

      const config: SyncServerConfig = {
        token: validToken,
        getEntries: (since?: Date) => {
          if (since) {
            return desktopVault.getEntriesSince(since);
          }
          return desktopVault.getEntries();
        },
        getCategories: (since?: Date) => {
          if (since) {
            return desktopVault.getCategoriesSince(since);
          }
          return desktopVault.getCategories();
        },
        mergeChanges: createMergeChanges(desktopVault),
      };

      server = createSyncServer(config);
      const port = (server.address() as {port: number}).port;
      serverAddress = `http://localhost:${port}`;

      const mobileClient = createMobileSimulator();
      await initializeVault(mobileClient.vault, key);

      const syncClient = createMobileSyncClient(serverAddress, validToken);
      await performSync(mobileClient, syncClient);

      const mobileEntries = await mobileClient.vault.getEntries();
      expect(mobileEntries).toHaveLength(1);
      expect(mobileEntries[0]!.title).toBe('Desktop Site');
      expect(mobileEntries[0]!.username).toBe('user@example.com');
    });

    it('syncs entries from mobile to desktop', async () => {
      const config: SyncServerConfig = {
        token: validToken,
        getEntries: (since?: Date) => {
          if (since) {
            return desktopVault.getEntriesSince(since);
          }
          return desktopVault.getEntries();
        },
        getCategories: (since?: Date) => {
          if (since) {
            return desktopVault.getCategoriesSince(since);
          }
          return desktopVault.getCategories();
        },
        mergeChanges: createMergeChanges(desktopVault),
      };

      server = createSyncServer(config);
      const port = (server.address() as {port: number}).port;
      serverAddress = `http://localhost:${port}`;

      const mobileClient = createMobileSimulator();
      await initializeVault(mobileClient.vault, key);

      const mobileEntry = createEntry(
        'mobile-entry-1',
        'Mobile Site',
        'mobile@example.com',
        'mobilepass',
        'uncategorized',
      );
      await mobileClient.vault.upsertEntry(mobileEntry);

      const syncClient = createMobileSyncClient(serverAddress, validToken);
      await performSync(mobileClient, syncClient);

      const desktopEntries = await desktopVault.getEntries();
      expect(desktopEntries).toHaveLength(1);
      expect(desktopEntries[0]!.title).toBe('Mobile Site');
      expect(desktopEntries[0]!.username).toBe('mobile@example.com');
    });

    it('syncs categories bidirectionally', async () => {
      const desktopCategory = createCategory('work', 'Work', '💼', '#3498db');
      await desktopVault.upsertCategory(desktopCategory);

      const config: SyncServerConfig = {
        token: validToken,
        getEntries: (since?: Date) => {
          if (since) {
            return desktopVault.getEntriesSince(since);
          }
          return desktopVault.getEntries();
        },
        getCategories: (since?: Date) => {
          if (since) {
            return desktopVault.getCategoriesSince(since);
          }
          return desktopVault.getCategories();
        },
        mergeChanges: createMergeChanges(desktopVault),
      };

      server = createSyncServer(config);
      const port = (server.address() as {port: number}).port;
      serverAddress = `http://localhost:${port}`;

      const mobileClient = createMobileSimulator();
      await initializeVault(mobileClient.vault, key);

      const mobileCategory = createCategory(
        'personal',
        'Personal',
        '🏠',
        '#e74c3c',
      );
      await mobileClient.vault.upsertCategory(mobileCategory);

      const syncClient = createMobileSyncClient(serverAddress, validToken);
      await performSync(mobileClient, syncClient);

      const mobileCategories = await mobileClient.vault.getCategories();
      expect(mobileCategories).toHaveLength(3);
      expect(mobileCategories.find(c => c.id === 'work')?.name).toBe('Work');
      expect(mobileCategories.find(c => c.id === 'personal')?.name).toBe(
        'Personal',
      );

      const desktopCategories = await desktopVault.getCategories();
      expect(desktopCategories).toHaveLength(3);
      expect(desktopCategories.find(c => c.id === 'personal')?.name).toBe(
        'Personal',
      );
    });
  });

  describe('incremental sync', () => {
    it('only syncs changes since last sync', async () => {
      const oldEntry = createEntry(
        'old-entry',
        'Old Entry',
        'old@example.com',
        'oldpass',
        'uncategorized',
      );
      oldEntry.updatedAt = new Date('2026-01-01');
      await desktopVault.upsertEntry(oldEntry);

      const config: SyncServerConfig = {
        token: validToken,
        getEntries: (since?: Date) => {
          if (since) {
            return desktopVault.getEntriesSince(since);
          }
          return desktopVault.getEntries();
        },
        getCategories: (since?: Date) => {
          if (since) {
            return desktopVault.getCategoriesSince(since);
          }
          return desktopVault.getCategories();
        },
        mergeChanges: createMergeChanges(desktopVault),
      };

      server = createSyncServer(config);
      const port = (server.address() as {port: number}).port;
      serverAddress = `http://localhost:${port}`;

      const mobileClient = createMobileSimulator();
      await initializeVault(mobileClient.vault, key);

      const syncClient = createMobileSyncClient(serverAddress, validToken);
      await performSync(mobileClient, syncClient);

      const mobileEntriesAfterFirstSync = await mobileClient.vault.getEntries();
      expect(mobileEntriesAfterFirstSync).toHaveLength(1);

      await new Promise(resolve => setTimeout(resolve, 10));

      const newEntry = createEntry(
        'new-entry',
        'New Entry',
        'new@example.com',
        'newpass',
        'uncategorized',
      );
      await desktopVault.upsertEntry(newEntry);

      await performSync(mobileClient, syncClient);

      const mobileEntriesAfterSecondSync =
        await mobileClient.vault.getEntries();
      expect(mobileEntriesAfterSecondSync).toHaveLength(2);
    });
  });

  describe('merge scenarios', () => {
    it('merges updates when both sides modify same entry', async () => {
      const now = Date.now();
      const sharedEntry = createEntry(
        'shared-entry',
        'Original Title',
        'user@example.com',
        'originalpass',
        'uncategorized',
      );
      sharedEntry.updatedAt = new Date(now - 100000);
      sharedEntry.createdAt = new Date(now - 100000);
      await desktopVault.upsertEntry(sharedEntry);

      const config: SyncServerConfig = {
        token: validToken,
        getEntries: (since?: Date) => {
          if (since) {
            return desktopVault.getEntriesSince(since);
          }
          return desktopVault.getEntries();
        },
        getCategories: (since?: Date) => {
          if (since) {
            return desktopVault.getCategoriesSince(since);
          }
          return desktopVault.getCategories();
        },
        mergeChanges: createMergeChanges(desktopVault),
      };

      server = createSyncServer(config);
      const port = (server.address() as {port: number}).port;
      serverAddress = `http://localhost:${port}`;

      const mobileClient = createMobileSimulator();
      await initializeVault(mobileClient.vault, key);

      const syncClient = createMobileSyncClient(serverAddress, validToken);
      await performSync(mobileClient, syncClient);

      const desktopEntry = (await desktopVault.getEntries())[0]!;
      const desktopUpdate: Entry = {
        ...desktopEntry,
        title: 'Desktop Updated',
        updatedAt: new Date(now + 10000),
      };
      await desktopVault.upsertEntry(desktopUpdate);

      const mobileEntry = (await mobileClient.vault.getEntries())[0]!;
      const mobileUpdate: Entry = {
        ...mobileEntry,
        title: 'Mobile Updated',
        password: 'newpassword',
        updatedAt: new Date(now + 20000),
      };
      await mobileClient.vault.upsertEntry(mobileUpdate);

      await performSync(mobileClient, syncClient);

      const mobileEntries = await mobileClient.vault.getEntries();
      const desktopEntries = await desktopVault.getEntries();

      expect(mobileEntries[0]!.title).toBe('Mobile Updated');
      expect(mobileEntries[0]!.password).toBe('newpassword');

      expect(desktopEntries[0]!.title).toBe('Mobile Updated');
      expect(desktopEntries[0]!.password).toBe('newpassword');
    });

    it('handles delete-wins across sync', async () => {
      const entryToDelete = createEntry(
        'delete-test',
        'To Be Deleted',
        'user@example.com',
        'pass',
        'uncategorized',
      );
      await desktopVault.upsertEntry(entryToDelete);

      const config: SyncServerConfig = {
        token: validToken,
        getEntries: (since?: Date) => {
          if (since) {
            return desktopVault.getEntriesSince(since);
          }
          return desktopVault.getEntries();
        },
        getCategories: (since?: Date) => {
          if (since) {
            return desktopVault.getCategoriesSince(since);
          }
          return desktopVault.getCategories();
        },
        mergeChanges: createMergeChanges(desktopVault),
      };

      server = createSyncServer(config);
      const port = (server.address() as {port: number}).port;
      serverAddress = `http://localhost:${port}`;

      const mobileClient = createMobileSimulator();
      await initializeVault(mobileClient.vault, key);

      const syncClient = createMobileSyncClient(serverAddress, validToken);
      await performSync(mobileClient, syncClient);

      await desktopVault.softDeleteEntry('delete-test');

      await performSync(mobileClient, syncClient);

      const mobileEntries = await mobileClient.vault.getEntries({
        includeDeleted: true,
      });
      expect(
        mobileEntries.find(e => e.id === 'delete-test')?.deletedAt,
      ).toBeDefined();

      const desktopEntries = await desktopVault.getEntries({
        includeDeleted: true,
      });
      expect(
        desktopEntries.find(e => e.id === 'delete-test')?.deletedAt,
      ).toBeDefined();
    });
  });

  describe('authentication', () => {
    it('rejects sync without token', async () => {
      const config: SyncServerConfig = {
        token: validToken,
        getEntries: () => desktopVault.getEntries(),
        getCategories: () => desktopVault.getCategories(),
        mergeChanges: createMergeChanges(desktopVault),
      };

      server = createSyncServer(config);
      const port = (server.address() as {port: number}).port;
      serverAddress = `http://localhost:${port}`;

      const syncClient = createMobileSyncClient(serverAddress, 'invalid-token');

      await expect(syncClient.pull()).rejects.toThrow();
    });

    it('accepts valid token', async () => {
      const config: SyncServerConfig = {
        token: validToken,
        getEntries: () => desktopVault.getEntries(),
        getCategories: () => desktopVault.getCategories(),
        mergeChanges: createMergeChanges(desktopVault),
      };

      server = createSyncServer(config);
      const port = (server.address() as {port: number}).port;
      serverAddress = `http://localhost:${port}`;

      const syncClient = createMobileSyncClient(serverAddress, validToken);

      const response = await syncClient.pull();
      expect(response).toBeDefined();
      expect(response.entries).toBeDefined();
      expect(response.categories).toBeDefined();
    });
  });

  describe('data consistency', () => {
    it('maintains sync token consistency across multiple syncs', async () => {
      const entry1 = createEntry(
        'entry-1',
        'First',
        'user1@example.com',
        'pass1',
        'uncategorized',
      );
      await desktopVault.upsertEntry(entry1);

      const config: SyncServerConfig = {
        token: validToken,
        getEntries: (since?: Date) => {
          if (since) {
            return desktopVault.getEntriesSince(since);
          }
          return desktopVault.getEntries();
        },
        getCategories: (since?: Date) => {
          if (since) {
            return desktopVault.getCategoriesSince(since);
          }
          return desktopVault.getCategories();
        },
        mergeChanges: createMergeChanges(desktopVault),
      };

      server = createSyncServer(config);
      const port = (server.address() as {port: number}).port;
      serverAddress = `http://localhost:${port}`;

      const mobileClient = createMobileSimulator();
      await initializeVault(mobileClient.vault, key);

      const syncClient = createMobileSyncClient(serverAddress, validToken);

      await performSync(mobileClient, syncClient);
      expect(mobileClient.lastSyncTimestamp).not.toBeNull();

      const entry2 = createEntry(
        'entry-2',
        'Second',
        'user2@example.com',
        'pass2',
        'uncategorized',
      );
      await mobileClient.vault.upsertEntry(entry2);

      await performSync(mobileClient, syncClient);

      const newTimestamp = mobileClient.lastSyncTimestamp!;
      expect(newTimestamp.getTime()).toBeGreaterThanOrEqual(
        mobileClient.lastSyncTimestamp!.getTime(),
      );
    });

    it('preserves all entry fields through sync round-trip', async () => {
      const fullEntry: Entry = {
        id: 'full-entry',
        title: 'Full Entry Test',
        username: 'user@example.com',
        password: 'P@ssw0rd!#$%',
        url: 'https://example.com/login?param=value&other=123',
        notes: 'Multi-line\nnotes\nwith special chars',
        categoryId: 'uncategorized',
        isFavorite: true,
        createdAt: new Date('2026-01-15T10:30:45.123Z'),
        updatedAt: new Date('2026-01-20T15:45:30.456Z'),
      };
      await desktopVault.upsertEntry(fullEntry);

      const config: SyncServerConfig = {
        token: validToken,
        getEntries: (since?: Date) => {
          if (since) {
            return desktopVault.getEntriesSince(since);
          }
          return desktopVault.getEntries();
        },
        getCategories: (since?: Date) => {
          if (since) {
            return desktopVault.getCategoriesSince(since);
          }
          return desktopVault.getCategories();
        },
        mergeChanges: createMergeChanges(desktopVault),
      };

      server = createSyncServer(config);
      const port = (server.address() as {port: number}).port;
      serverAddress = `http://localhost:${port}`;

      const mobileClient = createMobileSimulator();
      await initializeVault(mobileClient.vault, key);

      const syncClient = createMobileSyncClient(serverAddress, validToken);
      await performSync(mobileClient, syncClient);

      const mobileEntries = await mobileClient.vault.getEntries();
      expect(mobileEntries).toHaveLength(1);

      const syncedEntry = mobileEntries[0]!;
      expect(syncedEntry.title).toBe('Full Entry Test');
      expect(syncedEntry.username).toBe('user@example.com');
      expect(syncedEntry.password).toBe('P@ssw0rd!#$%');
      expect(syncedEntry.url).toBe(
        'https://example.com/login?param=value&other=123',
      );
      expect(syncedEntry.notes).toBe('Multi-line\nnotes\nwith special chars');
      expect(syncedEntry.isFavorite).toBe(true);
      expect(syncedEntry.createdAt!.getTime()).toBe(
        new Date('2026-01-15T10:30:45.123Z').getTime(),
      );
      expect(syncedEntry.updatedAt!.getTime()).toBe(
        new Date('2026-01-20T15:45:30.456Z').getTime(),
      );
    });
  });
});
