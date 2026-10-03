import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  getItem: async (key: string) => {
    return AsyncStorage.getItem(key);
  },

  setItem: async (key: string, value: string) => {
    await AsyncStorage.setItem(key, value);
  },

  removeItem: async (key: string) => {
    await AsyncStorage.removeItem(key);
  },
};

export async function uploadLocalFile(
  bucket: string,
  localUri: string,
  objectPath: string,
): Promise<string> {
  const response = await fetch(localUri);
  if (!response.ok) {
    throw new Error(`Unable to read captured file (${response.status}).`);
  }

  const blob = await response.blob();
  const { error } = await (await import('./backendClient')).backendClient.storage
    .from(bucket)
    .upload(objectPath, blob, {
      contentType: blob.type || 'image/jpeg',
      upsert: false,
    });

  if (error) throw error;
  return objectPath;
}
