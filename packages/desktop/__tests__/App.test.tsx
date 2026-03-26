import React from 'react';
import {render, screen} from '@testing-library/react-native';
import App from '../src/App';

describe('App', () => {
  it('renders correctly', () => {
    render(<App />);
    expect(screen.getByText('OnePass Desktop')).toBeTruthy();
  });

  it('displays subtitle', () => {
    render(<App />);
    expect(screen.getByText('Secure Password Manager')).toBeTruthy();
  });
});
