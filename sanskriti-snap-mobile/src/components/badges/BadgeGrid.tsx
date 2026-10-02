import React from "react";
import { Dimensions, FlatList, StyleSheet, View } from "react-native";
import { type Badge } from "../../services/badges";
import AchievementBadge from "./AchievementBadge";

interface Props {
  badges: Badge[];
}

const { width } = Dimensions.get("window");
const PADDING = 20;
const GAP = 12;
const CARD_WIDTH = (width - PADDING * 2 - GAP) / 2;

export default function BadgeGrid({ badges }: Props) {
  const renderItem = ({ item }: { item: Badge }) => (
    <View style={{ width: CARD_WIDTH }}>
      <AchievementBadge badge={item} />
    </View>
  );

  return (
    <FlatList
      data={badges}
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
    paddingHorizontal: PADDING,
    paddingBottom: 40,
  },
  row: {
    gap: GAP,
    marginBottom: GAP,
  },
});
