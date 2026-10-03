// src/components/DiscoveryItem.tsx
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DiscoveryItem as DiscoveryItemType } from '@/data/mockQuestDetails';

interface DiscoveryItemProps {
  item: DiscoveryItemType;
}

export const DiscoveryItem: React.FC<DiscoveryItemProps> = ({ item }) => {
  const isCompleted = item.status === 'completed';

  return (
    <View style={styles.container}>
      {/* Image / Placeholder */}
      {isCompleted && item.image ? (
        <Image
          source={{ uri: item.image }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.lockPlaceholder}>
          <Ionicons name="lock-closed" size={24} color="#9CA3AF" />
        </View>
      )}

      {/* Text Content */}
      <View style={styles.textContainer}>
        <Text style={styles.name}>{item.name}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color="#9CA3AF" />
          <Text style={styles.location}>{item.location}</Text>
        </View>
      </View>

      {/* Status */}
      {isCompleted ? (
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
        </View>
      ) : (
        <Text style={styles.unlockText}>Discover to Unlock</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 12,
  },
  lockPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  unlockText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9C4221',
    textAlign: 'right',
    marginLeft: 8,
  },
});