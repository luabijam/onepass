import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon, PasswordGenerator } from '../../components';
import { theme } from '../../theme';
import type { Entry } from '@onepass/vault-core';

interface EntryFormData {
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
}

interface EntryFormScreenProps {
  entry?: Entry;
  onSave: (data: EntryFormData) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export function EntryFormScreen({
  entry,
  onSave,
  onCancel,
  onDelete,
}: EntryFormScreenProps): React.JSX.Element {
  const isEditMode = entry !== undefined;
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (entry) {
      setTitle(entry.title);
      setUsername(entry.username);
      setPassword(entry.password);
      setUrl(entry.url || '');
      setNotes(entry.notes || '');
    }
  }, [entry]);

  const handleSave = () => {
    if (!title.trim()) {
      setValidationError('Title is required');
      return;
    }
    if (!username.trim()) {
      setValidationError('Username is required');
      return;
    }

    onSave({
      title: title.trim(),
      username: username.trim(),
      password,
      url: url.trim(),
      notes: notes.trim(),
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (onDelete) {
              onDelete();
            }
          },
        },
      ]
    );
  };

  const clearValidationError = () => {
    if (validationError) {
      setValidationError(null);
    }
  };

  const handleUsePassword = (generatedPassword: string) => {
    setPassword(generatedPassword);
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={[styles.header, { paddingTop: insets.top + theme.spacing.sm }]}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelButton} testID="cancel-button">
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditMode ? 'Edit' : 'New Entry'}</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton} testID="save-button">
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        {validationError && (
          <View style={styles.errorContainer} testID="validation-error">
            <AppIcon name="error" size={16} color={theme.colors.status.error} />
            <Text style={styles.errorText}>{validationError}</Text>
          </View>
        )}

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                clearValidationError();
              }}
              placeholder="e.g., Gmail, Netflix, Bank"
              placeholderTextColor={theme.colors.text.secondary}
              testID="title-input"
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Username *</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                clearValidationError();
              }}
              placeholder="Email or username"
              placeholderTextColor={theme.colors.text.secondary}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              testID="username-input"
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                placeholderTextColor={theme.colors.text.secondary}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                testID="password-input"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.iconButton}
                testID="password-visibility-toggle"
              >
                <AppIcon
                  name={showPassword ? 'visibility-off' : 'visibility'}
                  size={22}
                  color={theme.colors.text.secondary}
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => setShowPasswordGenerator(true)}
              style={styles.generateButton}
              testID="generate-password-button"
            >
              <AppIcon name="vpn-key" size={18} color={theme.colors.accent.primary} />
              <Text style={styles.generateButtonText}>Generate Password</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Website URL</Text>
            <TextInput
              style={styles.input}
              value={url}
              onChangeText={setUrl}
              placeholder="https://example.com"
              placeholderTextColor={theme.colors.text.secondary}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              testID="url-input"
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional notes or details..."
              placeholderTextColor={theme.colors.text.secondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              testID="notes-input"
            />
          </View>

          {isEditMode && onDelete && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <AppIcon name="delete" size={20} color={theme.colors.status.error} />
              <Text style={styles.deleteButtonText}>Delete Entry</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <PasswordGenerator
          visible={showPasswordGenerator}
          onUsePassword={handleUsePassword}
          onClose={() => setShowPasswordGenerator(false)}
        />
      </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.tertiary,
  },
  cancelButton: {
    padding: theme.spacing.sm,
  },
  cancelText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.accent.primary,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  saveButton: {
    padding: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.accent.primary,
    borderRadius: theme.borderRadius.md,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.status.errorBackground,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  errorText: {
    color: theme.colors.status.error,
    fontSize: theme.typography.fontSize.md,
    marginLeft: theme.spacing.sm,
  },
  form: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  fieldContainer: {
    marginBottom: theme.spacing.xl,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
  },
  notesInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    paddingRight: theme.spacing.sm,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
  },
  iconButton: {
    padding: theme.spacing.sm,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    alignSelf: 'flex-start',
  },
  generateButtonText: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.accent.primary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xxl,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background.secondary,
  },
  deleteButtonText: {
    color: theme.colors.status.error,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    marginLeft: theme.spacing.sm,
  },
});
