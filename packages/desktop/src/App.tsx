import React, {useState, useMemo, useEffect} from 'react';
import {StyleSheet} from 'react-native';
import {
  ThreeColumnLayout,
  CategorySidebar,
  EntryListPanel,
  EntryDetailPanel,
} from './components';
import {useVaultStore} from './stores';
import type {Entry, Category} from '@onepass/vault-core';

function App(): React.JSX.Element {
  const {
    isUnlocked,
    isInitialized,
    entries,
    categories,
    isLoading,
    initialize,
  } = useVaultStore();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const activeEntries = useMemo(() => {
    return entries.filter((entry: Entry) => !entry.deletedAt);
  }, [entries]);

  const activeCategories = useMemo(() => {
    return categories.filter((category: Category) => !category.deletedAt);
  }, [categories]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const entry of activeEntries) {
      counts[entry.categoryId] = (counts[entry.categoryId] ?? 0) + 1;
    }
    return counts;
  }, [activeEntries]);

  const filteredEntries = useMemo(() => {
    if (selectedCategoryId === null) {
      return activeEntries;
    }
    return activeEntries.filter(
      (entry: Entry) => entry.categoryId === selectedCategoryId,
    );
  }, [activeEntries, selectedCategoryId]);

  const selectedEntry = useMemo(() => {
    return entries.find((entry: Entry) => entry.id === selectedEntryId) ?? null;
  }, [entries, selectedEntryId]);

  const handleCategoryPress = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    setSelectedEntryId(null);
  };

  const handleEntryPress = (entryId: string) => {
    setSelectedEntryId(entryId);
  };

  const handleCreateEntry = () => {};

  const handleEditEntry = () => {};

  if (isLoading) {
    return (
      <ThreeColumnLayout
        sidebar={null}
        list={null}
        detail={null}
        style={styles.layout}
      />
    );
  }

  if (!isInitialized) {
    return (
      <ThreeColumnLayout
        sidebar={null}
        list={null}
        detail={null}
        style={styles.layout}
      />
    );
  }

  if (!isUnlocked) {
    return (
      <ThreeColumnLayout
        sidebar={null}
        list={null}
        detail={null}
        style={styles.layout}
      />
    );
  }

  return (
    <ThreeColumnLayout
      sidebar={
        <CategorySidebar
          categories={activeCategories}
          selectedCategoryId={selectedCategoryId}
          onCategoryPress={handleCategoryPress}
          allEntriesCount={activeEntries.length}
          categoryCounts={categoryCounts}
        />
      }
      list={
        <EntryListPanel
          entries={filteredEntries}
          selectedEntryId={selectedEntryId}
          onEntryPress={handleEntryPress}
          onCreatePress={handleCreateEntry}
        />
      }
      detail={
        <EntryDetailPanel entry={selectedEntry} onEditPress={handleEditEntry} />
      }
      style={styles.layout}
    />
  );
}

const styles = StyleSheet.create({
  layout: {
    flex: 1,
  },
});

export default App;
