import { describe, expect, test } from "bun:test";
import { shouldPauseAmbient, shouldReduceMotion } from "./ambientMotion";

describe("shouldReduceMotion", () => {
  test("'system' follows prefers-reduced-motion", () => {
    expect(shouldReduceMotion("system", true)).toBe(true);
    expect(shouldReduceMotion("system", false)).toBe(false);
  });
  test("an explicit setting wins over the OS preference", () => {
    expect(shouldReduceMotion("on", false)).toBe(true);
    expect(shouldReduceMotion("off", true)).toBe(false);
  });
  test("missing value (old saved settings) behaves like 'system'", () => {
    expect(shouldReduceMotion(undefined, true)).toBe(true);
    expect(shouldReduceMotion(undefined, false)).toBe(false);
  });
});

describe("shouldPauseAmbient", () => {
  const base = { hidden: false, playing: false, reduceMotion: false };
  test("runs on a visible, idle menu", () => {
    expect(shouldPauseAmbient(base)).toBe(false);
  });
  test("pauses when the tab is hidden", () => {
    expect(shouldPauseAmbient({ ...base, hidden: true })).toBe(true);
  });
  test("pauses during gameplay", () => {
    expect(shouldPauseAmbient({ ...base, playing: true })).toBe(true);
  });
  test("pauses when motion is reduced", () => {
    expect(shouldPauseAmbient({ ...base, reduceMotion: true })).toBe(true);
  });
});
