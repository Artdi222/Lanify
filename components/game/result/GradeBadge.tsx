"use client";
import { RANK_COLORS, type RankGrade } from "@/types/game";

interface GradeBadgeProps {
  rank: RankGrade;
}

export default function GradeBadge({ rank }: GradeBadgeProps) {
  const color = RANK_COLORS[rank];
  const isGold = rank === "SS";
  return (
    <div className="flex items-center justify-center">
      <div
        className="relative w-32 h-32 rounded-2xl flex items-center justify-center"
        style={{
          background: isGold
            ? "linear-gradient(135deg, #ffd700, #ffaa00, #ffd700)"
            : `${color}10`,
          border: `2px solid ${color}40`,
          boxShadow: `0 0 30px ${color}30`,
        }}
      >
        <span
          className="text-6xl font-game-display font-black"
          style={{ color, textShadow: `0 0 20px ${color}60` }}
        >
          {rank}
        </span>
      </div>
    </div>
  );
}
