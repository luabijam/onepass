import React from 'react';
import { render } from '@testing-library/react-native';
import { AppIcon, IconName } from '../src/components/Icon';

describe('AppIcon', () => {
  const iconNames: IconName[] = [
    'lock',
    'lock-open',
    'fingerprint',
    'search',
    'add',
    'edit',
    'delete',
    'save',
    'cancel',
    'settings',
    'sync',
    'visibility',
    'visibility-off',
    'content-copy',
  ];

  it('renders icon with default props', () => {
    const { getByText } = render(<AppIcon name="lock" />);
    expect(getByText('lock')).toBeTruthy();
  });

  it('renders icon with custom size', () => {
    const { getByText } = render(<AppIcon name="lock" size={32} />);
    expect(getByText('lock')).toBeTruthy();
  });

  it('renders icon with custom color', () => {
    const { getByText } = render(<AppIcon name="lock" color="#ff0000" />);
    expect(getByText('lock')).toBeTruthy();
  });

  it('renders icon with testID', () => {
    const { getByTestId } = render(<AppIcon name="lock" testID="my-icon" />);
    expect(getByTestId('my-icon')).toBeTruthy();
  });

  it.each(iconNames)('renders %s icon correctly', (iconName) => {
    const { getByText } = render(<AppIcon name={iconName} />);
    expect(getByText(iconName)).toBeTruthy();
  });

  it('uses default values when props not provided', () => {
    const { getByText } = render(<AppIcon name="settings" />);
    expect(getByText('settings')).toBeTruthy();
  });
});
