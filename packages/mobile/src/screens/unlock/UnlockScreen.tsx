import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { AppIcon } from '../../components';
import { theme } from '../../theme';
import { useVaultStore } from '../../stores';
import { VaultStorage } from '../../services/VaultStorage';

export function UnlockScreen(): React.JSX.Element {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);

  const {
    isInitialized,
    isLoading,
    initialize,
    unlock,
    createVault,
    error: vaultError,
  } = useVaultStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    VaultStorage.isBiometricsEnabled().then(setBiometricsAvailable);
  }, []);

  useEffect(() => {
    if (vaultError) {
      setError(vaultError);
    }
  }, [vaultError]);

  const handlePasswordUnlock = async () => {
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    setError(null);
    const success = await unlock(password);
    if (!success) {
      setError('Incorrect password');
    }
    setPassword('');
  };

  const handleCreateVault = async () => {
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError(null);
    const success = await createVault(password);
    if (!success) {
      setError('Failed to create vault');
    }
    setPassword('');
    setConfirmPassword('');
  };

  const handleBiometricUnlock = async () => {
    try {
      const result = await VaultStorage.unlockWithBiometrics();
      if (result.success && result.entries && result.categories) {
        useVaultStore.setState({
          isUnlocked: true,
          salt: result.salt ?? null,
          entries: result.entries,
          categories: result.categories,
        });
      } else {
        setError(result.error || 'Biometric unlock failed');
      }
    } catch {
      setError('Biometric unlock failed');
    }
  };

  if (isLoading && !isInitialized) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.accent.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>OnePass</Text>
        <Text style={styles.subtitle}>
          {isInitialized ? 'Unlock to continue' : 'Create a master password'}
        </Text>

        {error && (
          <View style={styles.errorContainer}>
            <AppIcon name="error" size={16} color={theme.colors.status.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={theme.colors.text.secondary}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError(null);
            }}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            testID="password-input"
          />

          {!isInitialized && (
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor={theme.colors.text.secondary}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setError(null);
              }}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              testID="confirm-password-input"
            />
          )}

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={isInitialized ? handlePasswordUnlock : handleCreateVault}
            disabled={isLoading}
            testID="unlock-button"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.colors.text.primary} />
            ) : (
              <Text style={styles.buttonText}>{isInitialized ? 'Unlock' : 'Create Vault'}</Text>
            )}
          </TouchableOpacity>

          {isInitialized && biometricsAvailable && (
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricUnlock}
              disabled={isLoading}
              testID="biometric-button"
            >
              <AppIcon name="fingerprint" size={24} color={theme.colors.accent.primary} />
              <Text style={styles.biometricText}>Use Biometrics</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
  },
  content: {
    width: '85%',
    maxWidth: 320,
  },
  title: {
    fontSize: theme.typography.fontSize.xxxl + 8,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.typography.fontSize.xxl,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.status.errorBackground,
    paddingHorizontal: theme.typography.fontSize.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.typography.fontSize.lg,
  },
  errorText: {
    color: theme.colors.status.error,
    fontSize: theme.typography.fontSize.md,
    marginLeft: theme.spacing.sm,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.typography.fontSize.md,
    paddingVertical: theme.typography.fontSize.lg,
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  button: {
    backgroundColor: theme.colors.accent.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.typography.fontSize.lg,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.typography.fontSize.xl,
  },
  biometricText: {
    color: theme.colors.accent.primary,
    fontSize: theme.typography.fontSize.lg,
    marginLeft: theme.spacing.sm,
  },
});
