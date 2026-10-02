import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import CollectionGrid from '../../components/collection/CollectionGrid';
import CollectionProgress from '../../components/collection/CollectionProgress';
import ScreenHeader from '../../components/ScreenHeader';
import { COLORS } from '../../constants/colors';
import { useAuthStore } from '@/store/authstore';
import { fetchCollection, type CollectionItem } from '@/services/progress';

const DISCOVER_TO_UNLOCK_CARDS: CollectionItem[] = [
  {
    id: 'discover-1',
    title: 'Discover to unlock',
    location: '',
    xp: 0,
    rarity: 'Common',
    isDiscovered: false,
  },
];

export default function CollectionScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    queueMicrotask(() => mounted && setLoading(true));
    fetchCollection(user?.id ?? null)
      .then((items) => {
        if (mounted) setCollection(items);
      })
      .catch((loadError: Error) => {
        if (mounted) setError(loadError.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const discoveredItems = collection.filter((item) => item.isDiscovered);
  const discoveredCount = discoveredItems.length;
  const totalXP = discoveredItems.reduce((sum, item) => sum + item.xp, 0);
  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenHeader title="My Collection" />
        <View style={styles.emptyContent}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.container}>
          <ScreenHeader title="My Collection" />
          <View style={styles.emptyContent}>
            <View style={styles.emptyCard}>
              <View style={styles.emptyImageContainer}>
                <Text style={styles.emptyImageText}>🏛️</Text>
              </View>
            </View>
            <Text style={styles.emptyTitle}>Unable to load collection</Text>
            <Text style={styles.emptySubtitle}>{error}</Text>
            <Button
              title="Start Exploring"
              onPress={() => router.push('/(tabs)/explore')}
              variant="primary"
              size="lg"
              fullWidth
              style={styles.exploreButton}
            />
          </View>
        </View>
      </>
    );
  }

  // --- POPULATED STATE ---
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <ScreenHeader title="My Collection" />

        <CollectionProgress
          totalDiscoveries={discoveredCount}
          lifetimeXP={totalXP}
        />

        <View style={styles.gridContainer}>
          <CollectionGrid
            items={[...collection, ...DISCOVER_TO_UNLOCK_CARDS]}
            onItemPress={(item) => {
              if (item.isDiscovered) {
                router.push(`/artifacts/${item.id}`);
              }
            }}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.neutral,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 40,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    width: '100%',
    maxWidth: 300,
  },
  emptyImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.neutral,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  emptyImageText: {
    fontSize: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 15,
    color: COLORS.tertiary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  exploreButton: {
    maxWidth: 300,
  },
  gridContainer: {
    flex: 1,
  },
});
