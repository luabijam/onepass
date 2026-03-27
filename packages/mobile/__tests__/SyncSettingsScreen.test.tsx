import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SyncSettingsScreen } from '../src/screens/settings/SyncSettingsScreen';

describe('SyncSettingsScreen', () => {
  const mockOnSyncNow = jest.fn();
  const mockOnBack = jest.fn();

  const defaultProps = {
    lastSyncTime: null as Date | null,
    syncInProgress: false,
    syncError: null as string | null,
    onSyncNow: mockOnSyncNow,
    onBack: mockOnBack,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Display sync status', () => {
    it('shows last sync status when available', () => {
      const lastSyncTime = new Date('2024-01-15T10:30:00Z');
      render(<SyncSettingsScreen {...defaultProps} lastSyncTime={lastSyncTime} />);

      expect(screen.getByText(/Synced/)).toBeTruthy();
    });

    it('shows idle status when no sync has occurred', () => {
      render(<SyncSettingsScreen {...defaultProps} />);

      expect(screen.getByText('Ready to sync')).toBeTruthy();
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

      expect(screen.getByTestId('sync-status-syncing')).toBeTruthy();
      expect(screen.getByTestId('sync-now-button')).toHaveTextContent('Syncing...');
    });

    it('disables Sync Now button when sync is in progress', () => {
      render(<SyncSettingsScreen {...defaultProps} syncInProgress={true} />);

      const syncButton = screen.getByTestId('sync-now-button');
      fireEvent.press(syncButton);

      expect(mockOnSyncNow).not.toHaveBeenCalled();
    });
  });

  describe('Sync status indicator', () => {
    it('shows idle status when not syncing', () => {
      render(<SyncSettingsScreen {...defaultProps} />);

      expect(screen.getByTestId('sync-status-idle')).toBeTruthy();
    });

    it('shows syncing status during sync', () => {
      render(<SyncSettingsScreen {...defaultProps} syncInProgress={true} />);

      expect(screen.getByTestId('sync-status-syncing')).toBeTruthy();
    });

    it('shows error status with message when sync fails', () => {
      render(<SyncSettingsScreen {...defaultProps} syncError="Network error" />);

      expect(screen.getByTestId('sync-status-error')).toBeTruthy();
      expect(screen.getByText('Network error')).toBeTruthy();
    });

    it('shows success status after successful sync', () => {
      const lastSyncTime = new Date();
      render(<SyncSettingsScreen {...defaultProps} lastSyncTime={lastSyncTime} />);

      expect(screen.getByTestId('sync-status-success')).toBeTruthy();
    });

    it('clears error status when starting new sync', () => {
      const { rerender } = render(
        <SyncSettingsScreen {...defaultProps} syncError="Previous error" />
      );

      expect(screen.getByText('Previous error')).toBeTruthy();

      rerender(<SyncSettingsScreen {...defaultProps} syncInProgress={true} />);

      expect(screen.getByTestId('sync-status-syncing')).toBeTruthy();
      expect(screen.queryByText('Previous error')).toBeNull();
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
