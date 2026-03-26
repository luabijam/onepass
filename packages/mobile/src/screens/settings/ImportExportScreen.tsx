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
          <AppIcon name="arrow-back" size={24} color="#0A84FF" />
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
                <AppIcon name="cloud-upload" size={24} color="#0A84FF" />
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
                  <ActivityIndicator size="small" color="#ffffff" />
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
                <AppIcon name="cloud-download" size={24} color="#0A84FF" />
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
                  <ActivityIndicator size="small" color="#ffffff" />
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
            <AppIcon name="warning" size={20} color="#FF9500" />
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
    backgroundColor: '#1C1C1E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#a0a0a0',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  description: {
    fontSize: 14,
    color: '#a0a0a0',
    lineHeight: 20,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
  },
  statusRow: {
    marginBottom: 16,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 12,
    flex: 1,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  statusValue: {
    fontSize: 14,
    color: '#a0a0a0',
    marginTop: 2,
  },
  actionButton: {
    backgroundColor: '#0A84FF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonDisabled: {
    backgroundColor: '#3A3A3C',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  warningSection: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9500',
    marginLeft: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#a0a0a0',
    lineHeight: 20,
  },
});
