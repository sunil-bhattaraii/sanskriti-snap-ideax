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
import VerificationNotice from '../../components/submission/VerificationNotice';
import type { SubmissionData } from '../../constants/data/mockSubmission';
import { backendClient } from '@/services/backendClient';
import { useAuthStore } from '@/store/authstore';

type ReviewData = SubmissionData & {
  artifactId: string;
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
    gpsLat: string;
    gpsLng: string;
    gpsAccuracy?: string;
    gpsCapturedAt: string;
  }>();

  const user = useAuthStore((state) => state.user);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<ReviewData | null>(null);

  // Fetch artifact details on mount
  useEffect(() => {
    if (!params.artifactId) return;

    backendClient
      .from('artifacts')
      .select('name, human_readable_location, xp_value')
      .eq('id', params.artifactId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          Alert.alert(
            'Unable to load artifact',
            error?.message ?? 'Artifact not found'
          );
          return;
        }
        setFormData({
          artifactId: params.artifactId,
          primaryImageUri: params.imageUri,
          galleryImages: [],
          privateNote: '',
          isPublic: false,
          xpReward: data.xp_value,
          placeName: data.name,
          location: data.human_readable_location,
          gpsLat: Number(params.gpsLat),
          gpsLng: Number(params.gpsLng),
          gpsAccuracy: params.gpsAccuracy ? Number(params.gpsAccuracy) : null,
          gpsCapturedAt: params.gpsCapturedAt,
        });
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
              // 1. Upload Image to Storage (Schema: submission-snaps/{user_id}/{submission_id}/{filename})
              const submissionId = `${user.id}/${formData.artifactId}/${Date.now()}.jpg`;
              const photoBlob = await (
                await fetch(formData.primaryImageUri)
              ).blob();

              const { error: uploadError } = await backendClient.storage
                .from('submission-snaps')
                .upload(submissionId, photoBlob, {
                  contentType: 'image/jpeg',
                  upsert: false,
                });

              if (uploadError) throw uploadError;

              // 2. Insert Submission Record
              const { data: submissionData, error: insertError } =
                await backendClient
                  .from('submissions')
                  .insert({
                    user_id: user.id,
                    artifact_id: formData.artifactId,
                    main_snap_url: submissionId, // Use the uploaded path
                    private_note: formData.privateNote,
                    user_submitted_at: new Date().toISOString(),
                    gps_lat: formData.gpsLat,
                    gps_lng: formData.gpsLng,
                    gps_accuracy_m: formData.gpsAccuracy,
                    gps_captured_at: formData.gpsCapturedAt,
                  })
                  .select('id')
                  .single();

              if (insertError) throw insertError;

              if (formData.galleryImages.length > 0) {
                const galleryRows = [];

                for (const [
                  index,
                  imageUri,
                ] of formData.galleryImages.entries()) {
                  const galleryPath = `${user.id}/${submissionData.id}/gallery-${index}.jpg`;
                  const galleryBlob = await (await fetch(imageUri)).blob();
                  const { error: galleryUploadError } = await backendClient.storage
                    .from('submission-snaps')
                    .upload(galleryPath, galleryBlob, {
                      contentType: 'image/jpeg',
                      upsert: false,
                    });

                  if (galleryUploadError) throw galleryUploadError;
                  galleryRows.push({
                    submission_id: submissionData.id,
                    url: galleryPath,
                    is_public: formData.isPublic,
                  });
                }

                const { error: galleryInsertError } = await backendClient
                  .from('submission_photos')
                  .insert(galleryRows);

                if (galleryInsertError) throw galleryInsertError;
              }

              // 3. Finalize Discovery (Server-side verification)
              const { data: result, error: rpcError } = await backendClient.rpc(
                'finalize_discovery',
                { p_submission_id: submissionData.id }
              );

              if (rpcError) {
                // If RPC fails unexpectedly, fallback to pending screen
                router.replace({
                  pathname: '/(tabs)/verification-pending',
                  params: { submissionId: submissionData.id },
                });
                return;
              }

              const finalizeResult = result as {
                success?: boolean;
                discovery_id?: string;
                error_code?: string;
                message?: string;
              };

              // 4. Handle Results
              if (finalizeResult.success && finalizeResult.discovery_id) {
                await fetchProfile(user.id);
                router.replace({
                  pathname: '/(tabs)/discovery-success',
                  params: { discoveryId: finalizeResult.discovery_id },
                });
                return;
              }

              if (finalizeResult.error_code === 'GPS_OUTSIDE_RADIUS') {
                // Calculate distance for UI feedback
                const { data: nearbyArtifacts } = await backendClient.rpc(
                  'nearby_artifacts',
                  {
                    p_lat: formData.gpsLat,
                    p_lng: formData.gpsLng,
                    p_radius_m: 2147483647,
                  }
                );

                const locationResult = nearbyArtifacts?.find(
                  (artifact: any) => artifact.id === formData.artifactId
                );

                router.replace({
                  pathname: '/(tabs)/verification-failed',
                  params: {
                    artifactId: formData.artifactId,
                    distanceRemaining: String(
                      Math.max(
                        0,
                        Math.round(
                          (locationResult?.distance_m ?? 0) -
                            (locationResult?.verification_radius_m ?? 0)
                        )
                      )
                    ),
                  },
                });
                return;
              }

              Alert.alert(
                'Verification failed',
                finalizeResult.message ?? 'Unable to verify this discovery.'
              );
            } catch (error: any) {
              console.error('Submission error:', error);
              Alert.alert(
                'Submission failed',
                error.message ??
                  'We could not upload your snap. Please try again.'
              );
            } finally {
              setSubmitting(false);
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
        <Button
          title={submitting ? 'Submitting...' : 'Submit Visit'}
          onPress={handleSubmit}
          variant="primary"
          size="lg"
          fullWidth
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
