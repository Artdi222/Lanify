import { Clock, Heart, Metronome, Play } from "lucide-react";
import type { Beatmap } from "@/types/beatmap";
import { formatDuration } from "@/types/game";
import { difficultyColor, starTextColor } from "@/lib/select/difficultyColor";

/** Panel info kiri-atas layar select. Ukuran dari foto: docs/ui-spec/song-select.md ("Kiri-atas"). */

const STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  ranked: { label: "RANKED", bg: "#b3ff66", fg: "#1c2a0c" },
  approved: { label: "APPROVED", bg: "#b3ff66", fg: "#1c2a0c" },
  loved: { label: "LOVED", bg: "#ff66aa", fg: "#33001a" },
  qualified: { label: "QUALIFIED", bg: "#66ccff", fg: "#00243a" },
  graveyard: { label: "GRAVEYARD", bg: "#8c9296", fg: "#101315" },
  pending: { label: "PENDING", bg: "#ffcc22", fg: "#2a2000" },
};

const n = (v: number | null | undefined) => (v ?? 0).toLocaleString("en-US");

function Stat({ label, value, ratio, color, width }: { label: string; value: string; ratio: number; color: string; width: number }) {
  return (
    <div style={{ width }}>
      <div className="h-0.5 w-full bg-black/60">
        <div className="h-full" style={{ width: `${Math.round(Math.min(1, Math.max(0, ratio)) * 100)}%`, backgroundColor: color }} />
      </div>
      <div className="mt-2 font-game-display text-[14px] font-semibold leading-tight text-white">{label}</div>
      <div className="font-game-display text-[17px] leading-tight text-white/90 tabular-nums">{value}</div>
    </div>
  );
}

function Meta({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2.5 font-game-display text-[17px] font-medium text-white">
      <span className="text-white/90">{icon}</span>
      {children}
    </span>
  );
}

export default function BeatmapInfoPanel({ beatmap }: { beatmap: Beatmap }) {
  const status = STATUS[beatmap.rankedStatus] ?? STATUS.ranked;
  const color = difficultyColor(beatmap.starRating);
  const notesTotal = Math.max(1, (beatmap.noteCount ?? 0) + (beatmap.holdCount ?? 0));

  return (
    <div className="shrink-0">
      <div className="bg-[#1f2029]/55 px-[22px] pb-3 pt-[18px]">
        <span className="inline-flex h-[19px] items-center rounded-full px-2.5 font-game-display text-[11px] font-bold tracking-wide" style={{ backgroundColor: status.bg, color: status.fg }}>
          {status.label}
        </span>
        <h1 className="mt-2 line-clamp-1 font-game-display text-[32px] font-light leading-[1.15] text-white">{beatmap.title}</h1>
        <p className="line-clamp-1 font-game-display text-[18px] font-semibold leading-tight text-white">{beatmap.artist}</p>
        <div className="mt-3 flex items-center gap-9">
          <Meta icon={<Play className="h-[18px] w-[18px]" aria-hidden />}>{n(beatmap.playCount)}</Meta>
          <Meta icon={<Heart className="h-[22px] w-[22px]" aria-hidden />}>{n(beatmap.favoriteCount)}</Meta>
          <Meta icon={<Clock className="h-[22px] w-[22px]" aria-hidden />}>{formatDuration(beatmap.lengthSeconds).padStart(5, "0")}</Meta>
          <Meta icon={<Metronome className="h-[22px] w-[22px]" aria-hidden />}>{Math.round(beatmap.bpm)}</Meta>
        </div>
      </div>

      <div className="flex h-10 items-center gap-2 rounded-tr-[14px] bg-select-panel/90 px-[22px]">
        <span
          className="inline-flex h-[26px] items-center gap-1 rounded-full px-2.5 font-game-display text-[14px] font-bold"
          style={{ backgroundColor: color, color: starTextColor(beatmap.starRating) }}
        >
          <span aria-hidden>★</span>
          {beatmap.starRating.toFixed(2)}
        </span>
        <span className="line-clamp-1 font-game-display text-[17px] font-semibold" style={{ color }}>
          [{beatmap.keyCount}K] {beatmap.difficultyName}
        </span>
        <span className="shrink-0 font-game-display text-[17px]" style={{ color, opacity: 0.8 }}>mapped by</span>
        <span className="shrink-0 font-game-display text-[17px] font-semibold text-[#8fd3ff]">{beatmap.creator}</span>
      </div>

      <div className="flex h-[70px] items-start justify-between rounded-br-[14px] bg-[#23282a]/90 px-[22px] pt-3">
        <div className="flex gap-3">
          <Stat label="Notes" value={n(beatmap.noteCount)} ratio={(beatmap.noteCount ?? 0) / notesTotal} color={color} width={86} />
          <Stat label="Hold Notes" value={n(beatmap.holdCount)} ratio={(beatmap.holdCount ?? 0) / notesTotal} color={color} width={86} />
        </div>
        <div className="flex gap-3">
          <Stat label="Key Count" value={String(beatmap.keyCount)} ratio={beatmap.keyCount / 10} color={color} width={104} />
          <Stat label="OD" value={beatmap.od.toFixed(1)} ratio={beatmap.od / 10} color={color} width={86} />
          <Stat label="HP" value={beatmap.hp.toFixed(1)} ratio={beatmap.hp / 10} color={color} width={86} />
        </div>
      </div>
    </div>
  );
}
