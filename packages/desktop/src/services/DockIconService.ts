import {NativeModules, Platform} from 'react-native';

export interface DockMenuItem {
  id: string;
  label: string;
  enabled?: boolean;
  separator?: boolean;
}

export interface DockState {
  isLocked: boolean;
  hasUnreadNotifications: boolean;
}

// Safely get the native module - it may not exist on all platforms
const DockIconManager = NativeModules.DockIconManager;

function getIsMacOS(): boolean {
  return Platform.OS === 'macos';
}

export const DockIconService = {
  setLockState(isLocked: boolean): void {
    if (!getIsMacOS() || !DockIconManager) {
      return;
    }

    if (DockIconManager.setLockState) {
      DockIconManager.setLockState(isLocked);
    }
  },

  setBadge(count: number): void {
    if (!getIsMacOS() || !DockIconManager) {
      return;
    }

    if (DockIconManager.setBadge) {
      DockIconManager.setBadge(count);
    }
  },

  clearBadge(): void {
    if (!getIsMacOS() || !DockIconManager) {
      return;
    }

    if (DockIconManager.clearBadge) {
      DockIconManager.clearBadge();
    }
  },

  setDockMenu(items: DockMenuItem[]): void {
    if (!getIsMacOS() || !DockIconManager) {
      return;
    }

    if (DockIconManager.setDockMenu) {
      DockIconManager.setDockMenu(items);
    }
  },

  onDockMenuItemSelected(callback: (itemId: string) => void): () => void {
    if (!getIsMacOS() || !DockIconManager) {
      return () => {};
    }

    if (DockIconManager.onDockMenuItemSelected) {
      const subscription = DockIconManager.onDockMenuItemSelected(callback);
      return () => {
        if (subscription?.remove) {
          subscription.remove();
        }
      };
    }

    return () => {};
  },

  bounce(): void {
    if (!getIsMacOS() || !DockIconManager) {
      return;
    }

    if (DockIconManager.bounce) {
      DockIconManager.bounce();
    }
  },

  bounceCritical(): void {
    if (!getIsMacOS() || !DockIconManager) {
      return;
    }

    if (DockIconManager.bounceCritical) {
      DockIconManager.bounceCritical();
    }
  },

  cancelBounce(): void {
    if (!getIsMacOS() || !DockIconManager) {
      return;
    }

    if (DockIconManager.cancelBounce) {
      DockIconManager.cancelBounce();
    }
  },
};
