import { create } from 'zustand';
import type {
  GameStatus,
  JudgementCounts,
  AccuracyPoint,
  HitError,
  ParsedBeatmap,
  JudgementType,
  RankGrade,
  LeaderboardEntry,
} from '@/types/game';
import type { Beatmap } from '@/types/beatmap';

interface GameState {
  status: GameStatus;
  score: number;
  combo: number;
  maxCombo: number;
  accuracy: number;
  judgements: JudgementCounts;
  hp: number;
  accuracyHistory: AccuracyPoint[];
  hitErrors: HitError[];
  currentBeatmap: ParsedBeatmap | null;
  selectedBeatmapId: string | null;
  selectedBeatmap: Beatmap | null;
  beatmaps: Beatmap[];
  latestJudgement: { type: JudgementType; time: number } | null;
  isReadOnly: boolean;
  retryTrigger: number;

  leaderboardCache: Record<string, { entries: LeaderboardEntry[]; timestamp: number }>;

  // Actions
  setBeatmaps: (beatmaps: Beatmap[]) => void;
  setSelectedBeatmap: (beatmap: Beatmap | null) => void;
  startGame: (beatmap: ParsedBeatmap) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  startResuming: () => void;
  failGame: () => void;
  endGame: () => void;
  updateJudgement: (type: JudgementType, errorMs: number, time: number, weight?: number) => void;
  updateHp: (hp: number) => void;
  resetGame: () => void;
  retryGame: () => void;
  setSelectedBeatmapId: (id: string | null) => void;
  setViewingScore: (entry: LeaderboardEntry, beatmap?: Beatmap | null) => void;
  setLeaderboardCache: (key: string, entries: LeaderboardEntry[]) => void;
  invalidateLeaderboardCache: (beatmapId?: string) => void;
}

const initialJudgements: JudgementCounts = {
  marvelous: 0,
  perfect: 0,
  great: 0,
  good: 0,
  bad: 0,
  miss: 0,
};

function calculateAccuracy(judgements: JudgementCounts): number {
  const weights = {
    marvelous: 300,
    perfect: 300,
    great: 200,
    good: 100,
    bad: 50,
    miss: 0,
  };
  const total =
    judgements.marvelous +
    judgements.perfect +
    judgements.great +
    judgements.good +
    judgements.bad +
    judgements.miss;
  if (total === 0) return 100;
  const weightedSum =
    judgements.marvelous * weights.marvelous +
    judgements.perfect * weights.perfect +
    judgements.great * weights.great +
    judgements.good * weights.good +
    judgements.bad * weights.bad +
    judgements.miss * weights.miss;
  return (weightedSum / (total * 300)) * 100;
}

function calculateRank(accuracy: number): RankGrade {
  if (accuracy >= 100) return 'SS';
  if (accuracy >= 95) return 'S';
  if (accuracy >= 90) return 'A';
  if (accuracy >= 80) return 'B';
  if (accuracy >= 70) return 'C';
  return 'D';
}

export const useGameStore = create<GameState>()((set, get) => ({
  status: 'idle',
  score: 0,
  combo: 0,
  maxCombo: 0,
  accuracy: 100,
  judgements: { ...initialJudgements },
  hp: 100,
  accuracyHistory: [],
  hitErrors: [],
  currentBeatmap: null,
  selectedBeatmapId: null,
  selectedBeatmap: null,
  beatmaps: [],
  latestJudgement: null,
  isReadOnly: false,
  retryTrigger: 0,

  setBeatmaps: (beatmaps) => set({ beatmaps }),
  setSelectedBeatmap: (selectedBeatmap) => set({ selectedBeatmap, selectedBeatmapId: selectedBeatmap?.id || null }),

  startGame: (beatmap) =>
    set({
      status: 'playing',
      score: 0,
      combo: 0,
      maxCombo: 0,
      accuracy: 100,
      judgements: { ...initialJudgements },
      hp: 100,
      accuracyHistory: [],
      hitErrors: [],
      currentBeatmap: beatmap,
      selectedBeatmapId: beatmap.id,
      latestJudgement: null,
      isReadOnly: false,
    }),

  pauseGame: () => set({ status: 'paused' }),
  resumeGame: () => set({ status: 'playing' }),
  startResuming: () => set({ status: 'resuming' }),
  failGame: () => set({ status: 'failed' }),
  endGame: () => set({ status: 'complete' }),

  updateJudgement: (type, errorMs, time, weight = 1) => {
    const state = get();
    const key = type.toLowerCase() as keyof JudgementCounts;
    const newJudgements = { ...state.judgements, [key]: state.judgements[key] + 1 };

    const isMiss = type === 'MISS';
    const newCombo = isMiss ? 0 : state.combo + 1;
    const newMaxCombo = Math.max(state.maxCombo, newCombo);
    const newAccuracy = calculateAccuracy(newJudgements);

    // HP calculation
    const hpDelta = (isMiss ? -8 : type === 'BAD' ? -4 : type === 'GOOD' ? -1 : 2) * weight;
    const newHp = Math.max(0, Math.min(100, state.hp + hpDelta));

    // Max score is 1,000,000
    const totalNotes = state.currentBeatmap?.notes?.reduce((acc, note) => {
      if (!note.isHoldNote) return acc + 1;
      return acc + 2 + (note.totalTicks || 0); // Head (1) + Tail (1) + Ticks
    }, 0) || 1;
    const maxPossibleScore = totalNotes * 320;

    const currentScoreSum =
      newJudgements.marvelous * 320 +
      newJudgements.perfect * 300 +
      newJudgements.great * 200 +
      newJudgements.good * 100 +
      newJudgements.bad * 50;

    const newScore = Math.floor((currentScoreSum / maxPossibleScore) * 1000000);

    set({
      judgements: newJudgements,
      combo: newCombo,
      maxCombo: newMaxCombo,
      accuracy: newAccuracy,
      hp: newHp,
      score: newScore,
      accuracyHistory: [...state.accuracyHistory, { time, accuracy: newAccuracy }],
      hitErrors: isMiss ? state.hitErrors : [...state.hitErrors, { time, errorMs }],
      latestJudgement: { type, time: Date.now() },
    });
  },

  updateHp: (hp) => set({ hp: Math.max(0, Math.min(100, hp)) }),

  resetGame: () =>
    set({
      status: 'idle',
      score: 0,
      combo: 0,
      maxCombo: 0,
      accuracy: 100,
      judgements: { ...initialJudgements },
      hp: 100,
      accuracyHistory: [],
      hitErrors: [],
      currentBeatmap: null,
      latestJudgement: null,
      isReadOnly: false,
    }),

  retryGame: () =>
    set((state) => ({
      status: 'playing',
      score: 0,
      combo: 0,
      maxCombo: 0,
      accuracy: 100,
      judgements: { ...initialJudgements },
      hp: 100,
      accuracyHistory: [],
      hitErrors: [],
      latestJudgement: null,
      isReadOnly: false,
      retryTrigger: state.retryTrigger + 1,
    })),

  setSelectedBeatmapId: (id) => set({ selectedBeatmapId: id }),

  setViewingScore: (entry, beatmap) =>
    set({
      score: entry.score,
      accuracy: entry.accuracy,
      maxCombo: entry.maxCombo,
      judgements: { ...entry.judgements },
      accuracyHistory: typeof entry.accuracyHistory === 'string' ? JSON.parse(entry.accuracyHistory) : [],
      hitErrors: typeof entry.hitErrors === 'string' ? JSON.parse(entry.hitErrors) : [],
      isReadOnly: true,
      status: 'complete',
      currentBeatmap: beatmap
        ? {
            id: beatmap.id,
            title: beatmap.title,
            artist: beatmap.artist,
            creator: beatmap.creator,
            difficultyName: beatmap.difficultyName,
            keyCount: beatmap.keyCount,
            od: beatmap.od,
            hp: beatmap.hp,
            bpm: beatmap.bpm,
            lengthMs: beatmap.lengthSeconds * 1000,
            notes: [],
            audioUrl: '',
            backgroundUrl: beatmap.coverUrl || '',
          }
        : get().currentBeatmap,
    }),

  leaderboardCache: {},

  setLeaderboardCache: (key, entries) =>
    set((state) => ({
      leaderboardCache: {
        ...state.leaderboardCache,
        [key]: { entries, timestamp: Date.now() },
      },
    })),

  invalidateLeaderboardCache: (beatmapId) => {
    if (!beatmapId) {
      set({ leaderboardCache: {} });
      return;
    }
    set((state) => {
      const newCache = { ...state.leaderboardCache };
      Object.keys(newCache).forEach((key) => {
        if (key.startsWith(beatmapId)) {
          delete newCache[key];
        }
      });
      return { leaderboardCache: newCache };
    });
  },
}));

export { calculateRank };
