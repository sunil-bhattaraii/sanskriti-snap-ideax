import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";

interface ArtifactBottomBarProps {
  storyUnlocked: boolean;
  isDiscovered?: boolean;
  onNavigate: () => void;
  onTakeSnap?: () => void;
}

export default function ArtifactBottomBar({ storyUnlocked, isDiscovered = false, onNavigate, onTakeSnap }: ArtifactBottomBarProps) {
  const insets = useSafeAreaInsets();

  // If already discovered, only show the navigation/map button
  const showSnapButton = storyUnlocked && !isDiscovered && !!onTakeSnap;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
      {showSnapButton ? (
        // Two-button layout when snap is required
        <View style={styles.twoButtonRow}>
          <TouchableOpacity style={styles.snapButton} onPress={onTakeSnap} activeOpacity={0.8}>
            <Ionicons name="camera" size={20} color={COLORS.white} />
            <Text style={styles.snapButtonText}>Take Snap</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navigateButton} onPress={onNavigate} activeOpacity={0.8}>
            <Ionicons name="navigate" size={20} color={COLORS.primary} />
            <Text style={styles.navigateButtonText}>Navigate</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.fullNavigateButton} onPress={onNavigate} activeOpacity={0.8}>
          <Ionicons name={isDiscovered ? "map" : "navigate"} size={20} color={COLORS.white} />
          <Text style={styles.fullNavigateButtonText}>{isDiscovered ? "View on Map" : "Start Navigation"}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingHorizontal: 20,
    paddingTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  twoButtonRow: { flexDirection: "row", gap: 12 },
  snapButton: {
    flex: 1.2, // Slightly wider to emphasize the primary action
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  snapButtonText: { color: COLORS.white, fontSize: 15, fontWeight: "700" },
  navigateButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  navigateButtonText: { color: COLORS.primary, fontSize: 15, fontWeight: "700" },
  fullNavigateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  fullNavigateButtonText: { color: COLORS.white, fontSize: 16, fontWeight: "700" },
});
