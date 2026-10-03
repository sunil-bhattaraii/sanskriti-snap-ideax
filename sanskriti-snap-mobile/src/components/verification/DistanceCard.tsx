import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { type VerificationFailedData } from "../../constants/data/mockVerificationFailed";

interface Props {
  data: VerificationFailedData;
}

export default function DistanceCard({ data }: Props) {
  return (
    <View style={styles.container}>
      {/* Distance Info Box */}
      <View style={styles.distanceBox}>
        <View style={styles.iconContainer}>
          <Ionicons name="map" size={20} color={COLORS.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>DISTANCE REMAINING</Text>
          <Text style={styles.distanceValue}>
            {data.distanceRemaining}m{" "}
            <Text style={styles.distanceUnit}>to the artifact</Text>
          </Text>
        </View>
      </View>

      {/* Map Preview */}
      <View style={styles.mapContainer}>
        <Image
          source={{ uri: data.mapImageUrl }}
          style={styles.mapImage}
          resizeMode="cover"
        />
        {/* Location Pin */}
        <View style={styles.mapPin}>
          <Ionicons name="location" size={24} color={COLORS.primary} />
        </View>
      </View>

      {/* Instruction Text */}
      <Text style={styles.instructionText}>{data.instructionText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
    paddingHorizontal: 20,
    width: "100%",
  },
  distanceBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    marginBottom: 16,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#FFF5F3",
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.tertiary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  distanceValue: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },
  distanceUnit: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.tertiary,
  },
  mapContainer: {
    height: 140,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: "#E2E8F0",
    position: "relative",
  },
  mapImage: {
    width: "100%",
    height: "100%",
  },
  mapPin: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -12,
    marginTop: -24,
  },
  instructionText: {
    fontSize: 14,
    color: COLORS.tertiary,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 10,
  },
});
