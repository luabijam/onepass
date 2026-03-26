import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { AppIcon } from '../../components';

interface Entry {
  id: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  categoryId: string;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

interface EntryListScreenProps {
  entries: Entry[];
  onEntryPress: (entryId: string) => void;
  onCreatePress: () => void;
}

export function EntryListScreen({
  entries,
  onEntryPress,
  onCreatePress,
}: EntryListScreenProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEntries = useMemo(() => {
    const activeEntries = entries.filter((entry) => !entry.deletedAt);
    const sortedEntries = [...activeEntries].sort((a, b) => a.title.localeCompare(b.title));

    if (!searchQuery.trim()) {
      return sortedEntries;
    }

    const query = searchQuery.toLowerCase();
    return sortedEntries.filter((entry) => {
      const titleMatch = entry.title.toLowerCase().includes(query);
      const usernameMatch = entry.username.toLowerCase().includes(query);
      const urlMatch = entry.url?.toLowerCase().includes(query) ?? false;
      return titleMatch || usernameMatch || urlMatch;
    });
  }, [entries, searchQuery]);

  const renderEntry = ({ item }: { item: Entry }) => (
    <TouchableOpacity
      style={styles.entryItem}
      onPress={() => onEntryPress(item.id)}
      testID={`entry-${item.id}`}
    >
      <View style={styles.entryContent}>
        <Text style={styles.entryTitle}>{item.title}</Text>
        <Text style={styles.entryUsername}>{item.username}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (searchQuery.trim()) {
      return <Text style={styles.emptyText}>No matching entries</Text>;
    }
    return <Text style={styles.emptyText}>No entries</Text>;
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <AppIcon name="search" size={20} color="#a0a0a0" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search entries..."
          placeholderTextColor="#a0a0a0"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <FlatList
        data={filteredEntries}
        keyExtractor={(item) => item.id}
        renderItem={renderEntry}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
      />
      <TouchableOpacity style={styles.fab} onPress={onCreatePress} testID="create-entry-fab">
        <AppIcon name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  entryItem: {
    backgroundColor: '#2C2C2E',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  entryContent: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  entryUsername: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  emptyText: {
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
    marginTop: 32,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0A84FF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
});
