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

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  updatedAt: Date;
  deletedAt?: Date;
}

interface CategoryFormData {
  name: string;
  icon: string;
  color: string;
}

interface CategoryFormScreenProps {
  category?: Category;
  onSave: (data: CategoryFormData) => void;
  onCancel: () => void;
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
          <AppIcon name="close" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>{isEditMode ? 'Edit Category' : 'New Category'}</Text>
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
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={(text) => {
              setName(text);
              clearValidationError();
            }}
            placeholder="Category name"
            placeholderTextColor="#a0a0a0"
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
            <AppIcon name="expand-more" size={20} color="#a0a0a0" />
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
            <AppIcon name="expand-more" size={20} color="#a0a0a0" />
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
                  {color === colorOption && <AppIcon name="check" size={20} color="#ffffff" />}
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
  iconSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  iconPreview: {
    fontSize: 28,
  },
  colorSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  colorPreview: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
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
    margin: 4,
    borderRadius: 8,
    backgroundColor: '#3A3A3C',
  },
  iconOptionSelected: {
    backgroundColor: '#0A84FF',
  },
  iconOptionText: {
    fontSize: 24,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
