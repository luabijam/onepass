import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { AppIcon, IconName } from './Icon';
import { theme } from '../theme';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface SyncStatusIndicatorProps {
  status: SyncStatus;
  lastSyncTime?: Date;
  errorMessage?: string;
}

interface StatusConfig {
  icon: IconName | null;
  iconColor: string;
  text: string;
}

export function SyncStatusIndicator({
  status,
  lastSyncTime,
  errorMessage,
}: SyncStatusIndicatorProps): React.JSX.Element {
  const getStatusConfig = (): StatusConfig => {
    switch (status) {
      case 'idle':
        return {
          icon: 'sync',
          iconColor: theme.colors.text.secondary,
          text: 'Ready to sync',
        };
      case 'syncing':
        return {
          icon: null,
          iconColor: theme.colors.accent.primary,
          text: 'Syncing...',
        };
      case 'success':
        return {
          icon: 'check',
          iconColor: theme.colors.status.success,
          text: lastSyncTime ? formatSyncTime(lastSyncTime) : 'Sync complete',
        };
      case 'error':
        return {
          icon: 'error',
          iconColor: theme.colors.status.error,
          text: errorMessage || 'Sync failed',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View style={styles.container} testID="sync-status-indicator">
      <View style={styles.statusRow} testID={`sync-status-${status}`}>
        {status === 'syncing' ? (
          <ActivityIndicator size="small" color={theme.colors.accent.primary} />
        ) : (
          <AppIcon name={config.icon!} size={20} color={config.iconColor} />
        )}
        <Text style={styles.statusText}>{config.text}</Text>
      </View>
    </View>
  );
}

function formatSyncTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Synced just now';
  } else if (diffMins < 60) {
    return `Synced ${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `Synced ${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays < 7) {
    return `Synced ${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else {
    return `Synced on ${date.toLocaleDateString()}`;
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.sm,
  },
});
