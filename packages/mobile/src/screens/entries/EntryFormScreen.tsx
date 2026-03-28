import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
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
}

export function EntryFormScreen({
  entry,
  onSave,
  onCancel,
}: EntryFormScreenProps): React.JSX.Element {
  const isEditMode = entry !== undefined;

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
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.backButton} testID="cancel-button">
          <AppIcon name="close" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>{isEditMode ? 'Edit Entry' : 'New Entry'}</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton} testID="save-button">
          <AppIcon name="check" size={24} color={theme.colors.accent.primary} />
        </TouchableOpacity>
      </View>

      {validationError && (
        <View style={styles.errorContainer} testID="validation-error">
          <AppIcon name="error" size={16} color={theme.colors.status.error} />
          <Text style={styles.errorText}>{validationError}</Text>
        </View>
      )}

      <ScrollView style={styles.form}>
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              clearValidationError();
            }}
            placeholder="Entry title"
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
            placeholder="Username or email"
            placeholderTextColor={theme.colors.text.secondary}
            autoCapitalize="none"
            autoCorrect={false}
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
              placeholder="Password"
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
                size={20}
                color={theme.colors.accent.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowPasswordGenerator(true)}
              style={styles.iconButton}
              testID="generate-password-button"
            >
              <AppIcon name="vpn-key" size={20} color={theme.colors.accent.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>URL</Text>
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
            placeholder="Additional notes"
            placeholderTextColor={theme.colors.text.secondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            testID="notes-input"
          />
        </View>
      </ScrollView>

      <PasswordGenerator
        visible={showPasswordGenerator}
        onUsePassword={handleUsePassword}
        onClose={() => setShowPasswordGenerator(false)}
      />
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
  saveButton: {
    padding: theme.spacing.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.status.errorBackground,
    marginHorizontal: theme.typography.fontSize.lg,
    marginTop: theme.typography.fontSize.md,
    paddingHorizontal: theme.typography.fontSize.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  errorText: {
    color: theme.colors.status.error,
    fontSize: theme.typography.fontSize.md,
    marginLeft: theme.spacing.sm,
  },
  form: {
    flex: 1,
    paddingHorizontal: theme.typography.fontSize.lg,
    paddingTop: theme.typography.fontSize.lg,
  },
  fieldContainer: {
    marginBottom: theme.typography.fontSize.xl,
  },
  label: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.typography.fontSize.md,
    paddingVertical: theme.typography.fontSize.md,
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
  },
  notesInput: {
    minHeight: 100,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.typography.fontSize.md,
    paddingVertical: theme.typography.fontSize.md,
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
  },
  iconButton: {
    padding: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },
});
