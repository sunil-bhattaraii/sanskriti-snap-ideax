import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ArtifactDetail } from "@/types/artifact";
import { COLORS } from "../../constants/colors";
import { getRarityInfo } from "../../utils/rarity";
import MarkdownText from "../MarkdownText";

interface ArtifactInfoProps {
  artifact: ArtifactDetail;
  distance: number | null;
  isUnlocked: boolean;
}

export default function ArtifactInfo({ artifact, distance, isUnlocked }: ArtifactInfoProps) {
  const rarityInfo = getRarityInfo(artifact.xpReward);

  return (
    <>
      <View style={styles.identitySection}>
        <Text style={styles.artifactName}>{artifact.name}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{artifact.humanReadableLocation}</Text>
          <Text style={styles.metaSeparator}>•</Text>
          <Text style={styles.metaText}>{artifact.category}</Text>
        </View>
      </View>

      <View style={styles.metadataRow}>
        <View style={[styles.rarityBadge, { backgroundColor: rarityInfo.bgColor }]}>
          <Ionicons name="star" size={14} color={rarityInfo.color} />
          <Text style={[styles.rarityText, { color: rarityInfo.color }]}>{rarityInfo.label}</Text>
        </View>

        <View style={[styles.xpBadge, isUnlocked && styles.xpBadgeClaimed]}>
          <Ionicons name={isUnlocked ? "checkmark-circle" : "trophy"} size={14} color={isUnlocked ? COLORS.primary : "#D4AF37"} />
          <Text style={[styles.xpText, isUnlocked && styles.xpTextClaimed]}>{isUnlocked ? "Claimed" : `${artifact.xpReward} XP`}</Text>
        </View>

        {distance !== null && (
          <View style={styles.distanceBadge}>
            <Ionicons name="walk" size={14} color={COLORS.tertiary} />
            <Text style={styles.distanceText}>
              {distance < 1 ? `${Math.round(distance * 1000)}m away` : `${distance.toFixed(1)}km away`}
            </Text>
          </View>
        )}
      </View>

      <MarkdownText text={artifact.description} style={styles.description} />
    </>
  );
}

const styles = StyleSheet.create({
  identitySection: { marginBottom: 16 },
  artifactName: { fontSize: 26, fontWeight: "800", color: COLORS.text, marginBottom: 8 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  metaText: { fontSize: 14, color: COLORS.tertiary },
  metaSeparator: { fontSize: 10, color: COLORS.tertiary },
  metadataRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" },
  rarityBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
  },
  rarityText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  xpBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  xpBadgeClaimed: { backgroundColor: "rgba(16, 185, 129, 0.08)", borderColor: "rgba(16, 185, 129, 0.35)" },
  xpText: { fontSize: 12, fontWeight: "700", color: COLORS.text },
  xpTextClaimed: { color: COLORS.primary },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  distanceText: { fontSize: 12, color: COLORS.tertiary },
  description: { fontSize: 16, lineHeight: 24, color: COLORS.tertiary, marginBottom: 24 },
});
