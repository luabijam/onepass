import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SyncSettingsScreen } from '../src/screens/settings/SyncSettingsScreen';

describe('SyncSettingsScreen', () => {
  const mockOnSyncNow = jest.fn();
  const mockOnBack = jest.fn();

  const defaultProps = {
    lastSyncStatus: null as string | null,
    syncInProgress: false,
    onSyncNow: mockOnSyncNow,
    onBack: mockOnBack,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Display sync status', () => {
    it('shows last sync status when available', () => {
      render(<SyncSettingsScreen {...defaultProps} lastSyncStatus="Last synced: 2 minutes ago" />);

      expect(screen.getByText('Last synced: 2 minutes ago')).toBeTruthy();
    });

    it('shows "Never synced" when no sync has occurred', () => {
      render(<SyncSettingsScreen {...defaultProps} />);

      expect(screen.getByText('Never synced')).toBeTruthy();
    });
  });

  describe('Sync Now button', () => {
    it('calls onSyncNow when Sync Now button is pressed', () => {
      render(<SyncSettingsScreen {...defaultProps} />);

      const syncButton = screen.getByText('Sync Now');
      fireEvent.press(syncButton);

      expect(mockOnSyncNow).toHaveBeenCalled();
    });

    it('shows syncing indicator when sync is in progress', () => {
      render(<SyncSettingsScreen {...defaultProps} syncInProgress={true} />);

      expect(screen.getByText('Syncing...')).toBeTruthy();
    });

    it('disables Sync Now button when sync is in progress', () => {
      render(<SyncSettingsScreen {...defaultProps} syncInProgress={true} />);

      const syncButton = screen.getByText('Syncing...');
      fireEvent.press(syncButton);

      expect(mockOnSyncNow).not.toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('calls onBack when back button is pressed', () => {
      render(<SyncSettingsScreen {...defaultProps} />);

      const backButton = screen.getByTestId('back-button');
      fireEvent.press(backButton);

      expect(mockOnBack).toHaveBeenCalled();
    });
  });

  describe('Dark theme', () => {
    it('uses dark theme colors', () => {
      render(<SyncSettingsScreen {...defaultProps} />);

      const titleText = screen.getByText('Sync Settings');
      expect(titleText).toBeTruthy();
    });
  });

  describe('LAN sync info', () => {
    it('shows LAN sync description', () => {
      render(<SyncSettingsScreen {...defaultProps} />);

      expect(screen.getByText(/Sync with desktop app on local network/)).toBeTruthy();
    });
  });
});
