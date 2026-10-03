import React from "react";
import { StyleSheet, View } from "react-native";
import Badge from "../Badge";

interface CollectionProgressProps {
  totalDiscoveries: number;
  lifetimeXP: number;
}

export default function CollectionProgress({
  totalDiscoveries,
  lifetimeXP,
}: CollectionProgressProps) {
  return (
    <View style={styles.container}>
      <Badge
        icon="camera"
        label="Total Discoveries"
        value={totalDiscoveries}
        variant="discoveries"
      />
      <Badge
        icon="star"
        label="Lifetime XP"
        value={lifetimeXP.toLocaleString()}
        variant="xp"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
});
