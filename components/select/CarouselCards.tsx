import Image from "next/image";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Beatmap } from "@/types/beatmap";
import { difficultyColor, starTextColor } from "@/lib/select/difficultyColor";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icons/Icon";

/** Kartu daftar beatmap (spec: docs/ui-spec/song-select.md, "Kanan: daftar beatmap"). */

const STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  ranked: { label: "RANKED", bg: "#b3ff66", fg: "#1c2a0c" },
  approved: { label: "APPROVED", bg: "#b3ff66", fg: "#1c2a0c" },
  loved: { label: "LOVED", bg: "#ff66aa", fg: "#33001a" },
  qualified: { label: "QUALIFIED", bg: "#66ccff", fg: "#00243a" },
  graveyard: { label: "GRAVEYARD", bg: "#8c9296", fg: "#101315" },
  pending: { label: "PENDING", bg: "#ffcc22", fg: "#2a2000" },
};

/** Ikon ruleset mania di samping pill status dan di tile difficulty (lazer menampilkan ikon ruleset di sini). */
function Ring({ size = 18, color = "#fff" }: { size?: number; color?: string }) {
  return <Icon name="ruleset-mania" size={size} strokeWidth={2.4} className="shrink-0" style={{ color }} />;
}

/** 10 slot: ★ penuh sebanyak floor(SR), satu ★ redup bila pecahan >= .25, sisanya titik. */
function StarRow({ stars, color }: { stars: number; color: string }) {
  const full = Math.floor(stars);
  const frac = stars - full;
  return (
    <span className="flex items-center gap-[3px]" aria-hidden>
      {Array.from({ length: 10 }, (_, i) =>
        i < full ? (
          <span key={i} className="text-[14px] leading-none" style={{ color }}>★</span>
        ) : i === full && frac >= 0.25 ? (
          <span key={i} className="text-[14px] leading-none opacity-55" style={{ color }}>★</span>
        ) : (
          <span key={i} className="h-[3px] w-[3px] rounded-full" style={{ backgroundColor: color, opacity: 0.4 }} />
        ),
      )}
    </span>
  );
}

export function HeaderCard({ label, count, collapsed, onClick }: { label: string; count: number; collapsed: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-14 w-full cursor-pointer items-center gap-4 rounded-l-[10px] bg-select-panel/90 px-6 text-left transition-[filter] duration-150 hover:brightness-125"
    >
      <span className={cn("h-6 w-1.5 rounded-full transition-colors", collapsed ? "bg-white/25" : "bg-white")} />
      <span className="font-game-display text-[17px] font-semibold uppercase tracking-widest text-white">{label}</span>
      <span className="ml-auto font-game-display text-[13px] text-white/50">{count} {count === 1 ? "item" : "items"}</span>
      <ChevronDown className={cn("h-5 w-5 text-white/50 transition-transform duration-300", collapsed && "-rotate-90")} aria-hidden />
    </button>
  );
}

export function SetCard({
  title,
  artist,
  coverUrl,
  status,
  difficulties,
  selected,
  expanded,
  onClick,
}: {
  title: string;
  artist: string;
  coverUrl?: string | null;
  status: string;
  difficulties: readonly Beatmap[];
  selected: boolean;
  expanded?: boolean;
  onClick: () => void;
}) {
  const st = STATUS[status] ?? STATUS.ranked;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={selected ? expanded : undefined}
      className={cn(
        "relative flex w-full cursor-pointer items-stretch overflow-hidden rounded-l-[10px] bg-[#101420] text-left transition-[filter,box-shadow] duration-200",
        selected ? "h-[95px] ring-2 ring-white shadow-[0_0_18px_rgba(140,200,255,0.55)]" : "h-[92px] hover:brightness-110",
      )}
    >
      {coverUrl && <Image fill unoptimized src={coverUrl} alt="" className="object-cover object-right" sizes="880px" />}
      <span className="absolute inset-0 bg-linear-to-r from-black/75 via-black/35 to-transparent" />
      {selected && (
        <span className="relative flex w-6 shrink-0 items-center justify-center bg-white text-black/80">
          <ChevronRight className="h-4 w-4" strokeWidth={3} aria-hidden />
        </span>
      )}
      <span className="relative flex min-w-0 flex-1 flex-col justify-center pl-5 pr-4">
        <span className="truncate font-game-display text-[24px] font-bold leading-[1.1] text-white drop-shadow">{title}</span>
        <span className="mt-0.5 truncate font-game-display text-[17px] leading-tight text-white drop-shadow">{artist}</span>
        <span className="mt-2 flex items-center gap-2">
          <span className="inline-flex h-[18px] items-center rounded-full px-2 font-game-display text-[11px] font-bold" style={{ backgroundColor: st.bg, color: st.fg }}>
            {st.label}
          </span>
          <Ring />
          <span className="flex items-center gap-[2.5px]">
            {difficulties.map((d) => (
              <span key={d.id} className="h-[14px] w-[7px] rounded-full" style={{ backgroundColor: difficultyColor(d.starRating) }} />
            ))}
          </span>
        </span>
      </span>
    </button>
  );
}

export function DiffCard({ diff, selected, onClick }: { diff: Beatmap; selected: boolean; onClick: () => void }) {
  const color = difficultyColor(diff.starRating);
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "animate-in fade-in-0 slide-in-from-right-6 duration-300 relative flex h-[58px] w-full cursor-pointer items-stretch overflow-hidden rounded-l-[10px] text-left transition-[filter,box-shadow]",
        selected ? "shadow-[0_0_16px_var(--glow)]" : "hover:brightness-110",
      )}
      style={{
        ["--glow" as string]: `${color}88`,
        border: selected ? `2px solid ${color}` : undefined,
        // Opak, rona difficulty memudar ke kanan. Di-fit dari 5 baris foto (warna strip diketahui): kiri ~25% di atas #3a4347,
        // tengah ~14.5% di atas #343d40, ujung ~8%. Terpilih (satu sampel, 4.26): kiri bernuansa warna, kanan abu terang #79737a.
        background: selected
          ? `linear-gradient(to right, color-mix(in srgb, ${color} 15%, #585056), color-mix(in srgb, ${color} 8%, #625b60) 25%, #79737a)`
          : `linear-gradient(to right, color-mix(in srgb, ${color} 25%, #3a4347), color-mix(in srgb, ${color} 14.5%, #343d40) 55%, color-mix(in srgb, ${color} 8%, #32393d))`,
      }}
    >
      <span className="flex w-4 shrink-0 items-center justify-center" style={{ backgroundColor: color }}>
        <Ring size={12} color="rgb(0 0 0 / 0.85)" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-1 pl-3 pr-4">
        <span className="truncate leading-none">
          <span className="font-game-display text-[17px] font-semibold text-white">[{diff.keyCount}K] {diff.difficultyName}</span>
          <span className="ml-1.5 font-game-display text-[14px] text-white/85">mapped by {diff.creator}</span>
        </span>
        <span className="flex items-center gap-2">
          <span
            className="inline-flex h-[18px] items-center gap-1 rounded-full px-2 font-game-display text-[12px] font-bold"
            style={{ backgroundColor: color, color: starTextColor(diff.starRating) }}
          >
            <span aria-hidden>★</span>
            {diff.starRating.toFixed(2)}
          </span>
          <StarRow stars={diff.starRating} color={color} />
        </span>
      </span>
    </button>
  );
}
