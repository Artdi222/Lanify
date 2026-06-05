"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Music,
  ChevronDown,
  Layers,
  ChevronRight,
  Star,
} from "lucide-react";
import { getStarRatingColor } from "@/types/game";
import type { Beatmap } from "@/types/beatmap";
import Image from "next/image";

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

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastGroupKey = useRef<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleCategory = (label: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const prevSelectedId = useRef<string | null>(null);

  // Auto-expand category/group when selected beatmap changes
  useEffect(() => {
    if (!selectedBeatmap) return;
    
    const isNewSelection = selectedBeatmap.id !== prevSelectedId.current;
    if (!isNewSelection) return;
    
    prevSelectedId.current = selectedBeatmap.id;

    // 1. Auto-expand category
    const category = groupedCategories.find(cat => 
      cat.items.some(item => 
        groupBy === "DIFFICULTY" 
          ? item.representedBeatmap?.id === selectedBeatmap.id
          : item.allDifficulties.some(d => d.id === selectedBeatmap.id)
      )
    );

    // We use setTimeout to avoid synchronous setState inside an effect
    // which can trigger cascading render warnings.
    setTimeout(() => {
      if (category && collapsedCategories.has(category.label)) {
        setCollapsedCategories(prev => {
          const next = new Set(prev);
          next.delete(category.label);
          return next;
        });
      }

      // 2. Auto-expand group
      const groupId = groupBy === "DIFFICULTY" 
        ? selectedBeatmap.id 
        : `${selectedBeatmap.title}|||${selectedBeatmap.artist}`;

      setCollapsedGroups((prev) => {
        if (prev.has(groupId)) {
          const next = new Set(prev);
          next.delete(groupId);
          return next;
        }
        return prev;
      });
    }, 0);
  }, [selectedBeatmap, groupedCategories, groupBy, collapsedCategories]); // Removed collapsedCategories from deps


  // Auto-scroll to selected beatmap
  useEffect(() => {
    if (!selectedBeatmap) return;
    
    let groupKey = "";
    if (groupBy === "DIFFICULTY") {
      groupKey = selectedBeatmap.id;
    } else {
      groupKey = `${selectedBeatmap.title}|||${selectedBeatmap.artist}`;
    }
    const groupChanged = groupKey !== lastGroupKey.current;
    lastGroupKey.current = groupKey;

    // Longer delay if we're expanding a new group, shorter if moving within same group
    const delay = groupChanged ? 250 : 50;

    const timer = setTimeout(() => {
      const selectedEl = document.getElementById(`beatmap-${selectedBeatmap.id}`);
      const container = scrollContainerRef.current;

      if (selectedEl && container) {
        const elementRect = selectedEl.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // Calculate the scroll position to center the element within the container
        const scrollTarget = container.scrollTop + (elementRect.top - containerRect.top) - (containerRect.height / 2) + (elementRect.height / 2);
        
        container.scrollTo({
          top: scrollTarget,
          behavior: "smooth",
        });
      } else if (groupChanged && container) {
        const groupEl = document.getElementById(`group-${groupKey}`);
        if (groupEl) {
          const elementRect = groupEl.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          const scrollTarget = container.scrollTop + (elementRect.top - containerRect.top) - (containerRect.height / 2) + (elementRect.height / 2);
          
          container.scrollTo({
            top: scrollTarget,
            behavior: "smooth",
          });
        }
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [selectedBeatmap, groupBy, collapsedCategories]);

  return (
    <div className="flex flex-col h-full">
      {/* ── TOP: Search + Filters ───────────────────────────── */}
      <div className="relative z-50 shrink-0 p-4 space-y-3 bg-[#0a0a18]/80 backdrop-blur-md shadow-2xl border-b border-white/10">
        {/* Search bar */}
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/30 group-focus-within:text-cyan-400 transition-colors" />
          <input
            type="text"
            placeholder="Search beatmaps, artists, mappers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white font-game-display font-medium placeholder:text-white/20 focus:outline-none focus:border-cyan-400/50 transition-all"
          />
        </div>

        {/* Star Rating — [label] [slider] all one row */}
        <div className="flex items-center justify-between" style={{ height: "26px" }}>
          <span className="text-[11px] font-game-display font-bold text-white/40 tracking-widest uppercase whitespace-nowrap" style={{ width: "90px" }}>
            Star Rating
          </span>
          <div className="flex items-center gap-2" style={{ maxWidth: "calc(100% - 140px)", width: "100%", height: "26px", boxSizing: "border-box" }}>
            <RangeSlider
              min={0}
              max={10}
              step={0.1}
              value={[starMin, starMax]}
              onChange={([min, max]) => setStarRange(min, max)}
            />
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }}>
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

          {search.trim().length > 0 && (
            <div className="ml-auto text-[10px] font-game-mono font-bold text-white/30 tracking-widest whitespace-nowrap">
              {groupedCategories.reduce((acc, cat) => acc + cat.items.length, 0)} matches
            </div>
          )}
        </div>
      </div>

      {/* ── SONG LIST (scrollable) ─────────────────────────── */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-4 flex flex-col scrollbar-hide pb-32 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : groupedCategories.length === 0 || (groupedCategories.length === 1 && groupedCategories[0].items.length === 0) ? (
          <div className="flex flex-col items-center justify-center h-48 text-white/20">
            <Music className="w-10 h-10 mb-3 opacity-20" />
            <p className="text-xs font-game-display font-bold uppercase tracking-widest">
              No results
            </p>
          </div>
        ) : (
          groupedCategories.map((category) => (
            <div key={category.label} className="mb-3">
              {/* Category Header Card */}
              {category.label && (
                <button
                  onClick={() => toggleCategory(category.label)}
                  className="relative z-10 w-[96%] ml-auto mr-0 px-6 py-3 mb-3 bg-[#111122]/95 backdrop-blur-xl border border-white/10 shadow-2xl flex items-center gap-4 text-left transition-all hover:bg-[#1a1a2e] active:scale-[0.98] group/header"
                  style={{ borderRadius: "12px 0 0 12px" }}
                >
                  <div className={`w-1.5 h-6 rounded-full transition-colors ${collapsedCategories.has(category.label) ? "bg-white/20" : "bg-cyan-500"}`} />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-game-display font-black text-white/30 tracking-[0.2em] uppercase leading-none mb-1">
                      Category
                    </span>
                    <span className="text-[15px] font-game-display font-bold text-white tracking-widest uppercase">
                      {category.label}
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-white/5 ml-4" />
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-game-mono font-bold text-white/40">
                      {category.items.length} {category.items.length === 1 ? 'ITEM' : 'ITEMS'}
                    </span>
                    <ChevronDown 
                      className={`w-5 h-5 text-white/30 transition-transform duration-300 ${collapsedCategories.has(category.label) ? "-rotate-90" : ""}`} 
                    />
                  </div>
                </button>
              )}
              
              <AnimatePresence initial={false}>
                {!collapsedCategories.has(category.label) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    {category.items.map((item) => {
                      const diffs = item.allDifficulties;
                      const isSelectedGroup = groupBy === "DIFFICULTY" 
                        ? item.representedBeatmap?.id === selectedBeatmap?.id
                        : diffs.some((d) => d.id === selectedBeatmap?.id);
                      
                      const isExpanded = isSelectedGroup && groupBy !== "DIFFICULTY" && !collapsedGroups.has(item.id);

                      const statusMap: Record<string, { label: string; className: string }> = {
                        ranked: { label: "RANKED", className: "bg-[#b3ff66] text-black" },
                        loved: { label: "LOVED", className: "bg-[#ff66aa] text-white" },
                        qualified: { label: "QUALIFIED", className: "bg-[#66ccff] text-black" },
                        approved: { label: "APPROVED", className: "bg-[#b3ff66] text-black" },
                        graveyard: { label: "GRAVEYARD", className: "bg-black/80 text-white border border-white/20" },
                        pending: { label: "PENDING", className: "bg-yellow-500/80 text-white" },
                      };
                      const status = statusMap[item.status] || statusMap.ranked;

                      const allItems = groupedCategories.flatMap(c => c.items);
                      const selectedGroupIdx = allItems.findIndex((it) => 
                        groupBy === "DIFFICULTY" 
                          ? it.representedBeatmap?.id === selectedBeatmap?.id
                          : it.allDifficulties.some((dd) => dd.id === selectedBeatmap?.id)
                      );
                      
                      let distance = 999;
                      if (selectedGroupIdx >= 0) {
                        const globalIdx = allItems.indexOf(item);
                        distance = Math.abs(globalIdx - selectedGroupIdx);
                      }
                      
                      const widthMap: Record<number, string> = {
                        0: "100%",
                        1: "97%",
                        2: "94%",
                        3: "91%",
                        4: "88%",
                      };
                      const rowWidth = widthMap[distance] || "85%";

                      const currentDiff = (isSelectedGroup && selectedBeatmap && diffs.some(d => d.id === selectedBeatmap.id))
                        ? selectedBeatmap
                        : item.representedBeatmap || diffs[0];

                      const representedColor = currentDiff ? getStarRatingColor(currentDiff.starRating) : null;

                      return (
                        <motion.div
                          key={item.id}
                          id={`group-${item.id}`}
                          layout
                          initial={{ opacity: 0, x: 20 }}
                          animate={{
                            opacity: 1,
                            x: 0,
                            width: rowWidth,
                            zIndex: isSelectedGroup ? 30 : 1,
                          }}
                          transition={{ 
                            type: "spring", 
                            stiffness: 400, 
                            damping: 35,
                            width: { duration: 0.3, ease: "easeOut" }
                          }}
                          className="relative mb-0.5 group ml-auto"
                        >
                          <button
                            onClick={() => {
                              if (isSelectedGroup) {
                                // Toggle manual collapse if already selected
                                setCollapsedGroups(prev => {
                                  const next = new Set(prev);
                                  if (next.has(item.id)) next.delete(item.id);
                                  else next.add(item.id);
                                  return next;
                                });
                              } else {
                                onSelectBeatmap(item.representedBeatmap || diffs[0]);
                              }
                            }}
                            className={`relative w-full flex items-stretch text-left transition-all duration-300 cursor-pointer shadow-lg overflow-hidden group/card z-10
                              ${isSelectedGroup
                                ? "drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                                : "hover:brightness-110 opacity-85"}`}
                            style={{
                              minHeight: isSelectedGroup ? (groupBy === "DIFFICULTY" ? "100px" : "90px") : (groupBy === "DIFFICULTY" ? "64px" : "52px"),
                              boxSizing: "border-box",
                              borderRadius: "12px 0 0 12px",
                              border: isSelectedGroup && representedColor ? `1px solid ${representedColor}` : undefined,
                            }}
                          >
                            {/* ── Left Side Strip ── */}
                            {groupBy === "DIFFICULTY" && currentDiff ? (
                              <div 
                                className={`w-12 shrink-0 flex flex-col items-center justify-center gap-1.5 z-20 transition-all duration-300
                                  ${isSelectedGroup ? "w-14" : "w-10 opacity-80"}`}
                                style={{ 
                                  backgroundColor: representedColor || "rgba(255,255,255,0.1)",
                                  borderRadius: "12px 0 0 12px" 
                                }}
                              >
                                <span className={`text-[10px] font-game-mono font-black ${representedColor ? "text-black/70" : "text-white/70"}`}>
                                  {currentDiff.keyCount}K
                                </span>
                                <div className={`p-1 rounded-full ${representedColor ? "bg-black/10" : "bg-white/10"}`}>
                                  <Star className={`w-3.5 h-3.5 ${representedColor ? "fill-black/70 text-black/70" : "fill-white/70 text-white/70"}`} />
                                </div>
                                {isSelectedGroup && (
                                  <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}>
                                    <ChevronRight className={`w-5 h-5 ${representedColor ? "text-black" : "text-white"}`} />
                                  </motion.div>
                                )}
                              </div>
                            ) : (
                              isSelectedGroup && (
                                <div className="w-10 shrink-0 flex items-center justify-center z-20" 
                                     style={{ 
                                       backgroundColor: representedColor || "white",
                                       borderRadius: "12px 0 0 12px" 
                                     }}>
                                  <ChevronRight className="w-6 h-6 text-black" />
                                </div>
                              )
                            )}

                            {/* Main content area */}
                            <div className="relative flex-1 flex z-10">
                              {/* Background Image */}
                              {item.coverUrl && (
                                <Image
                                  fill
                                  unoptimized
                                  src={item.coverUrl}
                                  alt=""
                                  className={`object-cover z-0 transition-transform duration-500 ${isSelectedGroup ? "scale-105" : ""}`}
                                />
                              )}
                              
                              {/* Dark Dim Overlay */}
                              <div className={`absolute inset-0 z-0 transition-opacity duration-500 
                                ${isSelectedGroup
                                  ? "bg-linear-to-r from-black/80 via-black/40 to-transparent"
                                  : "bg-linear-to-r from-black/90 via-black/60 to-black/20"}`} 
                              />

                              {/* Text Content */}
                              <div className={`relative z-10 px-4 flex flex-col justify-center w-full ${isSelectedGroup ? "py-4" : "p-3"}`}>
                                <h3 className={`text-[20px] font-game-display text-white leading-tight drop-shadow-md truncate ${isSelectedGroup ? "font-bold" : "font-semibold"}`}>
                                  {item.title}
                                </h3>
                                
                                <div className="flex items-center gap-2 mb-2 truncate">
                                  <p className="text-[13px] font-game-body text-white/90 drop-shadow-md truncate">
                                    {item.artist}
                                  </p>
                                  {currentDiff && (
                                    <span className="text-[11px] font-game-display font-medium text-white/40 bg-white/5 px-2 py-px rounded italic truncate shrink-0">
                                      {currentDiff.difficultyName}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-3 mt-auto">
                                  {currentDiff && (
                                    <div 
                                      className="flex items-center gap-1 px-2 py-0.5 rounded-md font-game-mono font-bold text-[11px] shadow-sm border border-white/10"
                                      style={{ 
                                        backgroundColor: representedColor || "rgba(255,255,255,0.1)",
                                        color: representedColor ? "black" : "white"
                                      }}
                                    >
                                      <Star className="w-3 h-3 fill-current" />
                                      {currentDiff.starRating.toFixed(2)}
                                    </div>
                                  )}

                                  <span className={`px-2 py-px text-[9px] font-bold tracking-wider rounded-full shadow-sm ${status.className}`}>
                                    {status.label}
                                  </span>

                                  <div className="flex items-center gap-2">
                                    <Layers className="w-3 h-3 text-white/30" />
                                    <div className="flex items-center gap-[2px]">
                                      {diffs.map((d) => {
                                        const isHighlighted = groupBy === "DIFFICULTY" 
                                          ? d.id === item.representedBeatmap?.id 
                                          : (isSelectedGroup && currentDiff?.id === d.id);
                                        return (
                                          <div
                                            key={d.id}
                                            className={`rounded-[1px] transition-all duration-300 ${isHighlighted ? "z-10 scale-110 opacity-100" : "opacity-30"}`}
                                            style={{
                                              width: isHighlighted ? "5px" : "4px",
                                              height: isHighlighted ? "14px" : "10px",
                                              backgroundColor: getStarRatingColor(d.starRating),
                                              boxShadow: isHighlighted ? `0 0 8px ${getStarRatingColor(d.starRating)}` : undefined,
                                            }}
                                          />
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                layout
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                style={{ overflow: "hidden" }}
                              >
                                <div className="pt-2 pb-3 space-y-1.5 relative z-0 pl-[2px]">
                                  {diffs.map((diff) => {
                                    const isSel = diff.id === selectedBeatmap?.id;
                                    const col = getStarRatingColor(diff.starRating);
                                    return (
                                      <button
                                        key={diff.id}
                                        id={`beatmap-${diff.id}`}
                                        onClick={() => onSelectBeatmap(diff)}
                                        className={`flex items-stretch text-left transition-all duration-200 cursor-pointer overflow-hidden group backdrop-blur-md
                                          ${isSel ? "w-full shadow-[0_0_15px_rgba(255,255,255,0.3)]" : "w-[95%] ml-auto hover:brightness-110 shadow-lg opacity-85"}`}
                                        style={{
                                          height: isSel ? "62px" : "52px",
                                          backgroundColor: isSel ? `${col}66` : `${col}80`,
                                          border: `1px solid ${col}A0`,
                                          borderLeft: isSel ? `4px solid ${col}` : `1px solid ${col}A0`,
                                          borderRadius: "8px 0 0 8px",
                                        }}
                                      >
                                        <div className="w-12 shrink-0 flex items-center justify-center bg-current z-10" style={{ backgroundColor: col }}>
                                          <div className="w-6 h-6 rounded-full bg-black/40 flex items-center justify-center text-white font-game-mono font-bold text-[10px]">
                                            {diff.keyCount}K
                                          </div>
                                        </div>
                                        <div className="flex-1 flex flex-col justify-center px-4 z-10 min-w-0">
                                          <div className="flex items-baseline gap-2 truncate">
                                            <span className={`text-[14px] font-game-display text-white truncate ${isSel ? "font-bold" : "font-semibold"}`}>
                                              [{diff.keyCount}K] {diff.difficultyName}
                                            </span>
                                            <span className="text-[11px] font-game-body text-white/80 truncate shrink-0">
                                              mapped by {diff.creator}
                                            </span>
                                          </div>
                                          <div className="mt-0.5">
                                            <span className="inline-flex px-2 py-px rounded-full text-[10px] font-game-mono font-bold text-black" style={{ backgroundColor: col }}>
                                              ★ {diff.starRating.toFixed(2)}
                                            </span>
                                          </div>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>
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
