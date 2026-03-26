import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ImportExportScreen } from '../src/screens/settings/ImportExportScreen';

jest.spyOn(Alert, 'alert');

describe('ImportExportScreen', () => {
  const mockOnExportVault = jest.fn();
  const mockOnImportVault = jest.fn();
  const mockOnBack = jest.fn();

  const defaultProps = {
    exportInProgress: false,
    importInProgress: false,
    lastExportDate: null as string | null,
    onExportVault: mockOnExportVault,
    onImportVault: mockOnImportVault,
    onBack: mockOnBack,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Navigation', () => {
    it('calls onBack when back button is pressed', () => {
      render(<ImportExportScreen {...defaultProps} />);

      const backButton = screen.getByTestId('back-button');
      fireEvent.press(backButton);

      expect(mockOnBack).toHaveBeenCalled();
    });
  });

  describe('Export functionality', () => {
    it('shows "Never exported" when no export has occurred', () => {
      render(<ImportExportScreen {...defaultProps} />);

      expect(screen.getByText('Never exported')).toBeTruthy();
    });

    it('shows last export date when available', () => {
      render(<ImportExportScreen {...defaultProps} lastExportDate="Mar 26, 2026, 10:30 AM" />);

      expect(screen.getByText('Mar 26, 2026, 10:30 AM')).toBeTruthy();
    });

    it('calls onExportVault when Export Vault button is pressed', async () => {
      mockOnExportVault.mockResolvedValue(undefined);
      render(<ImportExportScreen {...defaultProps} />);

      const exportButton = screen.getByText('Export Vault');
      fireEvent.press(exportButton);

      expect(mockOnExportVault).toHaveBeenCalled();
    });

    it('shows success alert on successful export', async () => {
      mockOnExportVault.mockResolvedValue(undefined);
      render(<ImportExportScreen {...defaultProps} />);

      const exportButton = screen.getByText('Export Vault');
      fireEvent.press(exportButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Export Successful', expect.any(String));
      });
    });

    it('shows error alert on export failure', async () => {
      mockOnExportVault.mockRejectedValue(new Error('Export failed'));
      render(<ImportExportScreen {...defaultProps} />);

      const exportButton = screen.getByText('Export Vault');
      fireEvent.press(exportButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Export Failed', expect.any(String));
      });
    });

    it('shows exporting indicator when export is in progress', () => {
      render(<ImportExportScreen {...defaultProps} exportInProgress={true} />);

      expect(screen.getByText('Exporting...')).toBeTruthy();
    });

    it('disables Export Vault button when export is in progress', () => {
      render(<ImportExportScreen {...defaultProps} exportInProgress={true} />);

      const exportingButton = screen.getByText('Exporting...');
      fireEvent.press(exportingButton);

      expect(mockOnExportVault).not.toHaveBeenCalled();
    });
  });

  describe('Import functionality', () => {
    it('calls onImportVault when Import Vault button is pressed', async () => {
      mockOnImportVault.mockResolvedValue(undefined);
      render(<ImportExportScreen {...defaultProps} />);

      const importButton = screen.getByText('Import Vault');
      fireEvent.press(importButton);

      expect(mockOnImportVault).toHaveBeenCalled();
    });

    it('shows success alert on successful import', async () => {
      mockOnImportVault.mockResolvedValue(undefined);
      render(<ImportExportScreen {...defaultProps} />);

      const importButton = screen.getByText('Import Vault');
      fireEvent.press(importButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Import Successful', expect.any(String));
      });
    });

    it('shows error alert on import failure', async () => {
      mockOnImportVault.mockRejectedValue(new Error('Import failed'));
      render(<ImportExportScreen {...defaultProps} />);

      const importButton = screen.getByText('Import Vault');
      fireEvent.press(importButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Import Failed', expect.any(String));
      });
    });

    it('shows importing indicator when import is in progress', () => {
      render(<ImportExportScreen {...defaultProps} importInProgress={true} />);

      expect(screen.getByText('Importing...')).toBeTruthy();
    });

    it('disables Import Vault button when import is in progress', () => {
      render(<ImportExportScreen {...defaultProps} importInProgress={true} />);

      const importingButton = screen.getByText('Importing...');
      fireEvent.press(importingButton);

      expect(mockOnImportVault).not.toHaveBeenCalled();
    });
  });

  describe('Dark theme', () => {
    it('uses dark theme colors', () => {
      render(<ImportExportScreen {...defaultProps} />);

      const titleText = screen.getByText('Import & Export');
      expect(titleText).toBeTruthy();
    });
  });

  describe('Warning section', () => {
    it('shows warning about backup before import', () => {
      render(<ImportExportScreen {...defaultProps} />);

      expect(screen.getByText('Important')).toBeTruthy();
      expect(screen.getByText(/Always export a backup before importing data/)).toBeTruthy();
    });
  });

  describe('UI elements', () => {
    it('shows export section with description', () => {
      render(<ImportExportScreen {...defaultProps} />);

      expect(screen.getByText('Export')).toBeTruthy();
      expect(screen.getByText(/Export your vault to an encrypted backup file/)).toBeTruthy();
    });

    it('shows import section with description', () => {
      render(<ImportExportScreen {...defaultProps} />);

      expect(screen.getByText('Import')).toBeTruthy();
      expect(screen.getByText(/Import a vault backup file/)).toBeTruthy();
    });
  });
});
