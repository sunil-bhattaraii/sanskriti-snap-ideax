import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { type VerificationPendingData } from "../../constants/data/mockVerificationPending";

interface Props {
  data: Pick<
    VerificationPendingData,
    "submittedImageUri" | "progressPercentage" | "currentStep"
  >;
}

export default function SubmissionPreview({ data }: Props) {
  return (
    <View style={styles.container}>
      {/* Image Container */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: data.submittedImageUri }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Gradient Overlay */}
        <View style={styles.overlay} />

        {/* Verifying Badge */}
        <View style={styles.verifyingBadge}>
          <Ionicons name="sync" size={16} color={COLORS.secondary} />
          <Text style={styles.verifyingText}>VERIFYING...</Text>
        </View>
      </View>

      {/* Progress Section */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${data.progressPercentage}%` },
            ]}
          />
        </View>

        <View style={styles.progressInfo}>
          <Text style={styles.progressStep}>{data.currentStep}</Text>
          <Ionicons
            name="ellipsis-horizontal"
            size={16}
            color={COLORS.tertiary}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  imageContainer: {
    height: 280,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#E2E8F0",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  verifyingBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  verifyingText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.secondary,
    letterSpacing: 0.5,
  },
  progressContainer: {
    marginTop: -20,
    marginHorizontal: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "#F1F5F9",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressStep: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: "600",
  },
});
