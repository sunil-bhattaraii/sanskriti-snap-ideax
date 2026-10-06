import * as FileSystem from 'expo-file-system/legacy';

const IMAGE_DIRECTORY = `${FileSystem.documentDirectory ?? ''}offline-images/`;
const MAX_CACHE_FILES = 200;
const MAX_CACHE_BYTES = 200 * 1024 * 1024;
const pendingDownloads = new Map<string, Promise<string | null>>();
let cacheMaintenance: Promise<void> | null = null;

function imagePath(remoteUrl: string) {
  let hash = 0;
  for (let index = 0; index < remoteUrl.length; index += 1) {
    hash = (hash * 31 + remoteUrl.charCodeAt(index)) | 0;
  }
  return `${IMAGE_DIRECTORY}${Math.abs(hash)}.img`;
}

async function enforceImageCacheLimit() {
  if (cacheMaintenance) return cacheMaintenance;
  cacheMaintenance = (async () => {
    try {
      const names = await FileSystem.readDirectoryAsync(IMAGE_DIRECTORY);
      const entries = await Promise.all(
        names.map(async (name) => {
          const localUri = `${IMAGE_DIRECTORY}${name}`;
          const info = (await FileSystem.getInfoAsync(localUri).catch(() => null)) as {
            exists: boolean;
            size?: number;
            modificationTime?: number;
          } | null;
          return {
            localUri,
            size: info?.exists ? Number(info.size ?? 0) : 0,
            modified: Number(info?.modificationTime ?? 0),
          };
        }),
      );
      const sorted = entries.sort((a, b) => a.modified - b.modified);
      let totalBytes = sorted.reduce((sum, entry) => sum + entry.size, 0);
      while (sorted.length > MAX_CACHE_FILES || totalBytes > MAX_CACHE_BYTES) {
        const oldest = sorted.shift();
        if (!oldest) break;
        await FileSystem.deleteAsync(oldest.localUri, { idempotent: true });
        totalBytes -= oldest.size;
      }
    } catch (error) {
      console.warn('Unable to prune image cache:', error);
    } finally {
      cacheMaintenance = null;
    }
  })();
  return cacheMaintenance;
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
      if (result.status >= 200 && result.status < 300) {
        await enforceImageCacheLimit();
        return localUri;
      }
      return null;
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