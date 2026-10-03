import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { type DiscoverySuccessData } from "../../constants/data/mockDiscoverySuccess";

interface Props {
  data: Pick<DiscoverySuccessData, "quest" | "badge">;
}

export default function CollectionAdded({ data }: Props) {
  const progressPercentage = (data.quest.progress / data.quest.total) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>QUEST PROGRESS</Text>
        <View style={styles.questRow}>
          <Text style={styles.questTitle}>{data.quest.name}</Text>
          <Text style={styles.questCount}>
            {data.quest.progress}/{data.quest.total} Discovered
          </Text>
        </View>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progressPercentage}%` },
            ]}
          />
        </View>
      </View>

      <View style={[styles.card, styles.badgeCard]}>
        <View style={styles.badgeIconContainer}>
          <View style={styles.badgeCircle}>
            <Ionicons
              name={data.badge.icon as any}
              size={24}
              color={COLORS.secondary}
            />
          </View>
          <View style={styles.checkBadge}>
            <Ionicons name="checkmark" size={12} color={COLORS.white} />
          </View>
        </View>
        <View style={styles.badgeTextContainer}>
          <Text style={[styles.sectionLabel, { color: "#10B981" }]}>
            BADGE UNLOCKED
          </Text>
          <Text style={styles.badgeTitle}>{data.badge.name}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16, marginBottom: 32 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.tertiary,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  questRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  questTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  questCount: { fontSize: 12, color: COLORS.tertiary, fontWeight: "600" },
  progressBarBg: {
    height: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  badgeCard: { flexDirection: "row", alignItems: "center", gap: 16 },
  badgeIconContainer: { position: "relative" },
  badgeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFBF0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  checkBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  badgeTextContainer: { flex: 1 },
  badgeTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },
});
