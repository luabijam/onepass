import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon, IconName } from '../../components';
import { theme } from '../../theme';
import type { Entry } from '@onepass/vault-core';

interface EntryListScreenProps {
  entries: Entry[];
  onEntryPress: (entryId: string) => void;
  onCreatePress: () => void;
  onSettingsPress?: () => void;
}

function getEntryIcon(entry: Entry): IconName {
  const url = entry.url?.toLowerCase() ?? '';
  if (url.includes('google')) return 'email';
  if (url.includes('github')) return 'link';
  if (url.includes('bank')) return 'lock';
  return 'lock';
}

function getEntryColor(entry: Entry): string {
  const colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEAA7',
    '#DDA0DD',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E9',
  ];
  const hash = entry.title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length] ?? colors[0]!;
}

export function EntryListScreen({
  entries,
  onEntryPress,
  onCreatePress,
  onSettingsPress,
}: EntryListScreenProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const insets = useSafeAreaInsets();

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
      <View style={[styles.entryIcon, { backgroundColor: getEntryColor(item) }]}>
        <AppIcon name={getEntryIcon(item)} size={20} color="#fff" />
      </View>
      <View style={styles.entryContent}>
        <Text style={styles.entryTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.entryUsername} numberOfLines={1}>
          {item.username}
        </Text>
      </View>
      <AppIcon name="expand-more" size={20} color={theme.colors.text.secondary} />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <AppIcon name="lock" size={64} color={theme.colors.background.tertiary} />
      <Text style={styles.emptyTitle}>
        {searchQuery.trim() ? 'No results found' : 'No entries yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery.trim() ? 'Try a different search term' : 'Tap + to add your first password'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + theme.spacing.md }]}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        {onSettingsPress && (
          <TouchableOpacity
            onPress={onSettingsPress}
            style={styles.settingsButton}
            testID="settings-button"
          >
            <AppIcon name="settings" size={22} color={theme.colors.text.secondary} />
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
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <AppIcon name="close" size={18} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={filteredEntries}
        keyExtractor={(item) => item.id}
        renderItem={renderEntry}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + theme.spacing.xl }]}
        onPress={onCreatePress}
        testID="create-entry-fab"
      >
        <Text style={styles.fabText}>+</Text>
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
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  headerLogo: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  settingsButton: {
    padding: theme.spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 100,
  },
  entryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
  },
  entryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  entryContent: {
    flex: 1,
  },
  entryTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  entryUsername: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '200',
    includeFontPadding: false,
  },
});
