import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { AppIcon } from './Icon';
import { theme } from '../theme';

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
              <AppIcon name="close" size={24} color={theme.colors.text.primary} />
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
              {includeUppercase && (
                <AppIcon name="check" size={16} color={theme.colors.text.primary} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Lowercase (a-z)</Text>
            <TouchableOpacity
              onPress={() => setIncludeLowercase(!includeLowercase)}
              style={[styles.checkbox, includeLowercase && styles.checkboxChecked]}
              testID="lowercase-toggle"
            >
              {includeLowercase && (
                <AppIcon name="check" size={16} color={theme.colors.text.primary} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Numbers (0-9)</Text>
            <TouchableOpacity
              onPress={() => setIncludeNumbers(!includeNumbers)}
              style={[styles.checkbox, includeNumbers && styles.checkboxChecked]}
              testID="numbers-toggle"
            >
              {includeNumbers && (
                <AppIcon name="check" size={16} color={theme.colors.text.primary} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Symbols (!@#$...)</Text>
            <TouchableOpacity
              onPress={() => setIncludeSymbols(!includeSymbols)}
              style={[styles.checkbox, includeSymbols && styles.checkboxChecked]}
              testID="symbols-toggle"
            >
              {includeSymbols && (
                <AppIcon name="check" size={16} color={theme.colors.text.primary} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              onPress={generatePassword}
              style={styles.regenerateButton}
              testID="regenerate-button"
            >
              <AppIcon name="sync" size={20} color={theme.colors.accent.primary} />
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
    backgroundColor: theme.colors.overlay.dark,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background.secondary,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    padding: theme.typography.fontSize.xl,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.typography.fontSize.xl,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  generatedPasswordContainer: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.typography.fontSize.lg,
    marginBottom: theme.typography.fontSize.xl,
  },
  generatedPassword: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: 'monospace',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.typography.fontSize.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.tertiary,
  },
  optionLabel: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 2,
    borderColor: theme.colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.accent.primary,
  },
  lengthButton: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.sm,
  },
  lengthButtonText: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.typography.fontSize.xl,
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.typography.fontSize.lg,
    paddingVertical: theme.typography.fontSize.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.primary,
  },
  regenerateButtonText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.accent.primary,
    marginLeft: theme.spacing.sm,
  },
  useButton: {
    paddingHorizontal: theme.typography.fontSize.xxl,
    paddingVertical: theme.typography.fontSize.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.accent.primary,
  },
  useButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
});
