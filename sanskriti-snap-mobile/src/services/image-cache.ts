import * as FileSystem from 'expo-file-system/legacy';

const IMAGE_DIRECTORY = `${FileSystem.documentDirectory ?? ''}offline-images/`;
const pendingDownloads = new Map<string, Promise<string | null>>();

function imagePath(remoteUrl: string) {
  let hash = 0;
  for (let index = 0; index < remoteUrl.length; index += 1) {
    hash = (hash * 31 + remoteUrl.charCodeAt(index)) | 0;
  }
  return `${IMAGE_DIRECTORY}${Math.abs(hash)}.img`;
}

export async function getCachedImageUri(remoteUrl?: string | null) {
  if (!remoteUrl || !FileSystem.documentDirectory) return null;
  const localUri = imagePath(remoteUrl);

  try {
    const existing = await FileSystem.getInfoAsync(localUri);
    if (existing.exists) return localUri;
  } catch (error) {
    console.warn('Unable to inspect cached image:', error);
  }

  const existingDownload = pendingDownloads.get(remoteUrl);
  if (existingDownload) return existingDownload;

  const download = (async () => {
    try {
      await FileSystem.makeDirectoryAsync(IMAGE_DIRECTORY, { intermediates: true });
      const result = await FileSystem.downloadAsync(remoteUrl, localUri);
      return result.status >= 200 && result.status < 300 ? localUri : null;
    } catch (error) {
      console.warn('Unable to cache remote image:', error);
      return null;
    } finally {
      pendingDownloads.delete(remoteUrl);
    }
  })();
  pendingDownloads.set(remoteUrl, download);
  return download;
}

