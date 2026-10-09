/**
 * Spektrum warna difficulty ala lazer. Titik awal `#4290FB` terverifikasi dari pita gradien di foto referensi
 * (docs/ui-spec/song-select.md); titik lain dari spektrum lazer, dicocokkan dengan tile baris yang diukur dari foto
 * (`#ff8776` @4.26, `#716bc4` @6.89). Titik di antaranya diinterpolasi linear.
 */
const STOPS: readonly (readonly [number, string])[] = [
  [0.1, "#4290FB"],
  [1.25, "#4FC0FF"],
  [2, "#4FFFD5"],
  [2.5, "#7CFF4F"],
  [3.3, "#F6F05C"],
  [4.2, "#FF8068"],
  [4.9, "#FF4E6F"],
  [5.8, "#C645B8"],
  [6.7, "#6563DE"],
  [7.7, "#18158E"],
  [9, "#000000"],
];

const rgb = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
const toHex = (c: number[]) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;

/** Warna difficulty untuk star rating (hex `#rrggbb`). Di luar rentang dijepit ke ujung spektrum. */
export function difficultyColor(stars: number): string {
  if (!Number.isFinite(stars) || stars <= STOPS[0][0]) return STOPS[0][1].toLowerCase();
  const last = STOPS[STOPS.length - 1];
  if (stars >= last[0]) return last[1].toLowerCase();
  const i = STOPS.findIndex(([s]) => s > stars);
  const [s0, c0] = STOPS[i - 1];
  const [s1, c1] = STOPS[i];
  const t = (stars - s0) / (s1 - s0);
  const a = rgb(c0);
  const b = rgb(c1);
  return toHex(a.map((v, k) => v + (b[k] - v) * t));
}

/** Teks di atas pill bintang: gelap untuk SR rendah, emas untuk SR >= 6.5 (terlihat di 6.75, 6.89, 7.76 pada foto). */
export function starTextColor(stars: number): string {
  return stars >= 6.5 ? "#ffd966" : "#1a1a1a";
}

/** Stop gradien CSS untuk pita Star Rating (0..max bintang), memakai spektrum yang sama. */
export function spectrumGradient(max = 10): string {
  const stops = STOPS.filter(([s]) => s <= max).map(([s, c]) => `${c} ${((s / max) * 100).toFixed(1)}%`);
  return `linear-gradient(to right, ${stops.join(", ")})`;
}
