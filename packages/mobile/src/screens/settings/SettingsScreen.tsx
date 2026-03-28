import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { AppIcon } from '../../components';
import { theme } from '../../theme';

export interface SettingsScreenProps {
  lastSyncStatus: string | null;
  onSyncNow: () => void;
  onExportVault: () => void;
  onImportVault: () => void;
  onManageCategories: () => void;
  onBackPress?: () => void;
}

export function SettingsScreen({
  lastSyncStatus,
  onSyncNow,
  onExportVault,
  onImportVault,
  onManageCategories,
  onBackPress,
}: SettingsScreenProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {onBackPress && (
          <TouchableOpacity onPress={onBackPress} style={styles.backButton} testID="back-button">
            <AppIcon name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Settings</Text>
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sync</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <AppIcon name="sync" size={24} color={theme.colors.accent.primary} />
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
              <AppIcon name="cloud-upload" size={24} color={theme.colors.accent.primary} />
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
              <AppIcon name="cloud-download" size={24} color={theme.colors.accent.primary} />
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
              <AppIcon name="category" size={24} color={theme.colors.accent.primary} />
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
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: theme.typography.fontSize.xxl,
    paddingHorizontal: theme.typography.fontSize.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.secondary,
    padding: theme.typography.fontSize.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: theme.typography.fontSize.md,
    flex: 1,
  },
  settingLabel: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  settingValue: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  syncButton: {
    backgroundColor: theme.colors.accent.primary,
    paddingHorizontal: theme.typography.fontSize.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginLeft: theme.typography.fontSize.md,
  },
  syncButtonText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
