import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

export default function SettingsSection({
  title,
  children,
}: SettingsSectionProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.tertiary,
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  content: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginHorizontal: 20,
    overflow: "hidden",
    // Optional: Add a subtle shadow/border if needed
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
});
