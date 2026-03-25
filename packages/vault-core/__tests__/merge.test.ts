import { describe, it, expect } from '@jest/globals';
import { mergeEntries, mergeCategories } from '../src/sync/merge.js';
import { Entry, createEntry } from '../src/models/entry.js';
import { Category, createCategory, createDefaultCategory } from '../src/models/category.js';

describe('mergeEntries', () => {
  describe('empty inputs', () => {
    it('returns empty map when both local and remote are empty', () => {
      const local = new Map<string, Entry>();
      const remote: Entry[] = [];

      const result = mergeEntries(local, remote);

      expect(result.size).toBe(0);
    });

    it('returns copy of remote when local is empty', () => {
      const local = new Map<string, Entry>();
      const remote = [
        createEntry('entry-1', 'GitHub', 'user@example.com', 'pass', 'uncategorized'),
        createEntry('entry-2', 'GitLab', 'user@example.com', 'pass2', 'work'),
      ];

      const result = mergeEntries(local, remote);

      expect(result.size).toBe(2);
      expect(result.get('entry-1')?.title).toBe('GitHub');
      expect(result.get('entry-2')?.title).toBe('GitLab');
    });

    it('returns copy of local when remote is empty', () => {
      const localEntry: Entry = {
        id: 'entry-1',
        title: 'Local Entry',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      };

      const local = new Map([['entry-1', localEntry]]);
      const remote: Entry[] = [];

      const result = mergeEntries(local, remote);

      expect(result.size).toBe(1);
      expect(result.get('entry-1')?.title).toBe('Local Entry');
    });
  });

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

    it('preserves local deletion timestamp when local deleted earlier', () => {
      const localEntry: Entry = {
        id: 'entry-1',
        title: 'Local',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
        deletedAt: new Date('2026-01-01'),
      };

      const remoteEntry: Entry = {
        id: 'entry-1',
        title: 'Remote',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-03'),
        deletedAt: new Date('2026-01-03'),
      };

      const local = new Map([['entry-1', localEntry]]);
      const result = mergeEntries(local, [remoteEntry]);

      expect(result.get('entry-1')?.deletedAt).toEqual(new Date('2026-01-01'));
    });

    it('uses remote content when both deleted and remote is newer', () => {
      const localEntry: Entry = {
        id: 'entry-1',
        title: 'Local Deleted',
        username: 'local-user',
        password: 'local-pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
        deletedAt: new Date('2026-01-02'),
      };

      const remoteEntry: Entry = {
        id: 'entry-1',
        title: 'Remote Deleted',
        username: 'remote-user',
        password: 'remote-pass',
        categoryId: 'work',
        isFavorite: true,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-03'),
        deletedAt: new Date('2026-01-02'),
      };

      const local = new Map([['entry-1', localEntry]]);
      const result = mergeEntries(local, [remoteEntry]);

      expect(result.get('entry-1')?.title).toBe('Remote Deleted');
      expect(result.get('entry-1')?.username).toBe('remote-user');
      expect(result.get('entry-1')?.deletedAt).toEqual(new Date('2026-01-02'));
    });

    it('uses remote content when remote is deleted and newer', () => {
      const localEntry: Entry = {
        id: 'entry-1',
        title: 'Active Local',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
      };

      const remoteEntry: Entry = {
        id: 'entry-1',
        title: 'Deleted Remote',
        username: 'deleted-user',
        password: 'deleted-pass',
        categoryId: 'work',
        isFavorite: true,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-03'),
        deletedAt: new Date('2026-01-03'),
      };

      const local = new Map([['entry-1', localEntry]]);
      const result = mergeEntries(local, [remoteEntry]);

      expect(result.get('entry-1')?.title).toBe('Deleted Remote');
      expect(result.get('entry-1')?.username).toBe('deleted-user');
      expect(result.get('entry-1')?.deletedAt).toEqual(new Date('2026-01-03'));
    });

    it('preserves local deletion timestamp when local is deleted and newer', () => {
      const localEntry: Entry = {
        id: 'entry-1',
        title: 'Deleted Local',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-03'),
        deletedAt: new Date('2026-01-01'),
      };

      const remoteEntry: Entry = {
        id: 'entry-1',
        title: 'Active Remote',
        username: 'remote-user',
        password: 'remote-pass',
        categoryId: 'work',
        isFavorite: true,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
      };

      const local = new Map([['entry-1', localEntry]]);
      const result = mergeEntries(local, [remoteEntry]);

      expect(result.get('entry-1')?.title).toBe('Deleted Local');
      expect(result.get('entry-1')?.deletedAt).toEqual(new Date('2026-01-01'));
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

  describe('multiple entries', () => {
    it('merges multiple entries in single operation', () => {
      const localEntry1: Entry = {
        id: 'entry-1',
        title: 'Local 1',
        username: 'user1',
        password: 'pass1',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      };

      const localEntry2: Entry = {
        id: 'entry-2',
        title: 'Local 2',
        username: 'user2',
        password: 'pass2',
        categoryId: 'work',
        isFavorite: true,
        createdAt: new Date('2026-01-02'),
        updatedAt: new Date('2026-01-03'),
      };

      const local = new Map([
        ['entry-1', localEntry1],
        ['entry-2', localEntry2],
      ]);

      const remote = [
        {
          ...createEntry('entry-1', 'Remote 1 Updated', 'user1', 'newpass', 'uncategorized'),
          updatedAt: new Date('2026-01-02'),
        },
        {
          ...createEntry('entry-2', 'Remote 2 Older', 'user2', 'oldpass', 'work'),
          updatedAt: new Date('2026-01-02'),
        },
        createEntry('entry-3', 'New Entry', 'user3', 'pass3', 'personal'),
      ];

      const result = mergeEntries(local, remote);

      expect(result.size).toBe(3);
      expect(result.get('entry-1')?.title).toBe('Remote 1 Updated');
      expect(result.get('entry-2')?.title).toBe('Local 2');
      expect(result.get('entry-3')?.title).toBe('New Entry');
    });

    it('handles mixed delete-wins across multiple entries', () => {
      const localActive: Entry = {
        id: 'entry-1',
        title: 'Active Local',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
      };

      const localDeleted: Entry = {
        id: 'entry-2',
        title: 'Deleted Local',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-03'),
        deletedAt: new Date('2026-01-03'),
      };

      const remoteDeleted: Entry = {
        id: 'entry-1',
        title: 'Deleted Remote',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-03'),
        deletedAt: new Date('2026-01-03'),
      };

      const remoteActive: Entry = {
        id: 'entry-2',
        title: 'Active Remote',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
      };

      const local = new Map([
        ['entry-1', localActive],
        ['entry-2', localDeleted],
      ]);

      const result = mergeEntries(local, [remoteDeleted, remoteActive]);

      expect(result.get('entry-1')?.deletedAt).toEqual(new Date('2026-01-03'));
      expect(result.get('entry-2')?.deletedAt).toEqual(new Date('2026-01-03'));
    });
  });
});

describe('mergeCategories', () => {
  describe('empty inputs', () => {
    it('returns empty map when both local and remote are empty', () => {
      const local = new Map<string, Category>();
      const remote: Category[] = [];

      const result = mergeCategories(local, remote);

      expect(result.size).toBe(0);
    });

    it('returns copy of remote when local is empty', () => {
      const local = new Map<string, Category>();
      const remote = [
        createCategory('cat-1', 'Work', '💼', '#FF5733'),
        createCategory('cat-2', 'Personal', '🏠', '#00FF00'),
      ];

      const result = mergeCategories(local, remote);

      expect(result.size).toBe(2);
      expect(result.get('cat-1')?.name).toBe('Work');
      expect(result.get('cat-2')?.name).toBe('Personal');
    });

    it('returns copy of local when remote is empty', () => {
      const localCat: Category = {
        id: 'cat-1',
        name: 'Local Category',
        icon: '📁',
        color: '#000000',
        updatedAt: new Date('2026-01-01'),
      };

      const local = new Map([['cat-1', localCat]]);
      const remote: Category[] = [];

      const result = mergeCategories(local, remote);

      expect(result.size).toBe(1);
      expect(result.get('cat-1')?.name).toBe('Local Category');
    });
  });

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

    it('preserves local deletion timestamp when local deleted earlier', () => {
      const localCat: Category = {
        id: 'cat-1',
        name: 'Local',
        icon: '📁',
        color: '#000000',
        updatedAt: new Date('2026-01-02'),
        deletedAt: new Date('2026-01-01'),
      };

      const remoteCat: Category = {
        id: 'cat-1',
        name: 'Remote',
        icon: '📁',
        color: '#000000',
        updatedAt: new Date('2026-01-03'),
        deletedAt: new Date('2026-01-03'),
      };

      const local = new Map([['cat-1', localCat]]);
      const result = mergeCategories(local, [remoteCat]);

      expect(result.get('cat-1')?.deletedAt).toEqual(new Date('2026-01-01'));
    });

    it('uses remote content when both deleted and remote is newer', () => {
      const localCat: Category = {
        id: 'cat-1',
        name: 'Local Deleted',
        icon: '📁',
        color: '#000000',
        updatedAt: new Date('2026-01-02'),
        deletedAt: new Date('2026-01-02'),
      };

      const remoteCat: Category = {
        id: 'cat-1',
        name: 'Remote Deleted',
        icon: '💼',
        color: '#FF5733',
        updatedAt: new Date('2026-01-03'),
        deletedAt: new Date('2026-01-02'),
      };

      const local = new Map([['cat-1', localCat]]);
      const result = mergeCategories(local, [remoteCat]);

      expect(result.get('cat-1')?.name).toBe('Remote Deleted');
      expect(result.get('cat-1')?.icon).toBe('💼');
      expect(result.get('cat-1')?.deletedAt).toEqual(new Date('2026-01-02'));
    });

    it('uses remote content when remote is deleted and newer', () => {
      const localCat: Category = {
        id: 'cat-1',
        name: 'Active Local',
        icon: '📁',
        color: '#000000',
        updatedAt: new Date('2026-01-02'),
      };

      const remoteCat: Category = {
        id: 'cat-1',
        name: 'Deleted Remote',
        icon: '💼',
        color: '#FF5733',
        updatedAt: new Date('2026-01-03'),
        deletedAt: new Date('2026-01-03'),
      };

      const local = new Map([['cat-1', localCat]]);
      const result = mergeCategories(local, [remoteCat]);

      expect(result.get('cat-1')?.name).toBe('Deleted Remote');
      expect(result.get('cat-1')?.deletedAt).toEqual(new Date('2026-01-03'));
    });

    it('preserves local deletion when local is deleted and newer', () => {
      const localCat: Category = {
        id: 'cat-1',
        name: 'Deleted Local',
        icon: '📁',
        color: '#000000',
        updatedAt: new Date('2026-01-03'),
        deletedAt: new Date('2026-01-01'),
      };

      const remoteCat: Category = {
        id: 'cat-1',
        name: 'Active Remote',
        icon: '💼',
        color: '#FF5733',
        updatedAt: new Date('2026-01-02'),
      };

      const local = new Map([['cat-1', localCat]]);
      const result = mergeCategories(local, [remoteCat]);

      expect(result.get('cat-1')?.name).toBe('Deleted Local');
      expect(result.get('cat-1')?.deletedAt).toEqual(new Date('2026-01-01'));
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

  describe('same timestamp', () => {
    it('keeps local version (local wins tie)', () => {
      const timestamp = new Date('2026-01-02T12:00:00Z');
      const localCat: Category = {
        id: 'cat-1',
        name: 'Local Version',
        icon: '📁',
        color: '#000000',
        updatedAt: timestamp,
      };

      const remoteCat: Category = {
        id: 'cat-1',
        name: 'Remote Version',
        icon: '💼',
        color: '#FF5733',
        updatedAt: timestamp,
      };

      const local = new Map([['cat-1', localCat]]);
      const result = mergeCategories(local, [remoteCat]);

      expect(result.get('cat-1')?.name).toBe('Local Version');
    });
  });

  describe('multiple categories', () => {
    it('merges multiple categories in single operation', () => {
      const localCat1: Category = {
        id: 'cat-1',
        name: 'Local 1',
        icon: '📁',
        color: '#000000',
        updatedAt: new Date('2026-01-01'),
      };

      const localCat2: Category = {
        id: 'cat-2',
        name: 'Local 2',
        icon: '💼',
        color: '#FF5733',
        updatedAt: new Date('2026-01-03'),
      };

      const local = new Map([
        ['cat-1', localCat1],
        ['cat-2', localCat2],
      ]);

      const remote = [
        {
          ...createCategory('cat-1', 'Remote 1 Updated', '📄', '#111111'),
          updatedAt: new Date('2026-01-02'),
        },
        {
          ...createCategory('cat-2', 'Remote 2 Older', '📋', '#222222'),
          updatedAt: new Date('2026-01-02'),
        },
        createCategory('cat-3', 'New Category', '🎨', '#333333'),
      ];

      const result = mergeCategories(local, remote);

      expect(result.size).toBe(3);
      expect(result.get('cat-1')?.name).toBe('Remote 1 Updated');
      expect(result.get('cat-2')?.name).toBe('Local 2');
      expect(result.get('cat-3')?.name).toBe('New Category');
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
