import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from './api';

export type CollectionItem = {
  id: string; title: string; location: string; xp: number;
  imageUrl: string; rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  isDiscovered: boolean;
};
export type QuestListItem = {
  id: string; name: string; description: string; imageUrl: string;
  current_progress: number; total_progress: number; xp_reward: number;
  has_badge_reward: boolean; is_favorite: boolean; completed: boolean;
};
export type QuestArtifact = {
  id: string; name: string; location: string; imageUrl: string; isDiscovered: boolean;
};
export type QuestDetails = QuestListItem & {
  category: string; heroImageUrl: string; totalArtifacts: number;
  discoveredCount: number; xpReward: number; badgeName?: string;
  artifacts: QuestArtifact[];
};

const cacheKey = (userId: string | null) => `@sanskriti_quests_${userId ?? 'guest'}`;
const collectionCacheKey = (userId: string | null) => `@sanskriti_collection_${userId ?? 'guest'}`;
const questDetailsCacheKey = (questId: string) => `@sanskriti_quest_details_${questId}`;

function mapCollectionItems(items: Array<Record<string, unknown>>): CollectionItem[] {
  return items.map((item) => ({
    id: String(item.id),
    title: String(item.name ?? ''),
    location: String(item.humanReadableLocation ?? ''),
    xp: Number(item.xpReward ?? 0),
    imageUrl: String(item.coverImageUrl ?? ''),
    rarity: (item.rarity as CollectionItem['rarity']) ?? 'Common',
    isDiscovered: true,
  }));
}

export async function fetchCollection(userId: string | null) {
  const response = await apiRequest<{ items: Array<Record<string, unknown>> }>('/collection');
  const items = mapCollectionItems(response.items);
  await AsyncStorage.setItem(collectionCacheKey(userId), JSON.stringify(items));
  return items;
}

export async function readCollectionCache(userId: string | null): Promise<CollectionItem[] | null> {
  const cached = await AsyncStorage.getItem(collectionCacheKey(userId));
  return cached ? (JSON.parse(cached) as CollectionItem[]) : null;
}

export async function fetchQuests(userId: string | null) {
  const result = await apiRequest<{ items: Array<Record<string, unknown>> }>('/quests');
  const quests = result.items.map((item) => ({
    id: String(item.id),
    name: String(item.name ?? ''),
    description: String(item.description ?? ''),
    imageUrl: '',
    current_progress: Number(item.discoveredCount ?? 0),
    total_progress: Number(item.artifactCount ?? 0),
    xp_reward: Number(item.xpReward ?? 0),
    has_badge_reward: Boolean(item.badge),
    is_favorite: false,
    completed: Boolean(item.completed),
  }));
  await AsyncStorage.setItem(cacheKey(userId), JSON.stringify(quests));
  return quests;
}

export async function readQuestCache(userId: string | null) {
  const value = await AsyncStorage.getItem(cacheKey(userId));
  return value ? (JSON.parse(value) as QuestListItem[]) : null;
}
export function warmQuestCache(userId: string | null) {
  return fetchQuests(userId);
}
export async function invalidateQuestCache(userId: string | null) {
  await AsyncStorage.removeItem(cacheKey(userId));
}
export function refreshQuestCache(userId: string | null) {
  return fetchQuests(userId);
}
function mapQuestDetails(item: Record<string, unknown>): QuestDetails {
  return {
    id: String(item.id),
    name: String(item.name ?? ''),
    description: String(item.description ?? ''),
    imageUrl: '',
    category: 'Heritage',
    heroImageUrl: String(item.artifacts && Array.isArray(item.artifacts) ? item.artifacts[0]?.coverImageUrl ?? '' : ''),
    current_progress: Number(item.discoveredCount ?? 0),
    total_progress: Number(item.artifactCount ?? 0),
    totalArtifacts: Number(item.artifactCount ?? 0),
    discoveredCount: Number(item.discoveredCount ?? 0),
    xp_reward: Number(item.xpReward ?? 0),
    xpReward: Number(item.xpReward ?? 0),
    has_badge_reward: Boolean(item.badge),
    is_favorite: false,
    completed: Boolean(item.completed),
    badgeName: item.badge && typeof item.badge === 'object'
      ? String((item.badge as { name?: string }).name ?? '')
      : undefined,
    artifacts: Array.isArray(item.artifacts)
      ? item.artifacts.map((artifact) => {
        const value = artifact as Record<string, unknown>;
        return {
          id: String(value.id),
          name: String(value.name ?? ''),
          location: String(value.humanReadableLocation ?? ''),
          imageUrl: String(value.coverImageUrl ?? ''),
          isDiscovered: Boolean(value.discovered),
        };
      })
      : [],
  };
}

export async function fetchQuestDetails(questId: string, _userId: string | null) {
  const details = await apiRequest<Record<string, unknown>>(`/quests/${questId}`)
    .then(mapQuestDetails);
  await AsyncStorage.setItem(questDetailsCacheKey(questId), JSON.stringify(details));
  return details;
}

export async function readQuestDetailsCache(questId: string): Promise<QuestDetails | null> {
  const cached = await AsyncStorage.getItem(questDetailsCacheKey(questId));
  return cached ? (JSON.parse(cached) as QuestDetails) : null;
}
