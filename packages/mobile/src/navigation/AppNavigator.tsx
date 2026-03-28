import React, { useEffect } from 'react';
import { useVaultStore } from '../stores';
import { UnlockScreen } from '../screens/unlock';
import { EntryListScreen } from '../screens/entries/EntryListScreen';
import { EntryDetailScreen } from '../screens/entries/EntryDetailScreen';
import { EntryFormScreen } from '../screens/entries/EntryFormScreen';
import { CategoryListScreen } from '../screens/categories/CategoryListScreen';
import { CategoryFormScreen } from '../screens/categories/CategoryFormScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { SyncSettingsScreen } from '../screens/settings/SyncSettingsScreen';
import { ImportExportScreen } from '../screens/settings/ImportExportScreen';
import type { Entry, Category } from '@onepass/vault-core';

type Screen =
  | 'EntryList'
  | 'EntryDetail'
  | 'EntryForm'
  | 'CategoryList'
  | 'CategoryForm'
  | 'Settings'
  | 'SyncSettings'
  | 'ImportExport';

function MainNavigator(): React.JSX.Element {
  const {
    entries,
    categories,
    getEntry,
    getCategory,
    addEntry,
    updateEntry,
    deleteEntry,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useVaultStore();

  const [currentScreen, setCurrentScreen] = React.useState<Screen>('EntryList');
  const [selectedEntryId, setSelectedEntryId] = React.useState<string | null>(null);
  const [editingEntryId, setEditingEntryId] = React.useState<string | undefined>(undefined);
  const [editingCategoryId, setEditingCategoryId] = React.useState<string | undefined>(undefined);

  const activeEntries = entries.filter((e: Entry) => !e.deletedAt);
  const activeCategories = categories.filter((c: Category) => !c.deletedAt);

  const selectedEntry = selectedEntryId ? getEntry(selectedEntryId) : undefined;

  const handleCreateEntry = () => {
    setEditingEntryId(undefined);
    setCurrentScreen('EntryForm');
  };

  const handleSaveEntry = async (data: {
    title: string;
    username: string;
    password: string;
    url: string;
    notes: string;
  }) => {
    if (editingEntryId) {
      await updateEntry(editingEntryId, {
        title: data.title,
        username: data.username,
        password: data.password,
        url: data.url || undefined,
        notes: data.notes || undefined,
      });
    } else {
      await addEntry({
        title: data.title,
        username: data.username,
        password: data.password,
        url: data.url || undefined,
        notes: data.notes || undefined,
        categoryId: 'uncategorized',
        isFavorite: false,
      });
    }
    setCurrentScreen('EntryList');
    setEditingEntryId(undefined);
  };

  const handleCreateCategory = () => {
    setEditingCategoryId(undefined);
    setCurrentScreen('CategoryForm');
  };

  const handleSaveCategory = async (data: { name: string; icon: string; color: string }) => {
    if (editingCategoryId) {
      await updateCategory(editingCategoryId, data);
    } else {
      await addCategory(data);
    }
    setCurrentScreen('CategoryList');
    setEditingCategoryId(undefined);
  };

  if (currentScreen === 'EntryList') {
    return (
      <EntryListScreen
        entries={activeEntries}
        onEntryPress={(id: string) => {
          setSelectedEntryId(id);
          setCurrentScreen('EntryDetail');
        }}
        onCreatePress={handleCreateEntry}
        onSettingsPress={() => setCurrentScreen('Settings')}
      />
    );
  }

  if (currentScreen === 'EntryDetail' && selectedEntry) {
    return (
      <EntryDetailScreen
        entry={selectedEntry}
        onEditPress={(id: string) => {
          setEditingEntryId(id);
          setCurrentScreen('EntryForm');
        }}
        onBackPress={() => {
          setSelectedEntryId(null);
          setCurrentScreen('EntryList');
        }}
        onDeletePress={async (id: string) => {
          await deleteEntry(id);
          setSelectedEntryId(null);
          setCurrentScreen('EntryList');
        }}
      />
    );
  }

  if (currentScreen === 'EntryForm') {
    const entry = editingEntryId ? getEntry(editingEntryId) : undefined;
    return (
      <EntryFormScreen
        entry={entry}
        onSave={handleSaveEntry}
        onCancel={() => {
          setEditingEntryId(undefined);
          setCurrentScreen(selectedEntryId ? 'EntryDetail' : 'EntryList');
        }}
        onDelete={
          editingEntryId
            ? async () => {
                await deleteEntry(editingEntryId);
                setEditingEntryId(undefined);
                setSelectedEntryId(null);
                setCurrentScreen('EntryList');
              }
            : undefined
        }
      />
    );
  }

  if (currentScreen === 'CategoryList') {
    return (
      <CategoryListScreen
        categories={activeCategories}
        onCategoryPress={(id: string) => {
          setEditingCategoryId(id);
          setCurrentScreen('CategoryForm');
        }}
        onCreatePress={handleCreateCategory}
        onBackPress={() => setCurrentScreen('Settings')}
      />
    );
  }

  if (currentScreen === 'CategoryForm') {
    const category = editingCategoryId ? getCategory(editingCategoryId) : undefined;
    return (
      <CategoryFormScreen
        category={category}
        onSave={handleSaveCategory}
        onCancel={() => {
          setEditingCategoryId(undefined);
          setCurrentScreen('CategoryList');
        }}
        onDeletePress={
          editingCategoryId && editingCategoryId !== 'uncategorized'
            ? async () => {
                await deleteCategory(editingCategoryId);
                setEditingCategoryId(undefined);
                setCurrentScreen('CategoryList');
              }
            : undefined
        }
      />
    );
  }

  if (currentScreen === 'Settings') {
    return (
      <SettingsScreen
        lastSyncStatus={null}
        onSyncNow={() => setCurrentScreen('SyncSettings')}
        onExportVault={() => setCurrentScreen('ImportExport')}
        onImportVault={() => setCurrentScreen('ImportExport')}
        onManageCategories={() => setCurrentScreen('CategoryList')}
        onBackPress={() => setCurrentScreen('EntryList')}
      />
    );
  }

  if (currentScreen === 'SyncSettings') {
    return (
      <SyncSettingsScreen
        lastSyncTime={null}
        syncInProgress={false}
        onSyncNow={() => {}}
        onBack={() => setCurrentScreen('Settings')}
      />
    );
  }

  if (currentScreen === 'ImportExport') {
    return (
      <ImportExportScreen
        exportInProgress={false}
        importInProgress={false}
        lastExportDate={null}
        onExportVault={async () => {}}
        onImportVault={async () => {}}
        onBack={() => setCurrentScreen('Settings')}
      />
    );
  }

  return (
    <EntryListScreen
      entries={activeEntries}
      onEntryPress={(id: string) => {
        setSelectedEntryId(id);
        setCurrentScreen('EntryDetail');
      }}
      onCreatePress={handleCreateEntry}
      onSettingsPress={() => setCurrentScreen('Settings')}
    />
  );
}

export function AppNavigator(): React.JSX.Element {
  const { isUnlocked, isInitialized, initialize } = useVaultStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isInitialized || !isUnlocked) {
    return <UnlockScreen />;
  }

  return <MainNavigator />;
}
