import { COLORS } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface XPBalanceProps {
  balance: number;
}

export default function XPBalance({ balance }: XPBalanceProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="star" size={20} color={COLORS.secondary} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.label}>Available XP</Text>
        <Text style={styles.balance}>{balance.toLocaleString()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBF0",
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(212, 175, 55, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontWeight: "600",
  },
  balance: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.secondary,
  },
});
