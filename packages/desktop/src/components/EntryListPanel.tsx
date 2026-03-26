import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {AppIcon} from './Icon';
import {theme} from '../theme';

export interface Entry {
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

export interface EntryListPanelProps {
  entries: Entry[];
  selectedEntryId: string | null;
  onEntryPress: (entryId: string) => void;
  onCreatePress: () => void;
}

export function EntryListPanel({
  entries,
  selectedEntryId,
  onEntryPress,
  onCreatePress,
}: EntryListPanelProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEntries = useMemo(() => {
    const activeEntries = entries.filter(entry => !entry.deletedAt);
    const sortedEntries = [...activeEntries].sort((a, b) =>
      a.title.localeCompare(b.title),
    );

    if (!searchQuery.trim()) {
      return sortedEntries;
    }

    const query = searchQuery.toLowerCase();
    return sortedEntries.filter(entry => {
      const titleMatch = entry.title.toLowerCase().includes(query);
      const usernameMatch = entry.username.toLowerCase().includes(query);
      const urlMatch = entry.url?.toLowerCase().includes(query) ?? false;
      return titleMatch || usernameMatch || urlMatch;
    });
  }, [entries, searchQuery]);

  const renderEntry = ({item}: {item: Entry}) => {
    const isSelected = selectedEntryId === item.id;
    return (
      <TouchableOpacity
        style={[styles.entryItem, isSelected && styles.entryItemSelected]}
        onPress={() => onEntryPress(item.id)}
        testID={`entry-${item.id}`}>
        <View style={styles.entryContent}>
          <Text
            style={[styles.entryTitle, isSelected && styles.entryTitleSelected]}
            numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.entryUsername} numberOfLines={1}>
            {item.username}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (searchQuery.trim()) {
      return <Text style={styles.emptyText}>No matching entries</Text>;
    }
    return <Text style={styles.emptyText}>No entries</Text>;
  };

  return (
    <View style={styles.container} testID="entry-list-panel">
      <View style={styles.searchContainer}>
        <AppIcon name="search" size={16} color={theme.colors.text.secondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          placeholderTextColor={theme.colors.text.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <FlatList
        data={filteredEntries}
        keyExtractor={item => item.id}
        renderItem={renderEntry}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={onCreatePress}
        testID="create-entry-button">
        <AppIcon name="add" size={20} color={theme.colors.text.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    margin: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.sm,
  },
  entryItem: {
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.xs,
  },
  entryItemSelected: {
    backgroundColor: theme.colors.background.tertiary,
    borderWidth: 1,
    borderColor: theme.colors.accent.primary,
  },
  entryContent: {
    flex: 1,
  },
  entryTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  entryTitleSelected: {
    color: theme.colors.accent.primary,
  },
  entryUsername: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.xxl * 2,
  },
  addButton: {
    position: 'absolute',
    right: theme.spacing.md,
    bottom: theme.spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
