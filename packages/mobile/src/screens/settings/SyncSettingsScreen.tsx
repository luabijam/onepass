import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { AppIcon } from '../../components';

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
          <AppIcon name="arrow-back" size={24} color="#0A84FF" />
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
              <AppIcon name="sync" size={24} color="#0A84FF" />
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
                <ActivityIndicator size="small" color="#ffffff" />
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
  },
  syncCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
  },
  syncStatusRow: {
    marginBottom: 16,
  },
  syncStatusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncStatusText: {
    marginLeft: 12,
    flex: 1,
  },
  syncStatusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  syncStatusValue: {
    fontSize: 14,
    color: '#a0a0a0',
    marginTop: 2,
  },
  syncButton: {
    backgroundColor: '#0A84FF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  syncButtonDisabled: {
    backgroundColor: '#3A3A3C',
  },
  syncButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
