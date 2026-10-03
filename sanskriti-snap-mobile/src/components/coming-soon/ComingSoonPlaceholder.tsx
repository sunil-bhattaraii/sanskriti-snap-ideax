import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { type ComingSoonData } from "../../constants/data/mockComingSoon";

interface Props {
  data: ComingSoonData;
}

export default function ComingSoonPlaceholder({ data }: Props) {
  const router = useRouter();

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/"); // Fallback to home if no history
    }
  };

  return (
    <View style={styles.container}>
      {/* Icon Illustration */}
      <View style={styles.iconContainer}>
        <Ionicons name={data.icon} size={48} color={COLORS.primary} />
      </View>

      {/* Text Content */}
      <Text style={styles.title}>{data.title}</Text>
      <Text style={styles.description}>{data.description}</Text>

      {/* Action Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleGoBack}
        activeOpacity={0.8}
      >
        <Ionicons
          name="arrow-back"
          size={20}
          color={COLORS.white}
          style={styles.buttonIcon}
        />
        <Text style={styles.buttonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingBottom: 80, // Offset for header
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFF5F3", // Light terracotta background
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    color: COLORS.tertiary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
});
