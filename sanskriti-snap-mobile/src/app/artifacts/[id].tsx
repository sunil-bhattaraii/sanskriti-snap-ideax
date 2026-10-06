import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import * as Location from "expo-location";
import { View, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Share, Alert, TouchableOpacity, Text, AppState } from "react-native";
import { Href, useRouter, useLocalSearchParams } from "expo-router";
import { apiRequest } from "../../services/api";
import { getCachedImageUri } from "../../services/image-cache";
import { isPlaceSaved, removeSavedPlace, savePlace } from "../../services/saved-places";
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
import CommunityBar from "../../components/ArtifactDetail/CommunityBar";

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
  const [isSaved, setIsSaved] = useState(false);
  const artifactCacheKey = `@sanskriti_artifact_${artifactId}`;

  const loadArtifactDetails = async () => {
    try {
      setLoading(true);

      const cached = await AsyncStorage.getItem(artifactCacheKey);
      const network = await NetInfo.fetch();
      let response: ArtifactDetail;
      if (!network.isConnected && cached) {
        response = JSON.parse(cached) as ArtifactDetail;
      } else try {
        response = await apiRequest<ArtifactDetail>(
          `/artifacts/${encodeURIComponent(artifactId)}`,
        );
        await AsyncStorage.setItem(artifactCacheKey, JSON.stringify(response));
      } catch (error) {
        if (!cached) throw error;
        response = JSON.parse(cached) as ArtifactDetail;
      }
      const imageUrls = [response.coverImageUrl, ...response.referenceImageUrls].filter(
        (url): url is string => Boolean(url),
      );
      void Promise.all(imageUrls.map((url) => getCachedImageUri(url))).catch((error) => {
        console.warn('Unable to prefetch artifact images:', error);
      });
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

  useEffect(() => {
    if (artifactId) {
      (async () => {
        await loadArtifactDetails();
      })();
    }
  }, [artifactId]);

  useEffect(() => {
    void isPlaceSaved(artifactId).then(setIsSaved);
  }, [artifactId]);

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

    // Unlock is proximity, so poll while the story is still locked — but keep
    // it event-friendly: 60s cadence, at most 10 polls (~10 minutes), never
    // overlapping a request, and only while the app is foregrounded. The next
    // visit to this screen, or a pull-to-refresh, re-checks too.
    const UNLOCK_POLL_INTERVAL_MS = 60_000;
    const MAX_UNLOCK_POLLS = 10;

    let inFlight = false;
    let polls = 0;
    let interval: ReturnType<typeof setInterval> | null = null;

    const poll = async () => {
      if (inFlight) return;
      polls += 1;
      inFlight = true;
      try {
        await unlockStoryAtCurrentLocation();
      } catch (error) {
        console.warn("Unable to check story unlock distance:", error);
      } finally {
        inFlight = false;
      }
    };

    const run = () => {
      if (AppState.currentState !== "active") return;
      void poll();
      if (interval && polls >= MAX_UNLOCK_POLLS) {
        clearInterval(interval);
        interval = null;
      }
    };

    interval = setInterval(run, UNLOCK_POLL_INTERVAL_MS);
    const appStateSub = AppState.addEventListener("change", (next) => {
      if (next === "active") run();
    });

    run();
    return () => {
      if (interval) clearInterval(interval);
      appStateSub.remove();
    };
  }, [artifact, artifactId]);

  const handleShare = async () => {
    if (!artifact) return;
    try {
      await Share.share({ message: `Check out ${artifact.name} on Sanskriti Snap! ${artifact.description}`, title: artifact.name });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const handleToggleSave = async () => {
    if (!artifact) return;
    if (isSaved) {
      await removeSavedPlace(artifact.id);
      setIsSaved(false);
      return;
    }
    await savePlace({
      id: artifact.id,
      name: artifact.name,
      location: artifact.humanReadableLocation,
      distance: artifact.distanceMeters == null ? '' : `${(artifact.distanceMeters / 1000).toFixed(1)} km away`,
      image: artifact.coverImageUrl ?? artifact.referenceImageUrls[0] ?? '',
      latitude: artifact.latitude,
      longitude: artifact.longitude,
    });
    setIsSaved(true);
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
      <ArtifactHeader
        onBack={() => router.back()}
        onShare={handleShare}
        isSaved={isSaved}
        onToggleSave={() => void handleToggleSave()}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadArtifactDetails} />}
      >
        <ArtifactHero images={artifact.reference_images} location={artifact.human_readable_location} />

        <View style={styles.mainContentContainer}>
          <ArtifactInfo artifact={artifact} distance={discoveryStatus.distanceToArtifact} isUnlocked={isUnlocked} />
          {isUnlocked ? (
            <CommunityBar
              artifactId={artifactId}
              onOpenGallery={() =>
                router.push(`/community/${encodeURIComponent(artifactId)}` as Href)
              }
            />
          ) : null}
          <ArtifactContent artifact={artifact} isUnlocked={isUnlocked} />
        </View>
      </ScrollView>

      <ArtifactBottomBar
        storyUnlocked={discoveryStatus.isStoryUnlocked}
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
