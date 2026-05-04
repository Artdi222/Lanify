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
