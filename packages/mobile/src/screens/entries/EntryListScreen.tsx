import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { AppIcon } from '../../components';
import { theme } from '../../theme';
import type { Entry } from '@onepass/vault-core';

interface EntryListScreenProps {
  entries: Entry[];
  onEntryPress: (entryId: string) => void;
  onCreatePress: () => void;
  onSettingsPress?: () => void;
}

export function EntryListScreen({
  entries,
  onEntryPress,
  onCreatePress,
  onSettingsPress,
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Entries</Text>
        {onSettingsPress && (
          <TouchableOpacity onPress={onSettingsPress} testID="settings-button">
            <AppIcon name="settings" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.searchContainer}>
        <AppIcon name="search" size={20} color={theme.colors.text.secondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search entries..."
          placeholderTextColor={theme.colors.text.secondary}
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
        <AppIcon name="add" size={28} color={theme.colors.text.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.typography.fontSize.lg,
    paddingTop: theme.typography.fontSize.lg,
    paddingBottom: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    marginHorizontal: theme.typography.fontSize.lg,
    marginVertical: theme.typography.fontSize.md,
    paddingHorizontal: theme.typography.fontSize.md,
    borderRadius: theme.borderRadius.md,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.lg,
    paddingVertical: theme.typography.fontSize.md,
    paddingHorizontal: theme.spacing.sm,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: theme.typography.fontSize.lg,
  },
  entryItem: {
    backgroundColor: theme.colors.background.secondary,
    padding: theme.typography.fontSize.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  entryContent: {
    flex: 1,
  },
  entryTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  entryUsername: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.typography.fontSize.xxl * 2,
  },
  fab: {
    position: 'absolute',
    right: theme.typography.fontSize.xl,
    bottom: theme.typography.fontSize.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
});
