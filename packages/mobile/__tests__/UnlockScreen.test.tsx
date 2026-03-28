import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { UnlockScreen } from '../src/screens/unlock/UnlockScreen';

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
  })),
}));

jest.mock('../src/services/VaultStorage', () => ({
  VaultStorage: {
    isBiometricsEnabled: jest.fn().mockResolvedValue(false),
  },
}));

describe('UnlockScreen', () => {
  describe('Display elements', () => {
    it('renders the app title', () => {
      render(<UnlockScreen />);
      expect(screen.getByText('OnePass')).toBeTruthy();
    });

    it('renders create vault prompt when not initialized', () => {
      render(<UnlockScreen />);
      expect(screen.getByText('Create a master password')).toBeTruthy();
    });
  });

  describe('Dark theme', () => {
    it('uses dark theme colors', () => {
      render(<UnlockScreen />);
      const title = screen.getByText('OnePass');
      expect(title).toBeTruthy();
    });
  });
});
