import type { Database } from '@/services/backendClient';

export type LeaderboardRow = Database['public']['Views']['leaderboard']['Row'];

export interface LeaderboardUser {
    id: string;
    username: string;
    display_name: string;
    profile_image_url: string | null;
    lifetime_xp: number;
    rank: number;
    level: number;
    isCurrentUser?: boolean;
}

export function getLevelFromXp(lifetimeXp: number): number {
    return Math.floor(lifetimeXp / 1000) + 1;
}

export function normalizeLeaderboardRow(row: LeaderboardRow): LeaderboardUser | null {
    if (
        row.id === null ||
        row.username === null ||
        row.display_name === null ||
        row.lifetime_xp === null ||
        row.rank === null
    ) {
        return null;
    }

    return {
        id: row.id,
        username: row.username,
        display_name: row.display_name,
        profile_image_url: row.profile_image_url,
        lifetime_xp: row.lifetime_xp,
        rank: row.rank,
        level: getLevelFromXp(row.lifetime_xp),
    };
}
