"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store/useGameStore";
import { getLeaderboard } from "@/lib/api/leaderboard";
import { User, Trophy} from "lucide-react";
import type { Beatmap } from "@/types/beatmap";

interface LeaderboardTabProps {
  beatmapId: string;
  beatmap?: Beatmap | null;
  scope?: 'GLOBAL' | 'LOCAL' | 'FRIENDS';
  token?: string | null;
}

const GRADE_COLORS: Record<string, string> = {
  SS: "#f4c430",
  S: "#f4c430",
  A: "#4caf50",
  B: "#2196f3",
  C: "#9c27b0",
  D: "#f44336",
};

export default function LeaderboardTab({ beatmapId, beatmap, scope = 'GLOBAL', token = null }: LeaderboardTabProps) {
  const router = useRouter();
  const cacheKey = `${beatmapId}-${scope}-${token || ""}`;
  const cached = useGameStore(state => state.leaderboardCache[cacheKey]);
  const setLeaderboardCache = useGameStore(state => state.setLeaderboardCache);
  const [prevCacheKey, setPrevCacheKey] = useState(cacheKey);
  const [loading, setLoading] = useState(!cached);

  // Sync loading state if the beatmap changes (initial guess based on cache existence)
  if (cacheKey !== prevCacheKey) {
    setPrevCacheKey(cacheKey);
    setLoading(!cached);
  }

  useEffect(() => {
    // Perform staleness check inside effect to keep render pure
    const isStale = !cached || Date.now() - cached.timestamp > 5 * 60 * 1000;
    
    if (!isStale) return;

    // We are stale, so we must fetch.
    // Note: We do NOT call setLoading(true) synchronously here to avoid cascading renders.
    // If 'cached' is missing, 'loading' is already true from the render phase.
    // If 'cached' exists but is stale, we show the stale data (loading=false) while refreshing.
    
    getLeaderboard(beatmapId, scope, token)
      .then((data) => {
        setLeaderboardCache(cacheKey, data);
      })
      .catch(() => {
        setLeaderboardCache(cacheKey, []);
      })
      .finally(() => {
        // Async state updates are perfectly safe in Effects
        setLoading(false);
      });
  }, [beatmapId, scope, token, cacheKey, cached, setLeaderboardCache]);

  const entries = cached?.entries || [];

  if (loading && !cached) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-lanify-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-lanify-text-secondary">
        <Trophy className="w-8 h-8 mb-2 opacity-30" />
        <p className="text-sm font-game-body">No scores yet</p>
        <p className="text-xs mt-1">Be the first to play!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      
      <div className="overflow-y-auto custom-scrollbar flex-1 pb-4 pl-3 pr-4 flex flex-col gap-2.5">
        {entries.map((entry, idx) => {
          const posColor = idx === 0 ? "#00e5ff" : idx === 1 ? "#c0c0c0" : idx === 2 ? "#cd7f32" : undefined;
          const gradeColor = GRADE_COLORS[entry.rank] || "#8888aa";
          
          return (
            <div
              key={entry.id}
              onClick={() => {
                const { setViewingScore } = useGameStore.getState();
                setViewingScore(entry, beatmap);
                router.push("/result");
              }}
              className="flex items-center gap-2.5 transition-all duration-200 hover:brightness-110 cursor-pointer group"
              style={{
                background: "rgba(0, 0, 0, 0.35)",
                borderRadius: "10px",
                padding: "10px 14px",
              }}
            >
              {/* Fix #11: Leaderboard Position Number (#N) Left of Avatar */}
              <div
                className="shrink-0 flex items-center justify-center font-game-display transition-colors group-hover:text-lanify-accent"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  fontWeight: 800,
                  fontSize: "14px",
                  color: posColor || "#fff",
                }}
              >
                #{entry.position}
              </div>

              {/* Avatar */}
              <div
                className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-white/15"
                style={idx === 0 ? { borderColor: "rgba(0,229,255,0.5)", boxShadow: "0 0 8px rgba(0,229,255,0.3)" } : {}}
              >
                {entry.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={entry.avatarUrl} alt={entry.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-black/40 flex items-center justify-center">
                    <User className={`w-6 h-6 ${idx === 0 ? "text-cyan-400" : "text-white/40"}`} />
                  </div>
                )}
              </div>

              {/* Username block */}
              <div className="flex-1 flex flex-col min-w-20">
                <span className="text-sm font-game-display font-bold truncate text-white" style={{ maxWidth: "100%" }}>
                  {entry.username}
                </span>
              </div>

              {/* Fix #12: Max Combo - Solid White */}
              <div className="flex flex-col items-center shrink-0 w-22.5">
                <span className="text-[10px] font-game-display uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>MAX COMBO</span>
                <span className="text-base font-game-mono text-lanify-text" style={{ fontWeight: 700 }}>{entry.maxCombo}x</span>
              </div>

              {/* Fix #12: Accuracy - Solid White */}
              <div className="flex flex-col items-center shrink-0 w-22.5">
                <span className="text-[10px] font-game-display uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>ACCURACY</span>
                <span className="text-base font-game-mono text-lanify-text" style={{ fontWeight: 700 }}>{entry.accuracy.toFixed(2)}%</span>
              </div>

              {/* Fix #11: Score & PP Value */}
              <div className="flex flex-col items-end shrink-0 w-30 justify-center pr-2">
                <span className={`text-[20px] font-game-display font-extrabold tracking-wider tabular-nums leading-none ${idx === 0 ? "text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]" : "text-amber-100"}`}>
                  {entry.pp ? Math.round(entry.pp).toLocaleString() : "0"}<span className="text-[12px] opacity-70 ml-0.5">pp</span>
                </span>
                <span className="text-[11px] font-game-mono text-white/50 tracking-wider mt-1">
                  {entry.score.toLocaleString()}
                </span>
              </div>

              {/* Fix #10: Grade Badge (S, SS, A, B) */}
              <div
                className="shrink-0 flex items-center justify-center font-game-display shadow-sm"
                style={{
                  backgroundColor: gradeColor,
                  color: entry.rank === "SS" || entry.rank === "S" ? "#000" : "#fff",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  fontWeight: 800,
                  fontSize: "15px",
                }}
              >
                {entry.rank}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}