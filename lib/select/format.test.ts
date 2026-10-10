import { describe, expect, test } from "bun:test";
import { relativeTimeLong, shortRank } from "./format";

const NOW = Date.parse("2026-10-09T12:00:00Z");
const ago = (ms: number) => new Date(NOW - ms).toISOString();
const MIN = 60_000, HOUR = 60 * MIN, DAY = 24 * HOUR;

describe("shortRank", () => {
  test("ribuan disingkat", () => {
    expect(shortRank(12)).toBe("#12");
    expect(shortRank(999)).toBe("#999");
    expect(shortRank(2915)).toBe("#2.9k");
  });
});

describe("relativeTimeLong", () => {
  test("spells units out with plurals", () => {
    expect(relativeTimeLong(ago(10_000), NOW)).toBe("just now");
    expect(relativeTimeLong(ago(MIN), NOW)).toBe("1 minute ago");
    expect(relativeTimeLong(ago(3 * HOUR), NOW)).toBe("3 hours ago");
    expect(relativeTimeLong(ago(DAY), NOW)).toBe("1 day ago");
    expect(relativeTimeLong(ago(65 * DAY), NOW)).toBe("2 months ago");
    expect(relativeTimeLong(ago(800 * DAY), NOW)).toBe("2 years ago");
    expect(relativeTimeLong("garbage", NOW)).toBe("");
  });
});
