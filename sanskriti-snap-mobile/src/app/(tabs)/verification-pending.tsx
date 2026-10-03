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
import { backendClient } from "@/services/backendClient";
import { useAuthStore } from "@/store/authstore";

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
  const user = useAuthStore((state) => state.user);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);

  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [checking, setChecking] = useState(false);

  // 1. Fetch real data to populate the UI (from kushal/integration)
  useEffect(() => {
    if (!submissionId) return;

    const fetchData = async () => {
      try {
        const { data: submission, error: subError } = await backendClient
          .from("submissions")
          .select("main_snap_url, verification_status, cv_status, artifact_id, gps_lat, gps_lng")
          .eq("id", submissionId)
          .single();

        if (subError || !submission) return;

        if (submission.verification_status === "verified") {
          const { data: discovery } = await backendClient
            .from("discoveries")
            .select("id")
            .eq("submission_id", submissionId)
            .maybeSingle();
          if (discovery) {
            router.replace({
              pathname: "/(tabs)/discovery-success",
              params: { discoveryId: discovery.id },
            });
          }
          return;
        }

        if (submission.verification_status === "rejected") {
          const { data: nearbyArtifacts } = await backendClient.rpc("nearby_artifacts", {
            p_lat: submission.gps_lat,
            p_lng: submission.gps_lng,
            p_radius_m: 2147483647,
          });
          const artifactResult = nearbyArtifacts?.find(
            (item) => item.id === submission.artifact_id,
          );
          router.replace({
            pathname: "/(tabs)/verification-failed",
            params: {
              artifactId: submission.artifact_id,
              distanceRemaining: String(
                Math.max(
                  0,
                  Math.round(
                    (artifactResult?.distance_m ?? 0) -
                    (artifactResult?.verification_radius_m ?? 0),
                  ),
                ),
              ),
            },
          });
          return;
        }

        const { data: artifact, error: artError } = await backendClient
          .from("artifacts")
          .select("name, human_readable_location, xp_value")
          .eq("id", submission.artifact_id)
          .single();

        if (artError || !artifact) return;

        const status = submission.verification_status === "pending" ? "verifying" : "analyzing";

        let imageUrl = submission.main_snap_url ?? "";
        if (imageUrl) {
          const { data: signedImage } = await backendClient.storage
            .from("submission-snaps")
            .createSignedUrl(imageUrl, 3600);
          imageUrl = signedImage?.signedUrl ?? imageUrl;
        }

        setVerificationData({
          submittedImageUri: imageUrl,
          placeName: artifact.name,
          location: artifact.human_readable_location,
          verificationStatus: status,
          progressPercentage: submission.cv_status === "pending" ? 45 : 80,
          currentStep: submission.cv_status === "pending" ? "Waiting for verification" : "Analyzing visual geometry",
          estimatedTime: "2-3 minutes",
          xpReward: artifact.xp_value,
          artifactId: submission.artifact_id,
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

      const { data: nearbyArtifacts, error: artifactError } = await backendClient.rpc(
        "nearby_artifacts",
        {
          p_lat: location.coords.latitude,
          p_lng: location.coords.longitude,
          p_radius_m: 10000,
        }
      );

      if (artifactError) throw artifactError;

      const artifact = (nearbyArtifacts || []).find(
        (item: any) => item.id === verificationData.artifactId
      );

      if (!artifact) {
        throw new Error("Could not locate this artifact nearby.");
      }

      const distance = Number(artifact.distance_m);
      const gpsVerified = distance <= artifact.verification_radius_m;

      const { error: updateError } = await backendClient
        .from("submissions")
        .update({
          gps_lat: location.coords.latitude,
          gps_lng: location.coords.longitude,
          gps_accuracy_m: location.coords.accuracy,
          gps_altitude_m: location.coords.altitude,
          gps_captured_at: new Date(location.timestamp).toISOString(),
          gps_verified: gpsVerified,
          cv_status: "pass",
          cv_similarity_score: 1,
          verification_status: gpsVerified ? "pending" : "rejected",
        })
        .eq("id", submissionId);

      if (updateError) throw updateError;

      if (!gpsVerified) {
        router.replace({
          pathname: "/(tabs)/verification-failed",
          params: {
            artifactId: verificationData.artifactId,
            distanceRemaining: String(
              Math.max(0, Math.round(distance - artifact.verification_radius_m)),
            ),
          },
        });
        return;
      }

      const { data: finalization, error: finalizationError } = await backendClient.rpc(
        "finalize_discovery",
        {
          p_submission_id: submissionId,
        }
      );

      if (finalizationError) throw finalizationError;

      const result = finalization as {
        success?: boolean;
        message?: string;
        xp_awarded?: number;
        discovery_id?: string;
      };

      if (!result.success || !result.discovery_id) {
        throw new Error(result.message || "Verification failed.");
      }

      if (user) await fetchProfile(user.id);

      // Update UI to show success
      setVerificationData((current) =>
        current
          ? {
            ...current,
            verificationStatus: "verified",
            progressPercentage: 100,
            currentStep: "Verification complete",
            xpReward: result.xp_awarded || current.xpReward,
          }
          : current
      );

      Alert.alert(
        "Discovery verified",
        `You earned ${result.xp_awarded || verificationData.xpReward} XP.`,
        [
          {
            text: "Continue",
            onPress: () =>
              router.replace({
                pathname: "/(tabs)/discovery-success",
                params: {
                  discoveryId: result.discovery_id,
                },
              }),
          },
        ],
        { cancelable: false }
      );
    } catch (error: any) {
      console.error("Verification error:", error);
      Alert.alert("Verification failed", error.message || "We could not verify this submission.");
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