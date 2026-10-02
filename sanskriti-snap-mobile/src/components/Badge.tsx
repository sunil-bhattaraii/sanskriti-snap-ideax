import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../constants/colors";

interface BadgeProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  variant: "discoveries" | "xp";
}

export default function Badge({ icon, label, value, variant }: BadgeProps) {
  const isDiscoveries = variant === "discoveries";

  return (
    <View
      style={[
        styles.container,
        isDiscoveries ? styles.discoveriesBg : styles.xpBg,
      ]}
    >
      <Text
        style={[
          styles.label,
          isDiscoveries ? styles.discoveriesText : styles.xpText,
        ]}
      >
        {label}
      </Text>
      <View style={styles.valueContainer}>
        <Ionicons
          name={icon}
          size={20}
          color={isDiscoveries ? COLORS.primary : COLORS.secondary}
        />
        <Text
          style={[
            styles.value,
            isDiscoveries ? styles.discoveriesText : styles.xpText,
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  discoveriesBg: {
    backgroundColor: "#FFF0F0", // Light pink/rose
  },
  xpBg: {
    backgroundColor: "#FFFBF0", // Light yellow/cream
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  discoveriesText: {
    color: COLORS.primary,
  },
  xpText: {
    color: COLORS.secondary,
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  value: {
    fontSize: 24,
    fontWeight: "800",
  },
});
