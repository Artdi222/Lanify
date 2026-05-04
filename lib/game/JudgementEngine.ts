import type { JudgementType } from "@/types/game";

/** osu!mania hit windows based on OD (Overall Difficulty) */
interface HitWindows {
  marvelous: number;
  perfect: number;
  great: number;
  good: number;
  bad: number;
}

/**
 * JudgementEngine — Determines hit accuracy based on osu!mania hit windows.
 * Uses standard osu!mania Score V1 hit windows.
 */
export class JudgementEngine {
  private hitWindows: HitWindows;

  constructor(od: number) {
    // osu!mania hit windows (in ms) based on OD
    // Source: osu! wiki
    // i adjust to make it easier lol
    this.hitWindows = {
      marvelous: 22,
      perfect: 74 - 3 * od,
      great: 108 - 3 * od,
      good: 138 - 3 * od,
      bad: 162 - 3 * od,
    };
  }

  /**
   * Judge a note hit.
   * @param hitTime - The time the key was pressed (ms)
   * @param noteTime - The time the note should be hit (ms)
   * @returns Judgement type and error in ms (negative = early, positive = late)
   */
  judge(hitTime: number, noteTime: number): { type: JudgementType; errorMs: number } {
    const errorMs = hitTime - noteTime;
    const absError = Math.abs(errorMs);

    if (absError <= this.hitWindows.marvelous) {
      return { type: "MARVELOUS", errorMs };
    }
    if (absError <= this.hitWindows.perfect) {
      return { type: "PERFECT", errorMs };
    }
    if (absError <= this.hitWindows.great) {
      return { type: "GREAT", errorMs };
    }
    if (absError <= this.hitWindows.good) {
      return { type: "GOOD", errorMs };
    }
    if (absError <= this.hitWindows.bad) {
      return { type: "BAD", errorMs };
    }

    return { type: "MISS", errorMs };
  }

  /** Get the max hit window (beyond which notes are missed) */
  getMissWindow(): number {
    return this.hitWindows.bad;
  }

  /** Get all hit window values */
  getWindows(): HitWindows {
    return { ...this.hitWindows };
  }
}
