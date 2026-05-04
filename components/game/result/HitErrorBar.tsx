"use client";
import type { HitError } from "@/types/game";

interface HitErrorBarProps {
  errors: HitError[];
}

export default function HitErrorBar({ errors }: HitErrorBarProps) {
  if (errors.length === 0) return null;
  const maxMs = 150;

  return (
    <div className="space-y-2">
      <p className="text-xs font-game-mono text-lanify-text-secondary">Hit Timing</p>
      <div className="relative h-8 rounded-lg bg-lanify-surface/50 border border-white/5 overflow-hidden">
        {/* Center line (perfect) */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/30" />
        {/* Gradient: cyan (early) → white (center) → purple (late) */}
        <div className="absolute inset-0 opacity-10" style={{
          background: "linear-gradient(90deg, #00e5ff, #ffffff, #7C3AED)"
        }} />
        {/* Error dots */}
        {errors.slice(-100).map((err, i) => {
          const pos = 50 + (err.errorMs / maxMs) * 50;
          const clampedPos = Math.max(2, Math.min(98, pos));
          return (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 w-1 h-3 rounded-full bg-white/60"
              style={{ left: `${clampedPos}%` }}
            />
          );
        })}
        {/* Labels */}
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-game-mono text-lanify-accent/60">Early</span>
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-game-mono text-lanify-accent2/60">Late</span>
      </div>
    </div>
  );
}
