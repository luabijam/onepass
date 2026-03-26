import request from 'supertest';
import {createSyncServer, SyncServerConfig} from '../src/sync/server';
import {VaultService} from '@onepass/vault-core';
import {mergeEntries, mergeCategories} from '@onepass/vault-core';
import {generateSalt} from '@onepass/vault-core';
import type {Entry, Category, SyncPayload} from '@onepass/vault-core';
import {createEntry, createCategory} from '@onepass/vault-core';

describe('POST /sync Integration', () => {
  const validToken = 'test-sync-token';
  let server: ReturnType<typeof createSyncServer>;
  let vault: VaultService;
  let key: Buffer;

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

      const mergedEntries = mergeEntries(localEntryMap, payload.entries);
      const mergedCategories = mergeCategories(
        localCategoryMap,
        payload.categories,
      );

      for (const entry of mergedEntries.values()) {
        await vaultService.upsertEntry(entry);
      }

      for (const category of mergedCategories.values()) {
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
    vault = new VaultService();
    key = generateSalt();
    await vault.open(key);

    const config: SyncServerConfig = {
      token: validToken,
      getEntries: (since?: Date) => {
        if (since) {
          return vault.getEntriesSince(since);
        }
        return vault.getEntries();
      },
      getCategories: (since?: Date) => {
        if (since) {
          return vault.getCategoriesSince(since);
        }
        return vault.getCategories();
      },
      mergeChanges: createMergeChanges(vault),
    };

    server = createSyncServer(config);
  });

  afterEach(async () => {
    if (server) {
      server.close();
    }
    if (vault.isOpen) {
      await vault.close();
    }
  });

  describe('merging entries', () => {
    it('adds new entries from client', async () => {
      const newEntry: Entry = {
        id: 'new-entry',
        title: 'New Site',
        username: 'user@example.com',
        password: 'secret',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      };

      const response = await request(server)
        .post('/sync')
        .set('Authorization', `Bearer ${validToken}`)
        .send({entries: [newEntry], categories: []});

      expect(response.status).toBe(200);
      expect(response.body.entries).toHaveLength(1);
      expect(
        response.body.entries.find((e: Entry) => e.id === 'new-entry'),
      ).toBeDefined();
    });

    it('updates local entry when client entry is newer', async () => {
      const localEntry = createEntry(
        'entry-1',
        'Local Title',
        'user',
        'pass',
        'uncategorized',
      );
      localEntry.updatedAt = new Date('2026-01-01');
      await vault.upsertEntry(localEntry);

      const newerEntry: Entry = {
        ...localEntry,
        title: 'Updated Title',
        updatedAt: new Date('2026-01-02'),
      };

      const response = await request(server)
        .post('/sync')
        .set('Authorization', `Bearer ${validToken}`)
        .send({entries: [newerEntry], categories: []});

      expect(response.status).toBe(200);
      const entry = response.body.entries.find(
        (e: Entry) => e.id === 'entry-1',
      );
      expect(entry.title).toBe('Updated Title');
    });

    it('keeps local entry when it is newer', async () => {
      const localEntry = createEntry(
        'entry-1',
        'Local Title',
        'user',
        'pass',
        'uncategorized',
      );
      localEntry.updatedAt = new Date('2026-01-02');
      await vault.upsertEntry(localEntry);

      const olderEntry: Entry = {
        ...localEntry,
        title: 'Older Title',
        updatedAt: new Date('2026-01-01'),
      };

      const response = await request(server)
        .post('/sync')
        .set('Authorization', `Bearer ${validToken}`)
        .send({entries: [olderEntry], categories: []});

      expect(response.status).toBe(200);
      const entry = response.body.entries.find(
        (e: Entry) => e.id === 'entry-1',
      );
      expect(entry.title).toBe('Local Title');
    });

    it('handles soft-deleted entries with delete-wins', async () => {
      const localEntry = createEntry(
        'entry-1',
        'Active',
        'user',
        'pass',
        'uncategorized',
      );
      localEntry.updatedAt = new Date('2026-01-02');
      await vault.upsertEntry(localEntry);

      const deletedEntry: Entry = {
        ...localEntry,
        updatedAt: new Date('2026-01-01'),
        deletedAt: new Date('2026-01-01'),
      };

      const response = await request(server)
        .post('/sync')
        .set('Authorization', `Bearer ${validToken}`)
        .send({entries: [deletedEntry], categories: []});

      expect(response.status).toBe(200);
      const entry = response.body.entries.find(
        (e: Entry) => e.id === 'entry-1',
      );
      expect(entry.deletedAt).toBeDefined();
    });

    it('merges multiple entries in single sync', async () => {
      const localEntry = createEntry(
        'entry-1',
        'Local',
        'user',
        'pass',
        'uncategorized',
      );
      localEntry.updatedAt = new Date('2026-01-01');
      await vault.upsertEntry(localEntry);

      const updatedEntry: Entry = {
        ...localEntry,
        title: 'Updated',
        updatedAt: new Date('2026-01-02'),
      };
      const newEntry = createEntry(
        'entry-2',
        'New Entry',
        'user2',
        'pass2',
        'uncategorized',
      );

      const response = await request(server)
        .post('/sync')
        .set('Authorization', `Bearer ${validToken}`)
        .send({entries: [updatedEntry, newEntry], categories: []});

      expect(response.status).toBe(200);
      expect(response.body.entries).toHaveLength(2);
      expect(
        response.body.entries.find((e: Entry) => e.id === 'entry-1')?.title,
      ).toBe('Updated');
      expect(
        response.body.entries.find((e: Entry) => e.id === 'entry-2'),
      ).toBeDefined();
    });
  });

  describe('merging categories', () => {
    it('adds new categories from client', async () => {
      const newCategory: Category = {
        id: 'work',
        name: 'Work',
        icon: '💼',
        color: '#3498db',
        updatedAt: new Date('2026-01-01'),
      };

      const response = await request(server)
        .post('/sync')
        .set('Authorization', `Bearer ${validToken}`)
        .send({entries: [], categories: [newCategory]});

      expect(response.status).toBe(200);
      const workCategory = response.body.categories.find(
        (c: Category) => c.id === 'work',
      );
      expect(workCategory).toBeDefined();
      expect(workCategory.name).toBe('Work');
    });

    it('updates local category when client category is newer', async () => {
      const localCategory = createCategory(
        'personal',
        'Personal',
        '🏠',
        '#ff0000',
      );
      localCategory.updatedAt = new Date('2026-01-01');
      await vault.upsertCategory(localCategory);

      const newerCategory: Category = {
        ...localCategory,
        name: 'Personal Updated',
        color: '#00ff00',
        updatedAt: new Date('2026-01-02'),
      };

      const response = await request(server)
        .post('/sync')
        .set('Authorization', `Bearer ${validToken}`)
        .send({entries: [], categories: [newerCategory]});

      expect(response.status).toBe(200);
      const category = response.body.categories.find(
        (c: Category) => c.id === 'personal',
      );
      expect(category.name).toBe('Personal Updated');
      expect(category.color).toBe('#00ff00');
    });

    it('keeps local category when it is newer', async () => {
      const localCategory = createCategory(
        'personal',
        'Local Version',
        '🏠',
        '#ff0000',
      );
      localCategory.updatedAt = new Date('2026-01-02');
      await vault.upsertCategory(localCategory);

      const olderCategory: Category = {
        ...localCategory,
        name: 'Older Version',
        updatedAt: new Date('2026-01-01'),
      };

      const response = await request(server)
        .post('/sync')
        .set('Authorization', `Bearer ${validToken}`)
        .send({entries: [], categories: [olderCategory]});

      expect(response.status).toBe(200);
      const category = response.body.categories.find(
        (c: Category) => c.id === 'personal',
      );
      expect(category.name).toBe('Local Version');
    });

    it('handles soft-deleted categories with delete-wins', async () => {
      const localCategory = createCategory(
        'personal',
        'Active',
        '🏠',
        '#ff0000',
      );
      localCategory.updatedAt = new Date('2026-01-02');
      await vault.upsertCategory(localCategory);

      const deletedCategory: Category = {
        ...localCategory,
        updatedAt: new Date('2026-01-01'),
        deletedAt: new Date('2026-01-01'),
      };

      const response = await request(server)
        .post('/sync')
        .set('Authorization', `Bearer ${validToken}`)
        .send({entries: [], categories: [deletedCategory]});

      expect(response.status).toBe(200);
      const category = response.body.categories.find(
        (c: Category) => c.id === 'personal',
      );
      expect(category.deletedAt).toBeDefined();
    });
  });

  describe('combined sync', () => {
    it('merges both entries and categories in single request', async () => {
      const newEntry = createEntry('entry-1', 'GitHub', 'user', 'pass', 'work');
      const newCategory: Category = {
        id: 'work',
        name: 'Work',
        icon: '💼',
        color: '#3498db',
        updatedAt: new Date('2026-01-01'),
      };

      const response = await request(server)
        .post('/sync')
        .set('Authorization', `Bearer ${validToken}`)
        .send({entries: [newEntry], categories: [newCategory]});

      expect(response.status).toBe(200);
      expect(
        response.body.entries.find((e: Entry) => e.id === 'entry-1'),
      ).toBeDefined();
      expect(
        response.body.categories.find((c: Category) => c.id === 'work'),
      ).toBeDefined();
    });

    it('returns serverTs timestamp', async () => {
      const response = await request(server)
        .post('/sync')
        .set('Authorization', `Bearer ${validToken}`)
        .send({entries: [], categories: []});

      expect(response.status).toBe(200);
      expect(typeof response.body.serverTs).toBe('number');
      expect(response.body.serverTs).toBeGreaterThan(0);
    });

    it('persists merged data to vault', async () => {
      const newEntry = createEntry(
        'persisted',
        'Persisted Entry',
        'user',
        'pass',
        'uncategorized',
      );
      const newCategory = createCategory('test-cat', 'Test', '📁', '#123456');

      await request(server)
        .post('/sync')
        .set('Authorization', `Bearer ${validToken}`)
        .send({entries: [newEntry], categories: [newCategory]});

      const entries = await vault.getEntries();
      const categories = await vault.getCategories();

      expect(entries.find(e => e.id === 'persisted')).toBeDefined();
      expect(categories.find(c => c.id === 'test-cat')).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('handles empty sync payload', async () => {
      const response = await request(server)
        .post('/sync')
        .set('Authorization', `Bearer ${validToken}`)
        .send({entries: [], categories: []});

      expect(response.status).toBe(200);
      expect(response.body.entries).toBeDefined();
      expect(response.body.categories).toBeDefined();
    });

    it('handles sync with existing data unchanged', async () => {
      const existingEntry = createEntry(
        'existing',
        'Existing',
        'user',
        'pass',
        'uncategorized',
      );
      await vault.upsertEntry(existingEntry);

      const olderEntry: Entry = {
        ...existingEntry,
        title: 'Older Title',
        updatedAt: new Date('2026-01-01'),
      };

      const response = await request(server)
        .post('/sync')
        .set('Authorization', `Bearer ${validToken}`)
        .send({entries: [olderEntry], categories: []});

      expect(response.status).toBe(200);
      const entry = response.body.entries.find(
        (e: Entry) => e.id === 'existing',
      );
      expect(entry.title).toBe('Existing');
    });

    it('handles local wins on same timestamp', async () => {
      const timestamp = new Date('2026-01-15T12:00:00Z');
      const localEntry = createEntry(
        'entry-1',
        'Local Title',
        'user',
        'pass',
        'uncategorized',
      );
      localEntry.updatedAt = timestamp;
      await vault.upsertEntry(localEntry);

      const sameTimeEntry: Entry = {
        ...localEntry,
        title: 'Remote Title',
        updatedAt: timestamp,
      };

      const response = await request(server)
        .post('/sync')
        .set('Authorization', `Bearer ${validToken}`)
        .send({entries: [sameTimeEntry], categories: []});

      expect(response.status).toBe(200);
      const entry = response.body.entries.find(
        (e: Entry) => e.id === 'entry-1',
      );
      expect(entry.title).toBe('Local Title');
    });
  });
});
