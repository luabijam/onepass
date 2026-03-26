import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { AppIcon } from '../../components';
import { theme } from '../../theme';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  updatedAt: Date;
  deletedAt?: Date;
}

interface CategoryListScreenProps {
  categories: Category[];
  onCategoryPress: (categoryId: string) => void;
  onCreatePress: () => void;
}

export function CategoryListScreen({
  categories,
  onCategoryPress,
  onCreatePress,
}: CategoryListScreenProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = useMemo(() => {
    const activeCategories = categories.filter((category) => !category.deletedAt);
    const sortedCategories = [...activeCategories].sort((a, b) => a.name.localeCompare(b.name));

    if (!searchQuery.trim()) {
      return sortedCategories;
    }

    const query = searchQuery.toLowerCase();
    return sortedCategories.filter((category) => category.name.toLowerCase().includes(query));
  }, [categories, searchQuery]);

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => onCategoryPress(item.id)}
      testID={`category-${item.id}`}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
        <Text style={styles.iconText}>{item.icon}</Text>
      </View>
      <View style={styles.categoryContent}>
        <Text style={styles.categoryName}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (searchQuery.trim()) {
      return <Text style={styles.emptyText}>No matching categories</Text>;
    }
    return <Text style={styles.emptyText}>No categories</Text>;
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <AppIcon name="search" size={20} color={theme.colors.text.secondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search categories..."
          placeholderTextColor={theme.colors.text.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <FlatList
        data={filteredCategories}
        keyExtractor={(item) => item.id}
        renderItem={renderCategory}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
      />
      <TouchableOpacity style={styles.fab} onPress={onCreatePress} testID="create-category-fab">
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
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    padding: theme.typography.fontSize.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.typography.fontSize.md,
  },
  iconText: {
    fontSize: theme.typography.fontSize.xl,
  },
  categoryContent: {
    flex: 1,
  },
  categoryName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
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
