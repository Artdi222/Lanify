import { describe, expect, test } from "bun:test";
import { FPS_LIMIT_OPTIONS, RENDER_SCALE_OPTIONS, resolveMaxFps, resolveResolution } from "./RenderSettings";

describe("resolveResolution", () => {
  test("0 means auto: the device pixel ratio", () => {
    expect(resolveResolution(0, 2)).toBe(2);
    expect(resolveResolution(0, 1.25)).toBe(1.25);
  });
  test("an explicit scale wins over the device pixel ratio", () => {
    expect(resolveResolution(1, 2)).toBe(1);
    expect(resolveResolution(0.75, 2)).toBe(0.75);
  });
  test("clamps to a sane range", () => {
    expect(resolveResolution(0.1, 1)).toBe(0.5);
    expect(resolveResolution(10, 1)).toBe(3);
  });
  test("bad or missing values (old saved settings) fall back to auto", () => {
    expect(resolveResolution(Number.NaN, 2)).toBe(2);
    expect(resolveResolution(undefined as unknown as number, 2)).toBe(2);
    expect(resolveResolution(-1, 2)).toBe(2);
  });
  test("a bad device pixel ratio never yields 0", () => {
    expect(resolveResolution(0, 0)).toBe(1);
    expect(resolveResolution(0, Number.NaN)).toBe(1);
  });
});

describe("resolveMaxFps", () => {
  test("0 means unlimited", () => {
    expect(resolveMaxFps(0)).toBe(0);
  });
  test("accepts normal caps", () => {
    for (const fps of [30, 60, 120, 144, 240]) expect(resolveMaxFps(fps)).toBe(fps);
  });
  test("a cap too low to play (or invalid) means unlimited, never a slideshow", () => {
    expect(resolveMaxFps(5)).toBe(0);
    expect(resolveMaxFps(-60)).toBe(0);
    expect(resolveMaxFps(Number.NaN)).toBe(0);
    expect(resolveMaxFps(undefined as unknown as number)).toBe(0);
  });
});

describe("option lists", () => {
  test("offer auto/unlimited first and only values the resolvers accept", () => {
    expect(RENDER_SCALE_OPTIONS[0].value).toBe(0);
    expect(FPS_LIMIT_OPTIONS[0].value).toBe(0);
    for (const o of FPS_LIMIT_OPTIONS) expect(resolveMaxFps(o.value)).toBe(o.value);
    for (const o of RENDER_SCALE_OPTIONS.slice(1)) expect(resolveResolution(o.value, 1)).toBe(o.value);
  });
});
