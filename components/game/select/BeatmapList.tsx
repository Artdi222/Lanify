"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Search, Music, ChevronDown, Layers, ChevronRight, Star } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { getStarRatingColor } from "@/types/game";
import type { Beatmap } from "@/types/beatmap";
import { buildRows, isSelectedItem, selectedRowIndex, type Row } from "@/lib/select/rows";

interface BeatmapListProps {
  beatmaps: Beatmap[];
  selectedBeatmap: Beatmap | null;
  onSelectBeatmap: (beatmap: Beatmap) => void;
  loading: boolean;
  search: string;
  setSearch: (s: string) => void;
  sortBy: SortKey;
  setSortBy: (s: SortKey) => void;
  starMin: number;
  starMax: number;
  setStarRange: (min: number, max: number) => void;
  groupBy: "NONE" | "ARTIST" | "DIFFICULTY";
  setGroupBy: (g: "NONE" | "ARTIST" | "DIFFICULTY") => void;
  groupedCategories: GroupCategory[];
}

export interface BeatmapGroupItem {
  id: string; // The parent ID or the beatmap ID
  title: string;
  artist: string;
  coverUrl?: string | null;
  status: string;
  representedBeatmap?: Beatmap; // For difficulty grouping
  allDifficulties: Beatmap[];
}

export interface GroupCategory {
  label: string; // e.g. "A", "1 Star", or "" for NONE
  items: BeatmapGroupItem[];
}

type SortKey = "title" | "artist" | "starRating" | "bpm";
type ListRow = Row<BeatmapGroupItem, Beatmap>;

const STATUS: Record<string, { label: string; className: string }> = {
  ranked: { label: "RANKED", className: "bg-[#b3ff66] text-black" },
  loved: { label: "LOVED", className: "bg-[#ff66aa] text-white" },
  qualified: { label: "QUALIFIED", className: "bg-[#66ccff] text-black" },
  approved: { label: "APPROVED", className: "bg-[#b3ff66] text-black" },
  graveyard: { label: "GRAVEYARD", className: "bg-black/80 text-white border border-white/20" },
  pending: { label: "PENDING", className: "bg-yellow-500/80 text-white" },
};

/** Kartu makin menyempit menjauhi kartu terpilih (efek "lengkung" ala lazer). Murni CSS, tanpa animasi per-frame. */
const widthFor = (distance: number) => `${Math.max(85, 100 - distance * 3)}%`;

const ROW_HEIGHT: Record<ListRow["kind"], number> = { header: 64, card: 76, diff: 64 };

export default function BeatmapList({
  selectedBeatmap,
  onSelectBeatmap,
  loading,
  search,
  setSearch,
  sortBy,
  setSortBy,
  starMin,
  starMax,
  setStarRange,
  groupBy,
  setGroupBy,
  groupedCategories,
}: BeatmapListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const selectedId = selectedBeatmap?.id ?? null;

  const toggle = (set: Set<string>, key: string) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  };

  // Seleksi baru (mis. panah keyboard, Random) harus membuka kategori dan grup tempatnya berada.
  const [prevSelectedId, setPrevSelectedId] = useState<string | null>(null);
  if (selectedId !== prevSelectedId) {
    setPrevSelectedId(selectedId);
    if (selectedId) {
      for (const cat of groupedCategories) {
        const item = cat.items.find((it) => isSelectedItem(it, groupBy, selectedId));
        if (!item) continue;
        if (collapsedCategories.has(cat.label)) setCollapsedCategories((s) => toggle(s, cat.label));
        if (collapsedGroups.has(item.id)) setCollapsedGroups((s) => toggle(s, item.id));
        break;
      }
    }
  }

  const rows = useMemo(
    () => buildRows<Beatmap, BeatmapGroupItem>(groupedCategories, { groupBy, selectedId, collapsedCategories, collapsedGroups }),
    [groupedCategories, groupBy, selectedId, collapsedCategories, collapsedGroups],
  );

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (i) => ROW_HEIGHT[rows[i].kind],
    getItemKey: (i) => rows[i].key,
    overscan: 8,
  });

  // Gulirkan seleksi baru ke tengah. Hanya saat id berubah, bukan saat grup dilipat/dibuka.
  const lastScrolledId = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedId || lastScrolledId.current === selectedId) return;
    const idx = selectedRowIndex(rows);
    if (idx < 0) return;
    lastScrolledId.current = selectedId;
    virtualizer.scrollToIndex(idx, { align: "center" });
  }, [selectedId, rows, virtualizer]);

  const matchCount = groupedCategories.reduce((acc, cat) => acc + cat.items.length, 0);

  return (
    <div className="flex flex-col h-full">
      {/* ── TOP: Search + Filters ───────────────────────────── */}
      <div className="relative z-20 shrink-0 space-y-3 border-b border-white/10 bg-lf-bg-raised/85 p-4 backdrop-blur-md">
        <div>
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-lf-accent" />
            <input
              type="text"
              placeholder="search..."
              aria-label="Search beatmaps"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lf-md border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 font-game-display text-base font-medium text-white placeholder:text-white/30 focus:border-lf-accent/60 focus:outline-none"
            />
          </div>
          <div className="mt-1 px-1 font-game-mono text-[11px] font-bold tracking-wider text-lf-accent">{matchCount} matches</div>
        </div>

        <div className="flex items-center justify-between" style={{ height: "26px" }}>
          <span className="whitespace-nowrap font-game-display text-[11px] font-bold uppercase tracking-widest text-white/50" style={{ width: "90px" }}>
            Star Rating
          </span>
          <div className="flex items-center gap-2" style={{ maxWidth: "calc(100% - 140px)", width: "100%", height: "26px", boxSizing: "border-box" }}>
            <RangeSlider min={0} max={10} step={0.1} value={[starMin, starMax]} onChange={([min, max]) => setStarRange(min, max)} />
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lf-md bg-white/6 px-3 py-2">
          <InlineDropdown
            label="Sort"
            value={sortBy}
            options={[
              { label: "TITLE", value: "title" },
              { label: "ARTIST", value: "artist" },
              { label: "STARS", value: "starRating" },
              { label: "BPM", value: "bpm" },
            ]}
            onChange={(val) => setSortBy(val as SortKey)}
          />
          <InlineDropdown
            label="Group"
            value={groupBy}
            options={[
              { label: "NONE", value: "NONE" },
              { label: "ARTIST", value: "ARTIST" },
              { label: "DIFFICULTY", value: "DIFFICULTY" },
            ]}
            onChange={(val) => setGroupBy(val as "NONE" | "ARTIST" | "DIFFICULTY")}
          />
          <InlineDropdown
            label="Collection"
            value="ALL"
            options={[
              { label: "ALL", value: "ALL" },
              { label: "FAVORITES", value: "FAVORITES" },
              { label: "RECENT", value: "RECENT" },
            ]}
            onChange={() => {}}
          />
        </div>
      </div>

      {/* ── SONG LIST (virtualized) ────────────────────────── */}
      <div ref={scrollRef} className="no-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-4 pb-32">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-lf-accent border-t-transparent" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-white/30">
            <Music className="mb-3 h-10 w-10 opacity-30" />
            <p className="font-game-display text-xs font-bold uppercase tracking-widest">No results</p>
          </div>
        ) : (
          <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
            {virtualizer.getVirtualItems().map((v) => {
              const row = rows[v.index];
              return (
                <div
                  key={v.key}
                  data-index={v.index}
                  ref={virtualizer.measureElement}
                  className="absolute left-0 top-0 w-full pb-0.5"
                  style={{ transform: `translateY(${v.start}px)` }}
                >
                  <ListRowView
                    row={row}
                    groupBy={groupBy}
                    selectedBeatmap={selectedBeatmap}
                    onSelectBeatmap={onSelectBeatmap}
                    onToggleCategory={(label) => setCollapsedCategories((s) => toggle(s, label))}
                    onToggleGroup={(id) => setCollapsedGroups((s) => toggle(s, id))}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ListRowView({
  row,
  groupBy,
  selectedBeatmap,
  onSelectBeatmap,
  onToggleCategory,
  onToggleGroup,
}: {
  row: ListRow;
  groupBy: BeatmapListProps["groupBy"];
  selectedBeatmap: Beatmap | null;
  onSelectBeatmap: (b: Beatmap) => void;
  onToggleCategory: (label: string) => void;
  onToggleGroup: (id: string) => void;
}) {
  if (row.kind === "header") {
    return (
      <button
        type="button"
        onClick={() => onToggleCategory(row.label)}
        className="ml-auto mr-0 mb-1 flex w-[96%] cursor-pointer items-center gap-4 rounded-l-lf-lg border border-white/10 bg-lf-surface/95 px-6 py-3 text-left transition-colors hover:bg-lf-surface-hover"
      >
        <div className={`h-6 w-1.5 rounded-full transition-colors ${row.collapsed ? "bg-white/20" : "bg-lf-accent"}`} />
        <span className="font-game-display text-[15px] font-bold uppercase tracking-widest text-white">{row.label}</span>
        <div className="ml-4 h-px flex-1 bg-white/5" />
        <span className="font-game-mono text-[10px] font-bold text-white/40">
          {row.count} {row.count === 1 ? "ITEM" : "ITEMS"}
        </span>
        <ChevronDown className={`h-5 w-5 text-white/30 transition-transform duration-300 ${row.collapsed ? "-rotate-90" : ""}`} />
      </button>
    );
  }

  if (row.kind === "diff") {
    const { diff } = row;
    const col = getStarRatingColor(diff.starRating);
    return (
      <button
        type="button"
        onClick={() => onSelectBeatmap(diff)}
        className={`ml-auto flex cursor-pointer items-stretch overflow-hidden rounded-l-lf-md text-left transition-[width,filter] duration-200 hover:brightness-110 ${row.selected ? "w-full" : "w-[95%] opacity-90"}`}
        style={{ height: row.selected ? 62 : 52, backgroundColor: row.selected ? `${col}66` : `${col}80`, border: `1px solid ${col}A0`, borderLeft: row.selected ? `4px solid ${col}` : `1px solid ${col}A0` }}
      >
        <div className="flex w-12 shrink-0 items-center justify-center" style={{ backgroundColor: col }}>
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black/40 font-game-mono text-[10px] font-bold text-white">{diff.keyCount}K</div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center px-4">
          <div className="flex items-baseline gap-2 truncate">
            <span className={`truncate font-game-display text-[14px] text-white ${row.selected ? "font-bold" : "font-semibold"}`}>
              [{diff.keyCount}K] {diff.difficultyName}
            </span>
            <span className="shrink-0 truncate font-game-body text-[11px] text-white/80">mapped by {diff.creator}</span>
          </div>
          <div className="mt-0.5">
            <span className="inline-flex rounded-full px-2 py-px font-game-mono text-[10px] font-bold text-black" style={{ backgroundColor: col }}>
              ★ {diff.starRating.toFixed(2)}
            </span>
          </div>
        </div>
      </button>
    );
  }

  const { item, selected, expanded, distance } = row;
  const diffs = item.allDifficulties;
  const status = STATUS[item.status] || STATUS.ranked;
  const currentDiff = selected && selectedBeatmap && diffs.some((d) => d.id === selectedBeatmap.id) ? selectedBeatmap : item.representedBeatmap || diffs[0];
  const color = currentDiff ? getStarRatingColor(currentDiff.starRating) : null;
  const byDifficulty = groupBy === "DIFFICULTY";

  return (
    <div className="ml-auto transition-[width] duration-300 ease-out" style={{ width: widthFor(distance) }}>
      <button
        type="button"
        id={`group-${item.id}`}
        onClick={() => (selected ? onToggleGroup(item.id) : onSelectBeatmap(item.representedBeatmap || diffs[0]))}
        aria-expanded={selected && !byDifficulty ? expanded : undefined}
        className={`relative flex w-full cursor-pointer items-stretch overflow-hidden rounded-l-lf-lg text-left shadow-lg transition-[filter,opacity] duration-300 ${selected ? "" : "opacity-85 hover:brightness-110"}`}
        style={{ minHeight: selected ? (byDifficulty ? 100 : 90) : byDifficulty ? 64 : 52, border: selected && color ? `1px solid ${color}` : undefined }}
      >
        {byDifficulty && currentDiff ? (
          <div className={`flex shrink-0 flex-col items-center justify-center gap-1.5 ${selected ? "w-14" : "w-10 opacity-80"}`} style={{ backgroundColor: color || "rgba(255,255,255,0.1)" }}>
            <span className="font-game-mono text-[10px] font-black text-black/70">{currentDiff.keyCount}K</span>
            <Star className="h-3.5 w-3.5 fill-black/70 text-black/70" />
            {selected && <ChevronRight className="h-5 w-5 text-black" />}
          </div>
        ) : (
          selected && (
            <div className="flex w-10 shrink-0 items-center justify-center" style={{ backgroundColor: color || "white" }}>
              <ChevronRight className="h-6 w-6 text-black" />
            </div>
          )
        )}

        <div className="relative flex flex-1">
          {item.coverUrl && <Image fill unoptimized src={item.coverUrl} alt="" className="object-cover" />}
          <div className={`absolute inset-0 ${selected ? "bg-linear-to-r from-black/80 via-black/40 to-transparent" : "bg-linear-to-r from-black/90 via-black/60 to-black/20"}`} />
          <div className={`relative flex w-full flex-col justify-center px-4 ${selected ? "py-4" : "p-3"}`}>
            <h3 className={`truncate font-game-display text-[20px] leading-tight text-white drop-shadow-md ${selected ? "font-bold" : "font-semibold"}`}>{item.title}</h3>
            <div className="mb-2 flex items-center gap-2 truncate">
              <p className="truncate font-game-body text-[13px] text-white/90 drop-shadow-md">{item.artist}</p>
              {currentDiff && <span className="shrink-0 truncate rounded bg-white/5 px-2 py-px font-game-display text-[11px] font-medium italic text-white/50">{currentDiff.difficultyName}</span>}
            </div>
            <div className="mt-auto flex items-center gap-3">
              {currentDiff && (
                <div className="flex items-center gap-1 rounded-md border border-white/10 px-2 py-0.5 font-game-mono text-[11px] font-bold shadow-sm" style={{ backgroundColor: color || "rgba(255,255,255,0.1)", color: color ? "black" : "white" }}>
                  <Star className="h-3 w-3 fill-current" />
                  {currentDiff.starRating.toFixed(2)}
                </div>
              )}
              <span className={`rounded-full px-2 py-px text-[9px] font-bold tracking-wider shadow-sm ${status.className}`}>{status.label}</span>
              <div className="flex items-center gap-2">
                <Layers className="h-3 w-3 text-white/30" />
                <div className="flex items-center gap-[2px]">
                  {diffs.map((d) => {
                    const hi = byDifficulty ? d.id === item.representedBeatmap?.id : selected && currentDiff?.id === d.id;
                    const c = getStarRatingColor(d.starRating);
                    return <div key={d.id} className={`rounded-[1px] ${hi ? "opacity-100" : "opacity-30"}`} style={{ width: hi ? 5 : 4, height: hi ? 14 : 10, backgroundColor: c, boxShadow: hi ? `0 0 8px ${c}` : undefined }} />;
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}

export function InlineDropdown({ label, value, options, onChange }: { label: string; value: string; options: { label: string; value: string }[]; onChange: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handle(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    window.addEventListener("mousedown", handle);
    return () => window.removeEventListener("mousedown", handle);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 rounded-md border border-white/10 hover:bg-white/20 transition-all cursor-pointer p-[6px_10px]" style={{ background: "rgba(255,255,255,0.12)" }}>
        <span className="text-[9px] font-game-display font-bold text-white/40 tracking-widest uppercase">{label}</span>
        <span className="text-[10px] font-game-mono font-bold text-white">{options.find(o => o.value === value)?.label || value}</span>
        <ChevronDown className="w-3 h-3 text-white/40" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -5, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -5, scale: 0.95 }} className="absolute top-full left-0 mt-2 w-36 bg-[#0a0a18]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl overflow-hidden z-100">
            {options.map(opt => (
              <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }} className={`w-full text-left px-3 py-2 text-[10px] font-game-mono font-bold transition-colors ${value === opt.value ? "bg-cyan-500/20 text-cyan-400" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RangeSlider({ min, max, step, value, onChange }: { min: number; max: number; step: number; value: [number, number]; onChange: (val: [number, number]) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const handlePointerDown = (index: 0 | 1) => (e: React.PointerEvent) => {
    e.preventDefault();
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const onPointerMove = (ev: PointerEvent) => {
      const offsetX = ev.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, offsetX / rect.width));
      const newValue = min + percentage * (max - min);
      const steppedValue = Math.round(newValue / step) * step;
      if (index === 0) onChange([Math.min(steppedValue, value[1] - step), value[1]]);
      else onChange([value[0], Math.max(steppedValue, value[0] + step)]);
    };
    const onPointerUp = () => { window.removeEventListener("pointermove", onPointerMove); window.removeEventListener("pointerup", onPointerUp); };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };
  const percent0 = ((value[0] - min) / (max - min)) * 100;
  const percent1 = ((value[1] - min) / (max - min)) * 100;
  return (
    <div className="relative h-[26px] py-0 touch-none group flex-1 px-[18px]" ref={trackRef} onPointerDown={(e) => {
      const track = trackRef.current; if (!track) return; if ((e.target as HTMLElement).classList.contains("cursor-grab")) return;
      const rect = track.getBoundingClientRect(); const offsetX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, offsetX / rect.width));
      const newValue = min + percentage * (max - min); const steppedValue = Math.round(newValue / step) * step;
      const dist0 = Math.abs(newValue - value[0]); const dist1 = Math.abs(newValue - value[1]);
      if (dist0 <= dist1) onChange([Math.min(steppedValue, value[1] - step), value[1]]);
      else onChange([value[0], Math.max(steppedValue, value[0] + step)]);
    }}>
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-3 bg-white/10 border border-white/5" />
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-3" style={{ background: "linear-gradient(to right, #e0f7fa 0%, #29b6f6 20%, #66bb6a 30%, #ffee58 40%, #ffa726 50%, #ef5350 60%, #ec407a 70%, #ab47bc 80%, #1a237e 90%, #000000 100%)", clipPath: `inset(0 ${100 - percent1}% 0 ${percent0}%)` }} />
      <div className="absolute top-1/2 -translate-y-1/2 h-3 border-y border-white/30" style={{ left: `${percent0}%`, width: `${percent1 - percent0}%` }} />
      <div className="absolute top-1/2 -translate-y-1/2 rounded shadow-xl border border-white/40 cursor-grab active:cursor-grabbing hover:scale-105 flex items-center justify-center" style={{ width: "36px", height: "26px", left: `calc(${percent0}% - 18px)`, backgroundColor: getStarRatingColor(value[0]) }} onPointerDown={handlePointerDown(0)}>
        <span className="text-[11px] font-game-mono font-bold text-black">{value[0].toFixed(1)}</span>
      </div>
      <div className="absolute top-1/2 -translate-y-1/2 rounded shadow-xl border border-white/40 cursor-grab active:cursor-grabbing hover:scale-105 flex items-center justify-center" style={{ width: "36px", height: "26px", left: `calc(${percent1}% - 18px)`, backgroundColor: getStarRatingColor(value[1]) }} onPointerDown={handlePointerDown(1)}>
        <span className="text-[11px] font-game-mono font-bold text-black">{value[1].toFixed(1)}</span>
      </div>
    </div>
  );
}
