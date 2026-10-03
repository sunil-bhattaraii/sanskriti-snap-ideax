import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SavedPlace } from '../services/saved-places';
import CachedImage from './CachedImage';

interface SavedPlaceCardProps {
  item: SavedPlace;
  onNavigate?: () => void;
}

export const SavedPlaceCard: React.FC<SavedPlaceCardProps> = ({ item, onNavigate }) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <CachedImage
          remoteUri={item.image}
          style={styles.cardImage}
          resizeMode="cover"
        />
        
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
            <Ionicons name="bookmark" size={20} color="#9C4221" />
          </View>
          
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
          </View>
          
          <Text style={styles.distanceText}>{item.distance}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.navigateButton} onPress={onNavigate} activeOpacity={0.9}>
        <Text style={styles.navigateButtonText}>NAVIGATE</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  cardImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  distanceText: {
    fontSize: 14,
    color: '#6B7280',
  },
  navigateButton: {
    backgroundColor: '#9C4221',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});