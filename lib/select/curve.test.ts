import { describe, expect, test } from "bun:test";
import { CURVE, rowOffsets } from "./curve";

const card = (selected = false) => ({ kind: "card" as const, selected });
const diff = (selected = false) => ({ kind: "diff" as const, selected });

describe("rowOffsets", () => {
  test("tanpa seleksi semua baris di base, header di nilai header", () => {
    expect(rowOffsets([{ kind: "header" }, card(), card()])).toEqual([CURVE.header, CURVE.base, CURVE.base]);
  });
  test("set terpilih paling kiri, difficulty terpilih sedikit lebih kanan", () => {
    const o = rowOffsets([card(), card(true), diff(), diff(true), diff()]);
    expect(o[1]).toBe(CURVE.selectedSet);
    expect(o[3]).toBe(CURVE.selectedDiff);
  });
  test("baris lain bertambah per jarak ke seleksi terdekat (kedua arah)", () => {
    const o = rowOffsets([card(), card(), card(), card(true), card(), card()]);
    expect(o[2]).toBe(CURVE.base);
    expect(o[4]).toBe(CURVE.base);
    expect(o[1]).toBe(CURVE.base + CURVE.step);
    expect(o[5]).toBe(CURVE.base + CURVE.step);
    expect(o[0]).toBe(CURVE.base + 2 * CURVE.step);
  });
  test("memakai seleksi terdekat bila ada dua (set dan difficulty) dan dibatasi max", () => {
    const rows = [card(true), diff(), diff(true), ...Array.from({ length: 30 }, () => card())];
    const o = rowOffsets(rows);
    expect(o[1]).toBe(CURVE.base);
    expect(o[rows.length - 1]).toBe(CURVE.max);
  });
});
