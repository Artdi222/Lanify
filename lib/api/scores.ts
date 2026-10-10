import type { ScoreSubmitPayload, ScoreResponse } from '@/types/score';
import { apiClient } from './client';

/** Submit a score (protected — requires JWT) */
export async function submitScore(
  data: ScoreSubmitPayload,
  token: string
): Promise<ScoreResponse> {
  return apiClient<ScoreResponse>('/scores', {
    method: 'POST',
    body: data,
    token,
  });
}

/** Get scores for a beatmap */
export async function getScoresForBeatmap(
  beatmapId: string
): Promise<ScoreResponse[]> {
  return apiClient<ScoreResponse[]>(`/scores/${beatmapId}`);
}

export type BeatmapPerformance = { starRating: number; maxCombo: number; maxPp: number };

// ponytail: memoized per beatmap (the value never changes); failed lookups are dropped so they retry.
const perfRequests = new Map<string, Promise<BeatmapPerformance>>();
const perfValues = new Map<string, BeatmapPerformance>();

/** Already-loaded value, for rendering without waiting a tick. */
export const peekBeatmapPerformance = (beatmapId: string) => perfValues.get(beatmapId);

/** NM star rating and the pp of a perfect play, for the result screen's breakdown. */
export function getBeatmapPerformance(beatmapId: string): Promise<BeatmapPerformance> {
  let req = perfRequests.get(beatmapId);
  if (!req) {
    req = apiClient<BeatmapPerformance>(`/scores/performance/${beatmapId}`);
    req.then((v) => perfValues.set(beatmapId, v)).catch(() => perfRequests.delete(beatmapId));
    perfRequests.set(beatmapId, req);
  }
  return req;
}

/** Graph data of one score (left out of leaderboard lists to keep them small). */
export async function getScoreDetail(scoreId: string) {
  return apiClient<{ accuracyHistory: string | null; hitErrors: string | null }>(`/scores/detail/${scoreId}`);
}
