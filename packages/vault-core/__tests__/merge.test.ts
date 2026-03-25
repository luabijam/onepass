import { describe, it, expect } from '@jest/globals';
import { mergeEntries, mergeCategories } from '../src/sync/merge.js';
import { Entry, createEntry } from '../src/models/entry.js';
import { Category, createCategory, createDefaultCategory } from '../src/models/category.js';

describe('mergeEntries', () => {
  describe('remote entry not in local', () => {
    it('adds remote entry to result', () => {
      const local = new Map<string, Entry>();
      const remote = [
        createEntry('remote-1', 'GitHub', 'user@example.com', 'pass', 'uncategorized'),
      ];

      const result = mergeEntries(local, remote);

      expect(result.size).toBe(1);
      expect(result.get('remote-1')?.title).toBe('GitHub');
    });
  });

  describe('remote entry is newer', () => {
    it('replaces local with remote', () => {
      const localEntry: Entry = {
        id: 'entry-1',
        title: 'Old Title',
        username: 'user',
        password: 'old-pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      };

      const remoteEntry: Entry = {
        id: 'entry-1',
        title: 'New Title',
        username: 'user',
        password: 'new-pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
      };

      const local = new Map([['entry-1', localEntry]]);
      const result = mergeEntries(local, [remoteEntry]);

      expect(result.get('entry-1')?.title).toBe('New Title');
      expect(result.get('entry-1')?.password).toBe('new-pass');
    });
  });

  describe('local entry is newer', () => {
    it('keeps local version', () => {
      const localEntry: Entry = {
        id: 'entry-1',
        title: 'Newer Local',
        username: 'user',
        password: 'local-pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-03'),
      };

      const remoteEntry: Entry = {
        id: 'entry-1',
        title: 'Older Remote',
        username: 'user',
        password: 'remote-pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
      };

      const local = new Map([['entry-1', localEntry]]);
      const result = mergeEntries(local, [remoteEntry]);

      expect(result.get('entry-1')?.title).toBe('Newer Local');
      expect(result.get('entry-1')?.password).toBe('local-pass');
    });
  });

  describe('delete-wins', () => {
    it('sets deletedAt when remote is deleted', () => {
      const localEntry: Entry = {
        id: 'entry-1',
        title: 'Active',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-03'),
      };

      const remoteEntry: Entry = {
        id: 'entry-1',
        title: 'Deleted',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
        deletedAt: new Date('2026-01-02'),
      };

      const local = new Map([['entry-1', localEntry]]);
      const result = mergeEntries(local, [remoteEntry]);

      expect(result.get('entry-1')?.deletedAt).toEqual(new Date('2026-01-02'));
    });

    it('sets deletedAt when local is deleted', () => {
      const localEntry: Entry = {
        id: 'entry-1',
        title: 'Deleted',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-03'),
        deletedAt: new Date('2026-01-03'),
      };

      const remoteEntry: Entry = {
        id: 'entry-1',
        title: 'Active',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
      };

      const local = new Map([['entry-1', localEntry]]);
      const result = mergeEntries(local, [remoteEntry]);

      expect(result.get('entry-1')?.deletedAt).toEqual(new Date('2026-01-03'));
    });

    it('preserves earlier deletion timestamp when both deleted', () => {
      const localEntry: Entry = {
        id: 'entry-1',
        title: 'Local',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-03'),
        deletedAt: new Date('2026-01-03'),
      };

      const remoteEntry: Entry = {
        id: 'entry-1',
        title: 'Remote',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
        deletedAt: new Date('2026-01-02'),
      };

      const local = new Map([['entry-1', localEntry]]);
      const result = mergeEntries(local, [remoteEntry]);

      expect(result.get('entry-1')?.deletedAt).toEqual(new Date('2026-01-02'));
    });
  });

  describe('same timestamp', () => {
    it('keeps local version (local wins tie)', () => {
      const timestamp = new Date('2026-01-02T12:00:00Z');
      const localEntry: Entry = {
        id: 'entry-1',
        title: 'Local Version',
        username: 'user',
        password: 'local',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: timestamp,
      };

      const remoteEntry: Entry = {
        id: 'entry-1',
        title: 'Remote Version',
        username: 'user',
        password: 'remote',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: timestamp,
      };

      const local = new Map([['entry-1', localEntry]]);
      const result = mergeEntries(local, [remoteEntry]);

      expect(result.get('entry-1')?.title).toBe('Local Version');
    });
  });

  describe('does not mutate inputs', () => {
    it('does not modify local map', () => {
      const localEntry: Entry = {
        id: 'entry-1',
        title: 'Local',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      };

      const local = new Map([['entry-1', localEntry]]);
      const remote = [createEntry('entry-1', 'Remote', 'user', 'pass', 'uncategorized')];

      mergeEntries(local, remote);

      expect(local.size).toBe(1);
      expect(local.get('entry-1')?.title).toBe('Local');
    });
  });
});

describe('mergeCategories', () => {
  describe('remote category not in local', () => {
    it('adds remote category to result', () => {
      const local = new Map<string, Category>();
      const remote = [createCategory('work-id', 'Work', '💼', '#FF5733')];

      const result = mergeCategories(local, remote);

      expect(result.size).toBe(1);
      expect(result.get('work-id')?.name).toBe('Work');
    });
  });

  describe('remote category is newer', () => {
    it('replaces local with remote', () => {
      const localCat: Category = {
        id: 'cat-1',
        name: 'Old Name',
        icon: '📁',
        color: '#000000',
        updatedAt: new Date('2026-01-01'),
      };

      const remoteCat: Category = {
        id: 'cat-1',
        name: 'New Name',
        icon: '💼',
        color: '#FF5733',
        updatedAt: new Date('2026-01-02'),
      };

      const local = new Map([['cat-1', localCat]]);
      const result = mergeCategories(local, [remoteCat]);

      expect(result.get('cat-1')?.name).toBe('New Name');
      expect(result.get('cat-1')?.icon).toBe('💼');
    });
  });

  describe('local category is newer', () => {
    it('keeps local version', () => {
      const localCat: Category = {
        id: 'cat-1',
        name: 'Newer Local',
        icon: '💼',
        color: '#FF5733',
        updatedAt: new Date('2026-01-03'),
      };

      const remoteCat: Category = {
        id: 'cat-1',
        name: 'Older Remote',
        icon: '📁',
        color: '#000000',
        updatedAt: new Date('2026-01-02'),
      };

      const local = new Map([['cat-1', localCat]]);
      const result = mergeCategories(local, [remoteCat]);

      expect(result.get('cat-1')?.name).toBe('Newer Local');
    });
  });

  describe('delete-wins', () => {
    it('sets deletedAt when remote is deleted', () => {
      const localCat: Category = {
        id: 'cat-1',
        name: 'Active',
        icon: '📁',
        color: '#000000',
        updatedAt: new Date('2026-01-03'),
      };

      const remoteCat: Category = {
        id: 'cat-1',
        name: 'Deleted',
        icon: '📁',
        color: '#000000',
        updatedAt: new Date('2026-01-02'),
        deletedAt: new Date('2026-01-02'),
      };

      const local = new Map([['cat-1', localCat]]);
      const result = mergeCategories(local, [remoteCat]);

      expect(result.get('cat-1')?.deletedAt).toEqual(new Date('2026-01-02'));
    });

    it('sets deletedAt when local is deleted', () => {
      const localCat: Category = {
        id: 'cat-1',
        name: 'Deleted',
        icon: '📁',
        color: '#000000',
        updatedAt: new Date('2026-01-03'),
        deletedAt: new Date('2026-01-03'),
      };

      const remoteCat: Category = {
        id: 'cat-1',
        name: 'Active',
        icon: '📁',
        color: '#000000',
        updatedAt: new Date('2026-01-02'),
      };

      const local = new Map([['cat-1', localCat]]);
      const result = mergeCategories(local, [remoteCat]);

      expect(result.get('cat-1')?.deletedAt).toEqual(new Date('2026-01-03'));
    });

    it('preserves earlier deletion timestamp when both deleted', () => {
      const localCat: Category = {
        id: 'cat-1',
        name: 'Local',
        icon: '📁',
        color: '#000000',
        updatedAt: new Date('2026-01-03'),
        deletedAt: new Date('2026-01-03'),
      };

      const remoteCat: Category = {
        id: 'cat-1',
        name: 'Remote',
        icon: '📁',
        color: '#000000',
        updatedAt: new Date('2026-01-02'),
        deletedAt: new Date('2026-01-02'),
      };

      const local = new Map([['cat-1', localCat]]);
      const result = mergeCategories(local, [remoteCat]);

      expect(result.get('cat-1')?.deletedAt).toEqual(new Date('2026-01-02'));
    });
  });

  describe('default category handling', () => {
    it('merges default category like any other', () => {
      const localDefault = createDefaultCategory();
      const remoteDefault: Category = {
        ...createDefaultCategory(),
        updatedAt: new Date('2026-02-01'),
      };

      const local = new Map([['uncategorized', localDefault]]);
      const result = mergeCategories(local, [remoteDefault]);

      expect(result.get('uncategorized')?.updatedAt).toEqual(new Date('2026-02-01'));
    });
  });

  describe('does not mutate inputs', () => {
    it('does not modify local map', () => {
      const localCat: Category = {
        id: 'cat-1',
        name: 'Local',
        icon: '📁',
        color: '#000000',
        updatedAt: new Date('2026-01-01'),
      };

      const local = new Map([['cat-1', localCat]]);
      const remote = [createCategory('cat-1', 'Remote', '💼', '#FF5733')];

      mergeCategories(local, remote);

      expect(local.size).toBe(1);
      expect(local.get('cat-1')?.name).toBe('Local');
    });
  });
});
