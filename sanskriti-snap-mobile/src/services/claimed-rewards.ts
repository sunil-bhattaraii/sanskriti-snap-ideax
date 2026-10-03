import { apiRequest } from './api';

export interface ClaimedReward {
  id: string;
  rewardTitle: string;
  partnerName: string;
  pointsSpent: number;
  redeemedAt: string;
  status: 'pending' | 'verified' | 'redeemed' | 'expired' | 'confirmed';
}

type RedemptionResponse = {
  items: Array<{
    id: string;
    rewardId: string;
    rewardTitle: string;
    businessName: string;
    pointsSpent: number;
    status: 'PENDING' | 'VERIFIED' | 'REDEEMED' | 'EXPIRED' | 'CONFIRMED';
    code: string | null;
    redeemedAt: string;
  }>;
};

export async function getClaimedRewards(userId: string): Promise<ClaimedReward[]> {
  const response = await apiRequest<RedemptionResponse>('/rewards/redemptions');
  return response.items.map((item) => ({
    id: item.id,
    rewardTitle: item.rewardTitle,
    partnerName: item.businessName,
    pointsSpent: item.pointsSpent,
    redeemedAt: item.redeemedAt,
    status: item.status.toLowerCase() as ClaimedReward['status'],
  }));
}
