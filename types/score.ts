import type { JudgementCounts, RankGrade } from './game';

/** Score submission payload for POST /scores */
export interface ScoreSubmitPayload {
  beatmapId: string;
  score: number;
  accuracy: number;
  maxCombo: number;
  marvelous?: number;
  perfect?: number;
  great?: number;
  good?: number;
  bad?: number;
  miss?: number;
  accuracyHistory?: string;
  hitErrors?: string;
  mods?: string;
}

/** Score response from backend */
export interface ScoreResponse {
  id: string;
  userId: string;
  beatmapId: string;
  score: number;
  accuracy: number;
  maxCombo: number;
  marvelous: number;
  perfect: number;
  great: number;
  good: number;
  bad: number;
  miss: number;
  pp?: number;
  accuracyHistory: string | null;
  hitErrors: string | null;
  mods: string | null;
  rank: RankGrade;
  submittedAt: string;
}

/** Convert game judgements to score submit payload */
export function judgementsToPayload(judgements: JudgementCounts): Partial<ScoreSubmitPayload> {
  return {
    marvelous: judgements.marvelous,
    perfect: judgements.perfect,
    great: judgements.great,
    good: judgements.good,
    bad: judgements.bad,
    miss: judgements.miss,
  };
}
