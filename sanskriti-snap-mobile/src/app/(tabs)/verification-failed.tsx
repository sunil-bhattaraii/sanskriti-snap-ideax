import { Ionicons } from '@expo/vector-icons';
import { Href, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '../../components/Button';
import { COLORS } from '../../constants/colors';
import { apiRequest } from '@/services/api';

type FailedData = {
  artifactName: string;
  mapImageUrl: string;
  distanceRemaining: number;
};

export default function VerificationFailedScreen() {
  const router = useRouter();
  const { artifactId, distanceRemaining } = useLocalSearchParams<{
    artifactId: string;
    distanceRemaining?: string;
  }>();
  const [failedData, setFailedData] = useState<FailedData | null>(null);

  useEffect(() => {
    if (!artifactId) return;

    apiRequest<{
      name: string;
      coverImageUrl: string | null;
    }>(`/artifacts/${encodeURIComponent(artifactId)}`)
      .then((data) => {
        setFailedData({
          artifactName: data.name,
          mapImageUrl: data.coverImageUrl ?? '',
          distanceRemaining: Number(distanceRemaining ?? 0),
        });
      })
      .catch((error) => {
        console.error('Unable to load failed verification details:', error);
      });
  }, [artifactId, distanceRemaining]);

  if (!failedData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  const handleNavigateCloser = () => {
    if (!artifactId) return;
    router.replace({
      pathname: '/(tabs)/navigation',
      params: { artifactId },
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Go back"
          hitSlop={12}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Verification</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <View style={styles.locationDisabledIcon}>
            <Ionicons name="location-outline" size={34} color={COLORS.error} />
            <View style={styles.disabledMark}>
              <Ionicons name="close" size={15} color={COLORS.error} />
            </View>
          </View>
          <Text style={styles.title}>You're almost there!</Text>
          <Text style={styles.subtitle}>You're not close enough yet.</Text>
        </View>

        <View style={styles.distanceCard}>
          <Ionicons name="map-outline" size={24} color="#DD6B20" />
          <View style={styles.distanceTextContainer}>
            <Text style={styles.distanceLabel}>DISTANCE REMAINING</Text>
            <Text style={styles.distanceValue}>
              {failedData.distanceRemaining}m{' '}
              <Text style={styles.distanceUnit}>to the artifact</Text>
            </Text>
          </View>
        </View>

        <View style={styles.mapCard}>
          {failedData.mapImageUrl ? (
            <Image
              source={{ uri: failedData.mapImageUrl }}
              style={styles.mapImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.mapPlaceholder}>
              <Ionicons name="map-outline" size={46} color={COLORS.disabled} />
            </View>
          )}
          <View style={styles.mapShade} />
          <View style={styles.userDot} />
          <View style={styles.artifactPin}>
            <Ionicons name="location" size={36} color={COLORS.primary} />
          </View>
          <View style={styles.routeLine} />
        </View>

        <Text style={styles.instruction}>
          To verify your discovery, please move a bit closer to{' '}
          <Text style={styles.instructionArtifact}>{failedData.artifactName}</Text>.
        </Text>

        <View style={styles.actions}>
          <Button
            title="Navigate Closer"
            onPress={handleNavigateCloser}
            variant="primary"
            size="lg"
            fullWidth
            leftIcon={<Ionicons name="navigate" size={20} color={COLORS.white} />}
          />
          <Button
            title="Try Again"
            onPress={() => router.back()}
            variant="outline"
            size="lg"
            fullWidth
            leftIcon={<Ionicons name="refresh" size={20} color={COLORS.primary} />}
            style={styles.tryAgainButton}
          />
          <Pressable
            onPress={() => router.replace('/(tabs)/home' as Href)}
            style={styles.continueButton}
          >
            <Text style={styles.continueText}>Continue Exploring</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.neutral,
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.neutral,
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    borderBottomColor: '#E4D8D2',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 14,
  },
  backButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    color: COLORS.primary,
    fontSize: 22,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 34,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  intro: {
    alignItems: 'center',
    marginBottom: 28,
  },
  locationDisabledIcon: {
    alignItems: 'center',
    backgroundColor: '#FFDBD6',
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
    width: 64,
  },
  disabledMark: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 11,
    height: 22,
    justifyContent: 'center',
    position: 'absolute',
    right: -2,
    top: -2,
    width: 22,
  },
  title: {
    color: COLORS.primary,
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    color: '#55423D',
    fontSize: 17,
    textAlign: 'center',
  },
  distanceCard: {
    alignItems: 'flex-start',
    backgroundColor: '#F1EDEA',
    borderColor: '#DCC1BA',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    padding: 16,
  },
  distanceTextContainer: {
    flex: 1,
  },
  distanceLabel: {
    color: '#55423D',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  distanceValue: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '700',
  },
  distanceUnit: {
    color: '#55423D',
    fontSize: 16,
    fontWeight: '400',
  },
  mapCard: {
    backgroundColor: '#E5E2DF',
    borderColor: '#DCC1BA',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    height: 190,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  mapImage: {
    height: '100%',
    opacity: 0.8,
    width: '100%',
  },
  mapPlaceholder: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  mapShade: {
    backgroundColor: 'rgba(247,243,240,0.22)',
    ...StyleSheet.absoluteFill,
  },
  userDot: {
    backgroundColor: '#4299E1',
    borderColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 2,
    height: 16,
    left: '24%',
    position: 'absolute',
    top: '34%',
    width: 16,
  },
  artifactPin: {
    position: 'absolute',
    right: '25%',
    top: '42%',
  },
  routeLine: {
    borderColor: '#4299E1',
    borderTopWidth: 3,
    borderStyle: 'dashed',
    left: '27%',
    position: 'absolute',
    top: '51%',
    transform: [{ rotate: '18deg' }],
    width: '43%',
  },
  instruction: {
    color: '#55423D',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 28,
    textAlign: 'center',
  },
  instructionArtifact: {
    color: COLORS.text,
    fontWeight: '700',
  },
  actions: {
    gap: 12,
  },
  tryAgainButton: {
    backgroundColor: 'transparent',
    borderColor: COLORS.tertiary,
    borderWidth: 2,
  },
  continueButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  continueText: {
    color: '#55423D',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
