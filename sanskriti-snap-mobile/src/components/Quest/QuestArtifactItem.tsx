import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS } from '@/constants/colors';
import { QuestArtifact } from '@/constants/Mock';

interface QuestArtifactItemProps {
  artifact: QuestArtifact;
  onPress: () => void;
}

export default function QuestArtifactItem({ artifact }: QuestArtifactItemProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push(`/artifacts/${artifact.id}`)}
      activeOpacity={0.7}
    >
      {/* Thumbnail */}
      <View style={styles.imageContainer}>
        {artifact.isDiscovered && artifact.imageUrl ? (
          <Image source={{ uri: artifact.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.lockedPlaceholder}>
            <Ionicons name="lock-closed" size={24} color={COLORS.tertiary} />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={1}>{artifact.name}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={COLORS.tertiary} />
          <Text style={styles.location} numberOfLines={1}>{artifact.location}</Text>
        </View>
      </View>

      {/* Status */}
      <View style={styles.statusContainer}>
        {artifact.isDiscovered ? (
          <View style={styles.checkmarkCircle}>
            <Ionicons name="checkmark" size={16} color={COLORS.white} />
          </View>
        ) : (
          <Text style={styles.unlockText}>Discover to{'\n'}Unlock</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  lockedPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 12,
    color: COLORS.tertiary,
  },
  statusContainer: {
    alignItems: 'flex-end',
    minWidth: 90,
  },
  checkmarkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'right',
    lineHeight: 14,
  },
});