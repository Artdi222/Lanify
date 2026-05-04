"use client";
import { JUDGEMENT_COLORS, type JudgementCounts } from "@/types/game";

interface JudgementBreakdownProps {
  judgements: JudgementCounts;
}

export default function JudgementBreakdown({ judgements }: JudgementBreakdownProps) {
  const items = [
    { label: "MARVELOUS", count: judgements.marvelous, color: JUDGEMENT_COLORS.MARVELOUS },
    { label: "PERFECT", count: judgements.perfect, color: JUDGEMENT_COLORS.PERFECT },
    { label: "GREAT", count: judgements.great, color: JUDGEMENT_COLORS.GREAT },
    { label: "GOOD", count: judgements.good, color: JUDGEMENT_COLORS.GOOD },
    { label: "BAD", count: judgements.bad, color: JUDGEMENT_COLORS.BAD },
    { label: "MISS", count: judgements.miss, color: JUDGEMENT_COLORS.MISS },
  ];

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between">
          <span className="text-xs font-game-mono" style={{ color: item.color }}>
            {item.label}
          </span>
          <span className="text-sm font-game-mono text-white tabular-nums">
            {item.count}
          </span>
        </div>
      ))}
    </div>
  );
}
