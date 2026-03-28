import React from 'react';
import { render, screen } from '@testing-library/react-native';
import App from '../src/App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen).toBeTruthy();
  });
});
