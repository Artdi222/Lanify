import { describe, expect, test } from "bun:test";
import { relativeTime, shortRank } from "./format";

const NOW = Date.parse("2026-10-09T12:00:00Z");
const ago = (ms: number) => new Date(NOW - ms).toISOString();
const MIN = 60_000, HOUR = 60 * MIN, DAY = 24 * HOUR;

describe("relativeTime", () => {
  test("satuan menit, jam, hari", () => {
    expect(relativeTime(ago(10_000), NOW)).toBe("now");
    expect(relativeTime(ago(5 * MIN), NOW)).toBe("5m");
    expect(relativeTime(ago(3 * HOUR), NOW)).toBe("3h");
    expect(relativeTime(ago(2 * DAY), NOW)).toBe("2d");
  });
  test("bulan dan tahun memakai akhiran lazer (mos, yr)", () => {
    expect(relativeTime(ago(40 * DAY), NOW)).toBe("1mos");
    expect(relativeTime(ago(200 * DAY), NOW)).toBe("6mos");
    expect(relativeTime(ago(330 * DAY), NOW)).toBe("11mos");
    expect(relativeTime(ago(400 * DAY), NOW)).toBe("1yr");
  });
  test("tanggal tidak valid atau di masa depan tidak melempar", () => {
    expect(relativeTime("bukan tanggal", NOW)).toBe("");
    expect(relativeTime(ago(-5 * DAY), NOW)).toBe("now");
  });
});

describe("shortRank", () => {
  test("ribuan disingkat", () => {
    expect(shortRank(12)).toBe("#12");
    expect(shortRank(999)).toBe("#999");
    expect(shortRank(2915)).toBe("#2.9k");
  });
});
