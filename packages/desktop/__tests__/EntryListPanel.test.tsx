import React from 'react';
import {render, screen, fireEvent} from '@testing-library/react-native';
import {EntryListPanel, Entry} from '../src/components/EntryListPanel';

describe('EntryListPanel', () => {
  const mockEntries: Entry[] = [
    {
      id: 'entry-1',
      title: 'GitHub',
      username: 'user1',
      password: 'password1',
      categoryId: 'cat-1',
      isFavorite: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'entry-2',
      title: 'Gmail',
      username: 'user2@gmail.com',
      password: 'password2',
      url: 'https://mail.google.com',
      categoryId: 'cat-2',
      isFavorite: true,
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
    {
      id: 'entry-3',
      title: 'Bank',
      username: 'user3',
      password: 'password3',
      categoryId: 'cat-3',
      isFavorite: false,
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03'),
    },
  ];

  const defaultProps = {
    entries: mockEntries,
    selectedEntryId: null,
    onEntryPress: jest.fn(),
    onCreatePress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all entries', () => {
    render(<EntryListPanel {...defaultProps} />);

    expect(screen.getByText('GitHub')).toBeTruthy();
    expect(screen.getByText('Gmail')).toBeTruthy();
    expect(screen.getByText('Bank')).toBeTruthy();
  });

  it('renders usernames', () => {
    render(<EntryListPanel {...defaultProps} />);

    expect(screen.getByText('user1')).toBeTruthy();
    expect(screen.getByText('user2@gmail.com')).toBeTruthy();
    expect(screen.getByText('user3')).toBeTruthy();
  });

  it('calls onEntryPress when an entry is pressed', () => {
    const onEntryPress = jest.fn();
    render(<EntryListPanel {...defaultProps} onEntryPress={onEntryPress} />);

    fireEvent.press(screen.getByTestId('entry-entry-1'));

    expect(onEntryPress).toHaveBeenCalledWith('entry-1');
  });

  it('calls onCreatePress when add button is pressed', () => {
    const onCreatePress = jest.fn();
    render(<EntryListPanel {...defaultProps} onCreatePress={onCreatePress} />);

    fireEvent.press(screen.getByTestId('create-entry-button'));

    expect(onCreatePress).toHaveBeenCalled();
  });

  it('highlights selected entry', () => {
    render(<EntryListPanel {...defaultProps} selectedEntryId="entry-2" />);

    const selectedEntry = screen.getByTestId('entry-entry-2');
    expect(selectedEntry).toBeTruthy();
  });

  it('filters entries by search query', () => {
    render(<EntryListPanel {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.changeText(searchInput, 'git');

    expect(screen.getByText('GitHub')).toBeTruthy();
    expect(screen.queryByText('Gmail')).toBeNull();
    expect(screen.queryByText('Bank')).toBeNull();
  });

  it('filters entries by username', () => {
    render(<EntryListPanel {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.changeText(searchInput, 'user2');

    expect(screen.getByText('Gmail')).toBeTruthy();
    expect(screen.queryByText('GitHub')).toBeNull();
  });

  it('filters entries by url', () => {
    render(<EntryListPanel {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.changeText(searchInput, 'google');

    expect(screen.getByText('Gmail')).toBeTruthy();
    expect(screen.queryByText('GitHub')).toBeNull();
  });

  it('shows empty state when no entries', () => {
    render(<EntryListPanel {...defaultProps} entries={[]} />);

    expect(screen.getByText('No entries')).toBeTruthy();
  });

  it('shows empty state when search has no matches', () => {
    render(<EntryListPanel {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.changeText(searchInput, 'nonexistent');

    expect(screen.getByText('No matching entries')).toBeTruthy();
  });

  it('filters out deleted entries', () => {
    const entriesWithDeleted: Entry[] = [
      ...mockEntries,
      {
        id: 'entry-4',
        title: 'Deleted Entry',
        username: 'deleted',
        password: 'deleted',
        categoryId: 'cat-1',
        isFavorite: false,
        createdAt: new Date('2024-01-04'),
        updatedAt: new Date('2024-01-04'),
        deletedAt: new Date('2024-01-05'),
      },
    ];

    render(<EntryListPanel {...defaultProps} entries={entriesWithDeleted} />);

    expect(screen.queryByText('Deleted Entry')).toBeNull();
  });

  it('sorts entries alphabetically by title', () => {
    render(<EntryListPanel {...defaultProps} />);

    const titles = screen.getAllByText(/^(GitHub|Gmail|Bank)$/);
    const titleTexts = titles.map(t => t.props.children);

    expect(titleTexts).toEqual(['Bank', 'GitHub', 'Gmail']);
  });
});
