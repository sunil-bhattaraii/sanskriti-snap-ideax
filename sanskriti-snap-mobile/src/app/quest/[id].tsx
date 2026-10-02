import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, router } from "expo-router";
import QuestHero from "@/components/Quest/QuestHero";
import AppHeader from "@/components/AppHeader";
import QuestProgressCard from "@/components/Quest/QuestProgressCard";
import QuestArtifactItem from "@/components/Quest/QuestArtifactItem";
import { COLORS } from "@/constants/colors";
import { fetchQuestDetails, type QuestDetails } from "@/services/progress";
import { useAuthStore } from "@/store/authstore";

export default function QuestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const [quest, setQuest] = useState<QuestDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      setQuest(null);
      setError(null);
      if (!id) return undefined;
      fetchQuestDetails(id, user?.id ?? null)
        .then((details) => {
          if (mounted) setQuest(details);
        })
        .catch((loadError: Error) => {
          if (mounted) setError(loadError.message);
        });
      return () => {
        mounted = false;
      };
    }, [id, user?.id]),
  );

  const handleStartExploring = () => {
    // Navigate to map or first undiscovered artifact
    if (!quest) return;
    router.push("/(tabs)/explore"); // Go to map
  };

  const handleArtifactPress = (artifactId: string) => {
    router.push({ pathname: "/artifacts/[id]", params: { id: artifactId } });
  };

  if (!quest) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.state}>
          <Text style={styles.stateText}>{error ?? "Loading quest..."}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <AppHeader
        title="Quest Details"
        showBack
        overlay
        rightActions={
          <TouchableOpacity hitSlop={10}>
            <Ionicons name="share-outline" size={24} color={COLORS.white} />
          </TouchableOpacity>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 1. Hero Section */}
        <QuestHero
          name={quest.name}
          description={quest.description}
          category={quest.category}
          heroImageUrl={quest.heroImageUrl}
          onStartPress={handleStartExploring}
        />

        {/* 2. Progress Card */}
        <QuestProgressCard
          discoveredCount={quest.discoveredCount}
          totalArtifacts={quest.totalArtifacts}
          xpReward={quest.xpReward}
          badgeName={quest.badgeName}
        />

        {/* 3. Required Discoveries List */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Required Discoveries</Text>

          {quest.artifacts.map((artifact) => (
            <QuestArtifactItem key={artifact.id} artifact={artifact} onPress={() => handleArtifactPress(artifact.id)} />
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.neutral },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    zIndex: 20,
    backgroundColor: "transparent",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: COLORS.white },
  scrollContent: { paddingBottom: 40 },
  listSection: { marginTop: 30, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: COLORS.text, marginBottom: 16 },
  state: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  stateText: { color: COLORS.tertiary, textAlign: "center" },
});
