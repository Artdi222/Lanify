import { describe, expect, test } from "bun:test";
import { filterSettings } from "./filter";

const items = [
  { id: 1, category: "audio", section: "Offset", label: "Audio Offset", keywords: "latency calibrate" },
  { id: 2, category: "audio", section: "Volume", label: "Master Volume" },
  { id: 3, category: "graphics", section: "Renderer", label: "Frame Limit", keywords: "fps" },
];

describe("filterSettings", () => {
  test("query kosong mengembalikan semua", () => {
    expect(filterSettings(items, "  ")).toHaveLength(3);
  });
  test("tidak peduli huruf besar dan mencocokkan label", () => {
    expect(filterSettings(items, "VOLUME").map((i) => i.id)).toEqual([2]);
  });
  test("mencocokkan kategori, seksi, dan keywords", () => {
    expect(filterSettings(items, "graphics").map((i) => i.id)).toEqual([3]);
    expect(filterSettings(items, "fps").map((i) => i.id)).toEqual([3]);
    expect(filterSettings(items, "audio").map((i) => i.id)).toEqual([1, 2]);
  });
  test("semua kata harus cocok", () => {
    expect(filterSettings(items, "audio latency").map((i) => i.id)).toEqual([1]);
    expect(filterSettings(items, "audio fps")).toEqual([]);
  });
});
