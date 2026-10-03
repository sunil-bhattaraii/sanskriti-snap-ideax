import type { ImageSourcePropType } from 'react-native';

const mapIcons = {
  temple: require('../../assets/map-icons/temple.png'),
  statue: require('../../assets/map-icons/statue.png'),
  carving: require('../../assets/map-icons/carving.png'),
  architecture: require('../../assets/map-icons/architecture.png'),
  site: require('../../assets/map-icons/site.png'),
  monument: require('../../assets/map-icons/monument.png'),
  courtyard: require('../../assets/map-icons/courtyard.png'),
  cultural_object: require('../../assets/map-icons/cultural-item.png'),
  other: require('../../assets/map-icons/other.png'),
} satisfies Record<string, ImageSourcePropType>;

export function getCategoryIcon(category: string): ImageSourcePropType {
  const key = category.trim().toLowerCase().replace(/[-\s]/g, '_');
  return mapIcons[key as keyof typeof mapIcons] ?? mapIcons.other;
}
