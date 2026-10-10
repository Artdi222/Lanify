"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, RotateCcw, Star, User } from "lucide-react";
import { useGameStore, calculateRank } from "@/lib/store/useGameStore";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { getBeatmapPerformance, submitScore } from "@/lib/api/scores";
import { judgementsToPayload } from "@/types/score";
import { JUDGEMENT_COLORS } from "@/types/game";
import { cn } from "@/lib/utils";
import { SHEAR, UNSHEAR } from "@/components/select/shear";
import GradeRing from "@/components/game/result/GradeRing";
import AccuracyGraph from "@/components/game/result/AccuracyGraph";
import HitErrorBar from "@/components/game/result/HitErrorBar";
import GuestBanner from "@/components/game/result/GuestBanner";
import { toast } from "sonner";

type Perf = { starRating: number; maxCombo: number; maxPp: number };

function StatCell({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div className="min-w-0 text-center">
      <div className="truncate rounded-full bg-black/45 px-1 py-px font-game-display text-[10px] font-bold uppercase tracking-wide" style={{ color: color ?? "#fff" }}>
        {label}
      </div>
      <div className="mt-1 font-game-body text-[19px] text-white tabular-nums">{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[20px] bg-lf-bg-raised/85 px-5 py-4 shadow-lf-panel">
      <h2 className="inline-block border-b-2 border-lf-accent pb-0.5 font-game-display text-sm font-bold text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Score screen. Spec: docs/ui-spec/score.md. */
export default function ResultPage() {
  const router = useRouter();
  const { score, maxCombo, accuracy, judgements, accuracyHistory, hitErrors, currentBeatmap, selectedBeatmapId, isReadOnly, viewingMeta } = useGameStore();
  const { token, isGuest, user } = useAuthStore();
  const submitted = useRef(false);
  const [freshPp, setFreshPp] = useState<number | null>(null);
  const [perf, setPerf] = useState<Perf | null>(null);
  const [playedAt] = useState(() => new Date().toISOString());

  const rank = calculateRank(accuracy);
  const beatmapId = currentBeatmap?.id ?? selectedBeatmapId;

  // Submit score on mount
  useEffect(() => {
    if (submitted.current || isReadOnly) return;

    // Don't submit if no notes were hit (avoids empty SS bug)
    const totalJudgements = Object.values(judgements).reduce((a, b) => a + b, 0);
    if (totalJudgements === 0 || (score === 0 && accuracy === 100)) {
      return;
    }

    submitted.current = true;

    if (token && selectedBeatmapId) {
      const payload = {
        beatmapId: selectedBeatmapId,
        score,
        accuracy: parseFloat(accuracy.toFixed(2)),
        maxCombo,
        ...judgementsToPayload(judgements),
        accuracyHistory: JSON.stringify(accuracyHistory),
        hitErrors: JSON.stringify(hitErrors),
      };
      submitScore(payload, token)
        .then((res) => {
          setFreshPp(res.pp ?? null);
          toast.success("Score saved!");
          useGameStore.getState().invalidateLeaderboardCache(selectedBeatmapId);
        })
        .catch(() => toast.error("Failed to save score"));
    }
  }, [token, selectedBeatmapId, score, accuracy, maxCombo, judgements, accuracyHistory, hitErrors, isReadOnly]);

  useEffect(() => {
    if (!beatmapId) return;
    let alive = true;
    getBeatmapPerformance(beatmapId)
      .then((res) => alive && setPerf(res))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [beatmapId]);

  const pp = isReadOnly ? viewingMeta?.pp ?? null : freshPp;
  const player = isReadOnly && viewingMeta ? viewingMeta : { username: isGuest ? "Guest" : user?.username ?? "Player", avatarUrl: isGuest ? null : user?.avatarUrl ?? null };
  const when = new Date(isReadOnly && viewingMeta ? viewingMeta.submittedAt : playedAt);
  const ppShare = pp !== null && perf?.maxPp ? Math.min(1, pp / perf.maxPp) : 0;

  const judgementCells = [
    { label: "Marvelous", count: judgements.marvelous, color: JUDGEMENT_COLORS.MARVELOUS },
    { label: "Perfect", count: judgements.perfect, color: JUDGEMENT_COLORS.PERFECT },
    { label: "Great", count: judgements.great, color: JUDGEMENT_COLORS.GREAT },
    { label: "Good", count: judgements.good, color: JUDGEMENT_COLORS.GOOD },
    { label: "Bad", count: judgements.bad, color: JUDGEMENT_COLORS.BAD },
    { label: "Miss", count: judgements.miss, color: JUDGEMENT_COLORS.MISS },
  ];

  const back = () => {
    useGameStore.getState().resetGame();
    router.push("/select");
  };

  return (
    <div className="relative h-screen overflow-hidden bg-lf-bg">
      {currentBeatmap?.backgroundUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={currentBeatmap.backgroundUrl} alt="" className="absolute inset-0 h-full w-full scale-105 object-cover blur-md" />
      )}
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10 flex h-full gap-9 px-7 pb-[72px] pt-[72px]">
        {/* Left: score card */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="relative flex w-[477px] shrink-0 flex-col pt-[65px]">
          <div className="absolute left-1/2 top-0 z-10 flex -translate-x-1/2 flex-col items-center">
            <span className="flex h-[105px] w-[105px] items-center justify-center overflow-hidden rounded-[22px] bg-lf-bg shadow-lf-panel">
              {player.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={player.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <User className="h-12 w-12 text-lf-text-muted" />
              )}
            </span>
            <span className="mt-1 font-game-display text-[15px] font-bold text-white">{player.username}</span>
          </div>

          <div className="flex min-h-0 flex-1 flex-col rounded-[22px] bg-lf-bg-raised/75 pt-[70px] shadow-lf-panel">
            <div className="flex min-h-0 flex-1 flex-col rounded-[22px] bg-lf-surface/90 px-6 pb-4 pt-5">
              <h1 className="truncate text-center font-game-display text-[20px] font-bold text-white">{currentBeatmap?.title || "Unknown"}</h1>
              <p className="truncate text-center font-game-body text-[13px] text-white/75">{currentBeatmap?.artist}</p>

              <div className="mt-5">
                <GradeRing accuracy={accuracy} rank={rank} />
              </div>

              <p className="mt-4 text-center font-game-body text-[60px] font-light leading-none text-white tabular-nums">{score.toLocaleString("en-US")}</p>
              <div className="mt-3 flex justify-center">
                <span className="flex items-center gap-1 rounded-full bg-lf-primary px-2.5 py-0.5 font-game-display text-xs font-bold text-white">
                  <Star className="h-3 w-3 fill-current" />
                  {perf ? perf.starRating.toFixed(2) : "-"}
                </span>
              </div>
              <p className="mt-1 text-center font-game-body text-[15px] text-white">{currentBeatmap?.difficultyName}</p>
              <p className="text-center font-game-body text-xs text-white/70">
                mapped by <span className="font-bold text-white">{currentBeatmap?.creator}</span>
              </p>

              <div className="mt-auto space-y-2 pt-4">
                <div className="grid grid-cols-3 gap-1.5">
                  <StatCell label="Accuracy" value={`${accuracy.toFixed(2)}%`} />
                  <StatCell
                    label="Max Combo"
                    value={
                      <>
                        {maxCombo.toLocaleString("en-US")}
                        {perf && <span className="text-xs text-white/60">/{perf.maxCombo.toLocaleString("en-US")}</span>}
                      </>
                    }
                  />
                  <StatCell label="PP" value={pp !== null ? Math.round(pp).toLocaleString("en-US") : "-"} />
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {judgementCells.map((j) => (
                    <StatCell key={j.label} label={j.label} value={j.count.toLocaleString("en-US")} color={j.color} />
                  ))}
                </div>
                <p className="pt-3 text-center font-game-body text-[11px] text-white/70">
                  Played on {when.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} {when.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right: breakdown + Lanify's own stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="no-scrollbar min-w-0 flex-1 space-y-3 overflow-y-auto pt-[150px]">
          {isGuest && !isReadOnly && <GuestBanner />}
          <Panel title="Performance Breakdown">
            <div className="flex items-center gap-6">
              <div className="flex min-w-0 flex-1 items-center gap-3 font-game-body text-xs text-white">
                Difficulty
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/70">
                  <div className="h-full rounded-full bg-lf-accent" style={{ width: `${ppShare * 100}%` }} />
                </div>
                <span className="w-9 text-right font-bold">{Math.round(ppShare * 100)}%</span>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div className="grid w-[40%] grid-cols-[1fr_auto] gap-x-4 font-game-body text-xs">
                <span className="text-lf-accent">Achieved PP</span>
                <span className="text-right text-lf-accent">{pp !== null ? Math.round(pp) : "-"}</span>
                <span className="text-white/60">Maximum</span>
                <span className="text-right text-white/60">{perf ? Math.round(perf.maxPp) : "-"}</span>
              </div>
            </div>
          </Panel>
          {accuracyHistory.length > 0 && (
            <Panel title="Accuracy Over Time">
              <AccuracyGraph data={accuracyHistory} />
            </Panel>
          )}
          {hitErrors.length > 0 && (
            <Panel title="Hit Error">
              <HitErrorBar errors={hitErrors} />
            </Panel>
          )}
        </motion.div>
      </div>

      {/* Footer */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex h-[67px] items-center justify-center gap-3 bg-lf-bg-raised/90">
        <button type="button" onClick={back} className={cn(SHEAR, "absolute -left-3 bottom-0 flex h-full w-[140px] cursor-pointer items-center justify-center gap-2 bg-select-back pl-3 font-game-display text-[17px] text-white transition-[filter] hover:brightness-110")}>
          <span className={cn(UNSHEAR, "flex items-center gap-2")}>
            <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white">
              <ChevronLeft className="h-4 w-4" />
            </span>
            back
          </span>
        </button>
        {!isReadOnly && selectedBeatmapId && (
          <button
            type="button"
            onClick={() => router.push(`/play/${selectedBeatmapId}`)}
            className="flex h-[38px] w-[400px] cursor-pointer items-center justify-center gap-2 rounded-lf-md bg-lf-primary font-game-display text-sm font-bold text-white transition-[filter] hover:brightness-110"
          >
            <RotateCcw className="h-4 w-4" /> Retry
          </button>
        )}
      </div>
    </div>
  );
}
