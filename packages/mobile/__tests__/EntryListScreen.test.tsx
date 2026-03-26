import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { EntryListScreen } from '../src/screens/entries/EntryListScreen';

interface Entry {
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

const createMockEntry = (overrides: Partial<Entry> = {}): Entry => ({
  id: '1',
  title: 'Test Entry',
  username: 'user@example.com',
  password: 'password123',
  categoryId: 'uncategorized',
  isFavorite: false,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

describe('EntryListScreen', () => {
  const mockOnEntryPress = jest.fn();
  const mockOnCreatePress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Display entries', () => {
    it('shows empty state when no entries', () => {
      render(
        <EntryListScreen
          entries={[]}
          onEntryPress={mockOnEntryPress}
          onCreatePress={mockOnCreatePress}
        />
      );
      expect(screen.getByText('No entries')).toBeTruthy();
    });

    it('displays all entries sorted by title', () => {
      const entries = [
        createMockEntry({ id: '1', title: 'Zebra Site' }),
        createMockEntry({ id: '2', title: 'Apple Site' }),
        createMockEntry({ id: '3', title: 'Middle Site' }),
      ];
      render(
        <EntryListScreen
          entries={entries}
          onEntryPress={mockOnEntryPress}
          onCreatePress={mockOnCreatePress}
        />
      );

      const titles = screen.getAllByText(/Site$/);
      expect(titles[0]).toHaveTextContent('Apple Site');
      expect(titles[1]).toHaveTextContent('Middle Site');
      expect(titles[2]).toHaveTextContent('Zebra Site');
    });

    it('shows title and username for each entry', () => {
      const entries = [createMockEntry({ title: 'Example', username: 'john@example.com' })];
      render(
        <EntryListScreen
          entries={entries}
          onEntryPress={mockOnEntryPress}
          onCreatePress={mockOnCreatePress}
        />
      );

      expect(screen.getByText('Example')).toBeTruthy();
      expect(screen.getByText('john@example.com')).toBeTruthy();
    });

    it('filters out soft-deleted entries', () => {
      const entries = [
        createMockEntry({ id: '1', title: 'Active Entry' }),
        createMockEntry({ id: '2', title: 'Deleted Entry', deletedAt: new Date() }),
      ];
      render(
        <EntryListScreen
          entries={entries}
          onEntryPress={mockOnEntryPress}
          onCreatePress={mockOnCreatePress}
        />
      );

      expect(screen.getByText('Active Entry')).toBeTruthy();
      expect(screen.queryByText('Deleted Entry')).toBeNull();
    });
  });

  describe('Search entries', () => {
    it('filters entries by title', () => {
      const entries = [
        createMockEntry({ id: '1', title: 'GitHub', username: 'dev' }),
        createMockEntry({ id: '2', title: 'GitLab', username: 'dev2' }),
        createMockEntry({ id: '3', title: 'AWS', username: 'admin' }),
      ];
      render(
        <EntryListScreen
          entries={entries}
          onEntryPress={mockOnEntryPress}
          onCreatePress={mockOnCreatePress}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search entries...');
      fireEvent.changeText(searchInput, 'Git');

      expect(screen.getByText('GitHub')).toBeTruthy();
      expect(screen.getByText('GitLab')).toBeTruthy();
      expect(screen.queryByText('AWS')).toBeNull();
    });

    it('filters entries by username', () => {
      const entries = [
        createMockEntry({ id: '1', title: 'Site A', username: 'alice@test.com' }),
        createMockEntry({ id: '2', title: 'Site B', username: 'bob@test.com' }),
      ];
      render(
        <EntryListScreen
          entries={entries}
          onEntryPress={mockOnEntryPress}
          onCreatePress={mockOnCreatePress}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search entries...');
      fireEvent.changeText(searchInput, 'alice');

      expect(screen.getByText('Site A')).toBeTruthy();
      expect(screen.queryByText('Site B')).toBeNull();
    });

    it('filters entries by url', () => {
      const entries = [
        createMockEntry({ id: '1', title: 'Site A', url: 'https://github.com' }),
        createMockEntry({ id: '2', title: 'Site B', url: 'https://example.com' }),
      ];
      render(
        <EntryListScreen
          entries={entries}
          onEntryPress={mockOnEntryPress}
          onCreatePress={mockOnCreatePress}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search entries...');
      fireEvent.changeText(searchInput, 'github');

      expect(screen.getByText('Site A')).toBeTruthy();
      expect(screen.queryByText('Site B')).toBeNull();
    });

    it('shows no results message when search has no matches', () => {
      const entries = [createMockEntry({ title: 'Site A' })];
      render(
        <EntryListScreen
          entries={entries}
          onEntryPress={mockOnEntryPress}
          onCreatePress={mockOnCreatePress}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search entries...');
      fireEvent.changeText(searchInput, 'nonexistent');

      expect(screen.getByText('No matching entries')).toBeTruthy();
    });
  });

  describe('Tap entry', () => {
    it('calls onEntryPress when entry is tapped', () => {
      const entries = [createMockEntry({ id: '123', title: 'Test Site' })];
      render(
        <EntryListScreen
          entries={entries}
          onEntryPress={mockOnEntryPress}
          onCreatePress={mockOnCreatePress}
        />
      );

      fireEvent.press(screen.getByText('Test Site'));

      expect(mockOnEntryPress).toHaveBeenCalledWith('123');
    });
  });

  describe('Create new entry', () => {
    it('calls onCreatePress when FAB is pressed', () => {
      render(
        <EntryListScreen
          entries={[]}
          onEntryPress={mockOnEntryPress}
          onCreatePress={mockOnCreatePress}
        />
      );

      const fab = screen.getByTestId('create-entry-fab');
      fireEvent.press(fab);

      expect(mockOnCreatePress).toHaveBeenCalled();
    });
  });
});
