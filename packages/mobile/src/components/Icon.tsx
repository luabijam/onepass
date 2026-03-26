import React from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../theme';

export type IconName =
  | 'lock'
  | 'lock-open'
  | 'fingerprint'
  | 'search'
  | 'add'
  | 'edit'
  | 'delete'
  | 'save'
  | 'cancel'
  | 'settings'
  | 'sync'
  | 'cloud-upload'
  | 'cloud-download'
  | 'visibility'
  | 'visibility-off'
  | 'content-copy'
  | 'category'
  | 'star'
  | 'star-border'
  | 'menu'
  | 'arrow-back'
  | 'check'
  | 'close'
  | 'expand-more'
  | 'expand-less'
  | 'info'
  | 'warning'
  | 'error'
  | 'vpn-key'
  | 'person'
  | 'email'
  | 'phone'
  | 'link'
  | 'note'
  | 'folder'
  | 'home';

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  testID?: string;
}

export function AppIcon({ name, size = 24, color = theme.colors.text.primary, testID }: IconProps) {
  return <Icon name={name} size={size} color={color} testID={testID} />;
}
