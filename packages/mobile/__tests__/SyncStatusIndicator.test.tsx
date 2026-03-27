import React from 'react';
import { ActivityIndicator } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { SyncStatusIndicator } from '../src/components/SyncStatusIndicator';

describe('SyncStatusIndicator', () => {
  describe('Idle status', () => {
    it('shows idle status with sync icon', () => {
      render(<SyncStatusIndicator status="idle" />);

      expect(screen.getByText('Ready to sync')).toBeTruthy();
    });
  });

  describe('Syncing status', () => {
    it('shows syncing status with spinner', () => {
      render(<SyncStatusIndicator status="syncing" />);

      expect(screen.getByText('Syncing...')).toBeTruthy();
    });

    it('shows activity indicator when syncing', () => {
      const { UNSAFE_queryByType } = render(<SyncStatusIndicator status="syncing" />);

      expect(UNSAFE_queryByType(ActivityIndicator)).toBeTruthy();
    });
  });

  describe('Success status', () => {
    it('shows success status with check icon', () => {
      render(<SyncStatusIndicator status="success" />);

      expect(screen.getByText('Sync complete')).toBeTruthy();
    });

    it('shows success status with timestamp', () => {
      const timestamp = new Date('2024-01-15T10:30:00Z');
      render(<SyncStatusIndicator status="success" lastSyncTime={timestamp} />);

      expect(screen.getByText(/Synced/)).toBeTruthy();
    });
  });

  describe('Error status', () => {
    it('shows error status with error icon', () => {
      render(<SyncStatusIndicator status="error" />);

      expect(screen.getByText('Sync failed')).toBeTruthy();
    });

    it('shows error message when provided', () => {
      render(<SyncStatusIndicator status="error" errorMessage="Network error" />);

      expect(screen.getByText('Network error')).toBeTruthy();
    });

    it('shows default error message when none provided', () => {
      render(<SyncStatusIndicator status="error" />);

      expect(screen.getByText('Sync failed')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('has correct testID for status indicator', () => {
      render(<SyncStatusIndicator status="syncing" />);

      expect(screen.getByTestId('sync-status-indicator')).toBeTruthy();
    });

    it('shows status-specific testID', () => {
      render(<SyncStatusIndicator status="success" />);

      expect(screen.getByTestId('sync-status-success')).toBeTruthy();
    });
  });
});
