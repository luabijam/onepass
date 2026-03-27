import React from 'react';
import {render, screen, fireEvent} from '@testing-library/react-native';
import {EntryDetailPanel} from '../src/components/EntryDetailPanel';
import type {Entry} from '@onepass/vault-core';

jest.mock('@react-native-clipboard/clipboard', () => ({
  setString: jest.fn(),
}));

describe('EntryDetailPanel', () => {
  const mockEntry: Entry = {
    id: 'entry-1',
    title: 'Test Entry',
    username: 'testuser',
    password: 'secretpassword',
    url: 'https://example.com',
    notes: 'Some notes here',
    categoryId: 'cat-1',
    isFavorite: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const defaultProps = {
    entry: mockEntry,
    onEditPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders entry title', () => {
    render(<EntryDetailPanel {...defaultProps} />);

    expect(screen.getByText('Test Entry')).toBeTruthy();
  });

  it('renders username field', () => {
    render(<EntryDetailPanel {...defaultProps} />);

    expect(screen.getByText('Username')).toBeTruthy();
    expect(screen.getByText('testuser')).toBeTruthy();
  });

  it('renders password field (masked)', () => {
    render(<EntryDetailPanel {...defaultProps} />);

    expect(screen.getByText('Password')).toBeTruthy();
    expect(screen.getByText(/\u2022{13}/)).toBeTruthy();
  });

  it('renders url field when present', () => {
    render(<EntryDetailPanel {...defaultProps} />);

    expect(screen.getByText('URL')).toBeTruthy();
    expect(screen.getByText('https://example.com')).toBeTruthy();
  });

  it('renders notes field when present', () => {
    render(<EntryDetailPanel {...defaultProps} />);

    expect(screen.getByText('Notes')).toBeTruthy();
    expect(screen.getByText('Some notes here')).toBeTruthy();
  });

  it('does not render url field when not present', () => {
    const entryWithoutUrl = {...mockEntry, url: undefined};
    render(<EntryDetailPanel {...defaultProps} entry={entryWithoutUrl} />);

    expect(screen.queryByText('URL')).toBeNull();
  });

  it('does not render notes field when not present', () => {
    const entryWithoutNotes = {...mockEntry, notes: undefined};
    render(<EntryDetailPanel {...defaultProps} entry={entryWithoutNotes} />);

    expect(screen.queryByText('Notes')).toBeNull();
  });

  it('calls onEditPress when edit button is pressed', () => {
    const onEditPress = jest.fn();
    render(<EntryDetailPanel {...defaultProps} onEditPress={onEditPress} />);

    fireEvent.press(screen.getByTestId('edit-entry-button'));

    expect(onEditPress).toHaveBeenCalledWith('entry-1');
  });

  it('toggles password visibility', () => {
    render(<EntryDetailPanel {...defaultProps} />);

    expect(screen.getByText(/\u2022{13}/)).toBeTruthy();

    fireEvent.press(screen.getByTestId('password-visibility-toggle'));

    expect(screen.getByText('secretpassword')).toBeTruthy();

    fireEvent.press(screen.getByTestId('password-visibility-toggle'));

    expect(screen.getByText(/\u2022{13}/)).toBeTruthy();
  });

  it('renders empty state when no entry is provided', () => {
    render(<EntryDetailPanel entry={null} onEditPress={jest.fn()} />);

    expect(screen.getByTestId('entry-detail-panel-empty')).toBeTruthy();
    expect(screen.getByText('No Entry Selected')).toBeTruthy();
    expect(
      screen.getByText('Select an entry from the list to view details'),
    ).toBeTruthy();
  });
});
