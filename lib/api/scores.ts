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

/** NM star rating and the pp of a perfect play, for the result screen's breakdown. */
export async function getBeatmapPerformance(beatmapId: string) {
  return apiClient<{ starRating: number; maxCombo: number; maxPp: number }>(`/scores/performance/${beatmapId}`);
}
