import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { AppIcon } from '../../components';
import { theme } from '../../theme';

export interface SyncSettingsScreenProps {
  lastSyncStatus: string | null;
  syncInProgress: boolean;
  onSyncNow: () => void;
  onBack: () => void;
}

export function SyncSettingsScreen({
  lastSyncStatus,
  syncInProgress,
  onSyncNow,
  onBack,
}: SyncSettingsScreenProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} testID="back-button">
          <AppIcon name="arrow-back" size={24} color={theme.colors.accent.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Sync Settings</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LAN Sync</Text>
          <Text style={styles.description}>
            Sync with desktop app on local network. Make sure both devices are on the same WiFi
            network.
          </Text>
        </View>

        <View style={styles.syncCard}>
          <View style={styles.syncStatusRow}>
            <View style={styles.syncStatusInfo}>
              <AppIcon name="sync" size={24} color={theme.colors.accent.primary} />
              <View style={styles.syncStatusText}>
                <Text style={styles.syncStatusLabel}>Sync Status</Text>
                <Text style={styles.syncStatusValue}>{lastSyncStatus || 'Never synced'}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.syncButton, syncInProgress && styles.syncButtonDisabled]}
            onPress={syncInProgress ? undefined : onSyncNow}
            disabled={syncInProgress}
            testID="sync-now-button"
          >
            {syncInProgress ? (
              <View style={styles.syncButtonContent}>
                <ActivityIndicator size="small" color={theme.colors.text.primary} />
                <Text style={styles.syncButtonText}>Syncing...</Text>
              </View>
            ) : (
              <Text style={styles.syncButtonText}>Sync Now</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
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
  },
  syncCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.typography.fontSize.lg,
  },
  syncStatusRow: {
    marginBottom: theme.typography.fontSize.lg,
  },
  syncStatusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncStatusText: {
    marginLeft: theme.typography.fontSize.md,
    flex: 1,
  },
  syncStatusLabel: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  syncStatusValue: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  syncButton: {
    backgroundColor: theme.colors.accent.primary,
    paddingVertical: theme.typography.fontSize.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  syncButtonDisabled: {
    backgroundColor: theme.colors.background.tertiary,
  },
  syncButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncButtonText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    marginLeft: theme.spacing.sm,
  },
});
