// src/app/(tabs)/empty-collection.tsx
import { Redirect } from 'expo-router';

export default function EmptyCollectionScreen() {
  return <Redirect href="/(tabs)/collection" />;
}
