import React, {useState, useMemo} from 'react';
import {StyleSheet} from 'react-native';
import {
  ThreeColumnLayout,
  CategorySidebar,
  Category,
  EntryListPanel,
  Entry,
  EntryDetailPanel,
} from './components';

const SAMPLE_ENTRIES: Entry[] = [
  {
    id: 'entry-1',
    title: 'Test Entry',
    username: 'testuser',
    password: 'testpass',
    url: 'https://example.com',
    categoryId: 'cat-1',
    isFavorite: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'entry-2',
    title: 'Another Entry',
    username: 'anotheruser',
    password: 'anotherpass',
    categoryId: 'cat-2',
    isFavorite: true,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
];

const SAMPLE_CATEGORIES: Category[] = [
  {id: 'cat-1', name: 'Personal', icon: 'person', color: '#FF0000', count: 1},
  {id: 'cat-2', name: 'Work', icon: 'folder', color: '#00FF00', count: 1},
];

function App(): React.JSX.Element {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  const filteredEntries = useMemo(() => {
    if (selectedCategoryId === null) {
      return SAMPLE_ENTRIES;
    }
    return SAMPLE_ENTRIES.filter(
      entry => entry.categoryId === selectedCategoryId,
    );
  }, [selectedCategoryId]);

  const selectedEntry = useMemo(() => {
    return SAMPLE_ENTRIES.find(entry => entry.id === selectedEntryId) ?? null;
  }, [selectedEntryId]);

  const handleCategoryPress = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    setSelectedEntryId(null);
  };

  const handleEntryPress = (entryId: string) => {
    setSelectedEntryId(entryId);
  };

  const handleCreateEntry = () => {};

  const handleEditEntry = () => {};

  return (
    <ThreeColumnLayout
      sidebar={
        <CategorySidebar
          categories={SAMPLE_CATEGORIES}
          selectedCategoryId={selectedCategoryId}
          onCategoryPress={handleCategoryPress}
          allEntriesCount={SAMPLE_ENTRIES.length}
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
