import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { AppIcon } from '../../components';
import { theme } from '../../theme';
import type { Category } from '@onepass/vault-core';

interface CategoryFormData {
  name: string;
  icon: string;
  color: string;
}

interface CategoryFormScreenProps {
  category?: Category;
  onSave: (data: CategoryFormData) => void;
  onCancel: () => void;
  onDeletePress?: () => void;
}

const DEFAULT_ICON = '📁';
const DEFAULT_COLOR = '#0A84FF';

const AVAILABLE_ICONS = ['📁', '💼', '🏠', '🔐', '💳', '🎮', '🎵', '📚', '🛒', '✈️', '🏥', '📧'];

const AVAILABLE_COLORS = [
  '#FF3B30',
  '#FF9500',
  '#FFCC00',
  '#34C759',
  '#00C7BE',
  '#30B0C7',
  '#007AFF',
  '#5856D6',
  '#AF52DE',
  '#FF2D55',
  '#A2845E',
  '#8E8E93',
];

export function CategoryFormScreen({
  category,
  onSave,
  onCancel,
  onDeletePress,
}: CategoryFormScreenProps): React.JSX.Element {
  const isEditMode = category !== undefined;

  const [name, setName] = useState('');
  const [icon, setIcon] = useState(DEFAULT_ICON);
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setIcon(category.icon);
      setColor(category.color);
    }
  }, [category]);

  const handleSave = () => {
    if (!name.trim()) {
      setValidationError('Name is required');
      return;
    }

    onSave({
      name: name.trim(),
      icon,
      color,
    });
  };

  const clearValidationError = () => {
    if (validationError) {
      setValidationError(null);
    }
  };

  const handleSelectIcon = (selectedIcon: string) => {
    setIcon(selectedIcon);
    setShowIconPicker(false);
  };

  const handleSelectColor = (selectedColor: string) => {
    setColor(selectedColor);
    setShowColorPicker(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.backButton} testID="cancel-button">
          <AppIcon name="close" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>{isEditMode ? 'Edit Category' : 'New Category'}</Text>
        <View style={styles.headerActions}>
          {isEditMode && onDeletePress && (
            <TouchableOpacity
              onPress={onDeletePress}
              style={styles.deleteButton}
              testID="delete-button"
            >
              <AppIcon name="delete" size={24} color={theme.colors.status.error} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleSave} style={styles.saveButton} testID="save-button">
            <AppIcon name="check" size={24} color={theme.colors.accent.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {validationError && (
        <View style={styles.errorContainer} testID="validation-error">
          <AppIcon name="error" size={16} color={theme.colors.status.error} />
          <Text style={styles.errorText}>{validationError}</Text>
        </View>
      )}

      <ScrollView style={styles.form}>
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={(text) => {
              setName(text);
              clearValidationError();
            }}
            placeholder="Category name"
            placeholderTextColor={theme.colors.text.secondary}
            testID="name-input"
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Icon</Text>
          <TouchableOpacity
            style={styles.iconSelector}
            onPress={() => setShowIconPicker(true)}
            testID="icon-button"
          >
            <Text style={styles.iconPreview}>{icon}</Text>
            <AppIcon name="expand-more" size={20} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Color</Text>
          <TouchableOpacity
            style={styles.colorSelector}
            onPress={() => setShowColorPicker(true)}
            testID="color-button"
          >
            <View style={[styles.colorPreview, { backgroundColor: color }]} />
            <AppIcon name="expand-more" size={20} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showIconPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowIconPicker(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowIconPicker(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Icon</Text>
            <View style={styles.iconGrid}>
              {AVAILABLE_ICONS.map((iconOption) => (
                <TouchableOpacity
                  key={iconOption}
                  style={[styles.iconOption, icon === iconOption && styles.iconOptionSelected]}
                  onPress={() => handleSelectIcon(iconOption)}
                >
                  <Text style={styles.iconOptionText}>{iconOption}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showColorPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowColorPicker(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowColorPicker(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Color</Text>
            <View style={styles.colorGrid}>
              {AVAILABLE_COLORS.map((colorOption) => (
                <TouchableOpacity
                  key={colorOption}
                  style={[styles.colorOption, { backgroundColor: colorOption }]}
                  onPress={() => handleSelectColor(colorOption)}
                  testID={`color-option-${colorOption}`}
                >
                  {color === colorOption && (
                    <AppIcon name="check" size={20} color={theme.colors.text.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
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
  iconSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.typography.fontSize.md,
    paddingVertical: theme.typography.fontSize.md,
  },
  iconPreview: {
    fontSize: 28,
  },
  colorSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.typography.fontSize.md,
    paddingVertical: theme.typography.fontSize.md,
  },
  colorPreview: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.typography.fontSize.xl,
    width: '80%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.typography.fontSize.lg,
    textAlign: 'center',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  iconOption: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    margin: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.tertiary,
  },
  iconOptionSelected: {
    backgroundColor: theme.colors.accent.primary,
  },
  iconOptionText: {
    fontSize: theme.typography.fontSize.xl + 4,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    margin: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
