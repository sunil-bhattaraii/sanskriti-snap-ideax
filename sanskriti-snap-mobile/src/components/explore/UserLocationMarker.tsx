import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ViewAnnotation } from '@maplibre/maplibre-react-native';

type Coordinate = [number, number];

interface UserLocationMarkerProps {
  coordinate: Coordinate;
}

export default function UserLocationMarker({
  coordinate,
}: UserLocationMarkerProps) {
  return (
    <ViewAnnotation
      key={`user-location-${coordinate[0]}-${coordinate[1]}`}
      id={`user-location-${coordinate[0]}-${coordinate[1]}`}
      lngLat={coordinate}
    >
      <View style={styles.pulse}>
        <View style={styles.dot} />
      </View>
    </ViewAnnotation>
  );
}



const styles = StyleSheet.create({
  pulse: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(142, 59, 34, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#8E3B22',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
