import { describe, it, expect } from '@jest/globals';
import {
  Category,
  DEFAULT_CATEGORY_ID,
  createDefaultCategory,
  createCategory,
  isCategoryDeleted,
  softDeleteCategory,
  restoreCategory,
  isDefaultCategory,
} from '../src/models/category.js';

describe('Category model', () => {
  describe('DEFAULT_CATEGORY_ID', () => {
    it('has expected value', () => {
      expect(DEFAULT_CATEGORY_ID).toBe('uncategorized');
    });
  });

  describe('createDefaultCategory', () => {
    it('creates the default category', () => {
      const category = createDefaultCategory();

      expect(category.id).toBe('uncategorized');
      expect(category.name).toBe('Uncategorized');
      expect(category.icon).toBe('📁');
      expect(category.color).toBe('#8E8E93');
      expect(category.updatedAt).toBeInstanceOf(Date);
      expect(category.deletedAt).toBeUndefined();
    });
  });

  describe('createCategory', () => {
    it('creates a category with all properties', () => {
      const category = createCategory('work-id', 'Work', '💼', '#FF5733');

      expect(category.id).toBe('work-id');
      expect(category.name).toBe('Work');
      expect(category.icon).toBe('💼');
      expect(category.color).toBe('#FF5733');
      expect(category.updatedAt).toBeInstanceOf(Date);
      expect(category.deletedAt).toBeUndefined();
    });
  });

  describe('isCategoryDeleted', () => {
    it('returns false for non-deleted category', () => {
      const category: Category = {
        id: '1',
        name: 'Test',
        icon: '📁',
        color: '#000000',
        updatedAt: new Date(),
      };

      expect(isCategoryDeleted(category)).toBe(false);
    });

    it('returns true for soft-deleted category', () => {
      const category: Category = {
        id: '1',
        name: 'Test',
        icon: '📁',
        color: '#000000',
        updatedAt: new Date(),
        deletedAt: new Date(),
      };

      expect(isCategoryDeleted(category)).toBe(true);
    });
  });

  describe('softDeleteCategory', () => {
    it('marks category as deleted', () => {
      const category: Category = {
        id: '1',
        name: 'Test',
        icon: '📁',
        color: '#000000',
        updatedAt: new Date('2026-01-01'),
      };

      const deleted = softDeleteCategory(category);

      expect(deleted.deletedAt).toBeInstanceOf(Date);
      expect(deleted.id).toBe(category.id);
      expect(deleted.name).toBe(category.name);
    });

    it('does not mutate original category', () => {
      const category: Category = {
        id: '1',
        name: 'Test',
        icon: '📁',
        color: '#000000',
        updatedAt: new Date(),
      };

      softDeleteCategory(category);

      expect(category.deletedAt).toBeUndefined();
    });
  });

  describe('restoreCategory', () => {
    it('removes deletedAt from category', () => {
      const category: Category = {
        id: '1',
        name: 'Test',
        icon: '📁',
        color: '#000000',
        updatedAt: new Date(),
        deletedAt: new Date(),
      };

      const restored = restoreCategory(category);

      expect(restored.deletedAt).toBeUndefined();
      expect(restored.id).toBe(category.id);
    });

    it('returns category unchanged if not deleted', () => {
      const category: Category = {
        id: '1',
        name: 'Test',
        icon: '📁',
        color: '#000000',
        updatedAt: new Date(),
      };

      const restored = restoreCategory(category);

      expect(restored).toEqual(category);
    });
  });

  describe('isDefaultCategory', () => {
    it('returns true for default category', () => {
      const category = createDefaultCategory();

      expect(isDefaultCategory(category)).toBe(true);
    });

    it('returns false for non-default category', () => {
      const category: Category = {
        id: 'work',
        name: 'Work',
        icon: '💼',
        color: '#FF5733',
        updatedAt: new Date(),
      };

      expect(isDefaultCategory(category)).toBe(false);
    });
  });
});
