import React, { useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { type SubmissionData } from "../../constants/data/mockSubmission";

interface Props {
  data: Pick<SubmissionData, "xpReward" | "isPublic">;
  onTogglePublic?: (isPublic: boolean) => void;
}

export default function RewardPreview({ data, onTogglePublic }: Props) {
  const [isPublic, setIsPublic] = useState(data.isPublic);

  const handleToggle = (value: boolean) => {
    setIsPublic(value);
    onTogglePublic?.(value);
  };

  return (
    <View style={styles.container}>
      <View style={styles.toggleRow}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Make additional photos public</Text>
          <Text style={styles.subtitle}>
            Allow others to see your gallery photos on the map. Primary snap is
            always verified privately.
          </Text>
        </View>
        <Switch
          value={isPublic}
          onValueChange={handleToggle}
          trackColor={{ false: "#E2E8F0", true: COLORS.primary }}
          thumbColor={isPublic ? COLORS.white : "#f4f3f4"}
          ios_backgroundColor="#E2E8F0"
        />
      </View>

      <View style={styles.rewardBox}>
        <Text style={styles.rewardLabel}>You will earn</Text>
        <Text style={styles.rewardValue}>+{data.xpReward} XP</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 32 },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  textContainer: { flex: 1, marginRight: 16 },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: { fontSize: 12, color: COLORS.tertiary, lineHeight: 16 },
  rewardBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFBF0",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  rewardLabel: { fontSize: 14, color: COLORS.tertiary, fontWeight: "600" },
  rewardValue: { fontSize: 18, fontWeight: "800", color: COLORS.secondary },
});
