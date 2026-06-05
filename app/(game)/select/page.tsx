"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Play,
  Shuffle,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import BeatmapList, { GroupCategory } from "@/components/game/select/BeatmapList";
import BeatmapDetail from "@/components/game/select/BeatmapDetail";
import { listBeatmaps } from "@/lib/api/beatmaps";
import { useGameStore } from "@/lib/store/useGameStore";
import { useMusicStore } from "@/lib/store/useMusicStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import type { Beatmap } from "@/types/beatmap";

export default function SongSelectPage() {
  const router = useRouter();
  const { beatmaps, setBeatmaps, selectedBeatmap, setSelectedBeatmap } = useGameStore();
  const [loading, setLoading] = useState(beatmaps.length === 0);
  const [mounted, setMounted] = useState(false);
  const lastSelectedByMe = useRef<string | null>(selectedBeatmap?.id || null);
  const selectedRef = useRef<Beatmap | null>(selectedBeatmap);

  useEffect(() => {
    selectedRef.current = selectedBeatmap;
  }, [selectedBeatmap]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const { playlist: musicPlaylist, currentIndex, playBeatmap, isPlaying } = useMusicStore();

  // Preview audio on selection
  useEffect(() => {
    if (!selectedBeatmap) return;

    const timer = setTimeout(async () => {
      // If already playing this song in the global player, don't restart it
      const currentGlobal = musicPlaylist[currentIndex];
      if (currentGlobal && 
          currentGlobal.title === selectedBeatmap.title && 
          currentGlobal.artist === selectedBeatmap.artist && 
          isPlaying) {
        return;
      }

      playBeatmap(selectedBeatmap);
    }, 400); // 400ms debounce

    return () => {
      clearTimeout(timer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBeatmap?.id]);

  const [search, setSearch] = useState("");
  
  const { 
    selectionSortBy: sortBy, 
    selectionGroupBy: groupBy, 
    selectionStarMin: starMin, 
    selectionStarMax: starMax,
    lastSelectedBeatmapId,
    setSelectionSortBy: setSortBy,
    setSelectionGroupBy: setGroupBy,
    setSelectionStarRange,
    setLastSelectedBeatmapId
  } = useSettingsStore();

  const changeSelection = useCallback((beatmap: Beatmap) => {
    lastSelectedByMe.current = beatmap.id;
    setSelectedBeatmap(beatmap);
    setLastSelectedBeatmapId(beatmap.id);
  }, [setSelectedBeatmap, setLastSelectedBeatmapId]);

  const fetchBeatmaps = useCallback(async () => {
    // Only fetch if we don't have them yet
    if (beatmaps.length > 0) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const res = await listBeatmaps(1, 10000);
      setBeatmaps(res.data);
      
      if (res.data.length > 0 && !selectedBeatmap) {
        // Priority 1: Try to restore last selected difficulty
        const persisted = lastSelectedBeatmapId ? res.data.find(b => b.id === lastSelectedBeatmapId) : null;
        
        if (persisted) {
          changeSelection(persisted);
        } else {
          // Priority 2: Try to match with currently playing music
          const currentMusic = musicPlaylist[currentIndex];
          const matched = currentMusic ? res.data.find(b => b.id === currentMusic.id) : null;
          
          if (matched) {
            changeSelection(matched);
          } else {
            // Priority 3: Pick the easiest of the first song
            const firstSongDiffs = res.data.filter(b => b.title === res.data[0].title && b.artist === res.data[0].artist);
            const easiest = firstSongDiffs.sort((a, b) => a.starRating - b.starRating)[0];
            changeSelection(easiest);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch beatmaps:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedBeatmap, musicPlaylist, currentIndex, beatmaps.length, setBeatmaps, changeSelection, lastSelectedBeatmapId]);

  // Sync selected beatmap with music player when it changes (e.g. from navbar)
  useEffect(() => {
    const currentMusic = musicPlaylist[currentIndex];
    if (!currentMusic) return;

    // Check against the ref to ensure we have the latest selection without being a dependency
    const currentSelected = selectedRef.current;

    // ONLY sync if:
    // 1. The song in the music player is actually different (different title/artist)
    // 2. AND we didn't just manually select this exact song ourselves
    // This prevents the 'difficulty reset' because musicPlaylist only stores one canonical diff per song
    const isSameSong = currentSelected && 
                      currentSelected.title === currentMusic.title && 
                      currentSelected.artist === currentMusic.artist;

    if (!isSameSong && lastSelectedByMe.current !== currentMusic.id) {
      const matched = beatmaps.find(b => b.id === currentMusic.id);
      if (matched) {
        changeSelection(matched);
      }
    }
  }, [currentIndex, musicPlaylist, beatmaps, changeSelection]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBeatmaps();
  }, [fetchBeatmaps]);


  const handleSelectBeatmap = (beatmap: Beatmap) => {
    changeSelection(beatmap);
  };

  const handleRandomBeatmap = () => {
    if (beatmaps.length === 0) return;
    const random = beatmaps[Math.floor(Math.random() * beatmaps.length)];
    changeSelection(random);
  };

  const allDiffs = useMemo(() => {
    if (!selectedBeatmap) return [];
    return beatmaps.filter(
      (b) =>
        b.title === selectedBeatmap.title &&
        b.artist === selectedBeatmap.artist,
    );
  }, [selectedBeatmap, beatmaps]);

  // --- Keyboard Navigation Logic ---
  const groupedCategories = useMemo<GroupCategory[]>(() => {
    const lowerSearch = search.toLowerCase();
    
    // First, filter all beatmaps
    const validBeatmaps = beatmaps.filter(b => {
      const matchesSearch = b.title.toLowerCase().includes(lowerSearch) || 
                            b.artist.toLowerCase().includes(lowerSearch);
      return matchesSearch && b.starRating >= starMin && b.starRating <= starMax;
    });

    if (groupBy === "DIFFICULTY") {
      // Each difficulty is its own item
      const items = validBeatmaps.map(b => {
        const inRangeDiffs = beatmaps.filter(x => 
          x.title === b.title && 
          x.artist === b.artist &&
          x.starRating >= starMin && 
          x.starRating <= starMax
        );
        return {
          id: b.id,
          title: b.title,
          artist: b.artist,
          coverUrl: b.coverUrl,
          status: b.rankedStatus,
          representedBeatmap: b,
          allDifficulties: inRangeDiffs.sort((a, b) => a.starRating - b.starRating)
        };
      });

      // Group by star rating buckets: 0-1 Stars, 1-2 Stars, etc.
      const map = new Map<number, typeof items>();
      for (const item of items) {
        const star = item.representedBeatmap!.starRating;
        const bucket = Math.floor(star);
        if (!map.has(bucket)) map.set(bucket, []);
        map.get(bucket)!.push(item);
      }

      const sortedBuckets = Array.from(map.keys()).sort((a, b) => a - b);
      return sortedBuckets.map(bucket => {
        const label = `${bucket} - ${bucket + 1} Stars`;
        const categoryItems = map.get(bucket)!;
        
        // Sort items within bucket
        categoryItems.sort((a, b) => {
          const aFirst = a.representedBeatmap!;
          const bFirst = b.representedBeatmap!;
          switch (sortBy) {
            case "title": return aFirst.title.localeCompare(bFirst.title);
            case "artist": return aFirst.artist.localeCompare(bFirst.artist);
            case "starRating": return aFirst.starRating - bFirst.starRating;
            case "bpm": return aFirst.bpm - bFirst.bpm;
            default: return 0;
          }
        });

        return {
          label,
          items: categoryItems
        };
      });
    } else {
      // Group by song parent (title + artist)
      const parentMap = new Map<string, Beatmap[]>();
      for (const b of validBeatmaps) {
        const key = `${b.title}|||${b.artist}`;
        if (!parentMap.has(key)) parentMap.set(key, []);
        parentMap.get(key)!.push(b);
      }

      const items = Array.from(parentMap.entries()).map(([key, diffs]) => {
        const first = diffs[0];
        // Use only the difficulties that passed the filter (in range)
        const sortedDiffs = diffs.sort((a, b) => a.starRating - b.starRating);
        return {
          id: key,
          title: first.title,
          artist: first.artist,
          coverUrl: first.coverUrl,
          status: first.rankedStatus,
          allDifficulties: sortedDiffs,
          representedBeatmap: sortedDiffs[0] // Default representative is the easiest in range
        };
      });

      if (groupBy === "ARTIST") {
        const map = new Map<string, typeof items>();
        for (const item of items) {
          const firstChar = item.artist.charAt(0).toUpperCase();
          const label = /[A-Z]/.test(firstChar) ? firstChar : "0-9";
          if (!map.has(label)) map.set(label, []);
          map.get(label)!.push(item);
        }

        const sortedLabels = Array.from(map.keys()).sort((a, b) => {
          if (a === "0-9") return -1;
          if (b === "0-9") return 1;
          return a.localeCompare(b);
        });

        return sortedLabels.map(label => {
          const categoryItems = map.get(label)!;
          categoryItems.sort((a, b) => {
            const aFirst = a.allDifficulties[0];
            const bFirst = b.allDifficulties[0];
            switch (sortBy) {
              case "title": return aFirst.title.localeCompare(bFirst.title);
              case "artist": return aFirst.artist.localeCompare(bFirst.artist);
              case "starRating": return aFirst.starRating - bFirst.starRating;
              case "bpm": return aFirst.bpm - bFirst.bpm;
              default: return 0;
            }
          });
          return { label, items: categoryItems };
        });
      } else {
        // NONE
        items.sort((a, b) => {
          const aFirst = a.allDifficulties[0];
          const bFirst = b.allDifficulties[0];
          switch (sortBy) {
            case "title": return aFirst.title.localeCompare(bFirst.title);
            case "artist": return aFirst.artist.localeCompare(bFirst.artist);
            case "starRating": return aFirst.starRating - bFirst.starRating;
            case "bpm": return aFirst.bpm - bFirst.bpm;
            default: return 0;
          }
        });
        return [{ label: "", items }];
      }
    }
  }, [beatmaps, search, starMin, starMax, groupBy, sortBy]);

  const flatBeatmaps = useMemo(() => {
    const list: Beatmap[] = [];
    groupedCategories.forEach(cat => {
      cat.items.forEach(item => {
        if (groupBy === "DIFFICULTY") {
          list.push(item.representedBeatmap!);
        } else {
          list.push(...item.allDifficulties);
        }
      });
    });
    return list;
  }, [groupedCategories, groupBy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in search
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (!selectedBeatmap || groupedCategories.length === 0) return;

      const currentIdx = flatBeatmaps.findIndex(b => b.id === selectedBeatmap.id);
      
      const flatItems = groupedCategories.flatMap(c => c.items);
      const currentGroupIdx = flatItems.findIndex(item => 
        groupBy === "DIFFICULTY" 
          ? item.representedBeatmap!.id === selectedBeatmap.id
          : item.allDifficulties.some(d => d.id === selectedBeatmap.id)
      );

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextIdx = (currentIdx + 1) % flatBeatmaps.length;
        changeSelection(flatBeatmaps[nextIdx]);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevIdx = (currentIdx - 1 + flatBeatmaps.length) % flatBeatmaps.length;
        changeSelection(flatBeatmaps[prevIdx]);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const nextGroupIdx = (currentGroupIdx + 1) % flatItems.length;
        const nextGroup = flatItems[nextGroupIdx];
        changeSelection(groupBy === "DIFFICULTY" ? nextGroup.representedBeatmap! : nextGroup.allDifficulties[0]);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        const prevGroupIdx = (currentGroupIdx - 1 + flatItems.length) % flatItems.length;
        const prevGroup = flatItems[prevGroupIdx];
        changeSelection(groupBy === "DIFFICULTY" ? prevGroup.representedBeatmap! : prevGroup.allDifficulties[0]);
      } else if (e.key === "Enter") {
        e.preventDefault();
        router.push(`/prepare/${selectedBeatmap.id}`);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedBeatmap, flatBeatmaps, groupedCategories, groupBy, router, changeSelection]);

  return (
    <div className="relative flex-1 w-full flex flex-col overflow-hidden bg-lanify-bg">
      {/* Background: selected beatmap art, heavily dimmed */}
      {/* Background: selected beatmap art, heavily dimmed */}
      <AnimatePresence>
        {selectedBeatmap?.coverUrl ? (
          <motion.div
            key={selectedBeatmap.coverUrl}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
            style={{ 
              backgroundImage: `url(${selectedBeatmap.coverUrl})`,
              filter: 'brightness(0.4)',
              transform: 'scale(1.05)',
            }}
          />
        ) : (
          <motion.div 
            key="fallback"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-linear-to-br from-lanify-bg via-lanify-surface to-lanify-bg z-0" 
            style={{ transform: 'scale(1.05)' }}
          />
        )}
      </AnimatePresence>

      {/* Main Content: Only show when mounted to prevent hydration mismatch, but maintain layout */}
      <div className={`relative z-10 flex flex-1 min-h-0 transition-opacity duration-300 ${mounted ? "opacity-100" : "opacity-0"}`}>
        {mounted && (
          <>
            {/* ─── LEFT PANEL (40%) — flush left ─────────────────── */}
            <div className="w-[40%] shrink-0 flex flex-col">
              {/* Beatmap detail card + leaderboard — fills available height */}
              <div className="flex-1 min-h-0 flex flex-col">
                <BeatmapDetail beatmap={selectedBeatmap} allDiffs={allDiffs} />
              </div>
            </div>

            {/* ─── GAP between panels ─── */}
            <div className="w-[15%] shrink-0" />

            {/* ─── RIGHT PANEL (45%) — flush right ────────────────── */}
            <div className="w-[45%] flex flex-col min-w-0">
              {/* Song list panel — fills available height */}
              <div className="flex-1 min-h-0 flex flex-col">
                <BeatmapList
                  beatmaps={beatmaps}
                  selectedBeatmap={selectedBeatmap}
                  onSelectBeatmap={handleSelectBeatmap}
                  loading={loading}
                  search={search}
                  setSearch={setSearch}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  starMin={starMin}
                  starMax={starMax}
                  setStarRange={setSelectionStarRange}
                  groupBy={groupBy}
                  setGroupBy={setGroupBy}
                  groupedCategories={groupedCategories}
                />
              </div>
            </div>
          </>
        )}
      </div>


      {/* ─── BOTTOM PANEL ────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-[#0a0a18] border-t border-white/10 flex items-center px-6 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        {/* Bottom-Left Corner — Controls */}
        <div className="flex-1 flex items-center gap-3">
          <Link href="/">
            <button className="h-12 px-8 rounded-xl bg-blue-900 hover:bg-blue-700 text-white font-game-display font-bold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-900/40 border border-blue-500/30">
              <ArrowLeft className="w-5 h-5" /> BACK
            </button>
          </Link>

          <motion.button
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 15px rgba(255,255,255,0.1)",
            }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center justify-center h-12 w-16 rounded-xl bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10 text-lanify-text-secondary hover:text-white transition-all cursor-pointer"
          >
            <span className="text-xs font-game-display font-bold">MODS</span>
            <span className="text-[9px] font-game-mono leading-none mt-0.5">
              4K/7K
            </span>
          </motion.button>

          <motion.button
            onClick={handleRandomBeatmap}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 15px rgba(255,255,255,0.1)",
            }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center justify-center h-12 px-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10 text-lanify-text-secondary hover:text-white transition-all cursor-pointer"
          >
            <Shuffle className="w-4 h-4 mb-0.5" />
            <span className="text-[9px] font-game-display font-bold tracking-widest leading-none">
              RANDOM
            </span>
          </motion.button>

          <motion.button
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 15px rgba(255,255,255,0.1)",
            }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center justify-center h-12 px-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10 text-lanify-text-secondary hover:text-white transition-all cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 mb-0.5" />
            <span className="text-[9px] font-game-display font-bold tracking-widest leading-none">
              OPTIONS
            </span>
          </motion.button>
        </div>

        {/* Center — Removed Play Button */}
        <div className="shrink-0 flex justify-center"></div>

        {/* Right Empty Space to balance flex layout */}
        <div className="flex-1" />
      </div>

      {/* Play button — 1/4 circle at exact bottom right */}
      <motion.button
        onClick={() =>
          selectedBeatmap && router.push(`/prepare/${selectedBeatmap.id}`)
        }
        disabled={!selectedBeatmap}
        whileHover={
          selectedBeatmap ? { scale: 1.05, filter: "brightness(1.1)" } : {}
        }
        whileTap={selectedBeatmap ? { scale: 0.95 } : {}}
        className={`absolute bottom-0 right-0 w-44 h-44 rounded-tl-full flex items-center justify-center pt-10 pl-10 z-30 transition-all shadow-[-10px_-10px_30px_rgba(0,0,0,0.4)]
          ${
            selectedBeatmap
              ? "bg-lanify-accent text-lanify-bg cursor-pointer shadow-[0_0_40px_rgba(0,229,255,0.4)]"
              : "bg-white/10 text-white/20 cursor-not-allowed border border-white/5"
          }`}
      >
        <div className="flex flex-col items-center justify-center">
          <Play
            className={`w-12 h-12 ml-2 ${selectedBeatmap ? "fill-lanify-bg" : "fill-white/20"}`}
          />
          <span className="text-xl font-game-display font-bold mt-1 tracking-widest">
            PLAY
          </span>
        </div>
      </motion.button>
    </div>
  );
}
