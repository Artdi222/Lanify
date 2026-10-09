import { describe, expect, test } from "bun:test";
import { CURVE, rowOffset } from "./curve";

const card = (selected = false) => ({ kind: "card" as const, selected });
const diff = (selected = false) => ({ kind: "diff" as const, selected });

describe("rowOffset", () => {
  test("header dan kartu terpilih memakai posisi tetap, tidak tergantung jarak", () => {
    expect(rowOffset({ kind: "header" }, 300)).toBe(CURVE.header);
    expect(rowOffset(card(true), 300)).toBe(CURVE.selectedSet);
    expect(rowOffset(diff(true), 0)).toBe(CURVE.selectedDiff);
  });
  test("cocok dengan titik foto (x layar - 1040) dalam ±10 px", () => {
    const photo: [number, number][] = [[5, 140], [123, 150], [187, 160], [251, 170], [283, 173], [315, 185], [405, 220]];
    for (const [d, x] of photo) expect(Math.abs(rowOffset(diff(), d) - x)).toBeLessThanOrEqual(10);
  });
  test("simetris atas-bawah dan naik monoton menjauhi tengah", () => {
    expect(rowOffset(card(), -190)).toBe(rowOffset(card(), 190));
    let prev = -Infinity;
    for (let d = 0; d <= 600; d += 20) {
      const o = rowOffset(diff(), d);
      expect(o).toBeGreaterThanOrEqual(prev);
      prev = o;
    }
  });
  test("dibatasi max", () => {
    expect(rowOffset(card(), 5000)).toBe(CURVE.max);
  });
});
