import React from "react";
import { Dimensions, FlatList, StyleSheet } from "react-native";
import CollectionCard from "./CollectionCard";

interface CollectionItem {
  id: string;
  title: string;
  location: string;
  xp: number;
  imageUrl?: string;
  rarity?: "Common" | "Rare" | "Epic" | "Legendary";
  isDiscovered: boolean;
}

interface CollectionGridProps {
  items: CollectionItem[];
  onItemPress?: (item: CollectionItem) => void;
}

const { width } = Dimensions.get("window");
const GAP = 12;
const PADDING = 16;
// Calculate exact width for 2 columns
const CARD_WIDTH = (width - PADDING * 2 - GAP) / 2;

export default function CollectionGrid({
  items,
  onItemPress,
}: CollectionGridProps) {
  const renderItem = ({ item }: { item: CollectionItem }) => (
    <CollectionCard
      width={CARD_WIDTH}
      title={item.title}
      location={item.location}
      xp={item.xp}
      imageUrl={item.imageUrl}
      rarity={item.rarity}
      isDiscovered={item.isDiscovered}
      onPress={() => onItemPress?.(item)}
    />
  );

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: PADDING,
    paddingBottom: 40,
  },
  row: {
    gap: GAP,
    marginBottom: GAP,
  },
});
