/**
 * Default category ID for uncategorized entries.
 */
export const DEFAULT_CATEGORY_ID = 'uncategorized';

/**
 * A category for organizing entries.
 */
export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * Creates the default "Uncategorized" category.
 */
export function createDefaultCategory(): Category {
  return {
    id: DEFAULT_CATEGORY_ID,
    name: 'Uncategorized',
    icon: '📁',
    color: '#8E8E93',
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };
}

/**
 * Creates a new category with the given properties.
 */
export function createCategory(id: string, name: string, icon: string, color: string): Category {
  return {
    id,
    name,
    icon,
    color,
    updatedAt: new Date(),
  };
}

/**
 * Checks if a category is soft-deleted.
 */
export function isCategoryDeleted(category: Category): boolean {
  return category.deletedAt !== undefined;
}

/**
 * Marks a category as soft-deleted.
 */
export function softDeleteCategory(category: Category): Category {
  return {
    ...category,
    deletedAt: new Date(),
  };
}

/**
 * Restores a soft-deleted category.
 */
export function restoreCategory(category: Category): Category {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { deletedAt, ...rest } = category;
  return rest;
}

/**
 * Checks if a category is the default uncategorized category.
 */
export function isDefaultCategory(category: Category): boolean {
  return category.id === DEFAULT_CATEGORY_ID;
}
