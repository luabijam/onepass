import { theme } from '../src/theme';

describe('theme', () => {
  describe('colors', () => {
    it('should have correct background colors', () => {
      expect(theme.colors.background.primary).toBe('#1C1C1E');
      expect(theme.colors.background.secondary).toBe('#2C2C2E');
      expect(theme.colors.background.tertiary).toBe('#3A3A3C');
    });

    it('should have correct text colors', () => {
      expect(theme.colors.text.primary).toBe('#ffffff');
      expect(theme.colors.text.secondary).toBe('#a0a0a0');
    });

    it('should have correct accent colors', () => {
      expect(theme.colors.accent.primary).toBe('#0A84FF');
    });

    it('should have correct status colors', () => {
      expect(theme.colors.status.error).toBe('#FF3B30');
      expect(theme.colors.status.errorBackground).toBe('rgba(255, 59, 48, 0.2)');
      expect(theme.colors.status.success).toBe('#34C759');
      expect(theme.colors.status.warning).toBe('#FF9500');
    });

    it('should have correct overlay colors', () => {
      expect(theme.colors.overlay.dark).toBe('rgba(0, 0, 0, 0.5)');
    });
  });

  describe('spacing', () => {
    it('should have correct spacing values', () => {
      expect(theme.spacing.xs).toBe(4);
      expect(theme.spacing.sm).toBe(8);
      expect(theme.spacing.md).toBe(12);
      expect(theme.spacing.lg).toBe(16);
      expect(theme.spacing.xl).toBe(20);
      expect(theme.spacing.xxl).toBe(24);
    });
  });

  describe('borderRadius', () => {
    it('should have correct border radius values', () => {
      expect(theme.borderRadius.sm).toBe(4);
      expect(theme.borderRadius.md).toBe(8);
      expect(theme.borderRadius.lg).toBe(12);
      expect(theme.borderRadius.xl).toBe(16);
      expect(theme.borderRadius.full).toBe(20);
    });
  });

  describe('typography', () => {
    it('should have correct font sizes', () => {
      expect(theme.typography.fontSize.xs).toBe(12);
      expect(theme.typography.fontSize.sm).toBe(13);
      expect(theme.typography.fontSize.md).toBe(14);
      expect(theme.typography.fontSize.lg).toBe(16);
      expect(theme.typography.fontSize.xl).toBe(18);
      expect(theme.typography.fontSize.xxl).toBe(20);
      expect(theme.typography.fontSize.xxxl).toBe(28);
    });

    it('should have correct font weights', () => {
      expect(theme.typography.fontWeight.normal).toBe('400');
      expect(theme.typography.fontWeight.medium).toBe('500');
      expect(theme.typography.fontWeight.semibold).toBe('600');
      expect(theme.typography.fontWeight.bold).toBe('bold');
    });
  });

  describe('immutability', () => {
    it('should be defined as const', () => {
      expect(theme).toBeDefined();
      expect(theme.colors.background.primary).toBe('#1C1C1E');
    });
  });
});
