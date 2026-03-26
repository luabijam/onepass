import React, {useCallback, useRef} from 'react';
import {View, ViewStyle, StyleProp, Platform} from 'react-native';
import {AppAction, ActionContext, dispatchAction} from '../actions';

export interface KeyboardShortcut {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: AppAction;
}

const SHORTCUTS: KeyboardShortcut[] = [
  {key: 'n', metaKey: true, action: 'newEntry'},
  {key: 'f', metaKey: true, action: 'search'},
  {key: 'c', metaKey: true, action: 'copyPassword'},
  {key: 'l', metaKey: true, action: 'lockVault'},
  {key: 'b', metaKey: true, shiftKey: true, action: 'toggleSidebar'},
  {key: 'p', metaKey: true, action: 'generatePassword'},
];

export interface KeyboardShortcutManagerProps {
  context: ActionContext;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function KeyboardShortcutManager({
  context,
  children,
  style,
}: KeyboardShortcutManagerProps): React.JSX.Element {
  const contextRef = useRef(context);
  contextRef.current = context;

  const handleKeyDown = useCallback(
    (event: {
      nativeEvent: {
        key: string;
        metaKey: boolean;
        ctrlKey: boolean;
        shiftKey: boolean;
        altKey: boolean;
      };
    }) => {
      const {key, metaKey, ctrlKey, shiftKey, altKey} = event.nativeEvent;

      for (const shortcut of SHORTCUTS) {
        const keyMatch = shortcut.key.toLowerCase() === key.toLowerCase();
        const metaMatch = (shortcut.metaKey ?? false) === metaKey;
        const ctrlMatch = (shortcut.ctrlKey ?? false) === ctrlKey;
        const shiftMatch = (shortcut.shiftKey ?? false) === shiftKey;
        const altMatch = (shortcut.altKey ?? false) === altKey;

        if (keyMatch && metaMatch && ctrlMatch && shiftMatch && altMatch) {
          dispatchAction(shortcut.action, contextRef.current);
          return;
        }
      }
    },
    [],
  );

  const keyDownEvents = SHORTCUTS.map(shortcut => ({
    key: shortcut.key,
    metaKey: shortcut.metaKey,
    ctrlKey: shortcut.ctrlKey,
    shiftKey: shortcut.shiftKey,
    altKey: shortcut.altKey,
  }));

  const isMacOS = Platform.OS === 'macos';

  return (
    <View
      style={[{flex: 1}, style]}
      focusable={isMacOS}
      keyDownEvents={isMacOS ? keyDownEvents : undefined}
      onKeyDown={isMacOS ? handleKeyDown : undefined}
      testID="keyboard-shortcut-manager">
      {children}
    </View>
  );
}

export type {AppAction, ActionContext};
