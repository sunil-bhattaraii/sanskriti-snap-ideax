import { COLORS } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export interface Reward {
  id: string;
  title: string;
  description: string;
  xpCost: number;
  imageUrl: string;
  category: string;
  badge?: "New" | "Popular" | "Limited";
  status?: "available" | "claimed";
}

interface RewardCardProps {
  reward: Reward;
  onClaim: (reward: Reward) => void;
  canAfford: boolean;
  isClaiming?: boolean;
}

export default function RewardCard({
  reward,
  onClaim,
  canAfford,
  isClaiming = false,
}: RewardCardProps) {
  const isClaimed = reward.status === "claimed";
  const getBadgeColor = (badge?: string) => {
    switch (badge) {
      case "New":
        return "#10B981";
      case "Popular":
        return "#F59E0B";
      case "Limited":
        return "#EF4444";
      default:
        return COLORS.primary;
    }
  };

  return (
    <View style={styles.card}>
      {/* Image Container */}
      <View style={styles.imageContainer}>
        {reward.imageUrl ? <Image
          source={{ uri: reward.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        /> : <View style={styles.imageFallback}><Ionicons name="gift-outline" size={44} color={COLORS.primary} /></View>}

        {/* Category Badge */}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{reward.category}</Text>
        </View>

        {/* Special Badge */}
        {reward.badge && !isClaimed && (
          <View
            style={[
              styles.specialBadge,
              { backgroundColor: getBadgeColor(reward.badge) },
            ]}
          >
            <Text style={styles.specialBadgeText}>{reward.badge}</Text>
          </View>
        )}
        {isClaimed && (
          <>
            <View pointerEvents="none" style={styles.claimedTint} />
            <View style={styles.claimedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.white} />
              <Text style={styles.claimedBadgeText}>Claimed</Text>
            </View>
          </>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {reward.title}
        </Text>

        <Text style={styles.description} numberOfLines={2}>
          {reward.description}
        </Text>

        {/* XP Cost Button */}
        <TouchableOpacity
          style={[
            styles.claimButton,
            (!canAfford || isClaimed) && styles.claimButtonDisabled,
          ]}
          onPress={() => onClaim(reward)}
          disabled={!canAfford || isClaiming || isClaimed}
          activeOpacity={0.7}
        >
          <Ionicons
            name="star"
            size={16}
            color={canAfford && !isClaimed ? COLORS.white : COLORS.tertiary}
          />
          <Text
            style={[
              styles.claimButtonText,
              (!canAfford || isClaimed) && styles.claimButtonTextDisabled,
            ]}
          >
            {isClaiming
              ? "Claiming..."
              : isClaimed
                ? "Claimed"
                : `${reward.xpCost.toLocaleString()} points`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    position: "relative",
    height: 160,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F3F0",
  },
  categoryBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  specialBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  specialBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.white,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: COLORS.tertiary,
    lineHeight: 18,
    marginBottom: 16,
  },
  claimButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  claimButtonDisabled: {
    backgroundColor: "#E5E7EB",
  },
  claimButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.white,
  },
  claimButtonTextDisabled: {
    color: COLORS.tertiary,
  },
  claimedTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  claimedBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6B7280",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  claimedBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.white,
  },
});
