/**
 * Efek kurva daftar beatmap ala lazer: kartu terpilih menjorok paling kiri, kartu lain makin ke kanan
 * menurut jarak barisnya dari baris terpilih. Angka diukur dari foto (docs/ui-spec/song-select.md, "Efek kurva"):
 * set terpilih x=1062, difficulty terpilih 1085, tetangga ±1182, lalu +12..14 px per baris (kolom mulai x=1040).
 */
export const CURVE = { selectedSet: 22, selectedDiff: 45, base: 142, step: 13, max: 260, header: 60 } as const;

interface CurveRow {
  kind: "header" | "card" | "diff";
  selected?: boolean;
}

/** Offset kiri (px, relatif kolom) untuk tiap baris. Tanpa seleksi, semua baris di `base`. */
export function rowOffsets(rows: readonly CurveRow[]): number[] {
  const n = rows.length;
  const dist = new Array<number>(n).fill(Infinity);
  let last = -Infinity;
  for (let i = 0; i < n; i++) {
    if (rows[i].kind !== "header" && rows[i].selected) last = i;
    dist[i] = i - last;
  }
  last = Infinity;
  for (let i = n - 1; i >= 0; i--) {
    if (rows[i].kind !== "header" && rows[i].selected) last = i;
    dist[i] = Math.min(dist[i], last - i);
  }
  return rows.map((r, i) => {
    if (r.kind === "header") return CURVE.header;
    if (r.selected) return r.kind === "card" ? CURVE.selectedSet : CURVE.selectedDiff;
    const d = dist[i];
    return Number.isFinite(d) ? Math.min(CURVE.max, CURVE.base + CURVE.step * (d - 1)) : CURVE.base;
  });
}
