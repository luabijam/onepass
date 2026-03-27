import React from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet} from 'react-native';
import type {Category} from '@onepass/vault-core';
import {AppIcon} from './Icon';
import {theme} from '../theme';

export interface CategorySidebarProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onCategoryPress: (categoryId: string | null) => void;
  allEntriesCount: number;
  categoryCounts: Record<string, number>;
}

export function CategorySidebar({
  categories,
  selectedCategoryId,
  onCategoryPress,
  allEntriesCount,
  categoryCounts,
}: CategorySidebarProps): React.JSX.Element {
  const renderCategory = ({item}: {item: Category}) => {
    const isSelected = selectedCategoryId === item.id;
    const count = categoryCounts[item.id] ?? 0;
    return (
      <TouchableOpacity
        style={[styles.categoryItem, isSelected && styles.categoryItemSelected]}
        onPress={() => onCategoryPress(item.id)}
        testID={`category-${item.id}`}>
        <View style={[styles.iconContainer, {backgroundColor: item.color}]}>
          <AppIcon name={item.icon} size={18} color="#ffffff" />
        </View>
        <Text
          style={[
            styles.categoryName,
            isSelected && styles.categoryNameSelected,
          ]}
          numberOfLines={1}>
          {item.name}
        </Text>
        <Text
          style={[
            styles.categoryCount,
            isSelected && styles.categoryCountSelected,
          ]}>
          {count}
        </Text>
      </TouchableOpacity>
    );
  };

  const allSelected = selectedCategoryId === null;

  return (
    <View style={styles.container} testID="category-sidebar">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Categories</Text>
      </View>
      <TouchableOpacity
        style={[styles.allItem, allSelected && styles.allItemSelected]}
        onPress={() => onCategoryPress(null)}
        testID="category-all">
        <AppIcon
          name="folder"
          size={18}
          color={
            allSelected
              ? theme.colors.accent.primary
              : theme.colors.text.secondary
          }
        />
        <Text style={[styles.allText, allSelected && styles.allTextSelected]}>
          All Entries
        </Text>
        <Text
          style={[
            styles.categoryCount,
            allSelected && styles.categoryCountSelected,
          ]}>
          {allEntriesCount}
        </Text>
      </TouchableOpacity>
      <FlatList
        data={categories}
        keyExtractor={item => item.id}
        renderItem={renderCategory}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.tertiary,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  allItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  allItemSelected: {
    backgroundColor: theme.colors.background.tertiary,
  },
  allText: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  allTextSelected: {
    color: theme.colors.accent.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  listContent: {
    paddingVertical: theme.spacing.xs,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  categoryItemSelected: {
    backgroundColor: theme.colors.background.tertiary,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  categoryNameSelected: {
    color: theme.colors.accent.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  categoryCount: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
  },
  categoryCountSelected: {
    color: theme.colors.accent.primary,
  },
});
