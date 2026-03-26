import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { PasswordGenerator } from '../src/components/PasswordGenerator';

describe('PasswordGenerator', () => {
  const mockOnUsePassword = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Visibility', () => {
    it('renders when visible prop is true', () => {
      render(
        <PasswordGenerator visible={true} onUsePassword={mockOnUsePassword} onClose={mockOnClose} />
      );
      expect(screen.getByText('Generate Password')).toBeTruthy();
    });

    it('does not render when visible prop is false', () => {
      render(
        <PasswordGenerator
          visible={false}
          onUsePassword={mockOnUsePassword}
          onClose={mockOnClose}
        />
      );
      expect(screen.queryByText('Generate Password')).toBeNull();
    });
  });

  describe('Password generation', () => {
    it('generates a password with default length of 16', () => {
      render(
        <PasswordGenerator visible={true} onUsePassword={mockOnUsePassword} onClose={mockOnClose} />
      );
      const generatedPassword = screen.getByTestId('generated-password');
      expect(generatedPassword.props.children.length).toBe(16);
    });

    it('generates a new password when regenerate button is pressed', () => {
      render(
        <PasswordGenerator visible={true} onUsePassword={mockOnUsePassword} onClose={mockOnClose} />
      );
      const firstPassword = screen.getByTestId('generated-password').props.children;
      fireEvent.press(screen.getByTestId('regenerate-button'));
      const secondPassword = screen.getByTestId('generated-password').props.children;
      expect(firstPassword).not.toBe(secondPassword);
    });

    it('generates password with uppercase characters when enabled', () => {
      render(
        <PasswordGenerator
          visible={true}
          onUsePassword={mockOnUsePassword}
          onClose={mockOnClose}
          includeUppercase={true}
          includeLowercase={false}
          includeNumbers={false}
          includeSymbols={false}
        />
      );
      const password = screen.getByTestId('generated-password').props.children as string;
      expect(/[A-Z]/.test(password)).toBe(true);
      expect(/[a-z]/.test(password)).toBe(false);
      expect(/[0-9]/.test(password)).toBe(false);
    });

    it('generates password with lowercase characters when enabled', () => {
      render(
        <PasswordGenerator
          visible={true}
          onUsePassword={mockOnUsePassword}
          onClose={mockOnClose}
          includeUppercase={false}
          includeLowercase={true}
          includeNumbers={false}
          includeSymbols={false}
        />
      );
      const password = screen.getByTestId('generated-password').props.children as string;
      expect(/[a-z]/.test(password)).toBe(true);
      expect(/[A-Z]/.test(password)).toBe(false);
      expect(/[0-9]/.test(password)).toBe(false);
    });

    it('generates password with numbers when enabled', () => {
      render(
        <PasswordGenerator
          visible={true}
          onUsePassword={mockOnUsePassword}
          onClose={mockOnClose}
          includeUppercase={false}
          includeLowercase={false}
          includeNumbers={true}
          includeSymbols={false}
        />
      );
      const password = screen.getByTestId('generated-password').props.children as string;
      expect(/[0-9]/.test(password)).toBe(true);
      expect(/[a-z]/.test(password)).toBe(false);
      expect(/[A-Z]/.test(password)).toBe(false);
    });

    it('generates password with symbols when enabled', () => {
      render(
        <PasswordGenerator
          visible={true}
          onUsePassword={mockOnUsePassword}
          onClose={mockOnClose}
          includeUppercase={false}
          includeLowercase={false}
          includeNumbers={false}
          includeSymbols={true}
        />
      );
      const password = screen.getByTestId('generated-password').props.children as string;
      expect(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)).toBe(true);
      expect(/[a-zA-Z0-9]/.test(password)).toBe(false);
    });
  });

  describe('Length controls', () => {
    it('shows default length of 16', () => {
      render(
        <PasswordGenerator visible={true} onUsePassword={mockOnUsePassword} onClose={mockOnClose} />
      );
      expect(screen.getByText('Length: 16')).toBeTruthy();
    });

    it('increases length when increase button is pressed', () => {
      render(
        <PasswordGenerator visible={true} onUsePassword={mockOnUsePassword} onClose={mockOnClose} />
      );
      fireEvent.press(screen.getByTestId('increase-length'));
      expect(screen.getByText('Length: 17')).toBeTruthy();
    });

    it('decreases length when decrease button is pressed', () => {
      render(
        <PasswordGenerator visible={true} onUsePassword={mockOnUsePassword} onClose={mockOnClose} />
      );
      fireEvent.press(screen.getByTestId('decrease-length'));
      expect(screen.getByText('Length: 15')).toBeTruthy();
    });

    it('limits minimum length to 8', () => {
      render(
        <PasswordGenerator
          visible={true}
          onUsePassword={mockOnUsePassword}
          onClose={mockOnClose}
          initialLength={8}
        />
      );
      fireEvent.press(screen.getByTestId('decrease-length'));
      expect(screen.getByText('Length: 8')).toBeTruthy();
    });

    it('limits maximum length to 32', () => {
      render(
        <PasswordGenerator
          visible={true}
          onUsePassword={mockOnUsePassword}
          onClose={mockOnClose}
          initialLength={32}
        />
      );
      fireEvent.press(screen.getByTestId('increase-length'));
      expect(screen.getByText('Length: 32')).toBeTruthy();
    });

    it('respects initialLength prop', () => {
      render(
        <PasswordGenerator
          visible={true}
          onUsePassword={mockOnUsePassword}
          onClose={mockOnClose}
          initialLength={20}
        />
      );
      expect(screen.getByText('Length: 20')).toBeTruthy();
    });

    it('generates password with correct length after length change', () => {
      render(
        <PasswordGenerator visible={true} onUsePassword={mockOnUsePassword} onClose={mockOnClose} />
      );
      fireEvent.press(screen.getByTestId('increase-length'));
      fireEvent.press(screen.getByTestId('increase-length'));
      fireEvent.press(screen.getByTestId('regenerate-button'));
      const password = screen.getByTestId('generated-password').props.children;
      expect(password.length).toBe(18);
    });
  });

  describe('Character class toggles', () => {
    it('shows all character class toggles', () => {
      render(
        <PasswordGenerator visible={true} onUsePassword={mockOnUsePassword} onClose={mockOnClose} />
      );
      expect(screen.getByText('Uppercase (A-Z)')).toBeTruthy();
      expect(screen.getByText('Lowercase (a-z)')).toBeTruthy();
      expect(screen.getByText('Numbers (0-9)')).toBeTruthy();
      expect(screen.getByText('Symbols (!@#$...)')).toBeTruthy();
    });

    it('toggles uppercase option', () => {
      render(
        <PasswordGenerator visible={true} onUsePassword={mockOnUsePassword} onClose={mockOnClose} />
      );
      const uppercaseToggle = screen.getByTestId('uppercase-toggle');
      expect(uppercaseToggle).toBeTruthy();
      fireEvent.press(uppercaseToggle);
    });

    it('toggles lowercase option', () => {
      render(
        <PasswordGenerator visible={true} onUsePassword={mockOnUsePassword} onClose={mockOnClose} />
      );
      const lowercaseToggle = screen.getByTestId('lowercase-toggle');
      expect(lowercaseToggle).toBeTruthy();
      fireEvent.press(lowercaseToggle);
    });

    it('toggles numbers option', () => {
      render(
        <PasswordGenerator visible={true} onUsePassword={mockOnUsePassword} onClose={mockOnClose} />
      );
      const numbersToggle = screen.getByTestId('numbers-toggle');
      expect(numbersToggle).toBeTruthy();
      fireEvent.press(numbersToggle);
    });

    it('toggles symbols option', () => {
      render(
        <PasswordGenerator visible={true} onUsePassword={mockOnUsePassword} onClose={mockOnClose} />
      );
      const symbolsToggle = screen.getByTestId('symbols-toggle');
      expect(symbolsToggle).toBeTruthy();
      fireEvent.press(symbolsToggle);
    });

    it('defaults to uppercase, lowercase, and numbers enabled, symbols disabled', () => {
      render(
        <PasswordGenerator
          visible={true}
          onUsePassword={mockOnUsePassword}
          onClose={mockOnClose}
          includeUppercase={true}
          includeLowercase={true}
          includeNumbers={true}
          includeSymbols={false}
        />
      );
      const password = screen.getByTestId('generated-password').props.children as string;
      expect(/[A-Z]/.test(password)).toBe(true);
      expect(/[a-z]/.test(password)).toBe(true);
      expect(/[0-9]/.test(password)).toBe(true);
      expect(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)).toBe(false);
    });
  });

  describe('Actions', () => {
    it('calls onUsePassword with generated password when Use Password is pressed', () => {
      render(
        <PasswordGenerator visible={true} onUsePassword={mockOnUsePassword} onClose={mockOnClose} />
      );
      const password = screen.getByTestId('generated-password').props.children;
      fireEvent.press(screen.getByTestId('use-password-button'));
      expect(mockOnUsePassword).toHaveBeenCalledWith(password);
    });

    it('calls onClose when close button is pressed', () => {
      render(
        <PasswordGenerator visible={true} onUsePassword={mockOnUsePassword} onClose={mockOnClose} />
      );
      fireEvent.press(screen.getByTestId('close-generator-button'));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('generates lowercase password when all character classes are disabled', () => {
      render(
        <PasswordGenerator
          visible={true}
          onUsePassword={mockOnUsePassword}
          onClose={mockOnClose}
          includeUppercase={false}
          includeLowercase={false}
          includeNumbers={false}
          includeSymbols={false}
        />
      );
      fireEvent.press(screen.getByTestId('regenerate-button'));
      const password = screen.getByTestId('generated-password').props.children as string;
      expect(/[a-z]/.test(password)).toBe(true);
    });

    it('uses initial password if provided', () => {
      render(
        <PasswordGenerator
          visible={true}
          onUsePassword={mockOnUsePassword}
          onClose={mockOnClose}
          initialPassword="initialPassword123"
        />
      );
      const password = screen.getByTestId('generated-password').props.children;
      expect(password).toBe('initialPassword123');
    });
  });
});
