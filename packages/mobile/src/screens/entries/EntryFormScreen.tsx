import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { AppIcon, PasswordGenerator } from '../../components';

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
          <AppIcon name="close" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>{isEditMode ? 'Edit Entry' : 'New Entry'}</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton} testID="save-button">
          <AppIcon name="check" size={24} color="#0A84FF" />
        </TouchableOpacity>
      </View>

      {validationError && (
        <View style={styles.errorContainer} testID="validation-error">
          <AppIcon name="error" size={16} color="#FF3B30" />
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
            placeholderTextColor="#a0a0a0"
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
            placeholderTextColor="#a0a0a0"
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
              placeholderTextColor="#a0a0a0"
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
                color="#0A84FF"
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowPasswordGenerator(true)}
              style={styles.iconButton}
              testID="generate-password-button"
            >
              <AppIcon name="vpn-key" size={20} color="#0A84FF" />
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
            placeholderTextColor="#a0a0a0"
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
            placeholderTextColor="#a0a0a0"
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
  saveButton: {
    padding: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginLeft: 8,
  },
  form: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#a0a0a0',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#ffffff',
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
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#ffffff',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
});
