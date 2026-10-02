import { Ionicons } from '@expo/vector-icons';

export function getCategoryIcon(
  category: string
): keyof typeof Ionicons.glyphMap {
  switch (category) {
    case 'temple':
      return 'home-outline';
    case 'statue':
      return 'body-outline';
    case 'carving':
      return 'hammer-outline';
    case 'architecture':
      return 'business-outline';
    case 'site':
      return 'location-outline';
    default:
      return 'compass-outline';
  }
}
