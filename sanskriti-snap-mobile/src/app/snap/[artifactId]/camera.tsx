import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../../constants/colors';
import { persistCapturedPhoto } from '@/services/local-photos';
import { resizeForUpload } from '@/utils/resize-image';

const { width, height } = Dimensions.get('window');

export default function SnapCameraScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const artifactId = params.artifactId as string;

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [locationName, setLocationName] = useState('Locating...');
  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number | null;
  } | null>(null);
  const [locationReady, setLocationReady] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const [scanLineAnim] = useState(() => new Animated.Value(0));
  const [shutterAnim] = useState(() => new Animated.Value(0));



  const fetchLocationName = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      // Use the cached GPS fix immediately while a more accurate fix loads.
      const lastKnown = await Location.getLastKnownPositionAsync({
        maxAge: 30 * 60 * 1000,
        requiredAccuracy: 500,
      });
      const location =
        lastKnown ??
        (await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        }));
      const lat = location.coords.latitude;
      const lng = location.coords.longitude;

      setCoordinates({
        latitude: lat,
        longitude: lng,
        accuracy: location.coords.accuracy,
      });
      setLocationReady(true);

      // Refresh the cached fix without blocking the camera shutter.
      if (lastKnown) {
        void Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        })
          .then((freshLocation) => {
            setCoordinates({
              latitude: freshLocation.coords.latitude,
              longitude: freshLocation.coords.longitude,
              accuracy: freshLocation.coords.accuracy,
            });
          })
          .catch((error) => {
            console.warn('Unable to refresh GPS fix:', error);
          });
      }

      // Reverse geocode to get a nice name
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { 'User-Agent': 'SanskritiSnapApp/1.0' } }
      );
      if (!response.ok) return;

      const responseText = await response.text();
      let data: { address?: Record<string, string> };
      try {
        data = JSON.parse(responseText);
      } catch {
        console.warn('Reverse geocoder returned a non-JSON response');
        return;
      }

      if (data.address) {
        const city =
          data.address.city || data.address.town || data.address.village || '';
        const district = data.address.state || '';
        setLocationName(`${city}, ${district}`.trim().replace(/^, |, $/g, ''));
      }
    } catch (error) {
      console.error('Location error:', error);
    }
  };

  const startScanAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const flipCamera = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };
  useEffect(() => {
    if (!permission?.granted) return;

    const locationTask = setTimeout(() => {
      void fetchLocationName();
    }, 0);
    startScanAnimation();

    return () => clearTimeout(locationTask);
  }, [permission?.granted]);
  const toggleFlash = () => {
    setFlash((current) => (current === 'off' ? 'on' : 'off'));
  };

  const takeSnap = async () => {
    if (!cameraRef.current) return;

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Shutter animation
    Animated.sequence([
      Animated.timing(shutterAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shutterAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: true, // Faster capture
      });

      if (photo?.uri) {
        if (!coordinates || !locationReady) {
          Alert.alert(
            'Location unavailable',
            'Wait for your location to be ready and try again.'
          );
          return;
        }

        const resizedUri = await resizeForUpload(
          photo.uri,
          photo.width,
          photo.height
        );
        const persistentPhoto = await persistCapturedPhoto(resizedUri, artifactId);

        // Navigate to review screen with all necessary verification data
        router.push({
          pathname: '/(tabs)/submission-review',
          params: {
            artifactId,
            imageUri: persistentPhoto.localUri,
            localPhotoId: persistentPhoto.id,
            gpsLat: String(coordinates.latitude),
            gpsLng: String(coordinates.longitude),
            gpsAccuracy:
              coordinates.accuracy === null
                ? ''
                : String(coordinates.accuracy),
            gpsCapturedAt: new Date().toISOString(),
          },
        } as any);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to capture photo.');
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color={COLORS.tertiary} />
        <Text style={styles.permissionText}>
          We need your permission to show the camera
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flash}
        onCameraReady={() => setIsReady(true)}
      />

      {/* Shutter Flash Overlay */}
      <Animated.View style={[styles.shutterFlash, { opacity: shutterAnim }]} />

      {/* UI Overlay Layer */}
      <View style={styles.overlay}>
        {/* Top Controls */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.statusContainer}>
            <View style={styles.statusPill}>
              <View style={styles.pulseDot} />
              <Text style={styles.statusText}>STABLE - READY TO SNAP</Text>
            </View>
            <View style={styles.locationPill}>
              <Text style={styles.locationText}>{locationName}</Text>
            </View>
          </View>

          <View style={styles.rightControls}>
            <TouchableOpacity style={styles.iconButton} onPress={toggleFlash}>
              <Ionicons
                name={flash === 'on' ? 'flash' : 'flash-off'}
                size={24}
                color={flash === 'on' ? COLORS.primary : '#FFFFFF'}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={flipCamera}>
              <Ionicons name="camera-reverse" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Viewfinder Reticle */}
        <View style={styles.reticleContainer} pointerEvents="none">
          <View style={styles.cornerTopLeft} />
          <View style={styles.cornerTopRight} />
          <View style={styles.cornerBottomLeft} />
          <View style={styles.cornerBottomRight} />

          {/* Scanning Line */}
          <Animated.View
            style={[
              styles.scanLine,
              {
                transform: [
                  {
                    translateY: scanLineAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-150, 150],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomBar}>
          <Text style={styles.instructionText}>
            Align the artifact within the frame and tap to verify your
            discovery.
          </Text>

          <TouchableOpacity
            style={styles.shutterButtonContainer}
            onPress={takeSnap}
            disabled={!isReady || !locationReady}
            activeOpacity={0.8}
          >
            <View style={styles.shutterOuterRing}>
              <View style={styles.shutterInner}>
                <Ionicons name="camera" size={36} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.neutral,
    padding: 20,
  },
  permissionText: {
    fontSize: 16,
    color: COLORS.tertiary,
    textAlign: 'center',
    marginVertical: 20,
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 40,
  },
  shutterFlash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFFFFF',
    zIndex: 100,
    pointerEvents: 'none',
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusContainer: {
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38A169',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  locationPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  locationText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  rightControls: {
    flexDirection: 'column',
    gap: 12,
  },

  // Reticle
  reticleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: 'rgba(212, 175, 55, 0.8)',
    borderTopLeftRadius: 12,
  },
  cornerTopRight: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: 'rgba(212, 175, 55, 0.8)',
    borderTopRightRadius: 12,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: 'rgba(212, 175, 55, 0.8)',
    borderBottomLeftRadius: 12,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: -100,
    right: -100,
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: 'rgba(212, 175, 55, 0.8)',
    borderBottomRightRadius: 12,
  },
  scanLine: {
    width: 200,
    height: 2,
    backgroundColor: 'rgba(212, 175, 55, 0.6)',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },

  // Bottom Bar
  bottomBar: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  instructionText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 280,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  shutterButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterOuterRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  shutterInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});
