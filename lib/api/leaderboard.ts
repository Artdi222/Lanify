import type { LeaderboardEntry } from '@/types/game';
import { apiClient } from './client';

/** Get leaderboard for a specific beatmap */
export async function getLeaderboard(
  beatmapId: string,
  scope: 'GLOBAL' | 'LOCAL' | 'FRIENDS' = 'GLOBAL',
  token?: string | null
): Promise<LeaderboardEntry[]> {
  if (scope === 'LOCAL' && token) {
    return apiClient<LeaderboardEntry[]>(`/leaderboard/${beatmapId}/local`, {
      token,
    });
  }
  return apiClient<LeaderboardEntry[]>(`/leaderboard/${beatmapId}`);
}

/** Get global leaderboard */
export async function getGlobalLeaderboard(): Promise<LeaderboardEntry[]> {
  return apiClient<LeaderboardEntry[]>('/leaderboard/global');
}
