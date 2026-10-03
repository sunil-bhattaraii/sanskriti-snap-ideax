import React, { useEffect, useState } from 'react';
import { Image, type ImageProps } from 'react-native';
import { getCachedImageUri } from '@/services/image-cache';

type CachedImageProps = Omit<ImageProps, 'source'> & {
  remoteUri?: string | null;
};

export default function CachedImage({ remoteUri, ...props }: CachedImageProps) {
  const [localUri, setLocalUri] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLocalUri(null);
    void getCachedImageUri(remoteUri).then((uri) => {
      if (mounted) setLocalUri(uri);
    });
    return () => {
      mounted = false;
    };
  }, [remoteUri]);

  return <Image {...props} source={{ uri: localUri ?? remoteUri ?? '' }} />;
}
