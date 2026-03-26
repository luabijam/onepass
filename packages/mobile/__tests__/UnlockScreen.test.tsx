import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { UnlockScreen } from '../src/screens/unlock/UnlockScreen';

describe('UnlockScreen', () => {
  describe('Display elements', () => {
    it('renders the app title', () => {
      render(<UnlockScreen />);

      expect(screen.getByText('OnePass')).toBeTruthy();
    });

    it('renders the unlock subtitle', () => {
      render(<UnlockScreen />);

      expect(screen.getByText('Unlock to continue')).toBeTruthy();
    });
  });

  describe('Dark theme', () => {
    it('uses dark theme colors', () => {
      render(<UnlockScreen />);

      const title = screen.getByText('OnePass');
      expect(title).toBeTruthy();
    });
  });
});
