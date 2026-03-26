import {
  registerActionHandler,
  dispatchAction,
  clearAllHandlers,
} from '../src/actions';
import type {AppAction, ActionContext} from '../src/actions';

describe('Actions', () => {
  beforeEach(() => {
    clearAllHandlers();
  });

  describe('registerActionHandler', () => {
    it('registers a handler for an action', () => {
      const handler = jest.fn();
      registerActionHandler('newEntry', handler);

      const context: ActionContext = {
        isVaultUnlocked: true,
        isSidebarVisible: true,
      };

      dispatchAction('newEntry', context);
      expect(handler).toHaveBeenCalledWith(context);
    });

    it('allows multiple handlers for the same action', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      registerActionHandler('newEntry', handler1);
      registerActionHandler('newEntry', handler2);

      const context: ActionContext = {
        isVaultUnlocked: true,
        isSidebarVisible: true,
      };

      dispatchAction('newEntry', context);
      expect(handler1).toHaveBeenCalledWith(context);
      expect(handler2).toHaveBeenCalledWith(context);
    });

    it('returns an unsubscribe function', () => {
      const handler = jest.fn();
      const unsubscribe = registerActionHandler('newEntry', handler);

      const context: ActionContext = {
        isVaultUnlocked: true,
        isSidebarVisible: true,
      };

      dispatchAction('newEntry', context);
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();

      dispatchAction('newEntry', context);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('does not call handlers for different actions', () => {
      const handler = jest.fn();
      registerActionHandler('newEntry', handler);

      const context: ActionContext = {
        isVaultUnlocked: true,
        isSidebarVisible: true,
      };

      dispatchAction('lockVault', context);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('dispatchAction', () => {
    it('does not throw when no handlers are registered', () => {
      const context: ActionContext = {
        isVaultUnlocked: true,
        isSidebarVisible: true,
      };

      expect(() => dispatchAction('newEntry', context)).not.toThrow();
    });

    it('passes context with selectedEntryId', () => {
      const handler = jest.fn();
      registerActionHandler('copyPassword', handler);

      const context: ActionContext = {
        selectedEntryId: 'entry-123',
        isVaultUnlocked: true,
        isSidebarVisible: true,
      };

      dispatchAction('copyPassword', context);
      expect(handler).toHaveBeenCalledWith(context);
    });
  });

  describe('clearAllHandlers', () => {
    it('removes all handlers', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      registerActionHandler('newEntry', handler1);
      registerActionHandler('lockVault', handler2);

      clearAllHandlers();

      const context: ActionContext = {
        isVaultUnlocked: true,
        isSidebarVisible: true,
      };

      dispatchAction('newEntry', context);
      dispatchAction('lockVault', context);

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('action types', () => {
    it('supports all defined action types', () => {
      const actions: AppAction[] = [
        'newEntry',
        'search',
        'copyPassword',
        'lockVault',
        'toggleSidebar',
        'import',
        'export',
        'generatePassword',
      ];

      actions.forEach(action => {
        const handler = jest.fn();
        registerActionHandler(action, handler);

        const context: ActionContext = {
          isVaultUnlocked: true,
          isSidebarVisible: true,
        };

        dispatchAction(action, context);
        expect(handler).toHaveBeenCalledWith(context);

        clearAllHandlers();
      });
    });
  });
});
