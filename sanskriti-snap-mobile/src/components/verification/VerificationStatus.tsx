import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";

interface Props {
  data: {
    verificationStatus: string;
    placeName: string;
    location: string;
  };
}

export default function VerificationStatus({ data }: Props) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "verifying":
        return {
          icon: "hourglass-outline" as const,
          color: "#F59E0B",
          label: "VERIFYING...",
        };
      case "analyzing":
        return {
          icon: "scan-outline" as const,
          color: "#3B82F6",
          label: "ANALYZING...",
        };
      default:
        return {
          icon: "time-outline" as const,
          color: "#F59E0B",
          label: "PENDING",
        };
    }
  };

  const config = getStatusConfig(data.verificationStatus);

  return (
    <View style={styles.container}>
      <View style={styles.statusBadge}>
        <Ionicons name={config.icon} size={14} color={config.color} />
        <Text style={[styles.statusText, { color: config.color }]}>
          {config.label}
        </Text>
      </View>

      <Text style={styles.title}>Discovery Pending</Text>
      <Text style={styles.placeName}>{data.placeName}</Text>
      <Text style={styles.location}>{data.location}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 24,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBF0",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 8,
  },
  placeName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: COLORS.tertiary,
  },
});
