"use client";

import Link from "next/link";
import { ChevronLeft, Settings, Shuffle, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoButton } from "@/components/menu/LogoButton";

/** Footer layar select: ukuran dan warna dari foto (docs/ui-spec/song-select.md, bagian Footer). */

function BackButton() {
  return (
    <Link
      href="/"
      className="group absolute bottom-[18px] left-[22px] z-10 flex h-16 w-[328px] -skew-x-[10deg] items-center justify-center rounded-lg border border-white/25 bg-select-back shadow-lg transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98]"
    >
      <span className="flex skew-x-[10deg] items-center gap-5 pr-[22px] font-game-display text-xl text-white">
        <ChevronLeft className="h-7 w-7" strokeWidth={3.5} aria-hidden />
        Back
      </span>
    </Link>
  );
}

interface TileProps {
  label: string;
  icon: React.ReactNode;
  bg: string;
  line: string;
  /** Lebar tile dalam px (foto: 160 / 160 / 160). */
  left: number;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  onClick?: () => void;
}

function Tile({ label, icon, bg, line, left, active, disabled, title, onClick }: TileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-options-toggle={label === "Options" ? "" : undefined}
      aria-pressed={active}
      title={title}
      className={cn(
        "group absolute bottom-0 flex h-[85px] w-40 -skew-x-[10deg] cursor-pointer items-start justify-center rounded-t-xl text-white shadow-lg transition-[transform,filter,background-color] duration-150",
        disabled ? "cursor-not-allowed opacity-50" : "hover:-translate-y-1.5 hover:brightness-125",
        active && "-translate-y-1.5 brightness-125",
      )}
      style={{ left, backgroundColor: active ? "var(--color-select-options-icon)" : bg }}
    >
      <span className="flex skew-x-[10deg] flex-col items-center gap-[13px] pt-[11px]">
        <span className="h-6 w-6">{icon}</span>
        <span className="font-game-display text-[17px] leading-none">{label}</span>
      </span>
      <span className="absolute inset-x-3 bottom-0 h-1.5 rounded-t-sm" style={{ backgroundColor: line }} />
    </button>
  );
}

export default function SelectFooter({
  onRandom,
  onOptions,
  onPlay,
  optionsOpen,
  canPlay,
}: {
  onRandom: () => void;
  onOptions: () => void;
  onPlay: () => void;
  optionsOpen: boolean;
  canPlay: boolean;
}) {
  return (
    <>
      <div className="absolute inset-x-0 bottom-0 z-20 h-[67px] rounded-tl-2xl bg-select-bar" />
      <div className="absolute inset-x-0 bottom-0 z-20 h-[85px]">
        <BackButton />
        <Tile
          label="Mods"
          left={405}
          bg="var(--color-select-mods)"
          line="var(--color-select-mods-line)"
          icon={<ArrowLeftRight className="h-6 w-6 text-select-mods-icon" aria-hidden />}
          disabled
          title="Mods coming soon"
        />
        <Tile
          label="Random"
          left={568}
          bg="var(--color-select-random)"
          line="var(--color-select-random-line)"
          icon={<Shuffle className="h-6 w-6 text-select-random-icon" aria-hidden />}
          onClick={onRandom}
        />
        <Tile
          label="Options"
          left={732}
          bg="var(--color-select-options)"
          line="var(--color-select-options-line)"
          icon={<Settings className={cn("h-6 w-6", optionsOpen ? "text-white" : "text-select-options-icon")} aria-hidden />}
          active={optionsOpen}
          onClick={onOptions}
        />
      </div>

      {/* Logo = tombol Play, terpotong di pojok kanan-bawah seperti lazer */}
      <LogoButton
        aria-label="Play"
        disabled={!canPlay}
        onClick={onPlay}
        circleClassName="h-[330px] w-[330px] text-6xl sm:h-[330px] sm:w-[330px] sm:text-7xl"
        className="absolute -bottom-[175px] -right-[115px] z-30 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </>
  );
}
