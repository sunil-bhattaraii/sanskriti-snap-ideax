// src/data/mockEmptyCollection.ts
export interface EmptyStateData {
  headerTitle: string;
  cardTitle: string;
  cardSubtitle: string;
  cardButtonText: string;
  mainTitle: string;
  mainSubtitle: string;
  ctaButtonText: string;
  artifactImage: string;
}

export const mockEmptyCollectionData: EmptyStateData = {
  headerTitle: 'My Collection',
  cardTitle: 'Your collection is empty.',
  cardSubtitle: 'Discover and add the locations to build your collection.',
  cardButtonText: 'Add to collection',
  mainTitle: 'Your collection is waiting',
  mainSubtitle: 'Discover your first heritage place to start building your personal museum of history.',
  ctaButtonText: 'Start Exploring',
  // Using a placeholder image of a stone artifact/pillar
  artifactImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBy84BYGz20jj30p9io7HuIvRYX4c8NnrVWpQ1LMMjp_RKwB5RA2ptHxs2_ByCxm3JCFQ0yo-HXHbZcaxeSXxhfRKl1wLX1FSgTb4cAbKaKrqXslK7zhJbsZ2Dra_oE5_OE_YRlHi6FINO0cJXMY7P1T40oTME5mHliwVYq8ST09rpkqrRUDx8mPSfyriDZLL-Up7axpuTCasoNV1FCASglRMMXYgew_yLz2gUYxmYuWEA1jjUM7EtD',
};