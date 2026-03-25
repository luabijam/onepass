import { describe, it, expect } from '@jest/globals';
import {
  Entry,
  createEntry,
  isEntryDeleted,
  softDeleteEntry,
  restoreEntry,
} from '../src/models/entry.js';

describe('Entry model', () => {
  describe('createEntry', () => {
    it('creates an entry with required fields', () => {
      const entry = createEntry('id-1', 'GitHub', 'user@example.com', 'secret123', 'work');

      expect(entry.id).toBe('id-1');
      expect(entry.title).toBe('GitHub');
      expect(entry.username).toBe('user@example.com');
      expect(entry.password).toBe('secret123');
      expect(entry.categoryId).toBe('work');
      expect(entry.isFavorite).toBe(false);
      expect(entry.createdAt).toBeInstanceOf(Date);
      expect(entry.updatedAt).toBeInstanceOf(Date);
      expect(entry.deletedAt).toBeUndefined();
    });

    it('sets createdAt and updatedAt to the same time', () => {
      const entry = createEntry('id-1', 'Test', 'user', 'pass', 'uncategorized');

      expect(entry.createdAt.getTime()).toBe(entry.updatedAt.getTime());
    });
  });

  describe('isEntryDeleted', () => {
    it('returns false for non-deleted entry', () => {
      const entry: Entry = {
        id: '1',
        title: 'Test',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(isEntryDeleted(entry)).toBe(false);
    });

    it('returns true for soft-deleted entry', () => {
      const entry: Entry = {
        id: '1',
        title: 'Test',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(),
      };

      expect(isEntryDeleted(entry)).toBe(true);
    });
  });

  describe('softDeleteEntry', () => {
    it('marks entry as deleted', () => {
      const entry: Entry = {
        id: '1',
        title: 'Test',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      };

      const deleted = softDeleteEntry(entry);

      expect(deleted.deletedAt).toBeInstanceOf(Date);
      expect(deleted.id).toBe(entry.id);
      expect(deleted.title).toBe(entry.title);
    });

    it('does not mutate original entry', () => {
      const entry: Entry = {
        id: '1',
        title: 'Test',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      softDeleteEntry(entry);

      expect(entry.deletedAt).toBeUndefined();
    });
  });

  describe('restoreEntry', () => {
    it('removes deletedAt from entry', () => {
      const entry: Entry = {
        id: '1',
        title: 'Test',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(),
      };

      const restored = restoreEntry(entry);

      expect(restored.deletedAt).toBeUndefined();
      expect(restored.id).toBe(entry.id);
    });

    it('returns entry unchanged if not deleted', () => {
      const entry: Entry = {
        id: '1',
        title: 'Test',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const restored = restoreEntry(entry);

      expect(restored).toEqual(entry);
    });
  });
});
