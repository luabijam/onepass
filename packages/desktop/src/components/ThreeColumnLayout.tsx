import React from 'react';
import {View, StyleSheet, ViewStyle, StyleProp} from 'react-native';
import {theme} from '../theme';

export interface ThreeColumnLayoutProps {
  sidebar: React.ReactNode;
  list: React.ReactNode;
  detail: React.ReactNode;
  sidebarWidth?: number;
  listWidth?: number;
  style?: StyleProp<ViewStyle>;
}

const SIDEBAR_WIDTH = 160;
const LIST_WIDTH = 200;

export function ThreeColumnLayout({
  sidebar,
  list,
  detail,
  sidebarWidth = SIDEBAR_WIDTH,
  listWidth = LIST_WIDTH,
  style,
}: ThreeColumnLayoutProps): React.JSX.Element {
  return (
    <View style={[styles.container, style]} testID="three-column-layout">
      <View
        style={[styles.sidebar, {width: sidebarWidth}]}
        testID="sidebar-column">
        {sidebar}
      </View>
      <View style={[styles.divider, {left: sidebarWidth}]} />
      <View
        style={[styles.list, {width: listWidth, left: sidebarWidth}]}
        testID="list-column">
        {list}
      </View>
      <View style={[styles.divider, {left: sidebarWidth + listWidth}]} />
      <View
        style={[styles.detail, {left: sidebarWidth + listWidth}]}
        testID="detail-column">
        {detail}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: theme.colors.background.primary,
  },
  sidebar: {
    backgroundColor: theme.colors.background.secondary,
  },
  list: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: theme.colors.background.primary,
  },
  detail: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.background.primary,
  },
  divider: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: theme.colors.background.tertiary,
  },
});
