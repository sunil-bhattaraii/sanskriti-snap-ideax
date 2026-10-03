import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function VerificationNotice() {
  return (
    <View style={styles.container}>
      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
      <Text style={styles.text}>
        Captured primary verification snap of the heritage site
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  text: {
    fontSize: 13,
    color: "#10B981", // Green success color
    fontWeight: "500",
    flex: 1,
  },
});
