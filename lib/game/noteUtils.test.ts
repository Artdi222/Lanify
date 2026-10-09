import { describe, expect, test } from "bun:test";
import type { ParsedNote } from "@/types/game";
import { BeatmapParser } from "./BeatmapParser";
import { advanceFirstVisible, cloneNotes, holdEndKey } from "./noteUtils";

const tap = (startTime: number, column = 0) => ({ column, startTime, endTime: startTime, isHoldNote: false }) as ParsedNote;
const hold = (startTime: number, endTime: number, column = 0) => ({ column, startTime, endTime, isHoldNote: true }) as ParsedNote;

describe("cloneNotes", () => {
  const osu = [
    "[General]", "AudioFilename: a.mp3", "Mode: 3",
    "[Difficulty]", "CircleSize:4", "OverallDifficulty:8", "HPDrainRate:5",
    "[HitObjects]", "64,192,1000,1,0,0:0:0:0:", "320,192,2000,128,0,3500:0:0:0:0:",
  ].join("\n");

  test("copies every field and is independent of the source", () => {
    const src = BeatmapParser.parse(osu).notes;
    const copy = cloneNotes(src);
    expect(copy).toEqual(src);
    expect(copy[0]).not.toBe(src[0]);
    copy[0].hit = true;
    copy[1].ticksHit = 99;
    expect(src[0].hit).toBe(false);
    expect(src[1].ticksHit).toBe(0);
  });

  test("a parsed note is flat (primitives only), so a shallow copy is a full copy", () => {
    // If someone adds a nested object/array field to ParsedNote this fails, and cloneNotes must become deep.
    for (const n of BeatmapParser.parse(osu).notes) {
      for (const v of Object.values(n)) expect(v === null || typeof v !== "object").toBe(true);
    }
  });
});

describe("holdEndKey", () => {
  test("is unique per (column, time) and stable", () => {
    const keys = new Set<number>();
    for (let col = 0; col < 10; col++) for (const t of [0, 1, 999, 1000, 60_000, 599_999]) keys.add(holdEndKey(col, t));
    expect(keys.size).toBe(10 * 6);
    expect(holdEndKey(3, 4200)).toBe(holdEndKey(3, 4200));
    expect(holdEndKey(3, 4200)).not.toBe(holdEndKey(4, 4200));
  });
});

describe("advanceFirstVisible", () => {
  test("skips taps that are entirely behind the visible window", () => {
    const notes = [tap(0), tap(100), tap(200), tap(5000)];
    expect(advanceFirstVisible(notes, 0, 150)).toBe(2); // 0 and 100 are past, 200 is not
  });

  test("a long hold that is still on screen blocks the pointer (never skips a visible note)", () => {
    const notes = [tap(0), hold(100, 9000), tap(200), tap(300)];
    expect(advanceFirstVisible(notes, 0, 1000)).toBe(1); // stops at the hold even though later taps are past
  });

  test("a finished hold is passed", () => {
    const notes = [hold(100, 900), tap(200), tap(5000)];
    expect(advanceFirstVisible(notes, 0, 1000)).toBe(2);
  });

  test("never moves backwards and never runs past the end", () => {
    const notes = [tap(0), tap(1)];
    expect(advanceFirstVisible(notes, 1, 0)).toBe(1);
    expect(advanceFirstVisible(notes, 0, 1e9)).toBe(2);
    expect(advanceFirstVisible([], 0, 100)).toBe(0);
  });

  test("starting from the pointer gives the same answer as scanning from 0", () => {
    const notes = Array.from({ length: 200 }, (_, i) => (i % 17 === 0 ? hold(i * 50, i * 50 + 400) : tap(i * 50)));
    let ptr = 0;
    for (let t = 0; t < 11_000; t += 37) {
      ptr = advanceFirstVisible(notes, ptr, t - 500);
      expect(ptr).toBe(advanceFirstVisible(notes, 0, t - 500));
    }
  });
});
