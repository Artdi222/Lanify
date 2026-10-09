/**
 * Mengubah kategori beatmap + seleksi + status collapse menjadi baris datar untuk daftar yang divirtualisasi.
 * Murni (tanpa React) supaya mudah dites.
 */

export interface RowItem<D extends { id: string }> {
  id: string;
  allDifficulties: D[];
  representedBeatmap?: D;
}

export interface RowCategory<I> {
  label: string;
  items: I[];
}

export type Row<I, D> =
  | { kind: "header"; key: string; label: string; count: number; collapsed: boolean }
  | { kind: "card"; key: string; item: I; selected: boolean; expanded: boolean; distance: number }
  | { kind: "diff"; key: string; diff: D; parent: I; selected: boolean };

export interface RowOptions {
  groupBy: "NONE" | "ARTIST" | "DIFFICULTY";
  selectedId: string | null;
  collapsedCategories: ReadonlySet<string>;
  collapsedGroups: ReadonlySet<string>;
}

export function isSelectedItem<D extends { id: string }>(item: RowItem<D>, groupBy: RowOptions["groupBy"], selectedId: string | null): boolean {
  if (!selectedId) return false;
  return groupBy === "DIFFICULTY" ? item.representedBeatmap?.id === selectedId : item.allDifficulties.some((d) => d.id === selectedId);
}

export function buildRows<D extends { id: string }, I extends RowItem<D>>(
  categories: readonly RowCategory<I>[],
  { groupBy, selectedId, collapsedCategories, collapsedGroups }: RowOptions,
): Row<I, D>[] {
  // Jarak ke kartu terpilih dihitung pada urutan datar seluruh item (termasuk kategori yang dilipat), seperti perilaku lama.
  let selectedIdx = -1;
  let idx = 0;
  for (const c of categories) {
    for (const it of c.items) {
      if (selectedIdx < 0 && isSelectedItem(it, groupBy, selectedId)) selectedIdx = idx;
      idx++;
    }
  }

  const rows: Row<I, D>[] = [];
  idx = 0;
  for (const c of categories) {
    const collapsed = collapsedCategories.has(c.label);
    if (c.label) rows.push({ kind: "header", key: `header-${c.label}`, label: c.label, count: c.items.length, collapsed });
    for (const item of c.items) {
      const myIdx = idx++;
      if (collapsed) continue;
      const selected = isSelectedItem(item, groupBy, selectedId);
      const expanded = selected && groupBy !== "DIFFICULTY" && !collapsedGroups.has(item.id);
      rows.push({ kind: "card", key: item.id, item, selected, expanded, distance: selectedIdx < 0 ? Infinity : Math.abs(myIdx - selectedIdx) });
      if (expanded) {
        for (const diff of item.allDifficulties) {
          rows.push({ kind: "diff", key: `diff-${diff.id}`, diff, parent: item, selected: diff.id === selectedId });
        }
      }
    }
  }
  return rows;
}

/** Indeks baris yang sebaiknya digulir ke tengah: difficulty terpilih bila terlihat, kalau tidak kartunya. -1 bila tidak ada. */
export function selectedRowIndex<I, D>(rows: readonly Row<I, D>[]): number {
  const diff = rows.findIndex((r) => r.kind === "diff" && r.selected);
  return diff >= 0 ? diff : rows.findIndex((r) => r.kind === "card" && r.selected);
}
