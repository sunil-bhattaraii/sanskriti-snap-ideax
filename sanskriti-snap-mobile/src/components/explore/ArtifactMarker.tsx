import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ViewAnnotation } from '@maplibre/maplibre-react-native';
import { getCategoryIcon } from '../../constants/MapIcons';

type Coordinate = [number, number];

interface ArtifactMarkerProps {
  id: string;
  coordinate: Coordinate;
  category: string;
  isSelected: boolean;
  onSelect: () => void;
}

export default function ArtifactMarker({
  id,
  coordinate,
  category,
  isSelected,
  onSelect,
}: ArtifactMarkerProps) {
  return (
    // ✅ FIX 1: Append isSelected to the key.
    // This forces React to completely destroy and recreate the marker
    // when selection changes, bypassing MapLibre's caching bug.
    <ViewAnnotation
      key={`${id}-${isSelected}`}
      id={id}
      lngLat={coordinate}
      onSelect={onSelect}
    >
      {isSelected ? (
        // Keep the selected marker category-specific while making it prominent.
        <View style={styles.selectedContainer}>
          <View style={styles.selectedIconWrapper}>
            <Ionicons
              name={getCategoryIcon(category)}
              size={28}
              color="#FFFFFF"
            />
          </View>
          <View style={styles.selectedPointer} />
        </View>
      ) : (
        // ✅ DEFAULT STATE: Category icon with pointer
        <View style={styles.container}>
          <View style={styles.iconWrapper}>
            <Ionicons
              name={getCategoryIcon(category)}
              size={16}
              color="#FFFFFF"
            />
          </View>
          <View style={styles.pointer} />
        </View>
      )}
    </ViewAnnotation>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8E3B22',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#8E3B22',
    marginTop: -2,
  },
  selectedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  selectedIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#8E3B22',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  selectedPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 11,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#8E3B22',
    marginTop: -2,
  },
});
