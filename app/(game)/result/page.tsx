"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { RotateCcw, ArrowLeft } from "lucide-react";
import { useGameStore, calculateRank } from "@/lib/store/useGameStore";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { submitScore } from "@/lib/api/scores";
import { judgementsToPayload } from "@/types/score";
import GradeBadge from "@/components/game/result/GradeBadge";
import JudgementBreakdown from "@/components/game/result/JudgementBreakdown";
import AccuracyGraph from "@/components/game/result/AccuracyGraph";
import HitErrorBar from "@/components/game/result/HitErrorBar";
import GuestBanner from "@/components/game/result/GuestBanner";
import { toast } from "sonner";

export default function ResultPage() {
  const router = useRouter();
  const { score, maxCombo, accuracy, judgements, accuracyHistory, hitErrors, currentBeatmap, selectedBeatmapId, isReadOnly } = useGameStore();
  const { token, isGuest } = useAuthStore();
  const submitted = useRef(false);

  const rank = calculateRank(accuracy);

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
        .then(() => {
          toast.success("Score saved!");
          useGameStore.getState().invalidateLeaderboardCache(selectedBeatmapId);
        })
        .catch(() => toast.error("Failed to save score"));
    }
  }, [token, selectedBeatmapId, score, accuracy, maxCombo, judgements, accuracyHistory, hitErrors, isReadOnly]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-linear-to-br from-lanify-bg via-lanify-surface to-lanify-bg" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-lanify-accent/3 blur-[150px]" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-lanify-accent2/3 blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-8 min-h-screen flex flex-col">
        {/* Guest Banner */}
        {isGuest && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <GuestBanner />
          </motion.div>
        )}

        {/* Beatmap info header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mt-4 mb-8"
        >
          <h1 className="text-2xl font-game-display font-bold text-white">
            {currentBeatmap?.title || "Unknown"}
          </h1>
          <p className="text-sm font-game-body text-lanify-text-secondary mt-1">
            {currentBeatmap?.artist} — {currentBeatmap?.difficultyName}
          </p>
        </motion.div>

        {/* Main content: LEFT stats / RIGHT grade */}
        <div className="flex-1 flex gap-8 items-start">
          {/* LEFT: Score, Accuracy, Combo, Judgements */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1 space-y-6"
          >
            {/* Score */}
            <div className="bg-lanify-surface/40 backdrop-blur-md border border-white/5 rounded-2xl p-6">
              <p className="text-xs font-game-mono text-lanify-accent uppercase tracking-wider mb-1">Score</p>
              <p className="text-5xl font-game-mono font-bold text-white text-shimmer tabular-nums">
                {score.toLocaleString()}
              </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-lanify-surface/30 border border-white/5 rounded-xl p-4">
                <p className="text-xs font-game-mono text-lanify-text-secondary uppercase mb-1">Max Combo</p>
                <p className="text-2xl font-game-mono font-bold text-white tabular-nums">{maxCombo}x</p>
              </div>
              <div className="bg-lanify-surface/30 border border-white/5 rounded-xl p-4">
                <p className="text-xs font-game-mono text-lanify-text-secondary uppercase mb-1">Accuracy</p>
                <p className="text-2xl font-game-mono font-bold text-white tabular-nums">{accuracy.toFixed(2)}%</p>
              </div>
            </div>

            {/* Judgement breakdown */}
            <div className="bg-lanify-surface/30 border border-white/5 rounded-xl p-4">
              <p className="text-xs font-game-mono text-lanify-accent uppercase tracking-wider mb-3">Judgements</p>
              <JudgementBreakdown judgements={judgements} />
            </div>

            {/* Hit error bar */}
            <div className="bg-lanify-surface/30 border border-white/5 rounded-xl p-4">
              <HitErrorBar errors={hitErrors} />
            </div>
          </motion.div>

          {/* RIGHT: Grade Badge + Accuracy Graph */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="w-[300px] space-y-6 shrink-0"
          >
            {/* Grade */}
            <div className="bg-lanify-surface/30 border border-white/5 rounded-2xl p-8">
              <GradeBadge rank={rank} />
            </div>

            {/* Accuracy graph */}
            <div className="bg-lanify-surface/30 border border-white/5 rounded-xl p-4">
              <p className="text-xs font-game-mono text-lanify-accent uppercase tracking-wider mb-3">Accuracy Over Time</p>
              <AccuracyGraph data={accuracyHistory} />
            </div>
          </motion.div>
        </div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex gap-3 justify-center mt-8"
        >
          <button
            onClick={() => { if (selectedBeatmapId) router.push(`/play/${selectedBeatmapId}`); }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-lanify-accent text-lanify-bg font-game-display font-semibold cursor-pointer hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all duration-200"
          >
            <RotateCcw className="w-4 h-4" /> Retry
          </button>
          <button
            onClick={() => { useGameStore.getState().resetGame(); router.push("/select"); }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-white font-game-body cursor-pointer hover:border-lanify-accent/30 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Select
          </button>
        </motion.div>
      </div>
    </div>
  );
}
