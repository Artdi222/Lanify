"use client";

import { useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Gamepad2, Keyboard, LayoutPanelLeft, Monitor, Search, Volume2, Wrench, type LucideIcon } from "lucide-react";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { filterSettings } from "@/lib/settings/filter";
import { FPS_LIMIT_OPTIONS, RENDER_SCALE_OPTIONS } from "@/lib/game/RenderSettings";
import { REDUCE_MOTION_OPTIONS } from "@/lib/motion/ambientMotion";
import { cn } from "@/lib/utils";
import GameSlider from "@/components/game/shared/GameSlider";
import OffsetWizard from "@/components/game/shared/OffsetWizard";
import { ActionButton, OptionPills, SettingRow } from "./controls";

const CATEGORIES = [
  { id: "gameplay", label: "Gameplay", Icon: Gamepad2 },
  { id: "input", label: "Input", Icon: Keyboard },
  { id: "audio", label: "Audio", Icon: Volume2 },
  { id: "graphics", label: "Graphics", Icon: Monitor },
  { id: "ui", label: "User Interface", Icon: LayoutPanelLeft },
  { id: "maintenance", label: "Maintenance", Icon: Wrench },
] as const satisfies readonly { id: string; label: string; Icon: LucideIcon }[];

/** Jarak (px) antara tepi atas area scroll dan judul kategori saat dilompati. Sama dengan `pt-4`. */
const SECTION_GAP = 16;

type CategoryId = (typeof CATEGORIES)[number]["id"];
type Rebinding = { mode: "4k" | "7k"; index: number } | null;

interface Item {
  id: string;
  category: CategoryId;
  section: string;
  label: string;
  keywords?: string;
  render: () => ReactNode;
}

export default function SettingsPanel() {
  const s = useSettingsStore();
  const [category, setCategory] = useState<CategoryId>("gameplay");
  const [query, setQuery] = useState("");
  const [rebinding, setRebinding] = useState<Rebinding>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  /** Selama scroll halus akibat klik sidebar, scroll-spy tidak boleh menimpa kategori yang baru diklik. */
  const spyLocked = useRef(false);

  const sectionTop = (id: string) => scrollRef.current?.querySelector<HTMLElement>(`[data-category="${id}"]`)?.offsetTop;

  const goTo = (id: CategoryId) => {
    setCategory(id);
    setQuery("");
    spyLocked.current = true;
    setTimeout(() => { spyLocked.current = false; }, 700);
    // Tunggu daftar lengkap dirender bila sebelumnya sedang mencari.
    requestAnimationFrame(() => {
      const top = sectionTop(id);
      if (top !== undefined) scrollRef.current?.scrollTo({ top: top - SECTION_GAP, behavior: "smooth" });
    });
  };

  const onScroll = () => {
    const box = scrollRef.current;
    if (!box || query.trim() || spyLocked.current) return;
    let current: CategoryId = CATEGORIES[0].id;
    for (const c of CATEGORIES) {
      const top = sectionTop(c.id);
      if (top !== undefined && top - SECTION_GAP <= box.scrollTop + 8) current = c.id;
    }
    setCategory(current);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!rebinding) return;
    e.preventDefault();
    s.setKeybind(rebinding.mode, rebinding.index, e.key === " " ? " " : e.key.toLowerCase());
    setRebinding(null);
  };

  const items: Item[] = [
    {
      id: "scrollDirection", category: "gameplay", section: "Scrolling", label: "Scroll Direction", keywords: "down up upscroll",
      render: () => (
        <SettingRow label="Scroll Direction">
          <button
            type="button"
            onClick={() => s.setScrollDirection(s.scrollDirection === "down" ? "up" : "down")}
            className="flex cursor-pointer items-center gap-2 rounded-lf-sm border border-lf-border bg-lf-surface px-4 py-2 font-game-mono text-lf-body text-lf-text transition-colors hover:border-lf-accent hover:text-lf-accent"
          >
            {s.scrollDirection === "down" ? <><ArrowDown className="h-4 w-4" /> Down</> : <><ArrowUp className="h-4 w-4" /> Up</>}
          </button>
        </SettingRow>
      ),
    },
    {
      id: "scrollSpeed", category: "gameplay", section: "Scrolling", label: "Scroll Speed", keywords: "approach",
      render: () => <SettingRow label="" stacked><GameSlider label="Scroll Speed" value={s.scrollSpeed} min={1} max={40} step={0.1} onChange={s.setScrollSpeed} /></SettingRow>,
    },
    {
      id: "dim", category: "gameplay", section: "Background", label: "Background Dim",
      render: () => <SettingRow label="" stacked><GameSlider label="Background Dim" value={s.backgroundDim} min={0} max={100} suffix="%" onChange={s.setBackgroundDim} /></SettingRow>,
    },
    {
      id: "blur", category: "gameplay", section: "Background", label: "Background Blur",
      render: () => <SettingRow label="" stacked><GameSlider label="Background Blur" value={s.backgroundBlur} min={0} max={100} suffix="%" onChange={s.setBackgroundBlur} /></SettingRow>,
    },
    {
      id: "keys4", category: "input", section: "Keyboard", label: "4K Keybinds", keywords: "key bind rebind",
      render: () => <KeybindRow label="4K" mode="4k" keys={s.keybinds["4k"]} rebinding={rebinding} onRebind={(index) => setRebinding({ mode: "4k", index })} />,
    },
    {
      id: "keys7", category: "input", section: "Keyboard", label: "7K Keybinds", keywords: "key bind rebind",
      render: () => <KeybindRow label="7K" mode="7k" keys={s.keybinds["7k"]} rebinding={rebinding} onRebind={(index) => setRebinding({ mode: "7k", index })} />,
    },
    {
      id: "volume", category: "audio", section: "Volume", label: "Master Volume",
      render: () => <SettingRow label="" stacked><GameSlider label="Master Volume" value={Math.round(s.volume * 100)} min={0} max={100} suffix="%" onChange={(v) => s.setVolume(v / 100)} /></SettingRow>,
    },
    {
      id: "offset", category: "audio", section: "Offset", label: "Audio Offset", keywords: "latency delay global",
      render: () => <SettingRow label="" stacked><GameSlider label="Audio Offset" value={s.globalOffset} min={-200} max={200} suffix="ms" onChange={s.setGlobalOffset} /></SettingRow>,
    },
    {
      id: "wizard", category: "audio", section: "Offset", label: "Offset Wizard", keywords: "calibrate tap metronome",
      render: () => <SettingRow label="" stacked><OffsetWizard /></SettingRow>,
    },
    {
      id: "maxFps", category: "graphics", section: "Renderer", label: "Frame Limit", keywords: "fps",
      render: () => <SettingRow label="Frame Limit" stacked><OptionPills options={FPS_LIMIT_OPTIONS} value={s.maxFps} onChange={s.setMaxFps} /></SettingRow>,
    },
    {
      id: "renderScale", category: "graphics", section: "Renderer", label: "Render Scale", keywords: "resolution",
      render: () => <SettingRow label="Render Scale" stacked><OptionPills options={RENDER_SCALE_OPTIONS} value={s.renderScale} onChange={s.setRenderScale} /></SettingRow>,
    },
    {
      id: "antialias", category: "graphics", section: "Renderer", label: "Anti-aliasing", keywords: "aa smooth",
      render: () => (
        <SettingRow
          label="Anti-aliasing"
          hint="Berlaku saat map berikutnya dimulai. Turunkan render scale atau matikan anti-aliasing bila gameplay tersendat di GPU lemah."
          stacked
        >
          <OptionPills options={[{ label: "Off", value: 0 }, { label: "On", value: 1 }]} value={s.antialias ? 1 : 0} onChange={(v) => s.setAntialias(v === 1)} />
        </SettingRow>
      ),
    },
    {
      id: "reduceMotion", category: "ui", section: "Motion", label: "Reduce Motion", keywords: "animation",
      render: () => <SettingRow label="Reduce Motion" stacked><OptionPills options={REDUCE_MOTION_OPTIONS} value={s.reduceMotion ?? "system"} onChange={s.setReduceMotion} /></SettingRow>,
    },
    {
      id: "reset", category: "maintenance", section: "Settings", label: "Reset all settings", keywords: "default restore",
      render: () => (
        <ActionButton
          variant="danger"
          onClick={() => {
            if (!confirmReset) return setConfirmReset(true);
            s.resetSettings();
            setConfirmReset(false);
          }}
          onBlur={() => setConfirmReset(false)}
        >
          {confirmReset ? "Klik lagi untuk konfirmasi" : "Reset all settings"}
        </ActionButton>
      ),
    },
  ];

  const searching = query.trim() !== "";
  const visible = filterSettings(items, query);
  const groups = CATEGORIES.map((c) => ({ ...c, items: visible.filter((i) => i.category === c.id) })).filter((g) => g.items.length > 0);

  return (
    <div className="flex h-full min-h-0 text-lf-text" onKeyDown={onKeyDown}>
      <nav aria-label="Settings categories" className="flex w-48 shrink-0 flex-col gap-1 bg-lf-bg-raised py-3">
        {CATEGORIES.map(({ id, label, Icon }) => {
          const active = !searching && id === category;
          return (
            <button
              key={id}
              type="button"
              onClick={() => goTo(id)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex cursor-pointer items-center gap-3 px-5 py-3 text-left font-game-body text-lf-body transition-colors hover:bg-lf-surface-hover",
                active ? "text-lf-text before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-1 before:rounded-full before:bg-lf-accent" : "text-lf-text-muted",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="flex min-w-0 flex-1 flex-col bg-lf-surface">
        <header className="shrink-0 border-b border-lf-border px-5 pb-4 pt-5">
          <h2 className="font-game-display text-lf-display leading-none">settings</h2>
          <p className="mt-1 text-lf-body text-lf-text-muted">change the way Lanify behaves</p>
          <label className="mt-4 flex items-center gap-2 rounded-lf-md border border-lf-border bg-lf-bg px-3 py-2 focus-within:border-lf-accent">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="type to search"
              aria-label="Search settings"
              className="min-w-0 flex-1 bg-transparent text-lf-body text-lf-text outline-hidden placeholder:text-lf-text-dim"
            />
            <Search className="h-5 w-5 text-lf-text-muted" aria-hidden />
          </label>
        </header>

        <div ref={scrollRef} onScroll={onScroll} className="no-scrollbar relative flex-1 overflow-y-auto px-5 pt-4">
          {groups.length === 0 && <p className="py-8 text-center text-lf-body text-lf-text-muted">Tidak ada setting yang cocok.</p>}
          {groups.map((g) => (
            <section key={g.id} data-category={g.id} className="mb-6">
              <h3 className="mb-3 font-game-display text-lf-title">{g.label}</h3>
              {[...new Set(g.items.map((i) => i.section))].map((section) => (
                <div key={section} className="mb-4">
                  <h4 className="mb-2 px-1 font-game-display text-lf-body text-lf-text-muted">{section}</h4>
                  <div className="flex flex-col gap-1.5">
                    {g.items.filter((i) => i.section === section).map((i) => <div key={i.id}>{i.render()}</div>)}
                  </div>
                </div>
              ))}
            </section>
          ))}
          {/* Ruang kosong supaya kategori terakhir yang pendek tetap bisa digulir sampai ke atas. */}
          {!searching && <div className="h-[60vh]" aria-hidden />}
        </div>
      </div>
    </div>
  );
}

function KeybindRow({
  label, keys, mode, rebinding, onRebind,
}: {
  label: string;
  keys: readonly string[];
  mode: "4k" | "7k";
  rebinding: Rebinding;
  onRebind: (index: number) => void;
}) {
  return (
    <SettingRow label={`${label} Mode`} stacked>
      <div className="flex gap-2">
        {keys.map((key, i) => {
          const active = rebinding?.mode === mode && rebinding.index === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onRebind(i)}
              className={cn(
                "h-11 flex-1 cursor-pointer rounded-lf-md border font-game-mono text-lg font-bold uppercase transition-colors",
                active
                  ? "animate-pulse border-lf-accent bg-lf-accent/15 text-lf-accent"
                  : "border-lf-border bg-lf-surface text-lf-text hover:border-lf-accent hover:text-lf-accent",
              )}
            >
              {active ? "..." : key === " " ? "SPC" : key}
            </button>
          );
        })}
      </div>
    </SettingRow>
  );
}
