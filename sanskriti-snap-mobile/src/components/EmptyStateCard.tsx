// src/components/EmptyStateCard.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EmptyStateData } from '../data/mockEmptyCollection';

interface EmptyStateCardProps {
  data: EmptyStateData;
  onAddPress?: () => void;
}

export const EmptyStateCard: React.FC<EmptyStateCardProps> = ({ data, onAddPress }) => {
  return (
    <View style={styles.card}>
      <Image
        source={{ uri: data.artifactImage }}
        style={styles.cardImage}
        resizeMode="contain"
      />
      <Text style={styles.cardTitle}>{data.cardTitle}</Text>
      <Text style={styles.cardSubtitle}>{data.cardSubtitle}</Text>
      
      <TouchableOpacity style={styles.cardButton} onPress={onAddPress} activeOpacity={0.8}>
        <Ionicons name="add-circle" size={14} color="#FFFFFF" style={styles.cardButtonIcon} />
        <Text style={styles.cardButtonText}>{data.cardButtonText}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 32,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  cardImage: {
    width: 140,
    height: 140,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9C4221',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cardButtonIcon: {
    marginRight: 4,
  },
  cardButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});