import { describe, expect, test } from "bun:test";
import { buildRows, selectedRowIndex, type RowItem } from "./rows";

type D = { id: string };
const d = (id: string): D => ({ id });
const item = (id: string, diffs: string[]): RowItem<D> => ({ id, allDifficulties: diffs.map(d), representedBeatmap: d(diffs[0]) });

const A = item("A", ["a1", "a2"]);
const B = item("B", ["b1"]);
const C = item("C", ["c1", "c2", "c3"]);
const cats = [{ label: "", items: [A, B, C] }];
const base = { groupBy: "NONE" as const, selectedId: null, collapsedCategories: new Set<string>(), collapsedGroups: new Set<string>() };

describe("buildRows", () => {
  test("tanpa seleksi: hanya kartu, jarak Infinity", () => {
    const rows = buildRows(cats, base);
    expect(rows.map((r) => r.kind)).toEqual(["card", "card", "card"]);
    expect(rows.every((r) => r.kind === "card" && r.distance === Infinity && !r.selected)).toBe(true);
  });

  test("seleksi mengembang menjadi baris difficulty dan menghitung jarak", () => {
    const rows = buildRows(cats, { ...base, selectedId: "c2" });
    expect(rows.map((r) => r.key)).toEqual(["A", "B", "C", "diff-c1", "diff-c2", "diff-c3"]);
    const cards = rows.filter((r) => r.kind === "card");
    expect(cards.map((r) => r.kind === "card" && r.distance)).toEqual([2, 1, 0]);
    expect(rows.filter((r) => r.kind === "diff" && r.selected).map((r) => r.key)).toEqual(["diff-c2"]);
  });

  test("grup yang dilipat manual tidak mengembang", () => {
    const rows = buildRows(cats, { ...base, selectedId: "c2", collapsedGroups: new Set(["C"]) });
    expect(rows.map((r) => r.kind)).toEqual(["card", "card", "card"]);
  });

  test("kategori dilipat: header tetap, item hilang, jarak tetap dihitung dari urutan penuh", () => {
    const grouped = [{ label: "X", items: [A] }, { label: "Y", items: [B, C] }];
    const rows = buildRows(grouped, { ...base, selectedId: "b1", collapsedCategories: new Set(["X"]) });
    expect(rows.map((r) => r.key)).toEqual(["header-X", "header-Y", "B", "diff-b1", "C"]);
    const c = rows.find((r) => r.key === "C");
    expect(c && c.kind === "card" && c.distance).toBe(1);
  });

  test("DIFFICULTY: seleksi menurut representedBeatmap dan tidak mengembang", () => {
    const items = [{ id: "a1", allDifficulties: [d("a1"), d("a2")], representedBeatmap: d("a1") }, { id: "a2", allDifficulties: [d("a1"), d("a2")], representedBeatmap: d("a2") }];
    const rows = buildRows([{ label: "", items }], { ...base, groupBy: "DIFFICULTY", selectedId: "a2" });
    expect(rows.map((r) => r.kind)).toEqual(["card", "card"]);
    expect(rows.map((r) => r.kind === "card" && r.selected)).toEqual([false, true]);
  });
});

describe("selectedRowIndex", () => {
  test("memilih difficulty terpilih, jatuh ke kartu, -1 bila tidak ada", () => {
    expect(selectedRowIndex(buildRows(cats, { ...base, selectedId: "c2" }))).toBe(4);
    expect(selectedRowIndex(buildRows(cats, { ...base, selectedId: "c2", collapsedGroups: new Set(["C"]) }))).toBe(2);
    expect(selectedRowIndex(buildRows(cats, base))).toBe(-1);
  });
});
