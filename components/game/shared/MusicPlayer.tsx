"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Music, 
  ChevronDown, 
  Volume2,
  ListMusic
} from "lucide-react";
import { useMusicStore } from "@/lib/store/useMusicStore";
import { useGameStore } from "@/lib/store/useGameStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function MusicPlayer() {
  const pathname = usePathname();
  const settings = useSettingsStore();
  const { 
    playlist, 
    currentIndex, 
    isPlaying, 
    togglePlay, 
    pauseMusic,
    next, 
    previous, 
    playBeatmap, 
    playRandom,
    setVolume
  } = useMusicStore();
  
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const currentSong = playlist[currentIndex];
  const { status: gameStatus } = useGameStore();
  const wasPlayingRef = useRef(false);

  // Hide on certain pages
  const isSelectPage = pathname === "/select";
  const isPreparePage = pathname.includes("/prepare/");
  const shouldHide = isSelectPage || isPreparePage || gameStatus === "playing";

  useEffect(() => {
    if (gameStatus === "playing") {
      if (isPlaying) {
        wasPlayingRef.current = true;
        pauseMusic();
      }
    } else if (wasPlayingRef.current && !isPlaying) {
      wasPlayingRef.current = false;
      togglePlay();
    }
  }, [gameStatus, isPlaying, togglePlay, pauseMusic]);

  // Sync with master volume
  useEffect(() => {
    setVolume(settings.volume);
  }, [settings.volume, setVolume]);

  // Auto-play random song if nothing playing
  useEffect(() => {
    if (currentIndex === -1 && playlist.length === 0) {
      playRandom();
    }
  }, [currentIndex, playlist.length, playRandom]);

  // Click outside to close
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    window.addEventListener("mousedown", handle);
    return () => window.removeEventListener("mousedown", handle);
  }, []);

  if (shouldHide) return null;

  return (
    <div className="relative flex items-center h-full mr-4" ref={containerRef}>
      {/* Mini Player */}
      <button 
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-3 h-7 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer max-w-[200px]"
      >
        <Music className={`w-3.5 h-3.5 text-lanify-accent ${isPlaying ? "animate-pulse" : ""}`} />
        <div className="flex flex-col items-start min-w-0">
          <span className="text-[10px] font-game-display font-bold text-white truncate w-full">
            {currentSong ? currentSong.title : "Not Playing"}
          </span>
        </div>
        <ChevronDown className={`w-3 h-3 text-white/30 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} />
      </button>

      {/* Expanded Card */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 w-72 bg-[#0a0a18]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-60"
          >
            {/* Header / Current Song */}
            <div className="relative h-28 w-full overflow-hidden">
              {currentSong?.coverUrl ? (
                <Image 
                  fill 
                  unoptimized 
                  src={currentSong.coverUrl} 
                  alt="" 
                  className="object-cover brightness-[0.4]" 
                />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-lanify-surface to-lanify-bg" />
              )}
              
              <div className="absolute inset-0 p-4 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h4 className="text-xs font-game-display font-bold text-white truncate">
                      {currentSong?.title || "Unknown"}
                    </h4>
                    <p className="text-[10px] font-game-body text-white/60 truncate">
                      {currentSong?.artist || "Unknown Artist"}
                    </p>
                  </div>
                  <Volume2 className="w-3.5 h-3.5 text-white/40" />
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-6">
                  <button onClick={previous} className="text-white/70 hover:text-white transition-colors cursor-pointer">
                    <SkipBack className="w-4 h-4 fill-current" />
                  </button>
                  <button 
                    onClick={togglePlay}
                    className="w-8 h-8 rounded-full bg-lanify-accent flex items-center justify-center text-lanify-bg hover:scale-110 transition-all cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                  </button>
                  <button onClick={next} className="text-white/70 hover:text-white transition-colors cursor-pointer">
                    <SkipForward className="w-4 h-4 fill-current" />
                  </button>
                </div>
              </div>
            </div>

            {/* Song List */}
            <div className="max-h-60 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              <div className="flex items-center gap-2 px-2 py-1 mb-1 border-b border-white/5">
                <ListMusic className="w-3 h-3 text-white/30" />
                <span className="text-[9px] font-game-display font-bold text-white/30 tracking-widest uppercase">Playlist</span>
              </div>
              
              {playlist.map((bm, idx) => (
                <button
                  key={bm.id}
                  onClick={() => playBeatmap(bm)}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all text-left group
                    ${idx === currentIndex ? "bg-lanify-accent/10 border border-lanify-accent/20" : "hover:bg-white/5 border border-transparent"}`}
                >
                  <div className="relative w-8 h-8 rounded-md overflow-hidden bg-white/5 shrink-0">
                    {bm.coverUrl ? (
                      <Image fill unoptimized src={bm.coverUrl} alt="" className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-3 h-3 text-white/10" />
                      </div>
                    )}
                    {idx === currentIndex && isPlaying && (
                      <div className="absolute inset-0 bg-lanify-accent/20 flex items-center justify-center">
                         <div className="flex gap-0.5 items-end h-3">
                            <div className="w-0.5 bg-lanify-accent animate-music-bar-1" />
                            <div className="w-0.5 bg-lanify-accent animate-music-bar-2" />
                            <div className="w-0.5 bg-lanify-accent animate-music-bar-3" />
                         </div>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className={`text-[11px] font-game-display font-bold truncate ${idx === currentIndex ? "text-lanify-accent" : "text-white group-hover:text-white"}`}>
                      {bm.title}
                    </div>
                    <div className="text-[9px] font-game-body text-white/40 truncate">
                      {bm.artist}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
