import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { AppIcon } from '../../components';

interface Entry {
  id: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  categoryId: string;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

interface EntryDetailScreenProps {
  entry: Entry;
  onEditPress: (entryId: string) => void;
  onBackPress: () => void;
}

export function EntryDetailScreen({
  entry,
  onEditPress,
  onBackPress,
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
          <AppIcon name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>{entry.title}</Text>
        <TouchableOpacity
          onPress={() => onEditPress(entry.id)}
          style={styles.editButton}
          testID="edit-entry-button"
        >
          <AppIcon name="edit" size={24} color="#0A84FF" />
        </TouchableOpacity>
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
            <AppIcon name="content-copy" size={20} color="#0A84FF" />
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
              color="#0A84FF"
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={onCopy} testID="copy-password">
            {showCopied ? (
              <Text style={styles.copiedText}>Copied</Text>
            ) : (
              <AppIcon name="content-copy" size={20} color="#0A84FF" />
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
    backgroundColor: '#1C1C1E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#a0a0a0',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  fieldValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldValue: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
  },
  notesText: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 24,
  },
  passwordActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 4,
    marginRight: 8,
  },
  copiedText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
});
