import { User } from "lucide-react";
import type { LeaderboardEntry } from "@/types/game";
import { GRADE_COLORS } from "@/lib/select/format";

const ROWS: [string, keyof LeaderboardEntry["judgements"]][] = [
  ["Marvelous", "marvelous"],
  ["Perfect", "perfect"],
  ["Great", "great"],
  ["Good", "good"],
  ["Bad", "bad"],
  ["Miss", "miss"],
];

/** Small leaderboard card beside the main score card (foto 1791518660446). */
export default function NeighbourCard({ entry, zoom = 1, onClick }: { entry: LeaderboardEntry; zoom?: number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ zoom }} className="flex w-[170px] shrink-0 cursor-pointer flex-col items-center opacity-80 transition-opacity hover:opacity-100">
      <div className="w-full rounded-[18px] bg-lf-bg-raised/85 px-3 pb-4 pt-2.5 shadow-lf-panel">
        <div className="text-center font-game-display text-[17px] font-bold text-white">#{entry.position}</div>
        <span className="mx-auto mt-2 flex h-[145px] w-[145px] items-center justify-center overflow-hidden rounded-[18px] bg-lf-bg">
          {entry.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={entry.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <User className="h-12 w-12 text-lf-text-muted" />
          )}
        </span>
        <div className="mt-2 truncate text-center font-game-display text-[14px] font-bold text-white">{entry.username}</div>
        <dl className="mt-3 space-y-0.5 font-game-body text-[11px]">
          {ROWS.map(([label, key]) => (
            <div key={key} className="flex justify-between">
              <dt className="text-white/85">{label}</dt>
              <dd className="text-lf-warning tabular-nums">{entry.judgements[key].toLocaleString("en-US")}</dd>
            </div>
          ))}
          <div className="flex justify-between pt-3">
            <dt className="text-white/85">Max Combo</dt>
            <dd className="text-lf-warning tabular-nums">x{entry.maxCombo.toLocaleString("en-US")}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-white/85">Accuracy</dt>
            <dd className="text-lf-warning tabular-nums">{entry.accuracy.toFixed(2)}%</dd>
          </div>
        </dl>
      </div>
      <div className="mt-2 font-game-body text-[19px] text-white tabular-nums">{entry.score.toLocaleString("en-US")}</div>
      <span className="mt-0.5 rounded-full px-2.5 font-game-display text-[11px] font-bold text-black/80" style={{ backgroundColor: GRADE_COLORS[entry.rank] ?? "#8c9296" }}>
        {entry.rank}
      </span>
    </button>
  );
}
