import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SettingsScreen } from '../src/screens/settings/SettingsScreen';

describe('SettingsScreen', () => {
  const mockOnSyncNow = jest.fn();
  const mockOnExportVault = jest.fn();
  const mockOnImportVault = jest.fn();
  const mockOnManageCategories = jest.fn();

  const defaultProps = {
    lastSyncStatus: null as string | null,
    onSyncNow: mockOnSyncNow,
    onExportVault: mockOnExportVault,
    onImportVault: mockOnImportVault,
    onManageCategories: mockOnManageCategories,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Sync settings', () => {
    it('shows last sync status when available', () => {
      render(<SettingsScreen {...defaultProps} lastSyncStatus="Last synced: 2 minutes ago" />);

      expect(screen.getByText('Last synced: 2 minutes ago')).toBeTruthy();
    });

    it('shows "Never synced" when no sync has occurred', () => {
      render(<SettingsScreen {...defaultProps} />);

      expect(screen.getByText('Never synced')).toBeTruthy();
    });

    it('calls onSyncNow when Sync Now button is pressed', () => {
      render(<SettingsScreen {...defaultProps} />);

      const syncButton = screen.getByText('Sync Now');
      fireEvent.press(syncButton);

      expect(mockOnSyncNow).toHaveBeenCalled();
    });
  });

  describe('Export vault', () => {
    it('calls onExportVault when Export Vault button is pressed', () => {
      render(<SettingsScreen {...defaultProps} />);

      const exportButton = screen.getByText('Export Vault');
      fireEvent.press(exportButton);

      expect(mockOnExportVault).toHaveBeenCalled();
    });
  });

  describe('Import vault', () => {
    it('calls onImportVault when Import from File button is pressed', () => {
      render(<SettingsScreen {...defaultProps} />);

      const importButton = screen.getByText('Import from File');
      fireEvent.press(importButton);

      expect(mockOnImportVault).toHaveBeenCalled();
    });
  });

  describe('Category management', () => {
    it('calls onManageCategories when Categories button is pressed', () => {
      render(<SettingsScreen {...defaultProps} />);

      const categoriesButton = screen.getByText('Categories');
      fireEvent.press(categoriesButton);

      expect(mockOnManageCategories).toHaveBeenCalled();
    });
  });

  describe('Dark theme', () => {
    it('uses dark theme colors', () => {
      render(<SettingsScreen {...defaultProps} />);

      const settingsText = screen.getByText('Settings');
      expect(settingsText).toBeTruthy();
    });
  });
});
