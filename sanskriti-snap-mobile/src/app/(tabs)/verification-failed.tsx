import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Button } from "../../components/Button";
import ScreenHeader from "../../components/ScreenHeader";
import DistanceCard from "../../components/verification/DistanceCard";
import VerificationAlert from "../../components/verification/VerificationAlert";
import { COLORS } from "../../constants/colors";

import type { VerificationFailedData } from "../../constants/data/mockVerificationFailed";
import { backendClient } from "@/services/backendClient";

export default function VerificationFailedScreen() {
  const router = useRouter();
  const { artifactId, distanceRemaining } = useLocalSearchParams<{ artifactId: string; distanceRemaining?: string }>();
  const [failedData, setFailedData] = useState<VerificationFailedData | null>(null);

  useEffect(() => {
    if (!artifactId) return;
    backendClient.from("artifacts").select("name, reference_images").eq("id", artifactId).single()
      .then(({ data }) => data && setFailedData({
        distanceRemaining: Number(distanceRemaining ?? 0),
        artifactName: data.name,
        mapImageUrl: data.reference_images[0] ?? "",
        instructionText: `Move closer to ${data.name} to verify your discovery.`,
      }));
  }, [artifactId, distanceRemaining]);

  if (!failedData) return <View style={styles.container}><Text style={styles.footerText}>Loading verification...</Text></View>;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title="Verification" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <VerificationAlert
          title="You're almost there!"
          subtitle="You're not close enough yet."
        />

        <DistanceCard data={failedData} />

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title="Navigate Closer"
            onPress={() => console.log("Navigate")}
            variant="primary"
            size="lg"
            fullWidth
            leftIcon={
              <Ionicons name="navigate" size={20} color={COLORS.white} />
            }
          />

          <Button
            title="Try Again"
            onPress={() => router.back()}
            variant="outline"
            size="lg"
            fullWidth
            leftIcon={
              <Ionicons name="refresh" size={20} color={COLORS.primary} />
            }
            style={styles.tryAgainButton}
          />
        </View>

        {/* Footer Link */}
        <TouchableOpacity
          style={styles.footerLink}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.footerText}>Continue Exploring</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.neutral,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
    alignItems: "center",
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 400,
    marginBottom: 24,
    gap: 12,
  },
  tryAgainButton: {
    marginTop: 0,
    borderColor: "#E2E8F0",
    backgroundColor: COLORS.white,
  },
  footerLink: {
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.tertiary,
    fontWeight: "500",
  },
});
