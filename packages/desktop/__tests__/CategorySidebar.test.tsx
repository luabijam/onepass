import React from 'react';
import {render, screen, fireEvent} from '@testing-library/react-native';
import {CategorySidebar} from '../src/components/CategorySidebar';
import type {Category} from '@onepass/vault-core';

describe('CategorySidebar', () => {
  const mockCategories: Category[] = [
    {
      id: 'cat-1',
      name: 'Social',
      icon: 'person',
      color: '#FF5722',
      updatedAt: new Date(),
    },
    {
      id: 'cat-2',
      name: 'Work',
      icon: 'folder',
      color: '#2196F3',
      updatedAt: new Date(),
    },
    {
      id: 'cat-3',
      name: 'Finance',
      icon: 'vpn-key',
      color: '#4CAF50',
      updatedAt: new Date(),
    },
  ];

  const mockCategoryCounts: Record<string, number> = {
    'cat-1': 5,
    'cat-2': 3,
    'cat-3': 2,
  };

  const defaultProps = {
    categories: mockCategories,
    selectedCategoryId: null,
    onCategoryPress: jest.fn(),
    allEntriesCount: 10,
    categoryCounts: mockCategoryCounts,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all categories', () => {
    render(<CategorySidebar {...defaultProps} />);

    expect(screen.getByText('Social')).toBeTruthy();
    expect(screen.getByText('Work')).toBeTruthy();
    expect(screen.getByText('Finance')).toBeTruthy();
  });

  it('renders All Entries option', () => {
    render(<CategorySidebar {...defaultProps} />);

    expect(screen.getByText('All Entries')).toBeTruthy();
    expect(screen.getByText('10')).toBeTruthy();
  });

  it('shows correct entry counts per category', () => {
    render(<CategorySidebar {...defaultProps} />);

    expect(screen.getByText('5')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('calls onCategoryPress when a category is pressed', () => {
    const onCategoryPress = jest.fn();
    render(
      <CategorySidebar {...defaultProps} onCategoryPress={onCategoryPress} />,
    );

    fireEvent.press(screen.getByTestId('category-cat-1'));

    expect(onCategoryPress).toHaveBeenCalledWith('cat-1');
  });

  it('calls onCategoryPress with null when All Entries is pressed', () => {
    const onCategoryPress = jest.fn();
    render(
      <CategorySidebar {...defaultProps} onCategoryPress={onCategoryPress} />,
    );

    fireEvent.press(screen.getByTestId('category-all'));

    expect(onCategoryPress).toHaveBeenCalledWith(null);
  });

  it('highlights selected category', () => {
    render(<CategorySidebar {...defaultProps} selectedCategoryId="cat-1" />);

    const selectedCategory = screen.getByTestId('category-cat-1');
    expect(selectedCategory).toBeTruthy();
  });

  it('highlights All Entries when no category is selected', () => {
    render(<CategorySidebar {...defaultProps} selectedCategoryId={null} />);

    expect(screen.getByTestId('category-all')).toBeTruthy();
  });

  it('renders empty list gracefully', () => {
    render(
      <CategorySidebar
        {...defaultProps}
        categories={[]}
        allEntriesCount={0}
        categoryCounts={{}}
      />,
    );

    expect(screen.getByText('All Entries')).toBeTruthy();
    expect(screen.getByText('0')).toBeTruthy();
  });
});
