import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface ProfileMenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconBgColor: string;
  iconColor: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  isDestructive?: boolean;
  style?: ViewStyle;
}

export default function ProfileMenuItem({
  icon,
  iconBgColor,
  iconColor,
  label,
  subtitle,
  onPress,
  isDestructive = false,
  style,
}: ProfileMenuItemProps) {
  return (
    <TouchableOpacity 
      style={[styles.container, style]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Icon Container */}
      <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
        <Ionicons 
          name={icon} 
          size={20} 
          color={isDestructive ? '#DC2626' : iconColor} 
        />
      </View>

      {/* Text Content */}
      <View style={styles.textContent}>
        <Text style={[styles.label, isDestructive && styles.destructiveLabel]}>
          {label}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}
      </View>

      {/* Chevron */}
      <Ionicons 
        name="chevron-forward" 
        size={20} 
        color="#9CA3AF" 
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textContent: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  destructiveLabel: {
    color: '#DC2626',
  },
  subtitle: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '600',
    marginTop: 2,
  },
});