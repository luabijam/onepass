import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { AppIcon } from '../../components';
import { theme } from '../../theme';
import type { Entry } from '@onepass/vault-core';

interface EntryDetailScreenProps {
  entry: Entry;
  onEditPress: (entryId: string) => void;
  onBackPress: () => void;
  onDeletePress?: (entryId: string) => void;
}

export function EntryDetailScreen({
  entry,
  onEditPress,
  onBackPress,
  onDeletePress,
}: EntryDetailScreenProps): React.JSX.Element {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (value: string, field: string) => {
    Clipboard.setString(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBackPress} style={styles.backButton} testID="back-button">
          <AppIcon name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>{entry.title}</Text>
        <View style={styles.headerActions}>
          {onDeletePress && (
            <TouchableOpacity
              onPress={() => onDeletePress(entry.id)}
              style={styles.deleteButton}
              testID="delete-entry-button"
            >
              <AppIcon name="delete" size={24} color={theme.colors.status.error} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => onEditPress(entry.id)}
            style={styles.editButton}
            testID="edit-entry-button"
          >
            <AppIcon name="edit" size={24} color={theme.colors.accent.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <FieldRow
          label="Username"
          value={entry.username}
          onCopy={() => copyToClipboard(entry.username, 'username')}
          showCopied={copiedField === 'username'}
        />

        <PasswordFieldRow
          password={entry.password}
          showPassword={showPassword}
          onToggleVisibility={() => setShowPassword(!showPassword)}
          onCopy={() => copyToClipboard(entry.password, 'password')}
          showCopied={copiedField === 'password'}
        />

        {entry.url && (
          <FieldRow
            label="URL"
            value={entry.url}
            onCopy={() => copyToClipboard(entry.url!, 'url')}
            showCopied={copiedField === 'url'}
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
  showCopied: boolean;
}

function FieldRow({ label, value, onCopy, showCopied }: FieldRowProps): React.JSX.Element {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldValueRow}>
        <Text style={styles.fieldValue}>{value}</Text>
        <TouchableOpacity onPress={onCopy} testID={`copy-${label.toLowerCase()}`}>
          {showCopied ? (
            <Text style={styles.copiedText}>Copied</Text>
          ) : (
            <AppIcon name="content-copy" size={20} color={theme.colors.accent.primary} />
          )}
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
  showCopied: boolean;
}

function PasswordFieldRow({
  password,
  showPassword,
  onToggleVisibility,
  onCopy,
  showCopied,
}: PasswordFieldRowProps): React.JSX.Element {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>Password</Text>
      <View style={styles.fieldValueRow}>
        <Text style={styles.fieldValue}>{showPassword ? password : maskPassword(password)}</Text>
        <View style={styles.passwordActions}>
          <TouchableOpacity
            onPress={onToggleVisibility}
            style={styles.iconButton}
            testID="password-visibility-toggle"
          >
            <AppIcon
              name={showPassword ? 'visibility-off' : 'visibility'}
              size={20}
              color={theme.colors.accent.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={onCopy} testID="copy-password">
            {showCopied ? (
              <Text style={styles.copiedText}>Copied</Text>
            ) : (
              <AppIcon name="content-copy" size={20} color={theme.colors.accent.primary} />
            )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.typography.fontSize.lg,
    paddingVertical: theme.typography.fontSize.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.tertiary,
  },
  backButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  editButton: {
    padding: theme.spacing.sm,
  },
  content: {
    flex: 1,
    padding: theme.typography.fontSize.lg,
  },
  fieldContainer: {
    marginBottom: theme.typography.fontSize.xl,
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
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
  },
  notesText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.fontSize.xxl,
  },
  passwordActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: theme.spacing.xs,
    marginRight: theme.spacing.sm,
  },
  copiedText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.status.success,
    fontWeight: theme.typography.fontWeight.medium,
  },
});
