import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from './api';

export type CollectionItem = {
  id: string; name: string; description: string; category: string;
  imageUrl: string; discoveredAt: string; xpValue: number;
};
export type QuestListItem = {
  id: string; title: string; description: string; imageUrl: string;
  artifactCount: number; discoveredCount: number; isCompleted: boolean;
};
export type QuestArtifact = {
  id: string; name: string; location: string; imageUrl: string; isDiscovered: boolean;
};
export type QuestDetails = QuestListItem & {
  artifacts: QuestArtifact[]; badgeName?: string;
};

const cacheKey = (userId: string | null) => `@sanskriti_quests_${userId ?? 'guest'}`;

export async function fetchCollection(_userId: string | null) {
  return apiRequest<CollectionItem[]>('/collection');
}

export async function fetchQuests(userId: string | null) {
  const result = await apiRequest<{ quests: QuestListItem[] } | QuestListItem[]>('/quests');
  const quests = Array.isArray(result) ? result : result.quests;
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
export function fetchQuestDetails(questId: string, _userId: string | null) {
  return apiRequest<QuestDetails>(`/quests/${questId}`);
}
