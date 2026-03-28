import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { AppNavigator } from '../src/navigation/AppNavigator';

jest.mock('../src/stores', () => ({
  useVaultStore: jest.fn(() => ({
    isUnlocked: false,
    isInitialized: false,
    isLoading: false,
    error: null,
    initialize: jest.fn(),
    unlock: jest.fn(),
    createVault: jest.fn(),
    clearError: jest.fn(),
    entries: [],
    categories: [],
    getEntry: jest.fn(),
    getCategory: jest.fn(),
    addEntry: jest.fn(),
    updateEntry: jest.fn(),
    deleteEntry: jest.fn(),
    addCategory: jest.fn(),
    updateCategory: jest.fn(),
    deleteCategory: jest.fn(),
  })),
}));

jest.mock('../src/services/VaultStorage', () => ({
  VaultStorage: {
    isBiometricsEnabled: jest.fn().mockResolvedValue(false),
  },
}));

describe('AppNavigator', () => {
  describe('Initial render', () => {
    it('renders without crashing', () => {
      render(<AppNavigator />);
      expect(screen).toBeTruthy();
    });
  });

  describe('Navigation structure', () => {
    it('includes Unlock screen in navigation', () => {
      render(<AppNavigator />);
      expect(screen.getByText('OnePass')).toBeTruthy();
    });
  });
});
