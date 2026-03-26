import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { EntryFormScreen } from '../src/screens/entries/EntryFormScreen';

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

describe('EntryFormScreen', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create new entry', () => {
    it('shows "New Entry" title when creating', () => {
      render(<EntryFormScreen onSave={mockOnSave} onCancel={mockOnCancel} />);
      expect(screen.getByText('New Entry')).toBeTruthy();
    });

    it('shows empty form fields when creating', () => {
      render(<EntryFormScreen onSave={mockOnSave} onCancel={mockOnCancel} />);
      expect(screen.getByPlaceholderText('Entry title')).toBeTruthy();
      expect(screen.getByPlaceholderText('Username or email')).toBeTruthy();
      expect(screen.getByPlaceholderText('Password')).toBeTruthy();
      expect(screen.getByPlaceholderText('https://example.com')).toBeTruthy();
      expect(screen.getByPlaceholderText('Additional notes')).toBeTruthy();
    });

    it('calls onSave with form data when save button is pressed', () => {
      render(<EntryFormScreen onSave={mockOnSave} onCancel={mockOnCancel} />);

      fireEvent.changeText(screen.getByTestId('title-input'), 'My New Entry');
      fireEvent.changeText(screen.getByTestId('username-input'), 'newuser@test.com');
      fireEvent.changeText(screen.getByTestId('password-input'), 'secretPassword');
      fireEvent.changeText(screen.getByTestId('url-input'), 'https://example.com');
      fireEvent.changeText(screen.getByTestId('notes-input'), 'Some notes');

      fireEvent.press(screen.getByTestId('save-button'));

      expect(mockOnSave).toHaveBeenCalledWith({
        title: 'My New Entry',
        username: 'newuser@test.com',
        password: 'secretPassword',
        url: 'https://example.com',
        notes: 'Some notes',
      });
    });

    it('trims whitespace from form values', () => {
      render(<EntryFormScreen onSave={mockOnSave} onCancel={mockOnCancel} />);

      fireEvent.changeText(screen.getByTestId('title-input'), '  Trimmed Title  ');
      fireEvent.changeText(screen.getByTestId('username-input'), '  trimmed@test.com  ');
      fireEvent.changeText(screen.getByTestId('url-input'), '  https://example.com  ');
      fireEvent.changeText(screen.getByTestId('notes-input'), '  Trimmed notes  ');

      fireEvent.press(screen.getByTestId('save-button'));

      expect(mockOnSave).toHaveBeenCalledWith({
        title: 'Trimmed Title',
        username: 'trimmed@test.com',
        password: '',
        url: 'https://example.com',
        notes: 'Trimmed notes',
      });
    });
  });

  describe('Edit existing entry', () => {
    it('shows "Edit Entry" title when editing', () => {
      const entry = createMockEntry();
      render(<EntryFormScreen entry={entry} onSave={mockOnSave} onCancel={mockOnCancel} />);
      expect(screen.getByText('Edit Entry')).toBeTruthy();
    });

    it('pre-fills form with existing entry values', () => {
      const entry = createMockEntry({
        title: 'GitHub',
        username: 'developer',
        password: 'mySecretPassword',
        url: 'https://github.com',
        notes: 'Work account',
      });
      render(<EntryFormScreen entry={entry} onSave={mockOnSave} onCancel={mockOnCancel} />);

      expect(screen.getByDisplayValue('GitHub')).toBeTruthy();
      expect(screen.getByDisplayValue('developer')).toBeTruthy();
      expect(screen.getByDisplayValue('mySecretPassword')).toBeTruthy();
      expect(screen.getByDisplayValue('https://github.com')).toBeTruthy();
      expect(screen.getByDisplayValue('Work account')).toBeTruthy();
    });

    it('calls onSave with updated values when save button is pressed', () => {
      const entry = createMockEntry();
      render(<EntryFormScreen entry={entry} onSave={mockOnSave} onCancel={mockOnCancel} />);

      fireEvent.changeText(screen.getByTestId('title-input'), 'Updated Title');
      fireEvent.press(screen.getByTestId('save-button'));

      expect(mockOnSave).toHaveBeenCalledWith({
        title: 'Updated Title',
        username: 'user@example.com',
        password: 'password123',
        url: '',
        notes: '',
      });
    });
  });

  describe('Validation', () => {
    it('shows error when title is empty', () => {
      render(<EntryFormScreen onSave={mockOnSave} onCancel={mockOnCancel} />);
      fireEvent.press(screen.getByTestId('save-button'));
      expect(screen.getByText('Title is required')).toBeTruthy();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('shows error when username is empty', () => {
      render(<EntryFormScreen onSave={mockOnSave} onCancel={mockOnCancel} />);
      fireEvent.changeText(screen.getByTestId('title-input'), 'Test Title');
      fireEvent.press(screen.getByTestId('save-button'));
      expect(screen.getByText('Username is required')).toBeTruthy();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('shows error when title is only whitespace', () => {
      render(<EntryFormScreen onSave={mockOnSave} onCancel={mockOnCancel} />);
      fireEvent.changeText(screen.getByTestId('title-input'), '   ');
      fireEvent.press(screen.getByTestId('save-button'));
      expect(screen.getByText('Title is required')).toBeTruthy();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('shows error when username is only whitespace', () => {
      render(<EntryFormScreen onSave={mockOnSave} onCancel={mockOnCancel} />);
      fireEvent.changeText(screen.getByTestId('title-input'), 'Test Title');
      fireEvent.changeText(screen.getByTestId('username-input'), '   ');
      fireEvent.press(screen.getByTestId('save-button'));
      expect(screen.getByText('Username is required')).toBeTruthy();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('clears error when user starts typing in title field', () => {
      render(<EntryFormScreen onSave={mockOnSave} onCancel={mockOnCancel} />);
      fireEvent.press(screen.getByTestId('save-button'));
      expect(screen.getByText('Title is required')).toBeTruthy();
      fireEvent.changeText(screen.getByTestId('title-input'), 'T');
      expect(screen.queryByText('Title is required')).toBeNull();
    });

    it('clears error when user starts typing in username field', () => {
      render(<EntryFormScreen onSave={mockOnSave} onCancel={mockOnCancel} />);
      fireEvent.changeText(screen.getByTestId('title-input'), 'Test');
      fireEvent.press(screen.getByTestId('save-button'));
      expect(screen.getByText('Username is required')).toBeTruthy();
      fireEvent.changeText(screen.getByTestId('username-input'), 'u');
      expect(screen.queryByText('Username is required')).toBeNull();
    });
  });

  describe('Password visibility', () => {
    it('masks password by default', () => {
      render(<EntryFormScreen onSave={mockOnSave} onCancel={mockOnCancel} />);
      const passwordInput = screen.getByTestId('password-input');
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });

    it('reveals password when visibility toggle is pressed', () => {
      render(<EntryFormScreen onSave={mockOnSave} onCancel={mockOnCancel} />);
      const passwordInput = screen.getByTestId('password-input');
      expect(passwordInput.props.secureTextEntry).toBe(true);

      fireEvent.press(screen.getByTestId('password-visibility-toggle'));
      expect(passwordInput.props.secureTextEntry).toBe(false);

      fireEvent.press(screen.getByTestId('password-visibility-toggle'));
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });
  });

  describe('Password generator', () => {
    it('opens password generator modal when generate button is pressed', () => {
      render(<EntryFormScreen onSave={mockOnSave} onCancel={mockOnCancel} />);
      fireEvent.press(screen.getByTestId('generate-password-button'));
      expect(screen.getByText('Generate Password')).toBeTruthy();
    });

    it('shows generated password in modal', () => {
      render(<EntryFormScreen onSave={mockOnSave} onCancel={mockOnCancel} />);
      fireEvent.press(screen.getByTestId('generate-password-button'));
      const generatedPassword = screen.getByTestId('generated-password');
      expect(generatedPassword.props.children.length).toBeGreaterThanOrEqual(8);
    });

    it('closes modal when close button is pressed', () => {
      render(<EntryFormScreen onSave={mockOnSave} onCancel={mockOnCancel} />);
      fireEvent.press(screen.getByTestId('generate-password-button'));
      expect(screen.getByText('Generate Password')).toBeTruthy();
      fireEvent.press(screen.getByTestId('close-generator-button'));
      expect(screen.queryByText('Generate Password')).toBeNull();
    });

    it('fills password field when "Use Password" is pressed', () => {
      render(<EntryFormScreen onSave={mockOnSave} onCancel={mockOnCancel} />);
      fireEvent.press(screen.getByTestId('generate-password-button'));
      const generatedPassword = screen.getByTestId('generated-password').props.children;
      fireEvent.press(screen.getByTestId('use-password-button'));
      expect(screen.getByDisplayValue(generatedPassword)).toBeTruthy();
    });

    it('generates new password when regenerate is pressed', () => {
      render(<EntryFormScreen onSave={mockOnSave} onCancel={mockOnCancel} />);
      fireEvent.press(screen.getByTestId('generate-password-button'));
      const firstPassword = screen.getByTestId('generated-password').props.children;
      fireEvent.press(screen.getByTestId('regenerate-button'));
      const secondPassword = screen.getByTestId('generated-password').props.children;
      expect(firstPassword).not.toBe(secondPassword);
    });

    it('adjusts password length with controls', () => {
      render(<EntryFormScreen onSave={mockOnSave} onCancel={mockOnCancel} />);
      fireEvent.press(screen.getByTestId('generate-password-button'));
      expect(screen.getByText('Length: 16')).toBeTruthy();
      fireEvent.press(screen.getByTestId('increase-length'));
      expect(screen.getByText('Length: 17')).toBeTruthy();
      fireEvent.press(screen.getByTestId('decrease-length'));
      expect(screen.getByText('Length: 16')).toBeTruthy();
    });

    it('limits password length to min 8 and max 32', () => {
      render(<EntryFormScreen onSave={mockOnSave} onCancel={mockOnCancel} />);
      fireEvent.press(screen.getByTestId('generate-password-button'));
      for (let i = 0; i < 30; i++) {
        fireEvent.press(screen.getByTestId('decrease-length'));
      }
      expect(screen.getByText('Length: 8')).toBeTruthy();
      for (let i = 0; i < 30; i++) {
        fireEvent.press(screen.getByTestId('increase-length'));
      }
      expect(screen.getByText('Length: 32')).toBeTruthy();
    });

    it('toggles character class options', () => {
      render(<EntryFormScreen onSave={mockOnSave} onCancel={mockOnCancel} />);
      fireEvent.press(screen.getByTestId('generate-password-button'));
      const uppercaseToggle = screen.getByTestId('uppercase-toggle');
      const lowercaseToggle = screen.getByTestId('lowercase-toggle');
      const numbersToggle = screen.getByTestId('numbers-toggle');
      const symbolsToggle = screen.getByTestId('symbols-toggle');

      expect(uppercaseToggle).toBeTruthy();
      expect(lowercaseToggle).toBeTruthy();
      expect(numbersToggle).toBeTruthy();
      expect(symbolsToggle).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('calls onCancel when cancel button is pressed', () => {
      render(<EntryFormScreen onSave={mockOnSave} onCancel={mockOnCancel} />);
      fireEvent.press(screen.getByTestId('cancel-button'));
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });
});
