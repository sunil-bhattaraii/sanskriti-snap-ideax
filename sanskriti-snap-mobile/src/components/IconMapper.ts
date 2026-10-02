// src/components/IconMapper.ts
// Utility to map Material Icons to Ionicons (Expo compatible)

export const getIconName = (materialIcon: string): keyof typeof import('@expo/vector-icons').Ionicons.glyphMap => {
  const iconMap: Record<string, keyof typeof import('@expo/vector-icons').Ionicons.glyphMap> = {
    arrow_back: 'arrow-back',
    settings: 'settings-outline',
    star: 'star',
    workspace_premium: 'award',
    military_tech: 'trophy',
    leaderboard: 'stats-chart',
    library_books: 'library',
    bookmark: 'bookmark-outline',
    redeem: 'gift',
    explore: 'compass-outline',
    map: 'map-outline',
    person: 'person',
    chevron_right: 'chevron-forward',
  };
  
  return iconMap[materialIcon] || 'circle-outline';
};    