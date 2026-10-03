import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { type DiscoverySuccessData } from "../../constants/data/mockDiscoverySuccess";

interface Props {
  data: Pick<DiscoverySuccessData, "xpEarned" | "pointsEarned">;
}

export default function XPReward({ data }: Props) {
  return (
    <View style={styles.container}>
      <View style={[styles.rewardBox, styles.xpBox]}>
        <View style={styles.iconCircle}>
          <Ionicons name="star" size={20} color={COLORS.white} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.xpValue}>+{data.xpEarned}</Text>
          <Text style={styles.xpLabel}>XP EARNED</Text>
        </View>
      </View>

      <View style={[styles.rewardBox, styles.pointsBox]}>
        <View style={[styles.iconCircle, styles.pointsIconCircle]}>
          <Ionicons name="cash-outline" size={20} color={COLORS.secondary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.xpValue, styles.pointsValue]}>
            +{data.pointsEarned}
          </Text>
          <Text style={[styles.xpLabel, styles.pointsLabel]}>POINTS</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", gap: 12, marginBottom: 24 },
  rewardBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  xpBox: { backgroundColor: COLORS.primary },
  pointsBox: {
    backgroundColor: "#FFFBF0",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  pointsIconCircle: { backgroundColor: "rgba(212, 175, 55, 0.2)" },
  textContainer: { flex: 1 },
  xpValue: { fontSize: 18, fontWeight: "800", color: COLORS.white },
  xpLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.8)",
    letterSpacing: 0.5,
  },
  pointsValue: { color: COLORS.secondary },
  pointsLabel: { color: "#B45309" },
});
