import { Ionicons } from '@expo/vector-icons';

export function getCategoryIcon(
  category: string
): keyof typeof Ionicons.glyphMap {
  switch (category.trim().toLowerCase()) {
    case 'temple':
      return 'business-outline';
    case 'statue':
      return 'body-outline';
    case 'carving':
      return 'hammer-outline';
    case 'architecture':
      return 'business-outline';
    case 'site':
      return 'location-outline';
    case 'monument':
      return 'trophy-outline';
    case 'courtyard':
      return 'grid-outline';
    case 'cultural_object':
    case 'cultural object':
    case 'cultural-object':
      return 'color-palette-outline';
    case 'other':
      return 'compass-outline';
    default:
      return 'compass-outline';
  }
}
