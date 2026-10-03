import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest, createIdempotencyKey } from './api';
import { updateLocalPhotoStatus } from './local-photos';

const QUEUE_KEY = '@sanskriti_verification_upload_queue_v1';
let processing = false;

export type PendingVerification = {
  id: string;
  localPhotoId?: string;
  artifactId: string;
  imageUri: string;
  galleryUris: string[];
  gpsLat: number;
  gpsLng: number;
  gpsAccuracy: number;
  gpsCapturedAt: string;
  privateNote: string | null;
  createdAt: string;
  retryCount: number;
  idempotencyKey: string;
  status: 'pending' | 'uploading' | 'failed';
};

async function readQueue() {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? (JSON.parse(raw) as PendingVerification[]) : [];
}

async function writeQueue(queue: PendingVerification[]) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function enqueueVerification(
  input: Omit<PendingVerification, 'id' | 'createdAt' | 'retryCount' | 'status' | 'idempotencyKey'>,
) {
  const queue = await readQueue();
  const item: PendingVerification = {
    ...input,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    createdAt: new Date().toISOString(),
    retryCount: 0,
    idempotencyKey: createIdempotencyKey(),
    status: 'pending',
  };
  await writeQueue([...queue, item]);
  return item;
}

async function uploadMedia(uri: string, purpose: 'VERIFICATION_SNAP' | 'VERIFICATION_GALLERY') {
  const sign = await apiRequest<{
    cloudName: string; apiKey: string; timestamp: number; signature: string;
    folder: string; resourceType: 'image';
  }>('/media/sign', {
    method: 'POST',
    body: JSON.stringify({ purpose, contentType: 'image/jpeg' }),
  });
  const file = await (await fetch(uri)).blob();
  const body = new FormData();
  body.append('file', file);
  body.append('api_key', sign.apiKey);
  body.append('timestamp', String(sign.timestamp));
  body.append('signature', sign.signature);
  body.append('folder', sign.folder);
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${sign.cloudName}/${sign.resourceType}/upload`,
    { method: 'POST', body },
  );
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.public_id) {
    throw new Error(payload?.error?.message ?? 'Image upload failed.');
  }
  return String(payload.public_id);
}

async function uploadVerification(item: PendingVerification) {
  const verificationImagePublicId = await uploadMedia(item.imageUri, 'VERIFICATION_SNAP');
  const additionalPhotos = await Promise.all(
    item.galleryUris.slice(0, 6).map(async (uri) => ({
      publicId: await uploadMedia(uri, 'VERIFICATION_GALLERY'),
    })),
  );
  return apiRequest('/verification-attempts', {
    method: 'POST',
    headers: { 'Idempotency-Key': item.idempotencyKey },
    body: JSON.stringify({
      artifactId: item.artifactId,
      verificationImagePublicId,
      additionalPhotos,
      location: {
        latitude: item.gpsLat,
        longitude: item.gpsLng,
        accuracyMeters: item.gpsAccuracy,
        capturedAt: item.gpsCapturedAt,
      },
      privateNote: item.privateNote,
    }),
  });
}

export async function processPendingVerifications() {
  if (processing) return;
  processing = true;
  try {
    const queue = await readQueue();
    for (const item of queue) {
      if (item.status === 'uploading') item.status = 'pending';
      item.status = 'uploading';
      if (item.localPhotoId) await updateLocalPhotoStatus(item.localPhotoId, 'uploading');
      await writeQueue(queue);
      try {
        await uploadVerification(item);
        if (item.localPhotoId) await updateLocalPhotoStatus(item.localPhotoId, 'uploaded');
        queue.splice(queue.indexOf(item), 1);
      } catch (error) {
        item.status = 'failed';
        item.retryCount += 1;
        if (item.localPhotoId) await updateLocalPhotoStatus(item.localPhotoId, 'failed');
        console.warn(`Offline verification retry ${item.retryCount} failed:`, error);
      }
      await writeQueue(queue);
    }
  } finally {
    processing = false;
  }
}
