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

// ponytail: memoized per beatmap/mods/total (the value never changes); failed lookups are dropped so they retry.
const perfRequests = new Map<string, Promise<BeatmapPerformance>>();
const perfValues = new Map<string, BeatmapPerformance>();
const perfKey = (id: string, mods: string, total?: number) => `${id}|${mods}|${total ?? ""}`;

/** Already-loaded value, for rendering without waiting a tick. */
export const peekBeatmapPerformance = (beatmapId: string, mods = "", total?: number) => perfValues.get(perfKey(beatmapId, mods, total));

/**
 * Star rating (for `mods`, e.g. "DTHD") and the pp of a perfect play, for the result screen's breakdown.
 * `total` = the play's judgement count, which makes "Maximum" exact; without it the backend uses max combo.
 */
export function getBeatmapPerformance(beatmapId: string, mods = "", total?: number): Promise<BeatmapPerformance> {
  const key = perfKey(beatmapId, mods, total);
  let req = perfRequests.get(key);
  if (!req) {
    const q = new URLSearchParams();
    if (mods) q.set("mods", mods);
    if (total) q.set("total", String(total));
    req = apiClient<BeatmapPerformance>(`/scores/performance/${beatmapId}${q.size ? `?${q}` : ""}`);
    req.then((v) => perfValues.set(key, v)).catch(() => perfRequests.delete(key));
    perfRequests.set(key, req);
  }
  return req;
}

/** Graph data of one score (left out of leaderboard lists to keep them small). */
export async function getScoreDetail(scoreId: string) {
  return apiClient<{ accuracyHistory: string | null; hitErrors: string | null }>(`/scores/detail/${scoreId}`);
}
