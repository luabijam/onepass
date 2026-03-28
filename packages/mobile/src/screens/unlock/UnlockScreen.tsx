import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { useVaultStore } from '../../stores';
import { VaultStorage } from '../../services/VaultStorage';

export function UnlockScreen(): React.JSX.Element {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const insets = useSafeAreaInsets();

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
    VaultStorage.isBiometricsEnabled()
      .then(setBiometricsAvailable)
      .catch(() => {});
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={[styles.logoContainer, { marginTop: insets.top + 40 }]}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>OnePass</Text>
          <Text style={styles.subtitle}>
            {isInitialized ? 'Welcome back' : 'Create your vault'}
          </Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={isInitialized ? 'Enter password' : 'Create password'}
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
          </View>

          {!isInitialized && (
            <View style={styles.inputContainer}>
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
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={isInitialized ? handlePasswordUnlock : handleCreateVault}
            disabled={isLoading}
            testID="unlock-button"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
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
              <Text style={styles.biometricText}>Use Face ID / Fingerprint</Text>
            </TouchableOpacity>
          )}
        </View>

        {!isInitialized && (
          <View style={[styles.hintContainer, { paddingBottom: insets.bottom + 20 }]}>
            <Text style={styles.hintText}>
              Your master password encrypts all your data.{'\n'}
              Make sure to remember it - it cannot be recovered.
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: theme.spacing.lg,
    borderRadius: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
  },
  errorContainer: {
    backgroundColor: theme.colors.status.errorBackground,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
  },
  errorText: {
    color: theme.colors.status.error,
    fontSize: theme.typography.fontSize.md,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  input: {
    paddingVertical: theme.spacing.lg,
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
  },
  button: {
    backgroundColor: theme.colors.accent.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  biometricButton: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    padding: theme.spacing.md,
  },
  biometricText: {
    color: theme.colors.accent.primary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
  },
  hintContainer: {
    marginTop: 32,
    paddingHorizontal: theme.spacing.lg,
  },
  hintText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
