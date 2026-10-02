import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProfileMenuItemProps {
  icon: string;
  iconColor: string;
  iconBackgroundColor: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
}

export const ProfileMenuItem: React.FC<ProfileMenuItemProps> = ({
  icon,
  iconColor,
  iconBackgroundColor,
  title,
  subtitle,
  onPress,
}) => {
  const getIconName = (iconName: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      military_tech: 'trophy',
      leaderboard: 'stats-chart',
      library_books: 'library',
      bookmark: 'bookmark-outline',
      redeem: 'gift',
      explore: 'compass-outline',
      map: 'map-outline',
      person: 'person',
    };
    return iconMap[iconName] || 'circle-outline';
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: iconBackgroundColor }]}>
        <Ionicons 
          name={getIconName(icon)} 
          size={24} 
          color={iconColor} 
        />
      </View>
      <View style={styles.textContainer}>
        {/* ✅ FIX: Apply conditional style via array instead of accessing prop in StyleSheet */}
        <Text style={[styles.title, subtitle && styles.titleWithSubtitle]}>
          {title}
        </Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  titleWithSubtitle: {
    marginBottom: 2, // Applied only when subtitle exists
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
  },
});