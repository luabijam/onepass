import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { EntryDetailScreen } from '../src/screens/entries/EntryDetailScreen';

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
  password: 'secretPassword123',
  categoryId: 'uncategorized',
  isFavorite: false,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

jest.mock('@react-native-clipboard/clipboard', () => ({
  setString: jest.fn(),
  getString: jest.fn(),
}));

describe('EntryDetailScreen', () => {
  const mockOnEditPress = jest.fn();
  const mockOnBackPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Display entry details', () => {
    it('shows title, username, password, url, and notes', () => {
      const entry = createMockEntry({
        title: 'GitHub',
        username: 'developer',
        password: 'mySecretPassword',
        url: 'https://github.com',
        notes: 'Work account',
      });
      render(
        <EntryDetailScreen
          entry={entry}
          onEditPress={mockOnEditPress}
          onBackPress={mockOnBackPress}
        />
      );

      expect(screen.getByText('GitHub')).toBeTruthy();
      expect(screen.getByText('developer')).toBeTruthy();
      expect(screen.getByText('https://github.com')).toBeTruthy();
      expect(screen.getByText('Work account')).toBeTruthy();
    });

    it('masks password by default', () => {
      const entry = createMockEntry({ password: 'mySecretPassword' });
      render(
        <EntryDetailScreen
          entry={entry}
          onEditPress={mockOnEditPress}
          onBackPress={mockOnBackPress}
        />
      );

      expect(screen.queryByText('mySecretPassword')).toBeNull();
      expect(screen.getByText('••••••••••••••••')).toBeTruthy();
    });

    it('reveals password when visibility toggle is pressed', () => {
      const entry = createMockEntry({ password: 'mySecretPassword' });
      render(
        <EntryDetailScreen
          entry={entry}
          onEditPress={mockOnEditPress}
          onBackPress={mockOnBackPress}
        />
      );

      const toggleButton = screen.getByTestId('password-visibility-toggle');
      fireEvent.press(toggleButton);

      expect(screen.getByText('mySecretPassword')).toBeTruthy();
      expect(screen.queryByText('••••••••••••••')).toBeNull();
    });

    it('hides url section when url is not provided', () => {
      const entry = createMockEntry({ url: undefined });
      render(
        <EntryDetailScreen
          entry={entry}
          onEditPress={mockOnEditPress}
          onBackPress={mockOnBackPress}
        />
      );

      expect(screen.queryByText('URL')).toBeNull();
    });

    it('hides notes section when notes is not provided', () => {
      const entry = createMockEntry({ notes: undefined });
      render(
        <EntryDetailScreen
          entry={entry}
          onEditPress={mockOnEditPress}
          onBackPress={mockOnBackPress}
        />
      );

      expect(screen.queryByText('Notes')).toBeNull();
    });
  });

  describe('Copy field', () => {
    it('copies username to clipboard when copy button is pressed', () => {
      const entry = createMockEntry({ username: 'john@example.com' });
      render(
        <EntryDetailScreen
          entry={entry}
          onEditPress={mockOnEditPress}
          onBackPress={mockOnBackPress}
        />
      );

      const usernameCopyButton = screen.getByTestId('copy-username');
      fireEvent.press(usernameCopyButton);

      expect(Clipboard.setString).toHaveBeenCalledWith('john@example.com');
    });

    it('copies password to clipboard when copy button is pressed', () => {
      const entry = createMockEntry({ password: 'secret123' });
      render(
        <EntryDetailScreen
          entry={entry}
          onEditPress={mockOnEditPress}
          onBackPress={mockOnBackPress}
        />
      );

      const passwordCopyButton = screen.getByTestId('copy-password');
      fireEvent.press(passwordCopyButton);

      expect(Clipboard.setString).toHaveBeenCalledWith('secret123');
    });

    it('copies url to clipboard when copy button is pressed', () => {
      const entry = createMockEntry({ url: 'https://github.com' });
      render(
        <EntryDetailScreen
          entry={entry}
          onEditPress={mockOnEditPress}
          onBackPress={mockOnBackPress}
        />
      );

      const urlCopyButton = screen.getByTestId('copy-url');
      fireEvent.press(urlCopyButton);

      expect(Clipboard.setString).toHaveBeenCalledWith('https://github.com');
    });

    it('shows "Copied" feedback when copy button is pressed', () => {
      const entry = createMockEntry();
      render(
        <EntryDetailScreen
          entry={entry}
          onEditPress={mockOnEditPress}
          onBackPress={mockOnBackPress}
        />
      );

      const usernameCopyButton = screen.getByTestId('copy-username');
      fireEvent.press(usernameCopyButton);

      expect(screen.getByText('Copied')).toBeTruthy();
    });
  });

  describe('Edit entry', () => {
    it('calls onEditPress when edit button is pressed', () => {
      const entry = createMockEntry({ id: 'entry-123' });
      render(
        <EntryDetailScreen
          entry={entry}
          onEditPress={mockOnEditPress}
          onBackPress={mockOnBackPress}
        />
      );

      const editButton = screen.getByTestId('edit-entry-button');
      fireEvent.press(editButton);

      expect(mockOnEditPress).toHaveBeenCalledWith('entry-123');
    });
  });

  describe('Navigation', () => {
    it('calls onBackPress when back button is pressed', () => {
      const entry = createMockEntry();
      render(
        <EntryDetailScreen
          entry={entry}
          onEditPress={mockOnEditPress}
          onBackPress={mockOnBackPress}
        />
      );

      const backButton = screen.getByTestId('back-button');
      fireEvent.press(backButton);

      expect(mockOnBackPress).toHaveBeenCalled();
    });
  });
});
