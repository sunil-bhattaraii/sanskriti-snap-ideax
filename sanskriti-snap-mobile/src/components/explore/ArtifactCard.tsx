import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { getCategoryIcon } from '../../constants/MapIcons'; 
import { formatDistance } from '../../utils/location';
import type { ExploreArtifact } from '../../types/artifact';

interface ArtifactCardProps {
  artifact: ExploreArtifact;
  onPress?: () => void; // ✅ Made optional since navigation is now handled internally
  isSelected?: boolean;
}

export default function ArtifactCard({
  artifact,
  onPress,
  isSelected = false,
}: ArtifactCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/artifacts/${artifact.id}`);

    if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.selectedCard]}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        {artifact.reference_images?.length > 0 ? (
          <Image
            source={{ uri: artifact.reference_images[0] }}
            style={styles.image}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image-outline" size={32} color="#9CA3AF" />
          </View>
        )}
        <View style={styles.xpBadge}>
          <Ionicons name="flash" size={10} color="#D4AF37" />
          <Text style={styles.xpText}>{artifact.xp_value} XP</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.categoryTag}>
            <Ionicons
              name={getCategoryIcon(artifact.category)}
              size={12}
              color={COLORS.primary}
            />
            <Text style={styles.categoryText}>
              {artifact.category.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.distanceText}>
            <Ionicons name="walk-outline" size={12} color="#6B7280" />{' '}
            {formatDistance(artifact.distance)}
          </Text>
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {artifact.name}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {artifact.description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 280,
    marginRight: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(136, 114, 108, 0.2)',
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#8E3B22',
    shadowOpacity: 0.15,
    elevation: 5,
  },
  imageContainer: { height: 140, position: 'relative' },
  image: { width: '100%', height: '100%' },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  xpBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  xpText: { fontSize: 10, fontWeight: '700', color: '#D4AF37' },
  content: { padding: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8E3B22',
    letterSpacing: 0.5,
  },
  distanceText: {
    fontSize: 12,
    color: '#6B7280',
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1b1a',
    marginBottom: 4,
  },
  description: { fontSize: 14, color: '#4A5568', lineHeight: 20 },
});
