import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { type Badge } from "../../services/badges";

interface Props {
  badge: Badge;
}

export default function AchievementBadge({ badge }: Props) {
  if (!badge.isUnlocked) {
    return (
      <View style={styles.card}>
        <View style={styles.badgeContainer}>
          <View style={styles.lockedCircle}>
            <Ionicons name="lock-closed" size={28} color="#9CA3AF" />
          </View>
        </View>
        <Text style={styles.lockedLabel}>LOCKED</Text>
        <Text style={styles.badgeTitle}>{badge.title}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Blue Dot Indicator */}
      <View style={styles.dot} />

      {/* Badge Image with Decorative Border */}
      <View style={styles.badgeContainer}>
        <View style={styles.badgeBorder}>
          {badge.imageUrl ? (
            <Image source={{ uri: badge.imageUrl }} style={styles.badgeImage} />
          ) : (
            <Ionicons name="ribbon" size={42} color="#F59E0B" />
          )}
        </View>
      </View>

      {/* Text Content */}
      <Text style={styles.badgeTitle}>{badge.title}</Text>
      <Text style={styles.badgeDescription} numberOfLines={2}>
        {badge.description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
    position: "relative",
    minHeight: 200,
    justifyContent: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dot: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3B82F6",
  },
  badgeContainer: {
    marginBottom: 12,
    alignItems: "center",
  },
  badgeBorder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: "#F59E0B", // Gold border for unlocked
    padding: 3,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeImage: {
    width: 78,
    height: 78,
    borderRadius: 39,
  },
  lockedCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  lockedLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#9CA3AF",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: 11,
    color: COLORS.tertiary,
    textAlign: "center",
    lineHeight: 14,
  },
});
