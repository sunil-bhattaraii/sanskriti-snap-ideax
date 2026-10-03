import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from "react-native";
import * as Location from "expo-location";
import { Button } from "../../components/Button";
import ScreenHeader from "../../components/ScreenHeader";
import PendingReward from "../../components/verification/PendingReward";
import SubmissionPreview from "../../components/verification/SubmissionPreview";
import VerificationInfo from "../../components/verification/VerificationInfo";
import VerificationStatus from "../../components/verification/VerificationStatus";
import { COLORS } from "../../constants/colors";
import { ApiRequestError, apiRequest } from "@/services/api";

type VerificationData = {
  submittedImageUri: string;
  placeName: string;
  location: string;
  verificationStatus: string;
  progressPercentage: number;
  currentStep: string;
  estimatedTime: string;
  xpReward: number;
  artifactId: string;
};

export default function VerificationPendingScreen() {
  const router = useRouter();
  const { submissionId } = useLocalSearchParams<{ submissionId: string }>();
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [checking, setChecking] = useState(false);

  // 1. Fetch real data to populate the UI (from kushal/integration)
  useEffect(() => {
    if (!submissionId) return;

    const fetchData = async () => {
      try {
        const attempt = await apiRequest<{
          id: string;
          status: string;
          artifactId: string;
          artifact: {
            name: string;
            humanReadableLocation: string;
            xpReward: number;
          };
          verificationImageUrl: string | null;
          gps: { status: string; distanceMeters: number | null; requiredMeters: number };
          cv: { status: string } | null;
          discoveryId: string | null;
        }>(`/verification-attempts/${encodeURIComponent(submissionId)}`);

        if (attempt.discoveryId) {
            router.replace({
              pathname: "/(tabs)/discovery-success",
              params: { discoveryId: attempt.discoveryId },
            });
          return;
        }

        if (attempt.status === "REJECTED") {
          router.replace({
            pathname: "/(tabs)/verification-failed",
            params: {
              artifactId: attempt.artifactId,
              distanceRemaining: String(Math.max(
                0,
                Math.round((attempt.gps?.distanceMeters ?? 0) - (attempt.gps?.requiredMeters ?? 0)),
              )),
            },
          });
          return;
        }

        setVerificationData({
          submittedImageUri: attempt.verificationImageUrl ?? "",
          placeName: attempt.artifact.name,
          location: attempt.artifact.humanReadableLocation,
          verificationStatus: attempt.status === "FLAGGED" ? "analyzing" : "verifying",
          progressPercentage: attempt.status === "FLAGGED" ? 80 : 45,
          currentStep: attempt.status === "FLAGGED"
            ? "Awaiting verification review"
            : "Verification complete",
          estimatedTime: "Review usually takes 2-3 minutes",
          xpReward: attempt.artifact.xpReward,
          artifactId: attempt.artifactId,
        });
      } catch (error) {
        console.error("Error fetching verification data:", error);
      }
    };

    void fetchData();
    const interval = setInterval(() => void fetchData(), 5000);
    return () => clearInterval(interval);
  }, [router, submissionId]);

  // 2. Manual retry/verification logic (from main)
  const handleRetryVerification = async () => {
    if (!submissionId || !verificationData) return;
    setChecking(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Location permission is required.");
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const result = await apiRequest<{
        attemptId: string;
        status: "VERIFIED" | "FLAGGED";
        discoveryId: string | null;
        xpAwarded: number;
        gps: { status: string; distanceMeters: number | null; requiredMeters: number };
      }>(`/verification-attempts/${encodeURIComponent(submissionId)}/recheck`, {
        method: "POST",
        body: JSON.stringify({
          location: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracyMeters: Math.max(1, Math.min(100, location.coords.accuracy ?? 100)),
            capturedAt: new Date(location.timestamp).toISOString(),
          },
        }),
      });

      if (!result.discoveryId) {
        if (result.status === "FLAGGED") {
          router.replace({
            pathname: "/(tabs)/verification-pending",
            params: { submissionId: result.attemptId },
          });
          return;
        }
        throw new Error("Verification did not produce a discovery.");
      }

      // Update UI to show success
      setVerificationData((current) =>
        current
          ? {
            ...current,
            verificationStatus: "verified",
            progressPercentage: 100,
            currentStep: "Verification complete",
            xpReward: result.xpAwarded || current.xpReward,
          }
          : current
      );

      Alert.alert(
        "Discovery verified",
        `You earned ${result.xpAwarded || verificationData.xpReward} XP.`,
        [
          {
            text: "Continue",
            onPress: () =>
              router.replace({
                pathname: "/(tabs)/discovery-success",
                params: {
                  discoveryId: result.discoveryId,
                },
              }),
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error("Verification error:", error);
      if (error instanceof ApiRequestError && error.code === "GPS_OUTSIDE_RADIUS") {
        Alert.alert("Verification failed", error.message);
      } else {
        Alert.alert("Verification failed", error instanceof Error ? error.message : "We could not verify this submission.");
      }
    } finally {
      setChecking(false);
    }
  };

  if (!verificationData) {
    return (
      <View style={styles.container}>
        <ActivityIndicator style={styles.loader} color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title="Submission Status" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <VerificationStatus data={verificationData} />
        <SubmissionPreview data={verificationData} />
        <VerificationInfo data={verificationData} />
        <PendingReward data={verificationData} />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={checking ? "Checking..." : "Retry Verification"}
          onPress={handleRetryVerification}
          variant="primary"
          size="lg"
          fullWidth
          disabled={checking}
          leftIcon={
            <Ionicons name="refresh-outline" size={20} color={COLORS.white} />
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.neutral,
  },
  loader: {
    flex: 1,
    alignSelf: "center",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120, // Space for fixed button
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: COLORS.neutral,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingBottom: 30, // Safe area
  },
});