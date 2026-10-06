import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import ScreenHeader from '@/components/ScreenHeader';
import { fetchArtifactSnaps, type CommunitySnap } from '@/services/community';
import { COLORS } from '../../constants/colors';

const PAGE_LIMIT = 100;

export default function CommunityGalleryScreen() {
  const { id } = useLocalSearchParams();
  const artifactId = String(id ?? '');

  const [snaps, setSnaps] = useState<CommunitySnap[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!artifactId) return;
    try {
      const items = await fetchArtifactSnaps(artifactId, PAGE_LIMIT);
      setSnaps(items);
    } catch (error) {
      console.warn('Unable to load community gallery:', error);
    }
  }, [artifactId]);

  useEffect(() => {
    void (async () => {
      await load();
      setLoading(false);
    })();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Community Gallery" />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : snaps.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            No community snapshots yet. Be the first!
          </Text>
        </View>
      ) : (
        <FlatList
          data={snaps}
          keyExtractor={(snap) => snap.id}
          numColumns={3}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
          }
          renderItem={({ item }) => (
            <View style={styles.cell}>
              <Image source={{ uri: item.imageUrl }} style={styles.image} />
              {item.author ? (
                <Text numberOfLines={1} style={styles.author}>
                  @{item.author.username}
                </Text>
              ) : null}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.neutral },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 15, color: COLORS.tertiary, paddingHorizontal: 32, textAlign: 'center' },
  grid: { padding: 12 },
  row: { gap: 8, marginBottom: 12 },
  cell: { flex: 1 },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: COLORS.disabled,
  },
  author: { fontSize: 12, color: COLORS.tertiary, marginTop: 4, paddingHorizontal: 2 },
});