import React from 'react';
import {render, screen, fireEvent} from '@testing-library/react-native';
import App from '../src/App';

describe('App', () => {
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
