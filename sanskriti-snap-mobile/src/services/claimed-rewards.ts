import { apiRequest } from './api';

export interface ClaimedReward {
  id: string;
  description: string;
  partnerName: string;
  pointsSpent: number;
  redeemedAt: string;
  status: 'pending' | 'verified' | 'redeemed' | 'expired';
}

export async function getClaimedRewards(userId: string): Promise<ClaimedReward[]> {
  return apiRequest<ClaimedReward[]>('/rewards/redemptions');
}
