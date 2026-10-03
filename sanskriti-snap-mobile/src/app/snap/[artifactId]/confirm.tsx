import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Href, useRouter, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import { apiRequest } from '../../../services/api';
import { COLORS } from '../../../constants/colors';
import { useAuthStore } from '../../../store/authstore';

const SNAP_CONFIRMATION_KEY = '@sanskriti_snap_confirmation_seen';

export default function SnapConfirmScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const artifactId = params.artifactId as string;
  const userId = useAuthStore((state) => state.user?.id);

  const [artifact, setArtifact] = useState<{
    id: string;
    name: string;
    category: string;
    reference_images: string[];
    xp_value: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState<boolean | null>(
    null
  );

  useEffect(() => {
    let mounted = true;

    const prepareConfirmation = async () => {
      try {
        const key = userId
          ? `${SNAP_CONFIRMATION_KEY}:${userId}`
          : SNAP_CONFIRMATION_KEY;
        const hasSeenConfirmation = await AsyncStorage.getItem(key);

        if (!mounted) return;

        if (hasSeenConfirmation === 'true') {
          router.replace(`/snap/${artifactId}/camera` as Href);
          return;
        }

        await AsyncStorage.setItem(key, 'true');
        if (mounted) setShowConfirmation(true);
      } catch (error) {
        console.error('Error preparing snap confirmation:', error);
        if (mounted) setShowConfirmation(true);
      }
    };

    void prepareConfirmation();

    return () => {
      mounted = false;
    };
  }, [artifactId, router, userId]);

  useEffect(() => {
    loadArtifactDetails();
  }, [artifactId]);

  const loadArtifactDetails = async () => {
    try {
      const data = await apiRequest<{
        id: string;
        name: string;
        category: string;
        coverImageUrl: string | null;
        referenceImageUrls: string[];
        xpReward: number;
      }>(`/artifacts/${encodeURIComponent(artifactId)}`);
      setArtifact({
        id: data.id,
        name: data.name,
        category: data.category,
        reference_images: data.referenceImageUrls ?? (data.coverImageUrl ? [data.coverImageUrl] : []),
        xp_value: data.xpReward,
      });
    } catch (error) {
      console.error('Error loading artifact:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTakeSnap = () => {
    router.push(`/snap/${artifactId}/camera` as Href);
  };

  const handleMaybeLater = () => {
    router.back();
  };

  if (loading || showConfirmation === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Blurred Background */}
      <View style={StyleSheet.absoluteFill}>
        {artifact?.reference_images?.[0] ? (
          <>
            <ImageBackground
              source={{ uri: artifact.reference_images[0] }}
              style={styles.backgroundImage}
              resizeMode="cover"
            >
              <View style={styles.blurOverlay} />
            </ImageBackground>
            <BlurView
              intensity={50}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          </>
        ) : (
          <View style={[styles.backgroundImage, styles.placeholderBackground]}>
            <BlurView
              intensity={50}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          </View>
        )}
      </View>

      {/* Modal Card */}
      <View style={styles.modalContainer}>
        <View style={styles.card}>
          {/* Ambient Glow */}
          <View style={styles.ambientGlow} />

          {/* Icon Header */}
          <View style={styles.iconContainer}>
            <Ionicons name="camera" size={32} color={COLORS.white} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Ready to Collect?</Text>

          {/* Description */}
          <Text style={styles.description}>
            Capture a Snap of this artifact to verify your visit and add it to
            your permanent collection. Your photo helps preserve Nepal's
            heritage.
          </Text>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            {/* Primary Button */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleTakeSnap}
              activeOpacity={0.9}
            >
              <Ionicons name="image" size={20} color={COLORS.white} />
              <Text style={styles.primaryButtonText}>Take a Snap</Text>
            </TouchableOpacity>

            {/* Secondary Button */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleMaybeLater}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  placeholderBackground: {
    backgroundColor: COLORS.primary,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(28, 27, 26, 0.4)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.neutral,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(136, 114, 108, 0.2)',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  ambientGlow: {
    position: 'absolute',
    top: -64,
    left: '50%',
    transform: [{ translateX: -64 }],
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(233, 195, 73, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(233, 195, 73, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.tertiary,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  actionsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  primaryButton: {
    width: '100%',
    minHeight: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  secondaryButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.tertiary,
  },
});
