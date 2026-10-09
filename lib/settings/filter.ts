export interface SearchableSetting {
  category: string;
  section: string;
  label: string;
  /** Kata kunci tambahan (sinonim) yang ikut dicari. */
  keywords?: string;
}

/** Item yang cocok dengan query (semua kata harus ditemukan, tanpa peduli huruf besar). Query kosong → semua. */
export function filterSettings<T extends SearchableSetting>(items: readonly T[], query: string): T[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [...items];
  return items.filter((it) => {
    const hay = `${it.category} ${it.section} ${it.label} ${it.keywords ?? ""}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}
