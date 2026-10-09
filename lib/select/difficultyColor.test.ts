import { describe, expect, test } from "bun:test";
import { difficultyColor, spectrumGradient, starTextColor } from "./difficultyColor";

describe("difficultyColor", () => {
  test("titik spektrum tepat mengembalikan warna titik itu", () => {
    expect(difficultyColor(0.1)).toBe("#4290fb");
    expect(difficultyColor(4.2)).toBe("#ff8068");
    expect(difficultyColor(6.7)).toBe("#6563de");
  });
  test("dijepit di luar rentang dan untuk nilai tidak valid", () => {
    expect(difficultyColor(0)).toBe("#4290fb");
    expect(difficultyColor(-3)).toBe("#4290fb");
    expect(difficultyColor(12)).toBe("#000000");
    expect(difficultyColor(NaN)).toBe("#4290fb");
  });
  test("interpolasi linear di tengah dua titik", () => {
    // tengah 2.5 (#7CFF4F) dan 3.3 (#F6F05C) = 2.9
    expect(difficultyColor(2.9)).toBe("#b9f856");
  });
  test("sesuai pill bintang yang diukur dari foto referensi (toleransi 12 per kanal)", () => {
    const measured: [number, string][] = [[3.62, "#f9d160"], [4.26, "#ff7d69"], [5.46, "#dd48a2"], [6.75, "#6260da"], [6.89, "#5c5ad2"], [7.76, "#17148b"]];
    for (const [sr, hex] of measured) {
      const got = difficultyColor(sr);
      for (const i of [1, 3, 5]) expect(Math.abs(parseInt(got.slice(i, i + 2), 16) - parseInt(hex.slice(i, i + 2), 16))).toBeLessThanOrEqual(12);
    }
  });
});

describe("starTextColor / spectrumGradient", () => {
  test("ambang 6.5", () => {
    expect(starTextColor(6.49)).toBe("#1a1a1a");
    expect(starTextColor(6.5)).toBe("#ffd966");
  });
  test("gradien mulai dari warna pertama dan hanya memuat titik <= max", () => {
    const g = spectrumGradient(10);
    expect(g.startsWith("linear-gradient(to right, #4290FB 1.0%")).toBe(true);
    expect(spectrumGradient(5)).not.toContain("#C645B8");
  });
});
