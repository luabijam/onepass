export type AppAction =
  | 'newEntry'
  | 'search'
  | 'copyPassword'
  | 'lockVault'
  | 'toggleSidebar'
  | 'import'
  | 'export'
  | 'generatePassword';

export interface ActionContext {
  selectedEntryId?: string;
  isVaultUnlocked: boolean;
  isSidebarVisible: boolean;
}

export type ActionHandler = (context: ActionContext) => void;
