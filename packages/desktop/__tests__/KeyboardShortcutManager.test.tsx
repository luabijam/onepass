import React from 'react';
import {render, screen} from '@testing-library/react-native';
import {KeyboardShortcutManager} from '../src/components/KeyboardShortcutManager';
import type {ActionContext} from '../src/actions';
import {Platform} from 'react-native';

describe('KeyboardShortcutManager', () => {
  const defaultContext: ActionContext = {
    isVaultUnlocked: true,
    isSidebarVisible: true,
  };

  it('renders children correctly', () => {
    render(
      <KeyboardShortcutManager context={defaultContext}>
        <></>
      </KeyboardShortcutManager>,
    );

    expect(screen.getByTestId('keyboard-shortcut-manager')).toBeTruthy();
  });

  it('always wraps children in a View with testID', () => {
    render(
      <KeyboardShortcutManager context={defaultContext}>
        <></>
      </KeyboardShortcutManager>,
    );

    const manager = screen.getByTestId('keyboard-shortcut-manager');
    expect(manager).toBeTruthy();
  });

  it('has focusable prop when on macOS', () => {
    const originalOS = Platform.OS;
    (Platform as unknown as {OS: string}).OS = 'macos';

    render(
      <KeyboardShortcutManager context={defaultContext}>
        <></>
      </KeyboardShortcutManager>,
    );

    const manager = screen.getByTestId('keyboard-shortcut-manager');
    expect(manager.props.focusable).toBe(true);
    expect(manager.props.keyDownEvents).toBeDefined();
    expect(manager.props.keyDownEvents.length).toBeGreaterThan(0);

    (Platform as unknown as {OS: string}).OS = originalOS;
  });

  it('does not have focusable prop when not on macOS', () => {
    const originalOS = Platform.OS;
    (Platform as unknown as {OS: string}).OS = 'ios';

    render(
      <KeyboardShortcutManager context={defaultContext}>
        <></>
      </KeyboardShortcutManager>,
    );

    const manager = screen.getByTestId('keyboard-shortcut-manager');
    expect(manager.props.focusable).toBeFalsy();
    expect(manager.props.keyDownEvents).toBeUndefined();

    (Platform as unknown as {OS: string}).OS = originalOS;
  });

  it('registers all expected keyboard shortcuts on macOS', () => {
    const originalOS = Platform.OS;
    (Platform as unknown as {OS: string}).OS = 'macos';

    render(
      <KeyboardShortcutManager context={defaultContext}>
        <></>
      </KeyboardShortcutManager>,
    );

    const manager = screen.getByTestId('keyboard-shortcut-manager');
    const keyDownEvents = manager.props.keyDownEvents;

    const expectedShortcuts = [
      {key: 'n', metaKey: true},
      {key: 'f', metaKey: true},
      {key: 'c', metaKey: true},
      {key: 'l', metaKey: true},
      {key: 'b', metaKey: true, shiftKey: true},
      {key: 'p', metaKey: true},
    ];

    expectedShortcuts.forEach(expected => {
      const found = keyDownEvents.some(
        (e: {key: string; metaKey?: boolean; shiftKey?: boolean}) =>
          e.key === expected.key &&
          e.metaKey === expected.metaKey &&
          e.shiftKey === expected.shiftKey,
      );
      expect(found).toBe(true);
    });

    (Platform as unknown as {OS: string}).OS = originalOS;
  });
});
