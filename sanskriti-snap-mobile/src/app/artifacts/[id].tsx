import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { MOCK_ARTIFACTS } from '../../constants/mockData';
import type { ArtifactDetail, DiscoveryStatus } from '../../types/artifact';

// Import sub-components
import ArtifactBottomBar from '../../components/ArtifactDetail/ArtifactBottomBar';
import ArtifactContent from '../../components/ArtifactDetail/ArtifactContent';
import ArtifactHeader from '../../components/ArtifactDetail/ArtifactHeader';
import ArtifactHero from '../../components/ArtifactDetail/ArtifactHero';
import ArtifactInfo from '../../components/ArtifactDetail/ArtifactInfo';

export default function ArtifactDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const artifactId = params.id;

  const defaultArtifact = useMemo(
    () =>
      MOCK_ARTIFACTS.find((item) => item.id === artifactId) ?? {
        ...MOCK_ARTIFACTS[0],
        id: artifactId || MOCK_ARTIFACTS[0].id,
      },
    [artifactId]
  );

  const [artifact, setArtifact] = useState<ArtifactDetail>(defaultArtifact);
  const [discoveryStatus, setDiscoveryStatus] = useState<DiscoveryStatus>({
    isDiscovered: false,
    isStoryUnlocked: true,
    distanceToArtifact: defaultArtifact.distance,
  });
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => {
      const found =
        MOCK_ARTIFACTS.find((item) => item.id === artifactId) ?? defaultArtifact;
      setArtifact(found);
      setRefreshing(false);
    }, 500);
  }, [artifactId, defaultArtifact]);

  const handleShare = async () => {
    if (!artifact) return;
    try {
      await Share.share({
        message: `Check out ${artifact.name} on Sanskriti Snap! ${artifact.description}`,
        title: artifact.name,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const isUnlocked = discoveryStatus.isDiscovered;

  const handleStartNavigation = () => {
    if (artifact) {
      router.push({
        pathname: '/(tabs)/explore',
        params: {
          lat: String(artifact.location.latitude),
          lng: String(artifact.location.longitude),
        },
      });
    } else {
      router.push('/(tabs)/explore');
    }
  };

  const handleTakeSnap = () => {
    if (isUnlocked) {
      Alert.alert(
        'Already Discovered',
        'You have already discovered this artifact. Great job!',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Snap Feature',
      `Take a photo of ${artifact?.name || 'this heritage site'} to verify and claim ${artifact?.xp_value || 100} XP!`,
      [
        {
          text: 'Claim XP (Demo)',
          onPress: () => {
            setDiscoveryStatus((prev) => ({
              ...prev,
              isDiscovered: true,
              isStoryUnlocked: true,
            }));
            Alert.alert(
              'Discovery Unlocked!',
              `Congratulations! You unlocked ${artifact?.name} and earned ${artifact?.xp_value} XP!`
            );
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  if (!artifact) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Artifact not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ArtifactHeader onBack={() => router.back()} onShare={handleShare} />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <ArtifactHero
          images={artifact.reference_images}
          location={artifact.human_readable_location}
        />

        <View style={styles.mainContentContainer}>
          <ArtifactInfo
            artifact={artifact}
            distance={discoveryStatus.distanceToArtifact}
            isUnlocked={isUnlocked}
          />
          <ArtifactContent artifact={artifact} isUnlocked={isUnlocked} />
        </View>
      </ScrollView>

      <ArtifactBottomBar
        storyUnlocked={discoveryStatus.isStoryUnlocked}
        isDiscovered={isUnlocked}
        onNavigate={handleStartNavigation}
        onTakeSnap={isUnlocked ? undefined : handleTakeSnap}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.neutral },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.neutral,
    gap: 16,
  },
  errorText: { fontSize: 16, color: COLORS.tertiary, fontWeight: '600' },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  content: { flex: 1 },
  mainContentContainer: {
    backgroundColor: COLORS.neutral,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100,
  },
});
