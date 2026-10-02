// src/components/QuestHeroCard.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { QuestDetailsData } from '@/data/mockQuestDetails';

interface QuestHeroCardProps {
  data: QuestDetailsData;
  onStartExploring?: () => void;
}

export const QuestHeroCard: React.FC<QuestHeroCardProps> = ({ data, onStartExploring }) => {
  return (
    <View style={styles.card}>
      <Image
        source={{ uri: data.heroImage }}
        style={styles.heroImage}
        resizeMode="cover"
      />
      
      {/* Category Pill */}
      <View style={styles.categoryPill}>
        <Ionicons name="compass-outline" size={14} color="#9C4221" />
        <Text style={styles.categoryText}>{data.category}</Text>
      </View>

      {/* Content Overlay */}
      <View style={styles.contentOverlay}>
        <Text style={styles.title}>{data.title}</Text>
        <Text style={styles.description} numberOfLines={3}>{data.description}</Text>
        
        <TouchableOpacity style={styles.ctaButton} onPress={onStartExploring} activeOpacity={0.9}>
          <Ionicons name="play" size={20} color="#FFFFFF" />
          <Text style={styles.ctaButtonText}>Start Exploring</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    height: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  categoryPill: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9C4221',
  },
  contentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    // Subtle gradient effect using background color for readability
    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: 100, // Push content down to overlap image nicely
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 20,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9C4221',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});