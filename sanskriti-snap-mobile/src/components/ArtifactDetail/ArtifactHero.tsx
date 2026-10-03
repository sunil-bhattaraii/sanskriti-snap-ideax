import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import CachedImage from '@/components/CachedImage';

interface ArtifactHeroProps {
  images: string[];
  location: string;
}

export default function ArtifactHero({ images, location }: ArtifactHeroProps) {
  return (
    <View style={styles.heroContainer}>
      {images?.length > 0 ? (
        <CachedImage
          remoteUri={images[0]}
          style={styles.heroImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.heroImage, styles.heroPlaceholder]}>
          <Ionicons name="image-outline" size={64} color={COLORS.tertiary} />
        </View>
      )}
      <View style={styles.gradientOverlay} />
      <View style={styles.locationBadge}>
        <Ionicons name="location" size={16} color={COLORS.primary} />
        <Text style={styles.locationBadgeText}>{location}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroContainer: { width: '100%', height: 300, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholder: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  locationBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(253, 249, 246, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.tertiary,
  },
});
