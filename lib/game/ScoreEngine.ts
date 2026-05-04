import type { JudgementType, RankGrade } from "@/types/game";

/**
 * ScoreEngine — osu!mania Score V1 calculations.
 */
export class ScoreEngine {
  private score: number = 0;
  private combo: number = 0;
  private maxCombo: number = 0;
  private totalNotes: number = 0;
  private weightedHits: number = 0;
  private maxWeightedHits: number = 0;

  private static WEIGHTS: Record<JudgementType, number> = {
    MARVELOUS: 320,
    PERFECT: 300,
    GREAT: 200,
    GOOD: 100,
    BAD: 50,
    MISS: 0,
  };

  private static ACC_WEIGHTS: Record<JudgementType, number> = {
    MARVELOUS: 300,
    PERFECT: 300,
    GREAT: 200,
    GOOD: 100,
    BAD: 50,
    MISS: 0,
  };

  /** Process a judgement and update score */
  processJudgement(type: JudgementType): {
    score: number;
    combo: number;
    maxCombo: number;
    accuracy: number;
  } {
    this.totalNotes++;
    this.maxWeightedHits += 300; // Maximum possible weight

    const baseScore = ScoreEngine.WEIGHTS[type];
    this.weightedHits += ScoreEngine.ACC_WEIGHTS[type];

    if (type === "MISS") {
      this.combo = 0;
    } else {
      this.combo++;
      if (this.combo > this.maxCombo) {
        this.maxCombo = this.combo;
      }
    }

    // Score V1: base + combo bonus
    const comboBonus = Math.floor(baseScore * this.combo * 0.01);
    this.score += baseScore + comboBonus;

    return {
      score: this.score,
      combo: this.combo,
      maxCombo: this.maxCombo,
      accuracy: this.getAccuracy(),
    };
  }

  /** Calculate current accuracy (0–100) */
  getAccuracy(): number {
    if (this.maxWeightedHits === 0) return 100;
    return (this.weightedHits / this.maxWeightedHits) * 100;
  }

  /** Determine rank based on accuracy */
  getRank(): RankGrade {
    const acc = this.getAccuracy();
    if (acc >= 100) return "SS";
    if (acc >= 95) return "S";
    if (acc >= 90) return "A";
    if (acc >= 80) return "B";
    if (acc >= 70) return "C";
    return "D";
  }

  /** Get current state */
  getState() {
    return {
      score: this.score,
      combo: this.combo,
      maxCombo: this.maxCombo,
      accuracy: this.getAccuracy(),
      rank: this.getRank(),
    };
  }

  /** Reset */
  reset(): void {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.totalNotes = 0;
    this.weightedHits = 0;
    this.maxWeightedHits = 0;
  }
}
