export const theme = {
  colors: {
    background: {
      primary: '#1C1C1E',
      secondary: '#2C2C2E',
      tertiary: '#3A3A3C',
    },
    text: {
      primary: '#ffffff',
      secondary: '#a0a0a0',
    },
    accent: {
      primary: '#0A84FF',
    },
    status: {
      error: '#FF3B30',
      errorBackground: 'rgba(255, 59, 48, 0.2)',
      success: '#34C759',
      warning: '#FF9500',
    },
    overlay: {
      dark: 'rgba(0, 0, 0, 0.5)',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 20,
  },
  typography: {
    fontSize: {
      xs: 12,
      sm: 13,
      md: 14,
      lg: 16,
      xl: 18,
      xxl: 20,
      xxxl: 28,
    },
    fontWeight: {
      normal: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: 'bold' as const,
    },
  },
} as const;

export type Theme = typeof theme;
export type Colors = typeof theme.colors;
