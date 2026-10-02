import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../data/mockBadges';

interface BadgeCardProps {
  badge: Badge;
}

export const BadgeCard: React.FC<BadgeCardProps> = ({ badge }) => {
  return (
    <View style={[styles.card, !badge.isUnlocked && styles.lockedCard]}>
      {badge.isUnlocked && badge.isNew && <View style={styles.newDot} />}

      <View style={styles.imageContainer}>
        <Image
          source={{ uri: badge.image }}
          style={[styles.badgeImage, !badge.isUnlocked && styles.lockedImage]}
          resizeMode="cover" // ✅ MUST BE A PROP, NOT IN STYLE
        />
        {!badge.isUnlocked && (
          <View style={styles.lockOverlay}>
            <Ionicons name="lock-closed" size={28} color="#9CA3AF" />
          </View>
        )}
      </View>

      {!badge.isUnlocked && (
        <View style={styles.lockedPill}>
          <Text style={styles.lockedPillText}>LOCKED</Text>
        </View>
      )}

      <Text style={[styles.title, !badge.isUnlocked && styles.lockedText]}>
        {badge.title}
      </Text>
      {badge.isUnlocked && (
        <Text style={styles.description} numberOfLines={2}>
          {badge.description}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '48%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, alignItems: 'center',
    marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6',
  },
  lockedCard: {
    backgroundColor: '#F9FAFB', borderWidth: 2, borderColor: '#E5E7EB',
    borderStyle: 'dashed', shadowOpacity: 0, elevation: 0,
  },
  newDot: { position: 'absolute', top: 12, right: 12, width: 10, height: 10, borderRadius: 5, backgroundColor: '#3B82F6' },
  imageContainer: { width: 100, height: 100, borderRadius: 50, marginBottom: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' },
  badgeImage: { width: '100%', height: '100%' },
  lockedImage: { opacity: 0.4 },
  lockOverlay: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  lockedPill: { backgroundColor: '#E5E7EB', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
  lockedPillText: { fontSize: 10, fontWeight: '700', color: '#6B7280', letterSpacing: 0.5 },
  title: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', textAlign: 'center', marginBottom: 4 },
  lockedText: { color: '#9CA3AF' },
  description: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 18 },
});