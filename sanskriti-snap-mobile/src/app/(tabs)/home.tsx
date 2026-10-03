import React from "react";
import { ActivityIndicator, View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Location from "expo-location";
import AppHeader from "@/components/AppHeader";
import FeaturedDiscoveryCard from "@/components/FeaturedDiscoveryCard";
import { COLORS } from "@/constants/colors";
import { backendClient } from "@/services/backendClient";
import { useAuthStore } from "@/store/authstore";

type FeaturedArtifact = { id: string; name: string; description: string; xp: number; imageUrl: string; discoveryCount: number };

export default function HomeScreen() {
  const [featuredArtifacts, setFeaturedArtifacts] = React.useState<FeaturedArtifact[]>([]);
  const [featuredLoading, setFeaturedLoading] = React.useState(true);
  const { user, profile } = useAuthStore();
  const displayName = profile?.displayName ?? user?.fullName ?? user?.email?.split("@")[0];
  const firstName = displayName?.trim().split(/\s+/)[0] || "Explorer";

  React.useEffect(() => {
    let mounted = true;

    const loadFeaturedArtifacts = async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        let artifacts: FeaturedArtifact[] = [];

        if (permission.status === "granted") {
          const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const { data, error } = await backendClient.rpc("nearby_artifacts", {
            p_lat: location.coords.latitude,
            p_lng: location.coords.longitude,
            p_radius_m: 5000,
          });

          if (error) throw error;
          artifacts = (data ?? []).map((artifact) => ({
            id: artifact.id,
            name: artifact.name,
            description: artifact.description,
            xp: artifact.xp_value,
            imageUrl: artifact.referenceImageUrls?.[0] ?? artifact.coverImageUrl ?? "",
            discoveryCount: artifact.discoveryCount ?? 0,
          }));
        } else {
          const { data, error } = await backendClient
            .from("artifacts")
            .select("id, name, description, xp_value, reference_images, discovery_count")
            .eq("status", "active")
            .order("discovery_count", { ascending: false })
            .limit(3);

          if (error) throw error;
          artifacts = (data ?? []).map((artifact) => ({
            id: artifact.id,
            name: artifact.name,
            description: artifact.description,
            xp: artifact.xp_value,
            imageUrl: artifact.referenceImageUrls?.[0] ?? artifact.coverImageUrl ?? "",
            discoveryCount: artifact.discoveryCount ?? 0,
          }));
        }

        artifacts.sort((first, second) => second.discoveryCount - first.discoveryCount);
        if (mounted) setFeaturedArtifacts(artifacts.slice(0, 3));
      } catch (error) {
        console.error("Unable to load popular discoveries:", error);
      } finally {
        if (mounted) setFeaturedLoading(false);
      }
    };

    void loadFeaturedArtifacts();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSearchPress = () => {
    router.push({ pathname: "/(tabs)/explore", params: { focus: `home-${Date.now()}` } });
  };

  const handleShowPlacesAroundMe = () => {
    router.push("/(tabs)/explore");
  };

  const handleFeaturedPress = (artifactId: string) => {
    router.push(`/artifacts/${artifactId}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.neutral} />

      <AppHeader logo />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Greeting Section */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingTitle}>Namaste, {firstName}</Text>
          <Text style={styles.greetingSubtitle}>Discover the soul of Nepal</Text>
        </View>

        {/* Search & Action Area */}
        <View style={styles.searchContainer}>
          {/* Search Bar - Clickable Only */}
          <TouchableOpacity style={styles.searchBar} onPress={handleSearchPress} activeOpacity={0.7}>
            <Ionicons name="search" size={20} color={COLORS.tertiary} />
            <Text style={styles.searchPlaceholder}>Where is your next destination?</Text>
            <Ionicons name="options-outline" size={20} color={COLORS.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryButton} onPress={handleShowPlacesAroundMe} activeOpacity={0.9}>
            <Ionicons name="location" size={20} color={COLORS.white} />
            <Text style={styles.primaryButtonText}>Show places around me</Text>
          </TouchableOpacity>
        </View>

        {/* Featured Discovery */}
        <View style={styles.featuredSection}>
          <Text style={styles.sectionTitle}>Top discoveries nearby</Text>

          {featuredLoading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : featuredArtifacts.length === 0 ? (
            <Text style={styles.emptyFeaturedText}>No discoveries available yet.</Text>
          ) : (
            featuredArtifacts.map((artifact) => (
              <View key={artifact.id} style={styles.featuredCardWrapper}>
                <FeaturedDiscoveryCard
                  title={artifact.name}
                  description={artifact.description}
                  xp={artifact.xp}
                  imageUrl={artifact.imageUrl}
                  onPress={() => handleFeaturedPress(artifact.id)}
                />
              </View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.neutral },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  // Greeting
  greetingContainer: { marginTop: 16, marginBottom: 24 },
  greetingTitle: { fontSize: 26, fontWeight: "700", color: COLORS.primary, marginBottom: 4, letterSpacing: -0.5 },
  greetingSubtitle: { fontSize: 16, color: COLORS.tertiary, opacity: 0.6 },
  // Search Container
  searchContainer: { gap: 12, marginTop: 16 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  searchPlaceholder: { flex: 1, fontSize: 16, color: COLORS.tertiary },
  // Primary Button
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 56,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: { color: COLORS.white, fontSize: 14, fontWeight: "600", letterSpacing: 0.5 },
  // Featured Section
  featuredSection: { marginTop: 24, gap: 8 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.tertiary,
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: 4,
  },
  featuredCardWrapper: { marginBottom: 12 },
  emptyFeaturedText: { color: COLORS.tertiary, paddingVertical: 20, textAlign: "center" },
});
