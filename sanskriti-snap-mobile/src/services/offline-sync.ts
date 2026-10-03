import { getCachedImageUri } from './image-cache';
import { warmExploreCache, readExploreCache } from './explore-data';
import { warmLeaderboardCache } from './leaderboard-data';
import { fetchCollection, warmQuestCache } from './progress';
import { offlineFirstRequest } from './cached-api';

type FeaturedResponse = {
  items: Array<{ coverImageUrl: string | null }>;
};

let syncPromise: Promise<void> | null = null;

export function syncOfflineData(userId: string | null): Promise<void> {
  if (syncPromise) return syncPromise;

  syncPromise = (async () => {
    const imageUrls = new Set<string>();
    const [explore, leaderboard, quests, collection, featured] =
      await Promise.allSettled([
        warmExploreCache(),
        warmLeaderboardCache(),
        warmQuestCache(userId),
        fetchCollection(userId),
        offlineFirstRequest<FeaturedResponse>(
          '/artifacts/featured?limit=3',
          ['featured-artifacts', 'featured-sync'],
        ),
      ]);

    if (explore.status === 'fulfilled') {
      (await readExploreCache())?.artifacts.forEach((artifact) =>
        artifact.reference_images.forEach((url) => imageUrls.add(url)),
      );
    }
    if (collection.status === 'fulfilled') {
      collection.value.forEach((item) => item.imageUrl && imageUrls.add(item.imageUrl));
    }
    if (featured.status === 'fulfilled') {
      featured.value.items.forEach((item) => item.coverImageUrl && imageUrls.add(item.coverImageUrl));
    }

    await Promise.all([...imageUrls].map((url) => getCachedImageUri(url)));
    console.info('[offline-sync] completed', {
      userId,
      datasets: {
        explore: explore.status,
        leaderboard: leaderboard.status,
        quests: quests.status,
        collection: collection.status,
        featured: featured.status,
      },
      images: imageUrls.size,
    });
  })().finally(() => {
    syncPromise = null;
  });

  return syncPromise;
}