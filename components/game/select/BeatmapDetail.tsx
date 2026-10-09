"use client";

import BeatmapInfoPanel from "@/components/select/BeatmapInfoPanel";
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
      <BeatmapInfoPanel beatmap={beatmap} />

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
