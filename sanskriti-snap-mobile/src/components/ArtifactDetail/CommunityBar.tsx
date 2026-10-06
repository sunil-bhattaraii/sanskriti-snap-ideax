import React, { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchArtifactSnaps, type CommunitySnap } from '@/services/community';
import { COLORS } from '../../constants/colors';

const THUMBNAIL_COUNT = 6;

type CommunityBarProps = {
  artifactId: string;
  onOpenGallery: () => void;
};

export default function CommunityBar({
  artifactId,
  onOpenGallery,
}: CommunityBarProps) {
  const [snaps, setSnaps] = useState<CommunitySnap[]>([]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const items = await fetchArtifactSnaps(artifactId, THUMBNAIL_COUNT);
        if (mounted) setSnaps(items);
      } catch (error) {
        console.warn('Unable to load community snapshots:', error);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [artifactId]);

  if (snaps.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Community snapshots</Text>
        <TouchableOpacity
          onPress={onOpenGallery}
          style={styles.viewAllButton}
          accessibilityRole="button"
        >
          <Text style={styles.viewAllText}>View all</Text>
          <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.thumbnailRow}
      >
        {snaps.map((snap) => (
          <Pressable
            key={snap.id}
            onPress={onOpenGallery}
            accessibilityRole="imagebutton"
          >
            <Image
              source={{ uri: snap.imageUrl }}
              style={styles.thumbnail}
              testID="community-thumbnail"
            />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    marginRight: 2,
  },
  thumbnailRow: {
    gap: 8,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: COLORS.disabled,
  },
});