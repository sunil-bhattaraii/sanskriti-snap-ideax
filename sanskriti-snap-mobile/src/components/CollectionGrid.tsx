// src/components/CollectionGrid.tsx
import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { CollectionItem } from '../data/mockCollection';
import { CollectionCard } from './CollectionCard';

interface CollectionGridProps {
  items: CollectionItem[];
  onItemPress?: (item: CollectionItem) => void;
}

export const CollectionGrid: React.FC<CollectionGridProps> = ({ items, onItemPress }) => {
  const renderItem = ({ item }: { item: CollectionItem }) => (
    <View style={styles.gridItem}>
      <CollectionCard item={item} onPress={() => onItemPress?.(item)} />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.id || `empty-${index}`}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridItem: {
    width: '48%',
  },
});