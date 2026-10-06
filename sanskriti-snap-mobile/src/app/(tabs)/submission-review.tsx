import { COLORS } from '@/constants/colors';
import { Href, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../../components/Button';
import ScreenHeader from '../../components/ScreenHeader';
import RewardPreview from '../../components/submission/RewardPreview';
import SubmissionInfo from '../../components/submission/SubmissionInfo';
import SubmissionPreview from '../../components/submission/SubmissionPreview';
import SubmitProgress, {
  SubmitStage,
} from '../../components/submission/SubmitProgress';
import VerificationNotice from '../../components/submission/VerificationNotice';
import type { SubmissionData } from '../../constants/data/mockSubmission';
import { ApiRequestError, apiRequest, apiRequestWithIdempotency } from '@/services/api';
import { useAuthStore } from '@/store/authstore';
import NetInfo from '@react-native-community/netinfo';
import { enqueueVerification } from '@/services/upload-queue';
import { offlineFirstRequest } from '@/services/cached-api';

type ReviewData = SubmissionData & {
  artifactId: string;
  localPhotoId?: string;
  gpsLat: number;
  gpsLng: number;
  gpsAccuracy: number | null;
  gpsCapturedAt: string;
};

export default function SubmissionReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    artifactId: string;
    imageUri: string;
    localPhotoId?: string;
    gpsLat: string;
    gpsLng: string;
    gpsAccuracy?: string;
    gpsCapturedAt: string;
  }>();

  const user = useAuthStore((state) => state.user);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitStage, setSubmitStage] = useState<SubmitStage>('uploading');
  const [formData, setFormData] = useState<ReviewData | null>(null);

  // Fetch artifact details on mount
  useEffect(() => {
    if (!params.artifactId) return;

    offlineFirstRequest<{
      id: string;
      name: string;
      humanReadableLocation: string;
      xpReward: number;
    }>(
      `/artifacts/${encodeURIComponent(params.artifactId)}`,
      ['artifact', params.artifactId],
    )
      .then((data) => {
        if (!data) {
          Alert.alert(
            'Unable to load artifact',
            'Artifact not found'
          );
          return;
        }
        setFormData({
          artifactId: params.artifactId,
          localPhotoId: params.localPhotoId,
          primaryImageUri: params.imageUri,
          galleryImages: [],
          privateNote: '',
          isPublic: false,
          xpReward: data.xpReward,
          placeName: data.name,
          location: data.humanReadableLocation,
          gpsLat: Number(params.gpsLat),
          gpsLng: Number(params.gpsLng),
          gpsAccuracy: params.gpsAccuracy ? Number(params.gpsAccuracy) : null,
          gpsCapturedAt: params.gpsCapturedAt,
        });
      })
      .catch((error) => {
        Alert.alert(
          'Unable to load artifact',
          error instanceof Error ? error.message : 'Artifact not found'
        );
      })
      .then(() => setLoading(false));
  }, [
    params.artifactId,
    params.gpsAccuracy,
    params.gpsCapturedAt,
    params.gpsLat,
    params.gpsLng,
    params.imageUri,
  ]);

  const handleSubmit = () => {
    if (!formData || !user) {
      Alert.alert(
        'Sign in required',
        'Please sign in before submitting a discovery.'
      );
      return;
    }

    Alert.alert(
      'Submit Discovery',
      'Are you sure you want to submit this visit for review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            if (!formData.primaryImageUri) {
              Alert.alert(
                'Missing photo',
                'Please take a photo before submitting.'
              );
              return;
            }

            setSubmitting(true);
            try {
              const network = await NetInfo.fetch();
              if (!network.isConnected) {
                await enqueueVerification({
                  artifactId: formData.artifactId,
                  localPhotoId: formData.localPhotoId,
                  imageUri: formData.primaryImageUri,
                  galleryUris: formData.galleryImages.slice(0, 6),
                  gpsLat: formData.gpsLat,
                  gpsLng: formData.gpsLng,
                  gpsAccuracy: Math.max(1, Math.min(100, formData.gpsAccuracy ?? 100)),
                  gpsCapturedAt: formData.gpsCapturedAt,
                  privateNote: formData.privateNote || null,
                });
                Alert.alert(
                  'Saved locally',
                  'Your photo is safe on this device and will upload automatically when internet returns.',
                );
                return;
              }

              const uploadMedia = async (uri: string, purpose: 'VERIFICATION_SNAP' | 'VERIFICATION_GALLERY') => {
                const sign = await apiRequest<{
                  cloudName: string;
                  apiKey: string;
                  timestamp: number;
                  signature: string;
                  folder: string;
                  resourceType: 'image';
                }>('/media/sign', {
                  method: 'POST',
                  body: JSON.stringify({ purpose, contentType: 'image/jpeg' }),
                });
                const file = await (await fetch(uri)).blob();
                const uploadBody = new FormData();
                uploadBody.append('file', file);
                uploadBody.append('api_key', sign.apiKey);
                uploadBody.append('timestamp', String(sign.timestamp));
                uploadBody.append('signature', sign.signature);
                uploadBody.append('folder', sign.folder);
                const response = await fetch(
                  `https://api.cloudinary.com/v1_1/${sign.cloudName}/${sign.resourceType}/upload`,
                  { method: 'POST', body: uploadBody },
                );
                const payload = await response.json().catch(() => null);
                if (!response.ok || !payload?.public_id) {
                  throw new Error(payload?.error?.message ?? 'Image upload failed.');
                }
                return String(payload.public_id);
              };

              setSubmitStage('uploading');
              const verificationImagePublicId = await uploadMedia(
                formData.primaryImageUri,
                'VERIFICATION_SNAP',
              );
              const additionalPhotos = await Promise.all(
                formData.galleryImages.slice(0, 6).map(async (uri) => ({
                  publicId: await uploadMedia(uri, 'VERIFICATION_GALLERY'),
                })),
              );

              setSubmitStage('verifying');
              const result = await apiRequestWithIdempotency<{
                attemptId: string;
                status: 'VERIFIED' | 'FLAGGED';
                discoveryId: string | null;
                gps: { status: string; distanceMeters: number | null; requiredMeters: number };
              }>('/verification-attempts', {
                method: 'POST',
                body: JSON.stringify({
                  artifactId: formData.artifactId,
                  verificationImagePublicId,
                  additionalPhotos,
                  location: {
                    latitude: formData.gpsLat,
                    longitude: formData.gpsLng,
                    accuracyMeters: Math.max(
                      1,
                      Math.min(100, formData.gpsAccuracy ?? 100),
                    ),
                    capturedAt: formData.gpsCapturedAt,
                  },
                  privateNote: formData.privateNote || null,
                }),
              });

              setSubmitStage('submitting');

              if (result.discoveryId) {
                await fetchProfile(user.id);
                router.replace({
                  pathname: '/(tabs)/discovery-success',
                  params: { discoveryId: result.discoveryId },
                });
                return;
              }
              if (result.status === 'FLAGGED') {
                router.replace({
                  pathname: '/(tabs)/verification-pending',
                  params: { submissionId: result.attemptId },
                });
                return;
              }
              if (result.gps.status !== 'PASSED' && result.gps.status !== 'WITHIN_RADIUS') {
                router.replace({
                  pathname: '/(tabs)/verification-failed',
                  params: {
                    artifactId: formData.artifactId,
                    distanceRemaining: String(Math.max(
                      0,
                      Math.round((result.gps.distanceMeters ?? 0) - result.gps.requiredMeters),
                    )),
                  },
                });
                return;
              }
              Alert.alert('Verification failed', 'Unable to verify this discovery.');
            } catch (error) {
              console.error('Submission error:', error);
              if (error instanceof ApiRequestError && error.code === 'GPS_OUTSIDE_RADIUS') {
                router.replace({
                  pathname: '/(tabs)/verification-failed',
                  params: {
                    artifactId: formData.artifactId,
                    distanceRemaining: String(
                      Math.max(
                        0,
                        Math.round(
                          Number(
                            error.details &&
                              typeof error.details === 'object' &&
                              'shortfallMeters' in error.details
                              ? error.details.shortfallMeters
                              : 0,
                          ),
                        ),
                      ),
                    ),
                  },
                });
                return;
              }
              Alert.alert(
                'Submission failed',
                error instanceof Error ? error.message :
                  'We could not upload your snap. Please try again.'
              );
            } finally {
              setSubmitting(false);
              setSubmitStage('uploading');
            }
          },
        },
      ]
    );
  };

  const updateField = <K extends keyof SubmissionData>(
    field: K,
    value: SubmissionData[K]
  ) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleRetake = () => {
    router.replace(`/snap/${formData?.artifactId}/camera` as Href);
  };

  const handleAddMore = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission required',
        'Allow photo access to add gallery images.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormData((previous) =>
        previous
          ? {
              ...previous,
              galleryImages: [
                ...previous.galleryImages,
                ...result.assets.map((asset) => asset.uri),
              ],
            }
          : previous
      );
    }
  };

  if (loading || !formData) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title="Review Discovery" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SubmissionPreview
          data={formData}
          onRetake={handleRetake}
          onAddMore={handleAddMore}
        />
        <VerificationNotice />
        <SubmissionInfo
          data={formData}
          onNoteChange={(note) => updateField('privateNote', note)}
        />
        <RewardPreview
          data={formData}
          onTogglePublic={(isPublic) => updateField('isPublic', isPublic)}
        />
      </ScrollView>

      <View style={styles.footer}>
        {submitting && <SubmitProgress stage={submitStage} />}
        <Button
          title={submitting ? 'Submitting...' : 'Submit Visit'}
          onPress={handleSubmit}
          variant="primary"
          size="lg"
          fullWidth
          disabled={submitting}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.neutral,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: COLORS.neutral,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingBottom: 30,
  },
});
