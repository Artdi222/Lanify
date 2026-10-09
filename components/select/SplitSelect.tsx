"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SplitOption<T extends string> {
  label: string;
  value: T;
}

/**
 * Dropdown dua bagian ala lazer: tile label (gelap) + nilai dengan chevron. Ukuran/warna dari foto
 * (docs/ui-spec/song-select.md, "Scope", "Sort", "Group", "Collection").
 */
export default function SplitSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
  dim,
  className,
}: {
  label: string;
  value: T;
  options: readonly SplitOption<T>[];
  onChange: (v: T) => void;
  disabled?: boolean;
  /** Tampil redup (mis. "Sort | Score" yang hanya punya satu opsi). */
  dim?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const current = options.find((o) => o.value === value)?.label ?? value;

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn("flex h-[43px] w-full overflow-hidden rounded-xl text-left font-game-display text-[17px] transition-[filter] duration-150", disabled ? "cursor-default" : "cursor-pointer hover:brightness-125")}
      >
        <span className={cn("flex shrink-0 items-center px-4 font-semibold", dim ? "bg-select-tile-dim/80 text-white/50" : "bg-select-tile text-white")}>{label}</span>
        <span className={cn("flex min-w-0 flex-1 items-center justify-between gap-2 px-4", dim ? "bg-select-tile-dim/60 text-white/45" : "bg-select-bar text-white")}>
          <span className="truncate">{current}</span>
          {!disabled && <ChevronDown className={cn("h-5 w-5 shrink-0 transition-transform duration-150", open && "rotate-180")} strokeWidth={2.5} aria-hidden />}
        </span>
      </button>
      {open && (
        <ul role="listbox" className="absolute left-0 top-full z-50 mt-1 min-w-full overflow-hidden rounded-xl bg-select-bar py-1 shadow-xl ring-1 ring-white/10">
          {options.map((o) => (
            <li key={o.value} role="option" aria-selected={o.value === value}>
              <button
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={cn("w-full cursor-pointer whitespace-nowrap px-4 py-2 text-left font-game-display text-[17px] hover:bg-select-tile", o.value === value ? "text-white" : "text-white/65")}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
