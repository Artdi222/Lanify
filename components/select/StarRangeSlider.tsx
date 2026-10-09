"use client";

import { spectrumGradient } from "@/lib/select/difficultyColor";
import { cn } from "@/lib/utils";
import { SHEAR, UNSHEAR } from "./shear";

const MAX = 10;
const HANDLE = 46;
const GRADIENT = spectrumGradient(MAX);

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

/**
 * Slider rentang star rating ala lazer: pita setinggi 38 berisi spektrum difficulty, handle kiri biru (nilai min),
 * handle kanan gelap (nilai max, "∞" bila di ujung). Bagian di luar rentang digelapkan. Spec: song-select.md, "Kanan-atas".
 */
export default function StarRangeSlider({ min, max, onChange }: { min: number; max: number; onChange: (min: number, max: number) => void }) {
  const valueAt = (track: HTMLElement, clientX: number, handle: "min" | "max") => {
    const r = track.getBoundingClientRect();
    const usable = r.width - 2 * HANDLE;
    // titik pusat handle yang diseret -> nilai
    const x = clientX - r.left - (handle === "min" ? HANDLE / 2 : HANDLE + HANDLE / 2);
    return round1(clamp((x / usable) * MAX, 0, MAX));
  };

  const drag = (handle: "min" | "max") => (e: React.PointerEvent) => {
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    const track = el.parentElement as HTMLElement;
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const v = valueAt(track, ev.clientX, handle);
      if (handle === "min") onChange(Math.min(v, max), max);
      else onChange(min, Math.max(v, min));
    };
    const up = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  };

  const key = (handle: "min" | "max") => (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 1 : 0.1;
    const dir = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    e.stopPropagation();
    if (handle === "min") onChange(round1(clamp(min + dir * step, 0, max)), max);
    else onChange(min, round1(clamp(max + dir * step, min, MAX)));
  };

  // posisi dalam % lebar pita (handle kiri dari 0, handle kanan berakhir di ujung kanan saat max = MAX)
  const pct = (v: number) => `calc(${v / MAX} * (100% - ${2 * HANDLE}px))`;

  return (
    <div className={cn(SHEAR, "relative h-full w-full select-none overflow-hidden rounded-[10px] border-[1.5px] border-[#66ccff] touch-none")} style={{ background: GRADIENT }}>
      {/* foto: spektrum diredam ~22% ke abu gelap */}
      <div className="absolute inset-0 bg-[rgb(40_44_52/0.22)]" />
      <div className="absolute inset-y-0 left-0 bg-black/55" style={{ width: `calc(${pct(min)} + ${HANDLE / 2}px)` }} />
      <div className="absolute inset-y-0 right-0 bg-black/55" style={{ width: `calc(100% - ${pct(max)} - ${HANDLE + HANDLE / 2}px)` }} />
      <div
        role="slider"
        tabIndex={0}
        aria-label="Minimum star rating"
        aria-valuemin={0}
        aria-valuemax={MAX}
        aria-valuenow={min}
        onPointerDown={drag("min")}
        onKeyDown={key("min")}
        className="absolute inset-y-0 flex cursor-ew-resize items-center justify-center rounded-l-lg bg-[#4290fb] font-game-display text-[17px] font-semibold text-[#10243f] outline-none focus-visible:ring-2 focus-visible:ring-white"
        style={{ left: pct(min), width: HANDLE }}
      >
        <span className={UNSHEAR}>{min.toFixed(1)}</span>
      </div>
      <div
        role="slider"
        tabIndex={0}
        aria-label="Maximum star rating"
        aria-valuemin={0}
        aria-valuemax={MAX}
        aria-valuenow={max}
        onPointerDown={drag("max")}
        onKeyDown={key("max")}
        className="absolute inset-y-0 flex cursor-ew-resize items-center justify-center rounded-r-lg bg-[#444] font-game-display text-[19px] font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-white"
        style={{ left: `calc(${HANDLE}px + ${pct(max)})`, width: HANDLE }}
      >
        <span className={UNSHEAR}>{max >= MAX ? "∞" : max.toFixed(1)}</span>
      </div>
    </div>
  );
}
