import {AppAction, ActionHandler, ActionContext} from './types';

const handlers = new Map<AppAction, Set<ActionHandler>>();

export function registerActionHandler(
  action: AppAction,
  handler: ActionHandler,
): () => void {
  if (!handlers.has(action)) {
    handlers.set(action, new Set());
  }
  handlers.get(action)!.add(handler);

  return () => {
    handlers.get(action)?.delete(handler);
  };
}

export function dispatchAction(
  action: AppAction,
  context: ActionContext,
): void {
  const actionHandlers = handlers.get(action);
  if (actionHandlers) {
    actionHandlers.forEach(handler => handler(context));
  }
}

export function clearAllHandlers(): void {
  handlers.clear();
}

export type {AppAction, ActionHandler, ActionContext} from './types';
