// src/components/CollectionCard.tsx
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CollectionItem, getRarityConfig } from '../data/mockCollection';

interface CollectionCardProps {
  item: CollectionItem;
  onPress?: () => void;
}

export const CollectionCard: React.FC<CollectionCardProps> = ({ item, onPress }) => {
  if (!item.discovered) {
    return (
      <View style={styles.emptyCard}>
        <View style={styles.lockContainer}>
          <Ionicons name="lock-closed" size={32} color="#9CA3AF" />
        </View>
        <Text style={styles.emptyText}>Discover to unlock</Text>
      </View>
    );
  }

  const rarityConfig = getRarityConfig(item.rarity);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <Image
        source={{ uri: item.image }}
        style={styles.cardImage}
        resizeMode="cover"
      />
      
      {/* Rarity Badge */}
      <View style={[styles.rarityBadge, { backgroundColor: rarityConfig.badgeColor }]}>
        <Ionicons 
          name={item.rarity === 'Legendary' ? 'stars' : item.rarity === 'Rare' ? 'auto-awesome' : 'water-drop'} 
          size={12} 
          color={rarityConfig.textColor} 
        />
        <Text style={[styles.rarityText, { color: rarityConfig.textColor }]}>
          {item.rarity}
        </Text>
      </View>

      {/* Card Content */}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.cardFooter}>
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={14} color="#6B7280" />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.location}
            </Text>
          </View>
          <Text style={styles.xpText}>+{item.xp} XP</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    height: 280,
  },
  cardImage: {
    width: '100%',
    height: 160,
  },
  rarityBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  rarityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardContent: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  locationText: {
    fontSize: 13,
    color: '#6B7280',
  },
  xpText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F59E0B',
  },
  emptyCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  lockContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
});