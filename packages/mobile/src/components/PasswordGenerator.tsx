import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { AppIcon } from './Icon';

export interface PasswordGeneratorProps {
  visible: boolean;
  onUsePassword: (password: string) => void;
  onClose: () => void;
  initialLength?: number;
  initialPassword?: string;
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
}

export function PasswordGenerator({
  visible,
  onUsePassword,
  onClose,
  initialLength = 16,
  initialPassword,
  includeUppercase: propIncludeUppercase = true,
  includeLowercase: propIncludeLowercase = true,
  includeNumbers: propIncludeNumbers = true,
  includeSymbols: propIncludeSymbols = false,
}: PasswordGeneratorProps): React.JSX.Element | null {
  const [passwordLength, setPasswordLength] = useState(initialLength);
  const [includeUppercase, setIncludeUppercase] = useState(propIncludeUppercase);
  const [includeLowercase, setIncludeLowercase] = useState(propIncludeLowercase);
  const [includeNumbers, setIncludeNumbers] = useState(propIncludeNumbers);
  const [includeSymbols, setIncludeSymbols] = useState(propIncludeSymbols);
  const [generatedPassword, setGeneratedPassword] = useState(initialPassword || '');

  const generatePassword = useCallback(() => {
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
  }, [passwordLength, includeUppercase, includeLowercase, includeNumbers, includeSymbols]);

  useEffect(() => {
    if (visible && !initialPassword) {
      generatePassword();
    }
  }, [visible, generatePassword, initialPassword]);

  useEffect(() => {
    if (initialPassword) {
      setGeneratedPassword(initialPassword);
    }
  }, [initialPassword]);

  const handleIncreaseLength = () => {
    setPasswordLength((prev) => Math.min(32, prev + 1));
  };

  const handleDecreaseLength = () => {
    setPasswordLength((prev) => Math.max(8, prev - 1));
  };

  const handleUsePassword = () => {
    onUsePassword(generatedPassword);
    onClose();
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Generate Password</Text>
            <TouchableOpacity onPress={onClose} testID="close-generator-button">
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
              onPress={handleDecreaseLength}
              style={styles.lengthButton}
              testID="decrease-length"
            >
              <Text style={styles.lengthButtonText}>-</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleIncreaseLength}
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
              onPress={handleUsePassword}
              style={styles.useButton}
              testID="use-password-button"
            >
              <Text style={styles.useButtonText}>Use Password</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
