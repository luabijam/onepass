import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { CategoryFormScreen } from '../src/screens/categories/CategoryFormScreen';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  updatedAt: Date;
  deletedAt?: Date;
}

const createMockCategory = (overrides: Partial<Category> = {}): Category => ({
  id: '1',
  name: 'Test Category',
  icon: '📁',
  color: '#8E8E93',
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

describe('CategoryFormScreen', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create new category', () => {
    it('shows "New Category" title when creating', () => {
      render(<CategoryFormScreen onSave={mockOnSave} onCancel={mockOnCancel} />);
      expect(screen.getByText('New Category')).toBeTruthy();
    });

    it('shows empty form fields when creating', () => {
      render(<CategoryFormScreen onSave={mockOnSave} onCancel={mockOnCancel} />);
      expect(screen.getByPlaceholderText('Category name')).toBeTruthy();
    });

    it('shows default icon and color', () => {
      render(<CategoryFormScreen onSave={mockOnSave} onCancel={mockOnCancel} />);
      expect(screen.getByText('📁')).toBeTruthy();
    });

    it('calls onSave with form data when save button is pressed', () => {
      render(<CategoryFormScreen onSave={mockOnSave} onCancel={mockOnCancel} />);

      fireEvent.changeText(screen.getByTestId('name-input'), 'My Category');

      fireEvent.press(screen.getByTestId('save-button'));

      expect(mockOnSave).toHaveBeenCalledWith({
        name: 'My Category',
        icon: '📁',
        color: '#0A84FF',
      });
    });

    it('trims whitespace from form values', () => {
      render(<CategoryFormScreen onSave={mockOnSave} onCancel={mockOnCancel} />);

      fireEvent.changeText(screen.getByTestId('name-input'), '  Trimmed Category  ');

      fireEvent.press(screen.getByTestId('save-button'));

      expect(mockOnSave).toHaveBeenCalledWith({
        name: 'Trimmed Category',
        icon: '📁',
        color: '#0A84FF',
      });
    });
  });

  describe('Edit existing category', () => {
    it('shows "Edit Category" title when editing', () => {
      const category = createMockCategory();
      render(
        <CategoryFormScreen category={category} onSave={mockOnSave} onCancel={mockOnCancel} />
      );
      expect(screen.getByText('Edit Category')).toBeTruthy();
    });

    it('pre-fills form with existing category values', () => {
      const category = createMockCategory({
        name: 'Work',
        icon: '💼',
        color: '#FF9500',
      });
      render(
        <CategoryFormScreen category={category} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      expect(screen.getByDisplayValue('Work')).toBeTruthy();
      expect(screen.getByText('💼')).toBeTruthy();
    });

    it('calls onSave with updated values when save button is pressed', () => {
      const category = createMockCategory();
      render(
        <CategoryFormScreen category={category} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      fireEvent.changeText(screen.getByTestId('name-input'), 'Updated Name');
      fireEvent.press(screen.getByTestId('save-button'));

      expect(mockOnSave).toHaveBeenCalledWith({
        name: 'Updated Name',
        icon: '📁',
        color: '#8E8E93',
      });
    });
  });

  describe('Validation', () => {
    it('shows error when name is empty', () => {
      render(<CategoryFormScreen onSave={mockOnSave} onCancel={mockOnCancel} />);
      fireEvent.press(screen.getByTestId('save-button'));
      expect(screen.getByText('Name is required')).toBeTruthy();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('shows error when name is only whitespace', () => {
      render(<CategoryFormScreen onSave={mockOnSave} onCancel={mockOnCancel} />);
      fireEvent.changeText(screen.getByTestId('name-input'), '   ');
      fireEvent.press(screen.getByTestId('save-button'));
      expect(screen.getByText('Name is required')).toBeTruthy();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('clears error when user starts typing', () => {
      render(<CategoryFormScreen onSave={mockOnSave} onCancel={mockOnCancel} />);
      fireEvent.press(screen.getByTestId('save-button'));
      expect(screen.getByText('Name is required')).toBeTruthy();
      fireEvent.changeText(screen.getByTestId('name-input'), 'T');
      expect(screen.queryByText('Name is required')).toBeNull();
    });
  });

  describe('Icon selection', () => {
    it('shows icon picker when icon button is pressed', () => {
      render(<CategoryFormScreen onSave={mockOnSave} onCancel={mockOnCancel} />);
      fireEvent.press(screen.getByTestId('icon-button'));
      expect(screen.getByText('Choose Icon')).toBeTruthy();
    });

    it('selects a new icon from the picker', () => {
      render(<CategoryFormScreen onSave={mockOnSave} onCancel={mockOnCancel} />);
      fireEvent.press(screen.getByTestId('icon-button'));
      fireEvent.press(screen.getByText('💼'));
      expect(screen.getByText('💼')).toBeTruthy();
    });
  });

  describe('Color selection', () => {
    it('shows color picker when color button is pressed', () => {
      render(<CategoryFormScreen onSave={mockOnSave} onCancel={mockOnCancel} />);
      fireEvent.press(screen.getByTestId('color-button'));
      expect(screen.getByText('Choose Color')).toBeTruthy();
    });

    it('selects a new color from the picker', () => {
      render(<CategoryFormScreen onSave={mockOnSave} onCancel={mockOnCancel} />);
      fireEvent.press(screen.getByTestId('color-button'));
      const colorOption = screen.getByTestId('color-option-#FF3B30');
      fireEvent.press(colorOption);
      expect(colorOption).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('calls onCancel when cancel button is pressed', () => {
      render(<CategoryFormScreen onSave={mockOnSave} onCancel={mockOnCancel} />);
      fireEvent.press(screen.getByTestId('cancel-button'));
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });
});
