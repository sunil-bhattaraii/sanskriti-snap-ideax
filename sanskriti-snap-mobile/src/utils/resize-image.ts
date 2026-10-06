import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export const MAX_IMAGE_DIMENSION = 1600;

export async function resizeForUpload(
  uri: string,
  width: number,
  height: number
): Promise<string> {
  if (
    Number.isFinite(width) &&
    Number.isFinite(height) &&
    Math.max(width, height) <= MAX_IMAGE_DIMENSION
  ) {
    return uri;
  }

  const target =
    width >= height
      ? { width: MAX_IMAGE_DIMENSION }
      : { height: MAX_IMAGE_DIMENSION };

  const result = await manipulateAsync(uri, [{ resize: target }], {
    compress: 0.7,
    format: SaveFormat.JPEG,
  });

  return result.uri;
}