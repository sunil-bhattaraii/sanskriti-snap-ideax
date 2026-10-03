import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/colors";

interface CollectionCardProps {
  width: number;
  title: string;
  location: string;
  xp: number;
  imageUrl?: string;
  rarity?: "Common" | "Rare" | "Epic" | "Legendary";
  isDiscovered?: boolean;
  onPress?: () => void;
}

export default function CollectionCard({
  width,
  title,
  location,
  xp,
  imageUrl,
  rarity = "Common",
  isDiscovered = true,
  onPress,
}: CollectionCardProps) {
  // Locked / Undiscovered State
  if (!isDiscovered) {
    return (
      <TouchableOpacity
        style={[styles.card, styles.lockedCard, { width }]}
        activeOpacity={0.7}
        onPress={onPress}
      >
        <View style={styles.lockCircle}>
          <Ionicons name="lock-closed" size={24} color={COLORS.tertiary} />
        </View>
        <Text style={styles.lockedText}>Discover to unlock</Text>
      </TouchableOpacity>
    );
  }

  const getBadgeColor = (rarity: string) => {
    switch (rarity) {
      case "Rare":
        return "#3B82F6";
      case "Epic":
        return "#8B5CF6";
      case "Legendary":
        return "#F59E0B";
      default:
        return "#60A5FA";
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, { width, height: width * 1.4 }]}
      activeOpacity={0.9}
      onPress={onPress}
    >
      {/* Background Image (Maximized View Area) */}
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.backgroundImage, styles.placeholderImage]} />
      )}

      {/* Top Right: Rarity Badge */}
      <View
        style={[styles.rarityBadge, { backgroundColor: getBadgeColor(rarity) }]}
      >
        <Ionicons name="sparkles" size={10} color="#FFFFFF" />
        <Text style={styles.rarityText}>{rarity}</Text>
      </View>

      {/* Compact Black Footer Box */}
      <View style={styles.bottomOverlay}>
        <View style={styles.textRow}>
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={10} color="#CBD5E1" />
              <Text style={styles.location} numberOfLines={1}>
                {location}
              </Text>
            </View>
          </View>

          <View style={styles.xpContainer}>
            <Text style={styles.xpText}>+{xp}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    backgroundColor: COLORS.tertiary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lockedCard: {
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#E8E8E8",
    borderWidth: 1,
    height: 200,
  },
  lockCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  lockedText: {
    fontSize: 11,
    color: COLORS.tertiary,
    fontWeight: "500",
    textAlign: "center",
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
  },
  placeholderImage: {
    backgroundColor: "#D1D5DB",
  },
  rarityBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 3,
    zIndex: 10,
  },
  rarityText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  // Sleek, compact footer bar
  bottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(15, 23, 42, 0.85)", // Dark slate, very compact
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  textRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  location: {
    fontSize: 10,
    color: "#CBD5E1",
    fontWeight: "500",
  },
  xpContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  xpText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFD700",
  },
});
