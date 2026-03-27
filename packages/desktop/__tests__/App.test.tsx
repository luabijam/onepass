import React from 'react';
import {render, screen, fireEvent} from '@testing-library/react-native';
import App from '../src/App';

jest.mock('../src/stores/vaultStore', () => ({
  useVaultStore: jest.fn(() => ({
    isUnlocked: true,
    isInitialized: true,
    entries: [
      {
        id: 'entry-1',
        title: 'Test Entry',
        username: 'testuser',
        password: 'testpass',
        url: 'https://example.com',
        categoryId: 'cat-1',
        isFavorite: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: 'entry-2',
        title: 'Another Entry',
        username: 'anotheruser',
        password: 'anotherpass',
        categoryId: 'cat-2',
        isFavorite: true,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      },
    ],
    categories: [
      {
        id: 'cat-1',
        name: 'Personal',
        icon: 'person',
        color: '#FF0000',
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: 'cat-2',
        name: 'Work',
        icon: 'folder',
        color: '#00FF00',
        updatedAt: new Date('2024-01-01'),
      },
    ],
    isLoading: false,
    error: null,
    salt: new Uint8Array(16),
    initialize: jest.fn(),
    unlock: jest.fn(),
    lock: jest.fn(),
    createVault: jest.fn(),
    addEntry: jest.fn(),
    updateEntry: jest.fn(),
    deleteEntry: jest.fn(),
    getEntry: jest.fn(),
    searchEntries: jest.fn(),
    addCategory: jest.fn(),
    updateCategory: jest.fn(),
    deleteCategory: jest.fn(),
    getCategory: jest.fn(),
    importData: jest.fn(),
    exportData: jest.fn(),
    exportVault: jest.fn(),
    importVault: jest.fn(),
    clearError: jest.fn(),
  })),
}));

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders three column layout', () => {
    render(<App />);
    expect(screen.getByTestId('three-column-layout')).toBeTruthy();
  });

  it('renders category sidebar', () => {
    render(<App />);
    expect(screen.getByTestId('category-sidebar')).toBeTruthy();
  });

  it('renders entry list panel', () => {
    render(<App />);
    expect(screen.getByTestId('entry-list-panel')).toBeTruthy();
  });

  it('renders entry detail panel', () => {
    render(<App />);
    expect(screen.getByTestId('entry-detail-panel-empty')).toBeTruthy();
  });

  it('displays all entries option in sidebar', () => {
    render(<App />);
    expect(screen.getByTestId('category-all')).toBeTruthy();
    expect(screen.getByText('All Entries')).toBeTruthy();
  });

  it('displays entries in list panel', () => {
    render(<App />);
    expect(screen.getByTestId('entry-entry-1')).toBeTruthy();
    expect(screen.getByTestId('entry-entry-2')).toBeTruthy();
  });

  it('displays categories in sidebar', () => {
    render(<App />);
    expect(screen.getByTestId('category-cat-1')).toBeTruthy();
    expect(screen.getByTestId('category-cat-2')).toBeTruthy();
  });

  it('shows entry detail when entry is selected', () => {
    render(<App />);
    fireEvent.press(screen.getByTestId('entry-entry-1'));
    expect(screen.getByTestId('entry-detail-panel')).toBeTruthy();
  });

  it('filters entries by category when category selected', () => {
    render(<App />);
    fireEvent.press(screen.getByTestId('category-cat-1'));
    expect(screen.getByTestId('entry-entry-1')).toBeTruthy();
    expect(screen.queryByTestId('entry-entry-2')).toBeNull();
  });

  it('shows all entries when All Entries is selected', () => {
    render(<App />);
    fireEvent.press(screen.getByTestId('category-cat-1'));
    fireEvent.press(screen.getByTestId('category-all'));
    expect(screen.getByTestId('entry-entry-1')).toBeTruthy();
    expect(screen.getByTestId('entry-entry-2')).toBeTruthy();
  });

  it('shows empty state when no entries match search', () => {
    render(<App />);
    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.changeText(searchInput, 'nonexistent');
    expect(screen.getByText('No matching entries')).toBeTruthy();
  });

  it('filters entries by search query', () => {
    render(<App />);
    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.changeText(searchInput, 'Test');
    expect(screen.getByTestId('entry-entry-1')).toBeTruthy();
    expect(screen.queryByTestId('entry-entry-2')).toBeNull();
  });

  it('displays entry details with all fields', () => {
    render(<App />);
    fireEvent.press(screen.getByTestId('entry-entry-1'));
    expect(screen.getByTestId('entry-detail-panel')).toBeTruthy();
    expect(screen.getByTestId('password-visibility-toggle')).toBeTruthy();
    expect(screen.getByTestId('copy-username')).toBeTruthy();
    expect(screen.getByTestId('copy-password')).toBeTruthy();
    expect(screen.getByTestId('copy-url')).toBeTruthy();
  });

  it('shows edit button in entry detail', () => {
    render(<App />);
    fireEvent.press(screen.getByTestId('entry-entry-1'));
    expect(screen.getByTestId('edit-entry-button')).toBeTruthy();
  });
});
