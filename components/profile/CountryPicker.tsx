"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { COUNTRIES, countryName } from "@/lib/country";
import Flag from "./Flag";

/** Searchable country dropdown with flags; "" = not set. */
export default function CountryPicker({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation(); // keep the profile sheet open
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  const q = query.trim().toLowerCase();
  const list = q ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q) : COUNTRIES;
  const pick = (code: string) => {
    onChange(code);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex h-12 w-full cursor-pointer items-center gap-3 rounded-lf-md border-2 bg-black/40 px-4 text-left font-game-body text-base text-white transition-colors ${open ? "border-lf-accent" : "border-transparent hover:border-white/15"}`}
      >
        {value ? <Flag code={value} height={20} /> : <span className="h-5 w-[27px] rounded-[2px] border border-dashed border-white/30" />}
        <span className={value ? "" : "text-white/45"}>{value ? countryName(value) : "Choose your country"}</span>
        <ChevronDown className={`ml-auto h-4 w-4 text-white/60 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-10 mt-2 overflow-hidden rounded-lf-md bg-lf-bg-raised shadow-lf-panel ring-1 ring-white/10">
          <div className="flex items-center gap-2 border-b border-white/10 px-4">
            <Search className="h-4 w-4 text-white/50" />
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search country" className="h-11 w-full bg-transparent font-game-body text-base text-white outline-hidden placeholder:text-white/40" />
          </div>
          <ul className="max-h-72 overflow-y-auto py-1" role="listbox">
            {list.map((c) => (
              <li key={c.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={c.code === value}
                  onClick={() => pick(c.code)}
                  className={`flex w-full cursor-pointer items-center gap-3 px-4 py-2 text-left font-game-body text-[15px] text-white transition-colors hover:bg-white/10 ${c.code === value ? "bg-lf-primary/30" : ""}`}
                >
                  <Flag code={c.code} height={18} />
                  {c.name}
                  {c.code === value && <Check className="ml-auto h-4 w-4 text-lf-accent" />}
                </button>
              </li>
            ))}
            {list.length === 0 && <li className="px-4 py-3 font-game-body text-sm text-white/50">No country matches &quot;{query}&quot;</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
