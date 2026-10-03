import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import LeaderboardPodium from '@/components/Leaderboard/LeaderboardPodium';
import LeaderboardListItem from '@/components/Leaderboard/LeaderboardListItem';
import AppHeader from '@/components/AppHeader';
import { COLORS } from '@/constants/colors';
import { useAuthStore } from '@/store/authstore';
import type { LeaderboardUser } from '@/types/leaderboard';
import {
  readLeaderboardCache,
  warmLeaderboardCache,
} from '@/services/leaderboard-data';

export default function LeaderboardScreen() {
  const user = useAuthStore((state) => state.user);
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCurrentUserVisible, setIsCurrentUserVisible] = useState(false);

  const loadLeaderboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      if (!isRefresh) {
        const cached = await readLeaderboardCache();
        if (cached) {
          setUsers(cached);
          setLoading(false);
          return;
        }
      }

      const users = await warmLeaderboardCache();
      setUsers(users);
    } catch (queryError) {
      setError(queryError instanceof Error ? queryError.message : 'Unable to load leaderboard');
      setUsers([]);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadLeaderboard());
  }, [loadLeaderboard]);

  const currentUser = users.find((entry) => entry.id === user?.id);
  const podiumUsers = users.slice(0, 3);
  const listUsers = users.slice(3).map((entry) => ({
    ...entry,
    isCurrentUser: entry.id === user?.id,
  }));
  const pinnedCurrentUser = useMemo(
    () => (currentUser && currentUser.rank > 3
      ? { ...currentUser, isCurrentUser: true }
      : null),
    [currentUser]
  );

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (pinnedCurrentUser) {
      const isVisible = viewableItems.some(item => item.item?.id === pinnedCurrentUser.id);
      setIsCurrentUserVisible(isVisible);
    }
  }, [pinnedCurrentUser]);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const handleUserPress = (_user: LeaderboardUser) => { };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.neutral} />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.stateText}>Loading leaderboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.neutral} />

      <AppHeader title="Leaderboard" showBack />

      <FlatList
        data={listUsers}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <LeaderboardPodium users={podiumUsers} />
        }
        renderItem={({ item }) => (
          <LeaderboardListItem
            user={item}
            onPress={handleUserPress}
          />
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        refreshing={refreshing}
        onRefresh={() => void loadLeaderboard(true)}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: pinnedCurrentUser && !isCurrentUserVisible ? 100 : 40 }
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.centerState}>
            <Text style={styles.stateText}>
              {error ?? 'No leaderboard entries yet.'}
            </Text>
          </View>
        }
      />

      {pinnedCurrentUser && !isCurrentUserVisible && (
        <View style={styles.floatingBarContainer}>
          <LeaderboardListItem
            user={pinnedCurrentUser}
            isPinned
            onPress={handleUserPress}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.neutral,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.neutral,
  },
  headerButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.disabled,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.tertiary,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  listContent: {
    paddingBottom: 20,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  stateText: {
    marginTop: 12,
    color: COLORS.tertiary,
    textAlign: 'center',
  },
  floatingBarContainer: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    minHeight: 72,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
});
