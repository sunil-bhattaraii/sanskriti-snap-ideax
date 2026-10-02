import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { type VerificationPendingData } from "../../constants/data/mockVerificationPending";

interface Props {
  data: Pick<VerificationPendingData, "estimatedTime">;
}

export default function VerificationInfo({ data }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.infoBox}>
        <View style={styles.iconContainer}>
          <Ionicons
            name="cloud-upload-outline"
            size={24}
            color={COLORS.primary}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Verification in Progress</Text>
          <Text style={styles.description}>
            Your discovery is being verified. We'll notify you once it's
            collected. You are free to keep exploring!
          </Text>
          {data.estimatedTime && (
            <Text style={styles.estimatedTime}>
              Estimated time: {data.estimatedTime}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.backgroundNote}>
        <Ionicons
          name="information-circle-outline"
          size={16}
          color={COLORS.tertiary}
        />
        <Text style={styles.noteText}>
          VERIFICATION HAPPENS IN THE BACKGROUND
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    gap: 16,
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF5F3",
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: COLORS.tertiary,
    lineHeight: 20,
    marginBottom: 8,
  },
  estimatedTime: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "600",
  },
  backgroundNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  noteText: {
    fontSize: 11,
    color: COLORS.tertiary,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
