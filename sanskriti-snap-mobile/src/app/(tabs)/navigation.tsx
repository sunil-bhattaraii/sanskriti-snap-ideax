import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Href, useRouter, useLocalSearchParams } from 'expo-router';
import {
  Map,
  Camera,
  GeoJSONSource,
  Layer,
  type CameraRef,
  type MapRef,
} from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { apiRequest } from '@/services/api';
import { COLORS } from '@/constants/colors';
import ArtifactMarker from '@/components/explore/ArtifactMarker';
import MapControls from '@/components/explore/MapControls';
import UserLocationMarker from '@/components/explore/UserLocationMarker';
import { distanceBetweenCoordinates } from '@/utils/geo';
import Svg, { Circle } from 'react-native-svg';

type Coordinate = [number, number];

const getNearestRouteIndex = (
  coordinates: Coordinate[],
  location: Coordinate
) => {
  return coordinates.reduce((nearestIndex, coordinate, index) => {
    const nearest = coordinates[nearestIndex];
    const currentDistance =
      (coordinate[0] - location[0]) ** 2 + (coordinate[1] - location[1]) ** 2;
    const nearestDistance =
      (nearest[0] - location[0]) ** 2 + (nearest[1] - location[1]) ** 2;

    return currentDistance < nearestDistance ? index : nearestIndex;
  }, 0);
};

type RouteData = {
  geometry: {
    coordinates: Coordinate[];
    type: string;
  };
  distance: number;
  duration: number;
  legs: Array<{
    steps: Array<{
      maneuver: {
        bearing_after: number;
        location: Coordinate;
        modifier?: string;
        type: string;
      };
      name: string;
      distance: number;
      duration: number;
      instruction?: string;
    }>;
    distance: number;
    duration: number;
  }>;
};

export default function NavigationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const artifactId = params.artifactId as string;

  const cameraRef = useRef<CameraRef | null>(null);
  const mapRef = useRef<MapRef | null>(null);

  const [artifact, setArtifact] = useState<{
    id: string;
    name: string;
    lat: number;
    lng: number;
    verification_radius_m: number;
    story_unlock_radius_m: number;
  } | null>(null);

  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [distanceToArtifact, setDistanceToArtifact] = useState<number>(0);
  const [estimatedTime, setEstimatedTime] = useState<number>(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [routeLoading, setRouteLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [walkedRouteIndex, setWalkedRouteIndex] = useState(0);
  const lastUnlockCheckAt = useRef(0);
  const unlockRequestInFlight = useRef(false);

  useEffect(() => {
    loadArtifactAndStartNavigation();

    let subscription: Location.LocationSubscription | null = null;
    startLocationTracking().then((locationSubscription) => {
      subscription = locationSubscription;
    });

    return () => {
      if (subscription !== null) {
        subscription.remove();
      }
    };
  }, [artifactId]);

  useEffect(() => {
    if (userLocation && artifact) {
      fetchRoute(userLocation, [artifact.lng, artifact.lat]);
    }
  }, [artifact]);

  const checkStoryUnlock = async (location: Coordinate, distance: number) => {
    if (!artifact || distance > artifact.story_unlock_radius_m) return;
    if (unlockRequestInFlight.current || Date.now() - lastUnlockCheckAt.current < 10_000) return;

    lastUnlockCheckAt.current = Date.now();
    unlockRequestInFlight.current = true;
    try {
      const result = await apiRequest<{ unlocked: boolean; distanceMeters: number }>(
        `/artifacts/${encodeURIComponent(artifact.id)}/unlock-story`,
        {
          method: 'POST',
          body: JSON.stringify({
            location: {
              latitude: location[1],
              longitude: location[0],
              capturedAt: new Date().toISOString(),
            },
          }),
        },
      );
      if (result.unlocked) {
        console.info('Story unlocked while navigating', {
          artifactId: artifact.id,
          distanceMeters: result.distanceMeters,
        });
      }
    } finally {
      unlockRequestInFlight.current = false;
    }
  };

  useEffect(() => {
    if (routeData && userLocation) {
      const directDistance = artifact
        ? distanceBetweenCoordinates(
            { latitude: userLocation[1], longitude: userLocation[0] },
            { latitude: artifact.lat, longitude: artifact.lng },
          )
        : null;
      setDistanceToArtifact(routeData.distance / 1000);
      // 12 minutes per kilometer
      setEstimatedTime(Math.ceil((routeData.distance / 1000) * 12));

      const nearestRouteIndex = getNearestRouteIndex(
        routeData.geometry.coordinates,
        userLocation
      );
      const routePointCount = routeData.geometry.coordinates.length;
      setWalkedRouteIndex(nearestRouteIndex);
      setProgress(
        routePointCount > 1
          ? (nearestRouteIndex / (routePointCount - 1)) * 100
          : 0
      );

      // The route distance is intentionally used for navigation display and
      // progress. Arrival/verification uses the direct geodesic distance.
      if (
        directDistance !== null &&
        directDistance <= (artifact?.verification_radius_m || 50)
      ) {
        handleArrival();
      }
    }
  }, [routeData, userLocation, artifact]);

  useEffect(() => {
    if (!artifact || !userLocation) return;
    const directDistance = distanceBetweenCoordinates(
      { latitude: userLocation[1], longitude: userLocation[0] },
      { latitude: artifact.lat, longitude: artifact.lng },
    );

    if (directDistance <= artifact.verification_radius_m) handleArrival();
    void checkStoryUnlock(userLocation, directDistance).catch((error) => {
      console.warn('Unable to check story unlock while navigating:', error);
    });
  }, [userLocation, artifact]);

  const loadArtifactAndStartNavigation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission is required for navigation');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const currentCoords: Coordinate = [
        location.coords.longitude,
        location.coords.latitude,
      ];
      setUserLocation(currentCoords);

      const targetArtifact = await apiRequest<{
        id: string;
        name: string;
        latitude: number;
        longitude: number;
        verificationRadiusMeters: number;
        storyUnlockRadiusMeters: number;
      }>(`/artifacts/${encodeURIComponent(artifactId)}`);

      const coords: Coordinate = [
        Number(targetArtifact.longitude),
        Number(targetArtifact.latitude),
      ];
      if (!Number.isFinite(coords[0]) || !Number.isFinite(coords[1])) {
        throw new Error('Artifact has invalid map coordinates');
      }

      setArtifact({
        id: targetArtifact.id,
        name: targetArtifact.name,
        lat: coords[1],
        lng: coords[0],
        verification_radius_m: targetArtifact.verificationRadiusMeters,
        story_unlock_radius_m: targetArtifact.storyUnlockRadiusMeters,
      });

      setTimeout(() => {
        cameraRef.current?.flyTo({
          center: [coords[0], coords[1]],
          zoom: 14,
          duration: 1000,
        });
      }, 500);
    } catch (error) {
      console.error('Error loading artifact:', error);
      Alert.alert('Error', 'Failed to load artifact details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const startLocationTracking = () => {
    return Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 5,
        timeInterval: 2000,
      },
      (location) => {
        const coords: Coordinate = [
          location.coords.longitude,
          location.coords.latitude,
        ];
        setUserLocation(coords);
      }
    );
  };

  const fetchRoute = async (start: Coordinate, end: Coordinate) => {
    setRouteLoading(true);
    try {
      // OSRM walking route API
      const url = `https://router.project-osrm.org/route/v1/foot/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson&steps=true`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        setRouteData(route);

        // Fit map to show entire route
        if (route.geometry && route.geometry.coordinates.length > 0) {
          const bounds = calculateBounds(route.geometry.coordinates);
          cameraRef.current?.fitBounds(bounds, { duration: 1000 });
        }
      } else {
        console.error('OSRM Error:', data);
        Alert.alert('Routing Error', 'Could not calculate walking route');
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      Alert.alert('Error', 'Failed to fetch route. Please try again.');
    } finally {
      setRouteLoading(false);
    }
  };

  const calculateBounds = (coordinates: Coordinate[]) => {
    let minLng = Infinity,
      maxLng = -Infinity;
    let minLat = Infinity,
      maxLat = -Infinity;

    coordinates.forEach(([lng, lat]) => {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    });

    return [minLng, minLat, maxLng, maxLat] as [number, number, number, number];
  };

  const handleArrival = () => {
    if (hasArrived) return;
    setHasArrived(true);
    setIsNavigating(true);
    Alert.alert(
      "You've Arrived!",
      `You're now at ${artifact?.name}. You can now take a snap to collect this artifact!`,
      [
        {
          text: 'Take a Snap',
          onPress: () => router.push(`/snap/${artifactId}/confirm` as Href),
        },
        {
          text: 'Stay Here',
          style: 'cancel',
        },
      ]
    );
  };

  const handleRecenter = () => {
    if (userLocation && cameraRef.current) {
      cameraRef.current.flyTo({
        center: userLocation,
        zoom: 17,
        duration: 500,
      });
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDistance = (km: number) => {
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)}km`;
  };

  const getCurrentInstruction = () => {
    if (!routeData || !routeData.legs[0]) return 'Head towards destination';

    const steps = routeData.legs[0].steps;
    if (steps.length === 0) return 'You have arrived';

    // Find current step based on distance traveled
    let distanceTraveled = 0;
    for (let i = 0; i < steps.length; i++) {
      distanceTraveled += steps[i].distance;
      if (distanceTraveled > routeData.distance * 0.1) {
        return (
          steps[i].instruction ||
          `Continue on ${steps[i].name || 'along the way'}`
        );
      }
    }
    return steps[steps.length - 1].instruction || 'Continue to destination';
  };

  useEffect(() => {
    if (isNavigating && userLocation) {
      cameraRef.current?.easeTo({
        center: userLocation,
        duration: 500,
      });
    }
  }, [isNavigating, userLocation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Preparing navigation...</Text>
      </View>
    );
  }

  if (!artifact || !userLocation) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="location-outline" size={48} color={COLORS.tertiary} />
        <Text style={styles.loadingText}>Waiting for GPS signal...</Text>
      </View>
    );
  }

  const progressCoordinates = routeData
    ? routeData.geometry.coordinates.slice(0, walkedRouteIndex + 1)
    : [];

  return (
    <View style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {artifact.name}
        </Text>

        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="share-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <Map
          ref={mapRef}
          style={styles.map}
          mapStyle="https://tiles.openfreemap.org/styles/liberty"
        >
          <Camera ref={cameraRef} center={userLocation} zoom={15} />

          <UserLocationMarker coordinate={userLocation} />

          <ArtifactMarker
            id="destination"
            coordinate={[artifact.lng, artifact.lat]}
            category="landmark"
            isSelected
            onSelect={() => undefined}
          />

          {/* Route Line from OSRM */}
          {routeData && routeData.geometry.coordinates.length >= 2 && (
            <GeoJSONSource
              id="route-source"
              data={{
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: routeData.geometry.coordinates,
                },
              }}
            >
              <Layer
                id="route-line"
                type="line"
                source="route-source"
                paint={{
                  'line-color': COLORS.primary,
                  'line-width': 5,
                  'line-opacity': 0.8,
                }}
                layout={{
                  'line-cap': 'round',
                  'line-join': 'round',
                }}
              />
            </GeoJSONSource>
          )}

          {/* Route Progress (highlighted portion) */}
          {progressCoordinates.length >= 2 && (
            <GeoJSONSource
              id="route-progress"
              data={{
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: progressCoordinates,
                },
              }}
            >
              <Layer
                id="route-progress-line"
                type="line"
                source="route-progress"
                paint={{
                  'line-color': '#10B981',
                  'line-width': 5,
                  'line-opacity': 0.9,
                }}
              />
            </GeoJSONSource>
          )}
        </Map>

        {/* Current Instruction Overlay */}
        <View style={styles.instructionOverlay}>
          <Ionicons name="navigate" size={20} color={COLORS.primary} />
          <Text style={styles.instructionText} numberOfLines={2}>
            {getCurrentInstruction()}
          </Text>
        </View>

        <MapControls onRecenter={handleRecenter} bottom={280} />

        {/* Loading Indicator */}
        {routeLoading && (
          <View style={styles.routeLoading}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.routeLoadingText}>Calculating route...</Text>
          </View>
        )}
      </View>

      {/* Bottom Navigation Card */}
      <View style={styles.bottomCard}>
        <View style={styles.dragHandle} />

        <View style={styles.infoRow}>
          <View>
            <Text style={styles.timeText}>{formatTime(estimatedTime)}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>
                {formatDistance(distanceToArtifact)}
              </Text>
              <View style={styles.dot} />
              <Text style={[styles.metaText, styles.walkingText]}>
                <Ionicons name="walk" size={14} color={COLORS.primary} />{' '}
                Exploring...
              </Text>
            </View>
          </View>

          <View style={styles.progressCircle}>
            <Svg
              height={56}
              width={56}
              style={{ transform: [{ rotate: '-90deg' }] }}
            >
              <Circle
                cx={28}
                cy={28}
                r={26}
                fill="none"
                stroke="#E2E8F0"
                strokeWidth={3}
              />

              <Circle
                cx={28}
                cy={28}
                r={26}
                fill="none"
                stroke={COLORS.primary}
                strokeWidth={3}
                strokeDasharray={163}
                strokeDashoffset={163 - (163 * progress) / 100}
                strokeLinecap="round"
              />
            </Svg>
            <Ionicons
              name="arrow-up"
              size={20}
              color={COLORS.primary}
              style={styles.progressIcon}
            />
          </View>
        </View>

        {!isNavigating && (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setIsNavigating(true)}
            >
              <Ionicons name="play" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Start Exploring</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exitButton}
              onPress={() => router.back()}
            >
              <Ionicons name="close" size={24} color={COLORS.tertiary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.neutral,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.neutral,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.tertiary,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: COLORS.neutral,
    height: 100,
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  instructionOverlay: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  routeLoading: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -75 }, { translateY: -20 }],
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeLoadingText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(253, 249, 246, 0.95)',
    backdropFilter: 'blur(10px)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E2DF',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  timeText: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  metaText: {
    fontSize: 14,
    color: COLORS.tertiary,
    fontWeight: '500',
  },
  walkingText: {
    color: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
  },
  progressCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: 'rgba(142, 59, 34, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressIcon: {
    position: 'absolute',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  exitButton: {
    width: 56,
    height: 56,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});