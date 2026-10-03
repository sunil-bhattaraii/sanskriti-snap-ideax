import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

interface MapControlsProps {
  onRecenter: () => void;
  bottom?: number;
}

export default function MapControls({
  onRecenter,
  bottom = 140,
}: MapControlsProps) {
  return (
    <View style={[styles.container, { bottom }]}>
      <TouchableOpacity style={styles.button} onPress={onRecenter}>
        <Ionicons name="locate-outline" size={24} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    bottom: 60,
    zIndex: 1,
    gap: 12,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(136, 114, 108, 0.2)',
  },
});
