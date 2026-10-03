import React, { useEffect, useState } from "react";
import * as Location from "expo-location";
import { View, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Share, Alert, TouchableOpacity, Text } from "react-native";
import { Href, useRouter, useLocalSearchParams } from "expo-router";
import { apiRequest } from "../../services/api";
import { COLORS } from "../../constants/colors";
import { useAuthStore } from "@/store/authstore";

// Import the backend-backed types
import type { ArtifactDetail, DiscoveryStatus } from "../../types/artifact";

// Import sub-components
import ArtifactHeader from "../../components/ArtifactDetail/ArtifactHeader";
import ArtifactHero from "../../components/ArtifactDetail/ArtifactHero";
import ArtifactInfo from "../../components/ArtifactDetail/ArtifactInfo";
import ArtifactContent from "../../components/ArtifactDetail/ArtifactContent";
import ArtifactBottomBar from "../../components/ArtifactDetail/ArtifactBottomBar";

export default function ArtifactDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const artifactId = params.id as string;

  const { user, profile } = useAuthStore();

  // Now strictly typed to the backend schema!
  const [artifact, setArtifact] = useState<ArtifactDetail | null>(null);
  const [discoveryStatus, setDiscoveryStatus] = useState<DiscoveryStatus>({
    isDiscovered: false,
    isStoryUnlocked: false,
    distanceToArtifact: null,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (artifactId) {
      loadArtifactDetails();
    }
  }, [artifactId]);

  const loadArtifactDetails = async () => {
    try {
      setLoading(true);

      const response = await apiRequest<ArtifactDetail>(
        `/artifacts/${encodeURIComponent(artifactId)}`,
      );
      const artifactData = {
        ...response,
        reference_images: response.referenceImageUrls ?? [],
        human_readable_location: response.humanReadableLocation,
        story_unlock_radius_m: response.storyUnlockRadiusMeters,
      };
      setArtifact(artifactData);

      if (user) {
        setDiscoveryStatus({
          isDiscovered: artifactData.discovered,
          isStoryUnlocked: artifactData.storyUnlocked,
          distanceToArtifact: artifactData.distanceMeters ?? null,
        });
      }
    } catch (error) {
      console.error("Error loading artifact:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const unlockStoryAtCurrentLocation = async () => {
    if (!artifactId || !artifact || artifact.storyUnlocked) return;
    const permission = await Location.getForegroundPermissionsAsync();
    if (!permission.granted) return;
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const result = await apiRequest<{
      unlocked: boolean;
      distanceMeters: number;
      story?: string;
    }>(`/artifacts/${encodeURIComponent(artifactId)}/unlock-story`, {
      method: 'POST',
      body: JSON.stringify({
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          capturedAt: new Date(position.timestamp).toISOString(),
        },
      }),
    });
    setDiscoveryStatus((current) => ({
      ...current,
      distanceToArtifact: result.distanceMeters,
      isStoryUnlocked: result.unlocked,
    }));
    if (result.unlocked) {
      setArtifact((current) =>
        current
          ? { ...current, storyUnlocked: true, story: result.story ?? '' }
          : current,
      );
    }
  };

  useEffect(() => {
    if (!artifact || artifact.storyUnlocked) return;
    void unlockStoryAtCurrentLocation().catch((error) => {
      console.warn('Unable to check story unlock distance:', error);
    });
    const interval = setInterval(() => {
      void unlockStoryAtCurrentLocation().catch((error) => {
        console.warn('Unable to check story unlock distance:', error);
      });
    }, 15_000);
    return () => clearInterval(interval);
  }, [artifact, artifactId]);

  const handleShare = async () => {
    if (!artifact) return;
    try {
      await Share.share({ message: `Check out ${artifact.name} on Sanskriti Snap! ${artifact.description}`, title: artifact.name });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const handleStartNavigation = () => {
    if (isUnlocked) {
      // If already discovered, route to the Explore/Map screen to view it
      router.push({ pathname: "/(tabs)/explore", params: { artifactId } });
    } else {
      // If not discovered, route to the Navigation screen to help them find it
      // (Change '/(tabs)/navigation' to '/(tabs)/explore' if you use the same map screen for both)
      router.push({ pathname: "/(tabs)/navigation", params: { artifactId } });
    }
  };

  const handleTakeSnap = () => {
    // Only allow taking snap if not already discovered
    if (discoveryStatus.isDiscovered) {
      Alert.alert("Already Discovered", "You have already discovered this artifact. Great job!", [{ text: "OK" }]);
      return;
    }

    const snapArtifactId = String(artifactId).trim();
    if (!snapArtifactId) {
      console.error("Cannot open snap confirmation without an artifact ID");
      return;
    }

    router.push(`/snap/${encodeURIComponent(snapArtifactId)}/confirm` as Href);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!artifact) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Artifact not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isUnlocked = discoveryStatus.isStoryUnlocked;

  return (
    <View style={styles.container}>
      <ArtifactHeader onBack={() => router.back()} onShare={handleShare} />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadArtifactDetails} />}
      >
        <ArtifactHero images={artifact.reference_images} location={artifact.human_readable_location} />

        <View style={styles.mainContentContainer}>
          <ArtifactInfo artifact={artifact} distance={discoveryStatus.distanceToArtifact} isUnlocked={isUnlocked} />
          <ArtifactContent artifact={artifact} isUnlocked={isUnlocked} />
        </View>
      </ScrollView>

      <ArtifactBottomBar
        storyUnlocked={discoveryStatus.isDiscovered}
        isDiscovered={discoveryStatus.isDiscovered}
        onNavigate={handleStartNavigation}
        onTakeSnap={discoveryStatus.isStoryUnlocked ? handleTakeSnap : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.neutral },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.neutral },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.neutral, gap: 16 },
  errorText: { fontSize: 16, color: COLORS.tertiary, fontWeight: "600" },
  backButton: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  backButtonText: { color: COLORS.white, fontWeight: "700", fontSize: 14 },
  content: { flex: 1 },
  mainContentContainer: {
    backgroundColor: COLORS.neutral,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100,
  },
});
