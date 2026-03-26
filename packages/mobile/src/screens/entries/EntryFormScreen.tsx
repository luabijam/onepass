import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
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

  const [passwordLength, setPasswordLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');

  useEffect(() => {
    if (entry) {
      setTitle(entry.title);
      setUsername(entry.username);
      setPassword(entry.password);
      setUrl(entry.url || '');
      setNotes(entry.notes || '');
    }
  }, [entry]);

  const generatePassword = () => {
    let chars = '';
    if (includeUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) chars += '0123456789';
    if (includeSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (chars.length === 0) {
      chars = 'abcdefghijklmnopqrstuvwxyz';
    }

    let result = '';
    for (let i = 0; i < passwordLength; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(result);
  };

  const useGeneratedPassword = () => {
    setPassword(generatedPassword);
    setShowPasswordGenerator(false);
  };

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
              onPress={() => {
                generatePassword();
                setShowPasswordGenerator(true);
              }}
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

      <Modal
        visible={showPasswordGenerator}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordGenerator(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Generate Password</Text>
              <TouchableOpacity
                onPress={() => setShowPasswordGenerator(false)}
                testID="close-generator-button"
              >
                <AppIcon name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <View style={styles.generatedPasswordContainer}>
              <Text style={styles.generatedPassword} testID="generated-password">
                {generatedPassword}
              </Text>
            </View>

            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Length: {passwordLength}</Text>
              <TouchableOpacity
                onPress={() => setPasswordLength(Math.max(8, passwordLength - 1))}
                style={styles.lengthButton}
                testID="decrease-length"
              >
                <Text style={styles.lengthButtonText}>-</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPasswordLength(Math.min(32, passwordLength + 1))}
                style={styles.lengthButton}
                testID="increase-length"
              >
                <Text style={styles.lengthButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Uppercase (A-Z)</Text>
              <TouchableOpacity
                onPress={() => setIncludeUppercase(!includeUppercase)}
                style={[styles.checkbox, includeUppercase && styles.checkboxChecked]}
                testID="uppercase-toggle"
              >
                {includeUppercase && <AppIcon name="check" size={16} color="#ffffff" />}
              </TouchableOpacity>
            </View>

            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Lowercase (a-z)</Text>
              <TouchableOpacity
                onPress={() => setIncludeLowercase(!includeLowercase)}
                style={[styles.checkbox, includeLowercase && styles.checkboxChecked]}
                testID="lowercase-toggle"
              >
                {includeLowercase && <AppIcon name="check" size={16} color="#ffffff" />}
              </TouchableOpacity>
            </View>

            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Numbers (0-9)</Text>
              <TouchableOpacity
                onPress={() => setIncludeNumbers(!includeNumbers)}
                style={[styles.checkbox, includeNumbers && styles.checkboxChecked]}
                testID="numbers-toggle"
              >
                {includeNumbers && <AppIcon name="check" size={16} color="#ffffff" />}
              </TouchableOpacity>
            </View>

            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Symbols (!@#$...)</Text>
              <TouchableOpacity
                onPress={() => setIncludeSymbols(!includeSymbols)}
                style={[styles.checkbox, includeSymbols && styles.checkboxChecked]}
                testID="symbols-toggle"
              >
                {includeSymbols && <AppIcon name="check" size={16} color="#ffffff" />}
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={generatePassword}
                style={styles.regenerateButton}
                testID="regenerate-button"
              >
                <AppIcon name="sync" size={20} color="#0A84FF" />
                <Text style={styles.regenerateButtonText}>Regenerate</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={useGeneratedPassword}
                style={styles.useButton}
                testID="use-password-button"
              >
                <Text style={styles.useButtonText}>Use Password</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#2C2C2E',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  generatedPasswordContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  generatedPassword: {
    fontSize: 16,
    fontFamily: 'monospace',
    color: '#ffffff',
    textAlign: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C',
  },
  optionLabel: {
    fontSize: 16,
    color: '#ffffff',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#0A84FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0A84FF',
  },
  lengthButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0A84FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  lengthButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1C1C1E',
  },
  regenerateButtonText: {
    fontSize: 16,
    color: '#0A84FF',
    marginLeft: 8,
  },
  useButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#0A84FF',
  },
  useButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
