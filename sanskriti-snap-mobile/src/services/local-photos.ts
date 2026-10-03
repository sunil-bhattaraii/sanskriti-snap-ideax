import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PHOTO_DIRECTORY = `${FileSystem.documentDirectory ?? ''}captured-photos/`;
const PHOTO_METADATA_KEY = '@sanskriti_local_photos_v1';

export type LocalPhoto = {
  id: string;
  localUri: string;
  createdAt: string;
  artifactId?: string;
  uploadStatus: 'pending' | 'uploading' | 'uploaded' | 'failed';
};

export async function persistCapturedPhoto(
  sourceUri: string,
  artifactId?: string,
): Promise<LocalPhoto> {
  if (!FileSystem.documentDirectory) {
    throw new Error('Persistent device storage is unavailable.');
  }
  await FileSystem.makeDirectoryAsync(PHOTO_DIRECTORY, { intermediates: true });
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const localUri = `${PHOTO_DIRECTORY}${id}.jpg`;
  await FileSystem.copyAsync({ from: sourceUri, to: localUri });
  const photo: LocalPhoto = {
    id,
    localUri,
    createdAt: new Date().toISOString(),
    artifactId,
    uploadStatus: 'pending',
  };
  const existing = await readLocalPhotos();
  await AsyncStorage.setItem(PHOTO_METADATA_KEY, JSON.stringify([...existing, photo]));
  return photo;
}

export async function readLocalPhotos(): Promise<LocalPhoto[]> {
  const raw = await AsyncStorage.getItem(PHOTO_METADATA_KEY);
  return raw ? (JSON.parse(raw) as LocalPhoto[]) : [];
}

export async function updateLocalPhotoStatus(
  id: string,
  uploadStatus: LocalPhoto['uploadStatus'],
) {
  const photos = await readLocalPhotos();
  await AsyncStorage.setItem(
    PHOTO_METADATA_KEY,
    JSON.stringify(photos.map((photo) => (photo.id === id ? { ...photo, uploadStatus } : photo))),
  );
}
