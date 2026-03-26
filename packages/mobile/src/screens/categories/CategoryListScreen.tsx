import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { AppIcon } from '../../components';

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
        <AppIcon name="search" size={20} color="#a0a0a0" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search categories..."
          placeholderTextColor="#a0a0a0"
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
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  categoryContent: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
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
