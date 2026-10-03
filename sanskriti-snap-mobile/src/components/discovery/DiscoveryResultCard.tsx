import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { type DiscoverySuccessData } from "../../constants/data/mockDiscoverySuccess";

interface Props {
  data: Pick<DiscoverySuccessData, "placeName" | "rarity" | "imageUrl">;
}

export default function DiscoveryResultCard({ data }: Props) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: data.imageUrl }} style={styles.image} />
      <View style={styles.overlay} />
      <View style={styles.content}>
        <Text style={styles.rarityLabel}>{data.rarity}</Text>
        <Text style={styles.placeName}>{data.placeName}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 220,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
    backgroundColor: "#E2E8F0",
  },
  image: { width: "100%", height: "100%" },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  content: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "rgba(45, 37, 33, 0.8)",
  },
  rarityLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.secondary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  placeName: { fontSize: 20, fontWeight: "800", color: COLORS.white },
});
