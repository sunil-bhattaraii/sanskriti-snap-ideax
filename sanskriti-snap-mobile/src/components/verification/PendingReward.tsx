import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { type VerificationPendingData } from "../../constants/data/mockVerificationPending";

interface Props {
  data: Pick<VerificationPendingData, "xpReward">;
}

export default function PendingReward({ data }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>UPON SUCCESSFUL VERIFICATION</Text>

      <View style={styles.rewardCard}>
        <View style={styles.iconContainer}>
          <Ionicons name="star" size={24} color={COLORS.secondary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.rewardAmount}>+{data.xpReward} XP</Text>
          <Text style={styles.rewardLabel}>
            will be added to your collection
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.tertiary,
    letterSpacing: 0.5,
    marginBottom: 12,
    textAlign: "center",
  },
  rewardCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBF0",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#FDE68A",
    gap: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(212, 175, 55, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
  },
  rewardAmount: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.secondary,
    marginBottom: 4,
  },
  rewardLabel: {
    fontSize: 13,
    color: "#B45309",
    fontWeight: "500",
  },
});
