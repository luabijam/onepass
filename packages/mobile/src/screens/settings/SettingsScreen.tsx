import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { AppIcon } from '../../components';

export interface SettingsScreenProps {
  lastSyncStatus: string | null;
  onSyncNow: () => void;
  onExportVault: () => void;
  onImportVault: () => void;
  onManageCategories: () => void;
}

export function SettingsScreen({
  lastSyncStatus,
  onSyncNow,
  onExportVault,
  onImportVault,
  onManageCategories,
}: SettingsScreenProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sync</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <AppIcon name="sync" size={24} color="#0A84FF" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Sync Status</Text>
                <Text style={styles.settingValue}>{lastSyncStatus || 'Never synced'}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.syncButton}
              onPress={onSyncNow}
              testID="sync-now-button"
            >
              <Text style={styles.syncButtonText}>Sync Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={onExportVault}
            testID="export-vault-button"
          >
            <View style={styles.settingInfo}>
              <AppIcon name="cloud-upload" size={24} color="#0A84FF" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Export Vault</Text>
                <Text style={styles.settingValue}>Save encrypted backup</Text>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={onImportVault}
            testID="import-vault-button"
          >
            <View style={styles.settingInfo}>
              <AppIcon name="cloud-download" size={24} color="#0A84FF" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Import from File</Text>
                <Text style={styles.settingValue}>Merge .onepass file</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Organization</Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={onManageCategories}
            testID="manage-categories-button"
          >
            <View style={styles.settingInfo}>
              <AppIcon name="category" size={24} color="#0A84FF" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Categories</Text>
                <Text style={styles.settingValue}>Manage entry categories</Text>
              </View>
            </View>
          </TouchableOpacity>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#a0a0a0',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2C2C2E',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  settingValue: {
    fontSize: 14,
    color: '#a0a0a0',
    marginTop: 2,
  },
  syncButton: {
    backgroundColor: '#0A84FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  syncButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
