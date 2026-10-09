"use client";
import { useGameStore } from "@/lib/store/useGameStore";
import { useProgressStore } from "@/lib/store/useProgressStore";
import ProgressBar from "@/components/game/ProgressBar";

export default function ScoreHUD() {
  const score = useGameStore((s) => s.score);
  const accuracy = useGameStore((s) => s.accuracy);
  const currentBeatmap = useGameStore((s) => s.currentBeatmap);
  const progress = useProgressStore((s) => s.progress);
  
  return (
    <div className="fixed inset-0 z-30 pointer-events-none">
      {/* Top left HUD - Score */}
      <div className="absolute top-8 left-8">
        <span className="text-2xl font-game-mono font-semibold text-white tabular-nums">
          {score.toLocaleString('en-US', { minimumIntegerDigits: 7, useGrouping: true })}
        </span>
      </div>

      {/* Top right HUD - Progress & Metadata */}
      <div className="absolute top-8 right-8 text-right flex flex-col items-end gap-1">
        <p className="text-lg font-game-display text-white/90 font-semibold max-w-[300px] truncate">
          {currentBeatmap?.title}
        </p>
        <p className="text-xs font-game-body text-lanify-text-secondary max-w-[300px] truncate">
          {currentBeatmap?.artist}
        </p>
        
        <div className="flex items-center gap-2 mt-1">
          <ProgressBar progress={progress} />
          <span className="text-lg font-game-mono text-lanify-accent tabular-nums font-semibold">
            {accuracy.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
}
