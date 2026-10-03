import React, { useEffect, useState } from 'react';
import { Image, type ImageProps, type ImageSourcePropType } from 'react-native';
import { getCachedImageUri } from '@/services/image-cache';

const placeholderImage = require('../../assets/images/placeholder.png');

type CachedImageProps = Omit<ImageProps, 'source'> & {
  remoteUri?: string | null;
  fallbackSource?: ImageSourcePropType;
};

export default function CachedImage({
  remoteUri,
  fallbackSource = placeholderImage,
  onError,
  ...props
}: CachedImageProps) {
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [hasLoadError, setHasLoadError] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLocalUri(null);
    setHasLoadError(false);
    void getCachedImageUri(remoteUri).then((uri) => {
      if (mounted) setLocalUri(uri);
    });
    return () => {
      mounted = false;
    };
  }, [remoteUri]);

  let source: ImageSourcePropType = fallbackSource;
  const cachedOrRemoteUri = localUri ?? remoteUri;
  if (!hasLoadError && cachedOrRemoteUri) {
    source = { uri: cachedOrRemoteUri };
  }

  return (
    <Image
      {...props}
      source={source}
      onError={(event) => {
        setHasLoadError(true);
        onError?.(event);
      }}
    />
  );
}
