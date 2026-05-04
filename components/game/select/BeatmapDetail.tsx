"use client";

import { useState } from "react";
import { Music, PlayCircle, User, Heart, Clock, Zap} from "lucide-react";
import LeaderboardTab from "./LeaderboardTab";
import GuestLeaderboardPlaceholder from "./GuestLeaderboardPlaceholder";
import GuestPill from "@/components/game/shared/GuestPill";
import { InlineDropdown } from "./BeatmapList";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { getStarRatingColor, formatDuration } from "@/types/game";
import type { Beatmap } from "@/types/beatmap";

interface BeatmapDetailProps {
  beatmap: Beatmap | null;
  allDiffs?: Beatmap[];
  selectedMods?: string[];
}

export default function BeatmapDetail({ beatmap, allDiffs = [], selectedMods = [] }: BeatmapDetailProps) {
  const { isGuest, token } = useAuthStore();
  const [scope, setScope] = useState("GLOBAL");
  const [sort, setSort] = useState("SCORE");

  if (!beatmap) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <Music className="w-12 h-12 text-lanify-text-secondary/30 mx-auto mb-3" />
          <p className="text-sm font-game-body text-lanify-text-secondary">
            Select a beatmap to view details
          </p>
        </div>
      </div>
    );
  }

  const starColor = getStarRatingColor(beatmap.starRating);

  const statusMap: Record<string, { label: string; color: string }> = {
    ranked: { label: "RANKED", color: "#b3ff66" },
    loved: { label: "LOVED", color: "#ff66aa" },
    qualified: { label: "QUALIFIED", color: "#66ccff" },
    approved: { label: "APPROVED", color: "#b3ff66" },
    graveyard: { label: "GRAVEYARD", color: "#8888aa" },
    pending: { label: "PENDING", color: "#ffaa00" },
  };
  const status = statusMap[beatmap.rankedStatus] || statusMap.ranked;

  const totalDiffs = allDiffs.length > 0 ? allDiffs.length : 1;
  const currentDiffIndex = allDiffs.findIndex((d) => d.id === beatmap.id);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── TOP CARD: beatmap info with slightly transparent dark bg ── */}
      <div className="relative shrink-0 overflow-hidden" style={{ minHeight: "220px" }}>
        {/* Semi-transparent dark overlay so cover art behind bleeds through */}
        <div className="absolute inset-0 bg-[#0a0a18]/85 backdrop-blur-sm" />
        
        {/* Status badge — top-left */}
        <div className="absolute top-3 left-3 z-20">
          <span
            className="px-2.5 py-1 text-[10px] font-game-display font-bold tracking-widest rounded border border-current bg-black/50 shadow-sm"
            style={{ color: status.color }}
          >
            {status.label}
          </span>
        </div>

        {/* Content overlay */}
        <div className="relative flex flex-col justify-between p-5 pt-10 z-10 h-full">
          {/* Title / Artist */}
          <div>
            <h1 className="text-[24px] font-game-display font-bold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,1)] line-clamp-2">
              {beatmap.title}
            </h1>
            <p className="text-[14px] font-game-body font-medium text-white/60 mb-2 line-clamp-1 italic">
              {beatmap.artist}
            </p>

            {/* Meta row */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <MetaPill
                icon={<User className="w-[18px] h-[18px]" />}
                label={beatmap.creator}
              />
              <MetaPill
                icon={<PlayCircle className="w-[18px] h-[18px] text-cyan-400" />}
                label={beatmap.playCount && beatmap.playCount > 1000 ? `${(beatmap.playCount / 1000).toFixed(1)}k` : (beatmap.playCount?.toString() || "0")}
              />
              <MetaPill
                icon={<Heart className="w-[18px] h-[18px] text-pink-500" />}
                label={beatmap.favoriteCount && beatmap.favoriteCount > 1000 ? `${(beatmap.favoriteCount / 1000).toFixed(1)}k` : (beatmap.favoriteCount?.toString() || "0")}
              />
              <MetaPill
                icon={<Clock className="w-[18px] h-[18px] text-orange-400" />}
                label={formatDuration(beatmap.lengthSeconds)}
              />
              <MetaPill
                icon={<Zap className="w-[18px] h-[18px] text-yellow-400" />}
                label={`${Math.round(beatmap.bpm)} BPM`}
              />
            </div>

            {/* Difficulty + Mods info */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span
                className="px-2 py-0.5 rounded text-[11px] font-game-mono font-bold border border-white/20"
                style={{ backgroundColor: `${starColor}30`, color: starColor }}
              >
                ★ {beatmap.starRating.toFixed(2)}
              </span>
              <span 
                className="px-2 py-0.5 text-[11px] font-game-mono font-bold rounded shadow-sm border border-white/20 bg-white/5 text-white"
              >
                {beatmap.keyCount}K
              </span>
              <span className="text-[11px] font-game-body text-white/40">
                Diff {currentDiffIndex + 1}/{totalDiffs}
              </span>
              {selectedMods.length > 0 && (
                <div className="flex items-center gap-1">
                  {selectedMods.map((mod) => (
                    <span key={mod} className="px-1.5 py-0.5 text-[9px] font-game-mono font-bold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {mod}
                    </span>
                  ))}
                </div>
              )}
              {selectedMods.length === 0 && (
                <span className="text-[11px] font-game-body text-white/30 italic">No mods</span>
              )}
            </div>
          </div>

          {/* Stat pills */}
          <div className="grid grid-cols-3 gap-1.5">
            <StatPill label="NOTES" value={beatmap.noteCount?.toLocaleString() ?? "0"} color={starColor} />
            <StatPill label="HOLDS" value={beatmap.holdCount?.toLocaleString() ?? "0"} color={starColor} />
            <StatPill label="KEYS" value={`${beatmap.keyCount}K`} color={starColor} />
            <StatPill label="OD" value={beatmap.od.toFixed(1)} color={starColor} />
            <StatPill label="HP" value={beatmap.hp.toFixed(1)} color={starColor} />
            <StatPill label="STARS" value={beatmap.starRating.toFixed(2)} color={starColor} />
          </div>
        </div>

        {/* Bottom edge accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: starColor, boxShadow: `0 -2px 10px ${starColor}80` }} />
      </div>

      {/* ── LEADERBOARD SECTION ── */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden mt-3">
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="flex-1 text-[13px] font-game-display text-lanify-text tracking-[0.06em] uppercase" style={{ fontWeight: 600 }}>
            Ranking
          </h2>
          {!isGuest && (
            <div className="flex items-center gap-2">
              <InlineDropdown
                label="Scope"
                value={scope}
                options={[
                  { label: "GLOBAL", value: "GLOBAL" },
                  { label: "LOCAL", value: "LOCAL" },
                  { label: "FRIENDS", value: "FRIENDS" },
                ]}
                onChange={setScope}
              />
              <InlineDropdown
                label="Sort"
                value={sort}
                options={[
                  { label: "SCORE", value: "SCORE" },
                  { label: "ACCURACY", value: "ACCURACY" },
                  { label: "DATE", value: "DATE" },
                ]}
                onChange={setSort}
              />
            </div>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          {isGuest ? (
            <GuestLeaderboardPlaceholder />
          ) : (
            <LeaderboardTab
              beatmapId={beatmap.id}
              beatmap={beatmap}
              scope={scope as "GLOBAL" | "LOCAL" | "FRIENDS"}
              token={token}
            />
          )}
        </div>
      </div>

      {/* Guest pill */}
      {isGuest && (
        <div className="p-2 border-t border-white/5 bg-black/20 shrink-0 mt-2">
          <GuestPill className="mx-auto" />
        </div>
      )}
    </div>
  );
}

function MetaPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/40 border border-white/10 text-[14px] font-medium text-white/70 shadow-sm">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-2 bg-white/5 border border-white/5 rounded-md relative overflow-hidden group hover:bg-white/10 transition-colors">
      <div className="absolute left-0 top-0 bottom-0 w-0.5 opacity-50 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: color }} />
      <span className="text-[11px] font-game-display font-semibold text-white/40 tracking-wider uppercase">
        {label}
      </span>
      <span className="text-[15px] font-game-mono font-bold text-white ml-auto">
        {value}
      </span>
    </div>
  );
}
