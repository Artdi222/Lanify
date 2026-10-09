import { beforeEach, describe, expect, test } from "bun:test";
import type { ParsedBeatmap, ParsedNote } from "@/types/game";
import { useGameStore } from "./useGameStore";

const note = (isHoldNote: boolean, totalTicks = 0) => ({ isHoldNote, totalTicks }) as ParsedNote;
const beatmap = (notes: ParsedNote[]) => ({ id: "map-1", notes }) as unknown as ParsedBeatmap;
const s = () => useGameStore.getState();

beforeEach(() => {
  s().resetGame();
});

describe("useGameStore.updateJudgement", () => {
  test("startGame computes the score denominator once, from the chart", () => {
    s().startGame(beatmap([note(false), note(false), note(true, 3)]));
    expect(s().maxScoreUnits).toBe((1 + 1 + 2 + 3) * 320);
  });

  test("a perfect run reaches 1,000,000 and 100% accuracy", () => {
    s().startGame(beatmap([note(false), note(false), note(false)]));
    for (let i = 0; i < 3; i++) s().updateJudgement("MARVELOUS", 0, i * 100);
    expect(s().score).toBe(1_000_000);
    expect(s().accuracy).toBe(100);
    expect(s().combo).toBe(3);
  });

  test("falls back to the chart when maxScoreUnits was never set", () => {
    useGameStore.setState({ currentBeatmap: beatmap([note(false), note(false)]), maxScoreUnits: 0 });
    s().updateJudgement("MARVELOUS", 0, 0);
    expect(s().maxScoreUnits).toBe(2 * 320);
    expect(s().score).toBe(500_000);
  });

  test("history grows in place during a run: no per-hit array copies", () => {
    s().startGame(beatmap([note(false), note(false)]));
    const acc = s().accuracyHistory;
    const errs = s().hitErrors;
    s().updateJudgement("MARVELOUS", -3, 100);
    s().updateJudgement("MISS", 99, 200);
    expect(s().accuracyHistory).toBe(acc);
    expect(s().hitErrors).toBe(errs);
    expect(acc.map((p) => p.time)).toEqual([100, 200]);
    expect(errs).toEqual([{ time: 100, errorMs: -3 }]); // misses never enter hitErrors
  });

  test("a new run never reuses or mutates the previous run's history", () => {
    s().startGame(beatmap([note(false)]));
    s().updateJudgement("MARVELOUS", 0, 10);
    const old = s().accuracyHistory;
    const oldErrs = s().hitErrors;

    s().retryGame();
    expect(s().accuracyHistory).not.toBe(old);
    s().updateJudgement("PERFECT", 5, 20);
    expect(old.length).toBe(1);
    expect(oldErrs.length).toBe(1);

    s().startGame(beatmap([note(false)]));
    expect(s().accuracyHistory).toEqual([]);
    expect(s().hitErrors).toEqual([]);
  });

  test("a batch behaves like repeated singles for score, combo and counts", () => {
    const notes = [note(true, 6), ...Array.from({ length: 5 }, () => note(false))];
    s().startGame(beatmap(notes));
    s().updateJudgement("MARVELOUS", 0, 1, 1 / 8); // head
    s().updateJudgement("PERFECT", 0, 2, 1 / 8, 6); // 6 ticks at once
    const batched = { score: s().score, combo: s().combo, j: { ...s().judgements }, hp: s().hp };

    s().startGame(beatmap(notes));
    s().updateJudgement("MARVELOUS", 0, 1, 1 / 8);
    for (let i = 0; i < 6; i++) s().updateJudgement("PERFECT", 0, 2, 1 / 8);
    expect(batched).toEqual({ score: s().score, combo: s().combo, j: s().judgements, hp: s().hp });
    expect(s().hitErrors.length).toBe(7); // one entry per judgement, as before
  });

  test("a MISS still resets combo and drains HP", () => {
    s().startGame(beatmap([note(false), note(false)]));
    s().updateJudgement("MARVELOUS", 0, 1);
    s().updateJudgement("MISS", 0, 2);
    expect(s().combo).toBe(0);
    expect(s().maxCombo).toBe(1);
    expect(s().hp).toBe(92); // 100 -> +2 clamped to 100 -> -8
  });
});
