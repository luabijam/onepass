import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { CategoryListScreen } from '../src/screens/categories/CategoryListScreen';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  updatedAt: Date;
  deletedAt?: Date;
}

const createMockCategory = (overrides: Partial<Category> = {}): Category => ({
  id: '1',
  name: 'Test Category',
  icon: '📁',
  color: '#8E8E93',
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

describe('CategoryListScreen', () => {
  const mockOnCategoryPress = jest.fn();
  const mockOnCreatePress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Display categories', () => {
    it('shows empty state when no categories', () => {
      render(
        <CategoryListScreen
          categories={[]}
          onCategoryPress={mockOnCategoryPress}
          onCreatePress={mockOnCreatePress}
        />
      );
      expect(screen.getByText('No categories')).toBeTruthy();
    });

    it('displays all categories sorted by name', () => {
      const categories = [
        createMockCategory({ id: '1', name: 'Zebra Folder' }),
        createMockCategory({ id: '2', name: 'Apple Folder' }),
        createMockCategory({ id: '3', name: 'Middle Folder' }),
      ];
      render(
        <CategoryListScreen
          categories={categories}
          onCategoryPress={mockOnCategoryPress}
          onCreatePress={mockOnCreatePress}
        />
      );

      const names = screen.getAllByText(/Folder$/);
      expect(names[0]).toHaveTextContent('Apple Folder');
      expect(names[1]).toHaveTextContent('Middle Folder');
      expect(names[2]).toHaveTextContent('Zebra Folder');
    });

    it('shows name and icon for each category', () => {
      const categories = [createMockCategory({ name: 'Work', icon: '💼', color: '#FF9500' })];
      render(
        <CategoryListScreen
          categories={categories}
          onCategoryPress={mockOnCategoryPress}
          onCreatePress={mockOnCreatePress}
        />
      );

      expect(screen.getByText('Work')).toBeTruthy();
      expect(screen.getByText('💼')).toBeTruthy();
    });

    it('filters out soft-deleted categories', () => {
      const categories = [
        createMockCategory({ id: '1', name: 'Active Category' }),
        createMockCategory({ id: '2', name: 'Deleted Category', deletedAt: new Date() }),
      ];
      render(
        <CategoryListScreen
          categories={categories}
          onCategoryPress={mockOnCategoryPress}
          onCreatePress={mockOnCreatePress}
        />
      );

      expect(screen.getByText('Active Category')).toBeTruthy();
      expect(screen.queryByText('Deleted Category')).toBeNull();
    });
  });

  describe('Search categories', () => {
    it('filters categories by name', () => {
      const categories = [
        createMockCategory({ id: '1', name: 'Work' }),
        createMockCategory({ id: '2', name: 'Personal' }),
        createMockCategory({ id: '3', name: 'Social' }),
      ];
      render(
        <CategoryListScreen
          categories={categories}
          onCategoryPress={mockOnCategoryPress}
          onCreatePress={mockOnCreatePress}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search categories...');
      fireEvent.changeText(searchInput, 'Work');

      expect(screen.getByText('Work')).toBeTruthy();
      expect(screen.queryByText('Personal')).toBeNull();
      expect(screen.queryByText('Social')).toBeNull();
    });

    it('shows no results message when search has no matches', () => {
      const categories = [createMockCategory({ name: 'Work' })];
      render(
        <CategoryListScreen
          categories={categories}
          onCategoryPress={mockOnCategoryPress}
          onCreatePress={mockOnCreatePress}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search categories...');
      fireEvent.changeText(searchInput, 'nonexistent');

      expect(screen.getByText('No matching categories')).toBeTruthy();
    });
  });

  describe('Tap category', () => {
    it('calls onCategoryPress when category is tapped', () => {
      const categories = [createMockCategory({ id: '123', name: 'Work' })];
      render(
        <CategoryListScreen
          categories={categories}
          onCategoryPress={mockOnCategoryPress}
          onCreatePress={mockOnCreatePress}
        />
      );

      fireEvent.press(screen.getByText('Work'));

      expect(mockOnCategoryPress).toHaveBeenCalledWith('123');
    });
  });

  describe('Create new category', () => {
    it('calls onCreatePress when FAB is pressed', () => {
      render(
        <CategoryListScreen
          categories={[]}
          onCategoryPress={mockOnCategoryPress}
          onCreatePress={mockOnCreatePress}
        />
      );

      const fab = screen.getByTestId('create-category-fab');
      fireEvent.press(fab);

      expect(mockOnCreatePress).toHaveBeenCalled();
    });
  });
});
