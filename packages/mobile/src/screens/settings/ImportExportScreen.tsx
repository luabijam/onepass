import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { AppIcon } from '../../components';
import { theme } from '../../theme';

export interface ImportExportScreenProps {
  exportInProgress: boolean;
  importInProgress: boolean;
  lastExportDate: string | null;
  onExportVault: () => Promise<void>;
  onImportVault: () => Promise<void>;
  onBack: () => void;
}

export function ImportExportScreen({
  exportInProgress,
  importInProgress,
  lastExportDate,
  onExportVault,
  onImportVault,
  onBack,
}: ImportExportScreenProps): React.JSX.Element {
  const handleExport = async () => {
    try {
      await onExportVault();
      Alert.alert('Export Successful', 'Your vault has been exported successfully.');
    } catch (error) {
      Alert.alert('Export Failed', 'Failed to export vault. Please try again.');
    }
  };

  const handleImport = async () => {
    try {
      await onImportVault();
      Alert.alert('Import Successful', 'Your vault has been imported successfully.');
    } catch (error) {
      Alert.alert('Import Failed', 'Failed to import vault. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} testID="back-button">
          <AppIcon name="arrow-back" size={24} color={theme.colors.accent.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Import & Export</Text>
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export</Text>
          <Text style={styles.description}>
            Export your vault to an encrypted backup file. This file can be used to restore your
            data on another device.
          </Text>
          <View style={styles.card}>
            <View style={styles.statusRow}>
              <View style={styles.statusInfo}>
                <AppIcon name="cloud-upload" size={24} color={theme.colors.accent.primary} />
                <View style={styles.statusText}>
                  <Text style={styles.statusLabel}>Last Export</Text>
                  <Text style={styles.statusValue}>{lastExportDate || 'Never exported'}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.actionButton, exportInProgress && styles.actionButtonDisabled]}
              onPress={exportInProgress ? undefined : handleExport}
              disabled={exportInProgress}
              testID="export-button"
            >
              {exportInProgress ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator size="small" color={theme.colors.text.primary} />
                  <Text style={styles.buttonText}>Exporting...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Export Vault</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Import</Text>
          <Text style={styles.description}>
            Import a vault backup file (.onepass). This will merge the imported entries with your
            existing data.
          </Text>
          <View style={styles.card}>
            <View style={styles.statusRow}>
              <View style={styles.statusInfo}>
                <AppIcon name="cloud-download" size={24} color={theme.colors.accent.primary} />
                <View style={styles.statusText}>
                  <Text style={styles.statusLabel}>Import from File</Text>
                  <Text style={styles.statusValue}>Merge .onepass file</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.actionButton, importInProgress && styles.actionButtonDisabled]}
              onPress={importInProgress ? undefined : handleImport}
              disabled={importInProgress}
              testID="import-button"
            >
              {importInProgress ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator size="small" color={theme.colors.text.primary} />
                  <Text style={styles.buttonText}>Importing...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Import Vault</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.warningSection}>
          <View style={styles.warningHeader}>
            <AppIcon name="warning" size={20} color={theme.colors.status.warning} />
            <Text style={styles.warningTitle}>Important</Text>
          </View>
          <Text style={styles.warningText}>
            Always export a backup before importing data. Importing will merge entries and cannot be
            undone.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.typography.fontSize.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.tertiary,
  },
  backButton: {
    marginRight: theme.typography.fontSize.lg,
    padding: theme.spacing.xs,
  },
  title: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  content: {
    flex: 1,
    padding: theme.typography.fontSize.lg,
  },
  section: {
    marginBottom: theme.typography.fontSize.xxl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
  },
  description: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.fontSize.xxl,
    marginBottom: theme.typography.fontSize.lg,
  },
  card: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.typography.fontSize.lg,
  },
  statusRow: {
    marginBottom: theme.typography.fontSize.lg,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: theme.typography.fontSize.md,
    flex: 1,
  },
  statusLabel: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  statusValue: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  actionButton: {
    backgroundColor: theme.colors.accent.primary,
    paddingVertical: theme.typography.fontSize.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  actionButtonDisabled: {
    backgroundColor: theme.colors.background.tertiary,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    marginLeft: theme.spacing.sm,
  },
  warningSection: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.typography.fontSize.lg,
    marginTop: theme.spacing.sm,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  warningTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.status.warning,
    marginLeft: theme.spacing.sm,
  },
  warningText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.fontSize.xxl,
  },
});
