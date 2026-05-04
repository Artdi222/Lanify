/** Parsed difficulty info from a .osu file inside an .osz archive */
export interface DifficultyInfo {
  filename: string;
  title: string;
  titleUnicode: string;
  artist: string;
  artistUnicode: string;
  creator: string;
  /** Difficulty name (e.g. "Hard", "Insane") */
  version: string;
  /** osu! game mode — must be 3 for mania */
  mode: number;
  /** Key count, from CircleSize */
  keyCount: number;
  /** Overall Difficulty */
  od: number;
  /** HP Drain Rate */
  hp: number;
  /** Beats per minute (from first uninherited timing point) */
  bpm: number;
  /** Estimated song length in seconds (from last hit object) */
  lengthSeconds: number;
  /** Background image file name if present */
  coverFileName?: string;
  /** Extracted background image file if present */
  coverFile?: File;
  noteCount: number;
  holdCount: number;
}

/** Beatmap as returned from the API */
export interface Beatmap {
  id: string;
  title: string;
  artist: string;
  creator: string;
  difficultyName: string;
  keyCount: number;
  starRating: number;
  bpm: number;
  lengthSeconds: number;
  od: number;
  hp: number;
  coverUrl: string | null;
  filePath: string;
  rankedStatus: 'ranked' | 'loved' | 'qualified' | 'approved' | 'graveyard' | 'pending';
  noteCount: number;
  holdCount: number;
  playCount: number;
  favoriteCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Paginated beatmap list response */
export interface BeatmapListResponse {
  data: Beatmap[];
  total: number;
  page: number;
  limit: number;
}

/** Payload for creating a new beatmap */
export interface CreateBeatmapPayload {
  title: string;
  artist: string;
  creator: string;
  difficultyName: string;
  keyCount: number;
  starRating: number;
  bpm: number;
  lengthSeconds: number;
  od: number;
  hp: number;
  coverUrl?: string;
  filePath: string;
  noteCount?: number;
  holdCount?: number;
  rankedStatus?: 'ranked' | 'loved' | 'qualified' | 'approved' | 'graveyard' | 'pending';
}

/** Payload for batch creating multiple difficulties */
export interface CreateBeatmapBatchPayload {
  filePath: string;
  coverUrl?: string;
  rankedStatus?: 'ranked' | 'loved' | 'qualified' | 'approved' | 'graveyard' | 'pending';
  commonMetadata: {
    title: string;
    artist: string;
    creator: string;
  };
  difficulties: {
    difficultyName: string;
    keyCount: number;
    starRating: number;
    bpm: number;
    lengthSeconds: number;
    od: number;
    hp: number;
    noteCount: number;
    holdCount: number;
  }[];
}
