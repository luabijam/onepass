import {NativeModules, Platform} from 'react-native';
import {DockIconService} from '../src/services/DockIconService';

jest.mock('react-native', () => ({
  Platform: {
    OS: 'macos',
  },
  NativeModules: {
    DockIconManager: {
      setLockState: jest.fn(),
      setBadge: jest.fn(),
      clearBadge: jest.fn(),
      setDockMenu: jest.fn(),
      onDockMenuItemSelected: jest.fn(),
      bounce: jest.fn(),
      bounceCritical: jest.fn(),
      cancelBounce: jest.fn(),
    },
  },
}));

describe('DockIconService', () => {
  const mockDockIconManager = NativeModules.DockIconManager;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setLockState', () => {
    it('calls setLockState with true when locked', () => {
      DockIconService.setLockState(true);
      expect(mockDockIconManager.setLockState).toHaveBeenCalledWith(true);
    });

    it('calls setLockState with false when unlocked', () => {
      DockIconService.setLockState(false);
      expect(mockDockIconManager.setLockState).toHaveBeenCalledWith(false);
    });
  });

  describe('setBadge', () => {
    it('calls setBadge with count', () => {
      DockIconService.setBadge(5);
      expect(mockDockIconManager.setBadge).toHaveBeenCalledWith(5);
    });

    it('calls setBadge with 0', () => {
      DockIconService.setBadge(0);
      expect(mockDockIconManager.setBadge).toHaveBeenCalledWith(0);
    });
  });

  describe('clearBadge', () => {
    it('calls clearBadge', () => {
      DockIconService.clearBadge();
      expect(mockDockIconManager.clearBadge).toHaveBeenCalled();
    });
  });

  describe('setDockMenu', () => {
    it('sets dock menu items', () => {
      const items = [
        {id: 'new-entry', label: 'New Entry'},
        {id: 'lock-vault', label: 'Lock Vault'},
        {separator: true, id: 'sep1', label: ''},
        {id: 'quit', label: 'Quit'},
      ];

      DockIconService.setDockMenu(items);
      expect(mockDockIconManager.setDockMenu).toHaveBeenCalledWith(items);
    });

    it('sets dock menu with enabled states', () => {
      const items = [
        {id: 'new-entry', label: 'New Entry', enabled: true},
        {id: 'lock-vault', label: 'Lock Vault', enabled: false},
      ];

      DockIconService.setDockMenu(items);
      expect(mockDockIconManager.setDockMenu).toHaveBeenCalledWith(items);
    });
  });

  describe('onDockMenuItemSelected', () => {
    it('registers callback and returns unsubscribe function', () => {
      const mockSubscription = {remove: jest.fn()};
      (mockDockIconManager.onDockMenuItemSelected as jest.Mock).mockReturnValue(
        mockSubscription,
      );

      const callback = jest.fn();
      const unsubscribe = DockIconService.onDockMenuItemSelected(callback);

      expect(mockDockIconManager.onDockMenuItemSelected).toHaveBeenCalledWith(
        callback,
      );
      expect(typeof unsubscribe).toBe('function');

      unsubscribe();
      expect(mockSubscription.remove).toHaveBeenCalled();
    });

    it('returns no-op function when native module is unavailable', () => {
      const originalManager = NativeModules.DockIconManager;
      (NativeModules as unknown as Record<string, unknown>).DockIconManager =
        undefined;

      const callback = jest.fn();
      const unsubscribe = DockIconService.onDockMenuItemSelected(callback);

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
      expect(callback).not.toHaveBeenCalled();

      (NativeModules as unknown as Record<string, unknown>).DockIconManager =
        originalManager;
    });
  });

  describe('bounce', () => {
    it('calls bounce for standard notification', () => {
      DockIconService.bounce();
      expect(mockDockIconManager.bounce).toHaveBeenCalled();
    });
  });

  describe('bounceCritical', () => {
    it('calls bounceCritical for urgent notification', () => {
      DockIconService.bounceCritical();
      expect(mockDockIconManager.bounceCritical).toHaveBeenCalled();
    });
  });

  describe('cancelBounce', () => {
    it('calls cancelBounce to stop bouncing', () => {
      DockIconService.cancelBounce();
      expect(mockDockIconManager.cancelBounce).toHaveBeenCalled();
    });
  });
});

describe('DockIconService on non-macOS', () => {
  let mockDockIconManager: typeof NativeModules.DockIconManager;

  beforeEach(() => {
    (Platform as unknown as {OS: string}).OS = 'ios';
    mockDockIconManager = NativeModules.DockIconManager;
    jest.clearAllMocks();
  });

  afterEach(() => {
    (Platform as unknown as {OS: string}).OS = 'macos';
  });

  it('does nothing on non-macOS platforms', () => {
    DockIconService.setLockState(true);
    DockIconService.setBadge(5);
    DockIconService.clearBadge();
    DockIconService.setDockMenu([{id: 'test', label: 'Test'}]);
    DockIconService.bounce();
    DockIconService.bounceCritical();
    DockIconService.cancelBounce();

    expect(mockDockIconManager!.setLockState).not.toHaveBeenCalled();
    expect(mockDockIconManager!.setBadge).not.toHaveBeenCalled();
    expect(mockDockIconManager!.clearBadge).not.toHaveBeenCalled();
    expect(mockDockIconManager!.setDockMenu).not.toHaveBeenCalled();
    expect(mockDockIconManager!.bounce).not.toHaveBeenCalled();
    expect(mockDockIconManager!.bounceCritical).not.toHaveBeenCalled();
    expect(mockDockIconManager!.cancelBounce).not.toHaveBeenCalled();
  });

  it('returns no-op unsubscribe on non-macOS platforms', () => {
    const callback = jest.fn();
    const unsubscribe = DockIconService.onDockMenuItemSelected(callback);

    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
  });
});
