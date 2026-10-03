import { Stack, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenHeader from '../../components/ScreenHeader';
import BadgeGrid from '../../components/badges/BadgeGrid';
import BadgeProgress from '../../components/badges/BadgeProgress';
import { COLORS } from '../../constants/colors';
import { getBadges, type BadgesData } from '../../services/badges';
import { useAuthStore } from '../../store/authstore';

export default function BadgesScreen() {
  const user = useAuthStore((state) => state.user);
  const [badgesData, setBadgesData] = useState<BadgesData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadBadges = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setBadgesData(await getBadges(user?.id));
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Unable to load badges.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void loadBadges();
    }, [loadBadges])
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title="My Badges" />

      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.statusContainer}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : error ? (
          <View style={styles.statusContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => void loadBadges()} style={styles.retryButton}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : badgesData ? (
          badgesData.badges.length === 0 ? (
            <View style={styles.statusContainer}>
              <Text style={styles.emptyTitle}>No badges yet</Text>
              <Text style={styles.emptyText}>
                Discover artifacts and complete quests to earn badges.
              </Text>
            </View>
          ) : (
            <>
              <BadgeProgress data={badgesData} />
              <BadgeGrid badges={badgesData.badges} />
            </>
          )
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.neutral,
  },
  content: {
    flex: 1,
  },
  statusContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    color: COLORS.tertiary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: COLORS.tertiary,
    lineHeight: 20,
    maxWidth: 280,
    textAlign: 'center',
  },
});
