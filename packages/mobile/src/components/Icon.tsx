import React from 'react';
import { Text, StyleSheet } from 'react-native';
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

const iconMap: Record<IconName, string> = {
  lock: '🔒',
  'lock-open': '🔓',
  fingerprint: '👆',
  search: '🔍',
  add: '+',
  edit: '✏️',
  delete: '🗑️',
  save: '💾',
  cancel: '✕',
  settings: '⚙️',
  sync: '🔄',
  'cloud-upload': '⬆️',
  'cloud-download': '⬇️',
  visibility: '👁️',
  'visibility-off': '🙈',
  'content-copy': '📋',
  category: '📁',
  star: '⭐',
  'star-border': '☆',
  menu: '☰',
  'arrow-back': '←',
  check: '✓',
  close: '✕',
  'expand-more': '▼',
  'expand-less': '▲',
  info: 'ℹ️',
  warning: '⚠️',
  error: '❌',
  'vpn-key': '🔑',
  person: '👤',
  email: '✉️',
  phone: '📞',
  link: '🔗',
  note: '📝',
  folder: '📂',
  home: '🏠',
};

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  testID?: string;
  style?: any;
}

export function AppIcon({
  name,
  size = 24,
  color = theme.colors.text.primary,
  testID,
  style,
}: IconProps) {
  return (
    <Text style={[styles.icon, { fontSize: size, color }, style]} testID={testID}>
      {iconMap[name]}
    </Text>
  );
}

const styles = StyleSheet.create({
  icon: {
    textAlign: 'center',
  },
});
