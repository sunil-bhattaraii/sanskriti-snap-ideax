import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface StatItemProps {
  value: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  style?: ViewStyle;
}

export default function StatItem({
  value,
  label,
  icon,
  iconColor,
  style,
}: StatItemProps) {
  return (
    <View style={[styles.container, style]}>
      <Ionicons 
        name={icon} 
        size={18} 
        color={iconColor} 
        style={styles.icon} 
      />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  icon: {
    marginBottom: 6,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
});