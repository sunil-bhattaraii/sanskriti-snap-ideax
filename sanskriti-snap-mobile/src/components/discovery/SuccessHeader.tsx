import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";

export default function SuccessHeader() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Discovery Collected!</Text>
      <Text style={styles.subtitle}>You've unlocked a piece of history.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.tertiary,
    textAlign: "center",
  },
});
