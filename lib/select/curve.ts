/**
 * Efek kurva daftar beatmap ala lazer. Diukur dari foto (docs/ui-spec/song-select.md, "Efek kurva"): posisi x kiri kartu
 * bergantung pada jarak vertikal tengah kartu ke tengah area daftar (bukan jarak indeks ke seleksi), simetris atas-bawah.
 * Titik foto (d px -> x layar, kolom mulai x=1040): 5->1180, 123->1190, 187->1200, 251->1210, 283->1213, 315->1225, 405->1260.
 * Fit kuadrat `base + a·d + b·d²` (galat ±10 px; kartu "xi" yang tertutup header meleset ~19 px). Bukan rumus lazer.
 * Kartu terpilih tetap di x=1062 (set) / 1085 (difficulty), header grup di 60.
 */
export const CURVE = { selectedSet: 22, selectedDiff: 45, base: 140, a: 0.0237, b: 0.000429, max: 300, header: 60 } as const;

interface CurveRow {
  kind: "header" | "card" | "diff";
  selected?: boolean;
}

/** Offset kiri (px, relatif kolom) untuk baris yang tengahnya berjarak `distance` px dari tengah area daftar. */
export function rowOffset(row: CurveRow, distance: number): number {
  if (row.kind === "header") return CURVE.header;
  if (row.selected) return row.kind === "card" ? CURVE.selectedSet : CURVE.selectedDiff;
  const d = Math.abs(distance);
  return Math.min(CURVE.max, Math.round(CURVE.base + CURVE.a * d + CURVE.b * d * d));
}
