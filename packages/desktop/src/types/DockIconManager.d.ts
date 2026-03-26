declare module 'react-native' {
  interface DockIconManagerInterface {
    setLockState(isLocked: boolean): void;
    setBadge(count: number): void;
    clearBadge(): void;
    setDockMenu(
      items: Array<{
        id: string;
        label: string;
        enabled?: boolean;
        separator?: boolean;
      }>,
    ): void;
    onDockMenuItemSelected(callback: (itemId: string) => void): {
      remove: () => void;
    } | null;
    bounce(): void;
    bounceCritical(): void;
    cancelBounce(): void;
  }

  interface NativeModulesStatic {
    DockIconManager?: DockIconManagerInterface;
  }
}
