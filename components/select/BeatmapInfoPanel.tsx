import { Clock, Heart, Metronome, Play } from "lucide-react";
import type { Beatmap } from "@/types/beatmap";
import { formatDuration } from "@/types/game";
import { difficultyColor, starTextColor } from "@/lib/select/difficultyColor";
import { cn } from "@/lib/utils";
import { SHEAR } from "./shear";

/** Panel info kiri-atas layar select. Ukuran dari foto: docs/ui-spec/song-select.md ("Kiri-atas"). */

const STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  ranked: { label: "RANKED", bg: "#c9cdf0", fg: "#1b1c26" },
  approved: { label: "APPROVED", bg: "#c9cdf0", fg: "#1b1c26" },
  loved: { label: "LOVED", bg: "#b9bde6", fg: "#1b1c26" },
  qualified: { label: "QUALIFIED", bg: "#b9bde6", fg: "#1b1c26" },
  graveyard: { label: "GRAVEYARD", bg: "#8c9296", fg: "#111219" },
  pending: { label: "PENDING", bg: "#dddded", fg: "#1b1c26" },
};

const n = (v: number | null | undefined) => (v ?? 0).toLocaleString("en-US");

function Stat({
  label,
  value,
  ratio,
  color,
  width,
}: {
  label: string;
  value: string;
  ratio: number;
  color: string;
  width: number;
}) {
  return (
    <div style={{ width }}>
      <div className="h-0.5 w-full bg-black/60">
        <div
          className="h-full"
          style={{
            width: `${Math.round(Math.min(1, Math.max(0, ratio)) * 100)}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <div className="mt-2 font-game-display text-[14px] font-semibold leading-tight text-white">
        {label}
      </div>
      <div className="font-game-display text-[17px] leading-tight text-white/90 tabular-nums">
        {value}
      </div>
    </div>
  );
}

function Meta({
  icon,
  pill,
  className,
  children,
}: {
  icon: React.ReactNode;
  /** foto: play count dan favorit masing-masing di pill gelap miring; durasi/BPM tanpa pill */
  pill?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={cn("relative flex h-full items-center gap-2.5 px-4 font-game-display text-[17px] font-medium text-white", className)}>
      {pill && <span className={cn(SHEAR, "absolute inset-0 rounded-[10px] bg-[#1e2127]")} />}
      <span className="relative text-white/90">{icon}</span>
      <span className="relative">{children}</span>
    </span>
  );
}

export default function BeatmapInfoPanel({ beatmap }: { beatmap: Beatmap }) {
  const status = STATUS[beatmap.rankedStatus] ?? STATUS.ranked;
  const color = difficultyColor(beatmap.starRating);
  const notesTotal = Math.max(
    1,
    (beatmap.noteCount ?? 0) + (beatmap.holdCount ?? 0),
  );

  return (
    <div className="relative shrink-0">
      {/* Satu latar miring (tan 0.2) untuk ketiga bagian supaya tepi kanannya satu garis seperti foto: x≈930 di atas, ≈876 di bawah.
          Pita warna diukur dari foto: judul #22262d, baris meta #282933, strip difficulty #22232e, statistik #22232e. */}
      <div
        aria-hidden
        className={cn(SHEAR, "absolute inset-y-0 -left-[60px] -right-[16px] rounded-r-2xl shadow-[0_8px_24px_rgb(0_0_0/0.3)]")}
        style={{
          background:
            "linear-gradient(to bottom, rgb(34 38 45 / 0.95) 0 90px, rgb(40 41 50 / 0.95) 90px 159px, rgb(38 43 46 / 0.95) 159px 202px, rgb(35 40 42 / 0.95) 202px)",
        }}
      />
      <div className="relative h-[159px] px-[22px] pt-[18px]">
        <span
          className="inline-flex h-[19px] items-center rounded-full px-2.5 font-game-display text-[11px] font-bold tracking-wide"
          style={{ backgroundColor: status.bg, color: status.fg }}
        >
          {status.label}
        </span>
        <h1 className="mt-2 line-clamp-1 font-game-display text-[32px] font-light leading-[1.15] text-white">
          {beatmap.title}
        </h1>
        <p className="line-clamp-1 font-game-display text-[18px] font-semibold leading-tight text-white">
          {beatmap.artist}
        </p>
        {/* posisi dari foto: pill play x -10..131 (ikon di 22), pill favorit 137..247, durasi mulai 253 */}
        <div className="absolute -left-[10px] top-[115px] flex h-[39px] items-center gap-[6px]">
          <Meta pill className="w-[141px] pl-[32px]" icon={<Play className="h-[18px] w-[18px]" aria-hidden />}>
            {n(beatmap.playCount)}
          </Meta>
          <Meta pill className="w-[110px]" icon={<Heart className="h-[22px] w-[22px]" aria-hidden />}>
            {n(beatmap.favoriteCount)}
          </Meta>
          <Meta icon={<Clock className="h-[22px] w-[22px]" aria-hidden />}>
            {formatDuration(beatmap.lengthSeconds).padStart(5, "0")}
          </Meta>
          <Meta icon={<Metronome className="h-[22px] w-[22px]" aria-hidden />}>
            {Math.round(beatmap.bpm)}
          </Meta>
        </div>
      </div>

      <div className="relative">
        <div className="flex h-[43px] items-center gap-2 px-[22px]">
          <span
            className="inline-flex h-[26px] items-center gap-1 rounded-full px-2.5 font-game-display text-[14px] font-bold"
            style={{
              backgroundColor: color,
              color: starTextColor(beatmap.starRating),
            }}
          >
            <span aria-hidden>★</span>
            {beatmap.starRating.toFixed(2)}
          </span>
          <span
            className="line-clamp-1 font-game-display text-[17px] font-semibold"
            style={{ color }}
          >
            [{beatmap.keyCount}K] {beatmap.difficultyName}
          </span>
          <span
            className="shrink-0 font-game-display text-[17px]"
            style={{ color, opacity: 0.8 }}
          >
            mapped by
          </span>
          <span className="shrink-0 font-game-display text-[17px] font-semibold text-[#b9bde6]">
            {beatmap.creator}
          </span>
        </div>

        <div className="flex h-[67px] items-start justify-between px-[22px] pt-3">
          <div className="flex gap-3">
            <Stat
              label="Notes"
              value={n(beatmap.noteCount)}
              ratio={(beatmap.noteCount ?? 0) / notesTotal}
              color={color}
              width={86}
            />
            <Stat
              label="Hold Notes"
              value={n(beatmap.holdCount)}
              ratio={(beatmap.holdCount ?? 0) / notesTotal}
              color={color}
              width={86}
            />
          </div>
          <div className="flex gap-3">
            <Stat
              label="Key Count"
              value={String(beatmap.keyCount)}
              ratio={beatmap.keyCount / 10}
              color={color}
              width={104}
            />
            <Stat
              label="OD"
              value={beatmap.od.toFixed(1)}
              ratio={beatmap.od / 10}
              color={color}
              width={86}
            />
            <Stat
              label="HP"
              value={beatmap.hp.toFixed(1)}
              ratio={beatmap.hp / 10}
              color={color}
              width={86}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
