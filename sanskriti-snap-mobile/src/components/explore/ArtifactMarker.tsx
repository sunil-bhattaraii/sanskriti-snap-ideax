import React, { useState } from 'react';
import { Image, View, StyleSheet } from 'react-native';
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
  const categoryIcon = getCategoryIcon(category);
  const [iconLoaded, setIconLoaded] = useState(false);

  return (
    // ✅ FIX 1: Append isSelected to the key.
    // This forces React to completely destroy and recreate the marker
    // when selection changes, bypassing MapLibre's caching bug.
    <ViewAnnotation
      key={`${id}-${isSelected}-${iconLoaded}`}
      id={id}
      lngLat={coordinate}
      onSelect={onSelect}
    >
      {isSelected ? (
        // Keep the selected marker category-specific while making it prominent.
        <View collapsable={false} style={styles.selectedContainer}>
          <View collapsable={false} style={styles.selectedIconWrapper}>
            <Image
              source={categoryIcon}
              style={styles.selectedIcon}
              resizeMode="contain"
              fadeDuration={0}
              onLoad={() => setIconLoaded(true)}
            />
          </View>
          <View style={styles.selectedPointer} />
        </View>
      ) : (
        // ✅ DEFAULT STATE: Category icon with pointer
        <View collapsable={false} style={styles.container}>
          <View collapsable={false} style={styles.iconWrapper}>
            <Image
              source={categoryIcon}
              style={styles.icon}
              resizeMode="contain"
              fadeDuration={0}
              onLoad={() => setIconLoaded(true)}
            />
          </View>
          <View style={styles.pointer} />
        </View>
      )}
    </ViewAnnotation>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 36,
    height: 44,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8E3B22',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  icon: {
    width: 20,
    height: 20,
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
    width: 56,
    height: 68,
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
  selectedIcon: {
    width: 34,
    height: 34,
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
