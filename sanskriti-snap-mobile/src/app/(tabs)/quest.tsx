import QuestCard from "@/components/Quest/QuestCard";
import AppHeader from "@/components/AppHeader";
import { readQuestCache, refreshQuestCache, type QuestListItem } from "@/services/progress";
import { useAuthStore } from "@/store/authstore";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FilterType = "all" | "in_progress" | "completed";

export default function QuestsScreen() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const user = useAuthStore((state) => state.user);
  const [quests, setQuests] = useState<QuestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      const userId = user?.id ?? null;
      const load = async () => {
        try {
          setLoading(true);
          const cached = await readQuestCache(userId);
          if (cached && mounted) {
            setQuests(cached);
            setLoading(false);
          }
          const items = await refreshQuestCache(userId);
          if (mounted) setQuests(items);
        } catch (loadError) {
          if (mounted) setError(loadError instanceof Error ? loadError.message : "Unable to load quests");
        } finally {
          if (mounted) setLoading(false);
        }
      };
      void load();
      return () => {
        mounted = false;
      };
    }, [user?.id]),
  );

  const filteredQuests = quests.filter((quest) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "in_progress") {
      return quest.current_progress > 0 && quest.current_progress < quest.total_progress;
    }
    if (activeFilter === "completed") {
      return quest.completed || (quest.total_progress > 0 && quest.current_progress >= quest.total_progress);
    }
    return true;
  });

  const renderFilterChip = (label: string, type: FilterType) => {
    const isActive = activeFilter === type;
    return (
      <TouchableOpacity key={type} style={[styles.chip, isActive && styles.chipActive]} onPress={() => setActiveFilter(type)}>
        <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const handleQuestPress = (item: QuestListItem) => {
    router.push({ pathname: "/quest/[id]", params: { id: item.id } });
  };

  const renderItem = ({ item }: { item: QuestListItem }) => (
    <QuestCard
      id={item.id}
      title={item.name}
      description={item.description}
      currentProgress={item.current_progress}
      totalProgress={item.total_progress}
      xpReward={item.xp_reward}
      hasBadgeReward={item.has_badge_reward}
      isFavorite={item.is_favorite}
      onPress={() => handleQuestPress(item)}
      style={styles.cardMargin}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      <AppHeader title="Quests" showBack />

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        {renderFilterChip("All Quests", "all")}
        {renderFilterChip("In Progress", "in_progress")}
        {renderFilterChip("Completed", "completed")}
      </View>

      {/* Quest List */}
      {loading ? (
        <View style={styles.state}>
          <ActivityIndicator size="large" color="#5C3D2E" />
        </View>
      ) : (
        <FlatList
          data={filteredQuests}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.emptyText}>{error ?? "No quests available yet."}</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#F9FAFB",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#1F2937" },
  filterContainer: { flexDirection: "row", paddingHorizontal: 20, paddingBottom: 16, gap: 12 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E7EB" },
  chipActive: { backgroundColor: "#5C3D2E", borderColor: "#5C3D2E" },
  chipText: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  chipTextActive: { color: "#FFFFFF" },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  cardMargin: { marginBottom: 16 },
  state: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { textAlign: "center", color: "#6B7280", padding: 32 },
});
