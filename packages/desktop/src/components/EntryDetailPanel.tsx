import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {AppIcon} from './Icon';
import {theme} from '../theme';
import type {Entry} from '@onepass/vault-core';

export interface EntryDetailPanelProps {
  entry: Entry | null;
  onEditPress: (entryId: string) => void;
}

export function EntryDetailPanel({
  entry,
  onEditPress,
}: EntryDetailPanelProps): React.JSX.Element {
  const [showPassword, setShowPassword] = useState(false);

  if (!entry) {
    return (
      <View style={styles.emptyContainer} testID="entry-detail-panel-empty">
        <AppIcon name="lock" size={48} color={theme.colors.text.secondary} />
        <Text style={styles.emptyTitle}>No Entry Selected</Text>
        <Text style={styles.emptySubtitle}>
          Select an entry from the list to view details
        </Text>
      </View>
    );
  }

  const copyToClipboard = async (value: string) => {
    const {Clipboard} = require('@react-native-clipboard/clipboard');
    Clipboard.setString(value);
  };

  return (
    <View style={styles.container} testID="entry-detail-panel">
      <View style={styles.header}>
        <Text style={styles.title}>{entry.title}</Text>
        <TouchableOpacity
          onPress={() => onEditPress(entry.id)}
          style={styles.editButton}
          testID="edit-entry-button">
          <AppIcon name="edit" size={20} color={theme.colors.accent.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <FieldRow
          label="Username"
          value={entry.username}
          onCopy={() => copyToClipboard(entry.username)}
        />

        <PasswordFieldRow
          password={entry.password}
          showPassword={showPassword}
          onToggleVisibility={() => setShowPassword(!showPassword)}
          onCopy={() => copyToClipboard(entry.password)}
        />

        {entry.url && (
          <FieldRow
            label="URL"
            value={entry.url}
            onCopy={() => copyToClipboard(entry.url!)}
          />
        )}

        {entry.notes && (
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Notes</Text>
            <Text style={styles.notesText}>{entry.notes}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

interface FieldRowProps {
  label: string;
  value: string;
  onCopy: () => void;
}

function FieldRow({label, value, onCopy}: FieldRowProps): React.JSX.Element {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldValueRow}>
        <Text style={styles.fieldValue} selectable>
          {value}
        </Text>
        <TouchableOpacity
          onPress={onCopy}
          testID={`copy-${label.toLowerCase()}`}>
          <AppIcon
            name="content-copy"
            size={18}
            color={theme.colors.accent.primary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface PasswordFieldRowProps {
  password: string;
  showPassword: boolean;
  onToggleVisibility: () => void;
  onCopy: () => void;
}

function PasswordFieldRow({
  password,
  showPassword,
  onToggleVisibility,
  onCopy,
}: PasswordFieldRowProps): React.JSX.Element {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>Password</Text>
      <View style={styles.fieldValueRow}>
        <Text style={styles.fieldValue} selectable>
          {showPassword ? password : maskPassword(password)}
        </Text>
        <View style={styles.passwordActions}>
          <TouchableOpacity
            onPress={onToggleVisibility}
            style={styles.iconButton}
            testID="password-visibility-toggle">
            <AppIcon
              name={showPassword ? 'visibility-off' : 'visibility'}
              size={18}
              color={theme.colors.accent.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={onCopy} testID="copy-password">
            <AppIcon
              name="content-copy"
              size={18}
              color={theme.colors.accent.primary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function maskPassword(password: string): string {
  return '•'.repeat(password.length);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
    padding: theme.spacing.xxl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.lg,
  },
  emptySubtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.tertiary,
  },
  title: {
    flex: 1,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  editButton: {
    padding: theme.spacing.sm,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  fieldContainer: {
    marginBottom: theme.spacing.lg,
  },
  fieldLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
  },
  fieldValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldValue: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
  },
  notesText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.fontSize.lg * 1.4,
  },
  passwordActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: theme.spacing.xs,
    marginRight: theme.spacing.sm,
  },
});
