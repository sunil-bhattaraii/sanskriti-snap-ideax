import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { type BadgesData } from "../../services/badges";

interface Props {
  data: Pick<BadgesData, "currentCount" | "totalCount">;
}

export default function BadgeProgress({ data }: Props) {
  const progress = data.totalCount === 0 ? 0 : data.currentCount / data.totalCount;
  const circumference = 2 * Math.PI * 50; // radius = 50
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={styles.container}>
      {/* Circular Progress with SVG-like approach using borders */}
      <View style={styles.progressContainer}>
        {/* Background Circle */}
        <View style={styles.circleBackground} />

        {/* Progress Arc (using rotation trick) */}
        <View
          style={[
            styles.circleProgress,
            {
              transform: [{ rotate: "-90deg" }],
              // Approximate the arc using border trick
              borderTopColor: "#F59E0B",
              borderRightColor: progress > 0.25 ? "#F59E0B" : "transparent",
              borderBottomColor: progress > 0.5 ? "#F59E0B" : "transparent",
              borderLeftColor: progress > 0.75 ? "#F59E0B" : "transparent",
            },
          ]}
        />

        {/* Center Text */}
        <View style={styles.centerText}>
          <Text style={styles.currentCount}>{data.currentCount}</Text>
          <Text style={styles.totalCount}>OF {data.totalCount}</Text>
        </View>
      </View>

      <Text style={styles.title}>Exploration Progress</Text>
      <Text style={styles.subtitle}>
        Keep discovering artifacts to expand your collection.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 10,
  },
  progressContainer: {
    width: 140,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
  },
  circleBackground: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: "#F3F4F6",
  },
  circleProgress: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: "transparent",
    borderTopColor: "#F59E0B",
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "transparent",
  },
  centerText: {
    alignItems: "center",
    zIndex: 10,
  },
  currentCount: {
    fontSize: 36,
    fontWeight: "800",
    color: COLORS.primary,
    lineHeight: 40,
  },
  totalCount: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.tertiary,
    letterSpacing: 1,
    marginTop: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.tertiary,
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});
