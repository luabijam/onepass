import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { AppNavigator } from '../src/navigation/AppNavigator';

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => children,
    Screen: ({ component: Component }: { component: React.ComponentType }) => {
      const MockComponent = Component;
      return <MockComponent />;
    },
  }),
}));

describe('AppNavigator', () => {
  describe('Initial render', () => {
    it('renders without crashing', () => {
      render(<AppNavigator />);
      expect(screen).toBeTruthy();
    });
  });

  describe('Navigation structure', () => {
    it('includes Unlock screen in navigation', () => {
      render(<AppNavigator />);
      expect(screen.getByText('OnePass')).toBeTruthy();
    });
  });
});
