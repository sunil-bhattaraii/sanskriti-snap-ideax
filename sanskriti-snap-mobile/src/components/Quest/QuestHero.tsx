import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';

export interface QuestHeroProps {
  name: string;
  description: string;
  category: string;
  heroImageUrl: string;
  onStartPress: () => void;
}

export default function QuestHero({ name, description, category, heroImageUrl, onStartPress }: QuestHeroProps) {
  return (
    <View style={styles.container}>
      {/* Hero Image */}
      <Image source={{ uri: heroImageUrl }} style={styles.heroImage} />

      {/* Dark Overlay for text readability */}
      <View style={styles.overlay} />

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.categoryTag}>
          <Ionicons name="compass" size={14} color={COLORS.text} />
          <Text style={styles.categoryText}>{category}</Text>
        </View>

        <Text style={styles.title}>{name}</Text>
        <Text style={styles.description} numberOfLines={3}>{description}</Text>

        <TouchableOpacity
          style={styles.startButton}
          onPress={onStartPress}
          accessibilityRole="button"
          accessibilityLabel={`Start exploring ${name} quest`}
        >
          <Ionicons name="play" size={20} color={COLORS.white} />
          <Text style={styles.startButtonText}>Start Exploring</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    height: 380,
    width: width,
    position: 'relative',
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)', // Slightly darker for better text contrast
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 30,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
    gap: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 8,
    // Text shadow for readability over image
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  description: {
    fontSize: 15,
    color: COLORS.white,
    lineHeight: 22,
    marginBottom: 20,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  startButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});