import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";

interface Props {
  title: string;
  subtitle: string;
}

export default function VerificationAlert({ title, subtitle }: Props) {
  return (
    <View style={styles.container}>
      {/* Icon Container - Compass with slash */}
      <View style={styles.iconCircle}>
        <Ionicons name="location" size={32} color={COLORS.primary} />
        <View style={styles.slashIcon}>
          <Ionicons name="close" size={16} color={COLORS.primary} />
        </View>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 10,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    position: "relative",
  },
  slashIcon: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.tertiary,
    textAlign: "center",
  },
});
