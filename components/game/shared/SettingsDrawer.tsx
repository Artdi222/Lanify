"use client";

import { useSettingsStore } from "@/lib/store/useSettingsStore";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Settings, ArrowDown, ArrowUp } from "lucide-react";
import { useState } from "react";

import GameSlider from "./GameSlider";
import OffsetWizard from "./OffsetWizard";

export default function SettingsDrawer({ children }: { children?: React.ReactNode }) {
  const settings = useSettingsStore();
  const [rebindingKey, setRebindingKey] = useState<{ mode: '4k' | '7k'; index: number } | null>(null);

  const handleKeyRebind = (e: React.KeyboardEvent) => {
    if (!rebindingKey) return;
    e.preventDefault();
    const key = e.key === ' ' ? ' ' : e.key.toLowerCase();
    settings.setKeybind(rebindingKey.mode, rebindingKey.index, key);
    setRebindingKey(null);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children || (
          <button className="p-2 rounded-lg bg-white/5 border border-white/5 hover:border-cyan-500/30 transition-all duration-200 cursor-pointer">
            <Settings className="w-5 h-5 text-white/70 hover:text-cyan-400 transition-colors" />
          </button>
        )}
      </SheetTrigger>
      <SheetContent
        className="sm:max-w-[600px] w-full bg-[#050508]/95 backdrop-blur-3xl border-l border-cyan-500/20 shadow-[-10px_0_40px_rgba(0,229,255,0.05)] overflow-y-auto no-scrollbar"
        onKeyDown={handleKeyRebind}
      >
        <div className="flex flex-col gap-8 p-8 pb-12">
          <SheetHeader className="border-b border-white/10 pb-5 p-0">
            <SheetTitle className="text-white font-game-display text-2xl tracking-[0.15em] uppercase">Settings</SheetTitle>
            <SheetDescription className="sr-only">
              Configure your game preferences, audio levels, and keybindings.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-8">
          {/* Visual Settings */}
          <section className="bg-white/5 p-6 rounded-2xl border border-white/5 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
            <h3 className="flex items-center gap-2 text-sm font-game-display font-bold text-cyan-400 tracking-[0.2em] uppercase mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
              Visual
            </h3>
            <div className="flex flex-col gap-6">
              <GameSlider
                label="Background Dim"
                value={settings.backgroundDim}
                min={0}
                max={100}
                suffix="%"
                onChange={settings.setBackgroundDim}
              />
              <GameSlider
                label="Background Blur"
                value={settings.backgroundBlur}
                min={0}
                max={100}
                suffix="%"
                onChange={settings.setBackgroundBlur}
              />
            </div>
          </section>

          {/* Audio Settings */}
          <section className="bg-white/5 p-6 rounded-2xl border border-white/5 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
            <h3 className="flex items-center gap-2 text-sm font-game-display font-bold text-cyan-400 tracking-[0.2em] uppercase mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
              Audio
            </h3>
            <div className="flex flex-col gap-6">
              <GameSlider
                label="Master Volume"
                value={Math.round(settings.volume * 100)}
                min={0}
                max={100}
                suffix="%"
                onChange={(v) => settings.setVolume(v / 100)}
              />
              <GameSlider
                label="Audio Offset"
                value={settings.globalOffset}
                min={-200}
                max={200}
                suffix="ms"
                onChange={settings.setGlobalOffset}
              />
              <OffsetWizard />
            </div>
          </section>

          {/* Input Settings */}
          <section className="bg-white/5 p-6 rounded-2xl border border-white/5 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
            <h3 className="flex items-center gap-2 text-sm font-game-display font-bold text-cyan-400 tracking-[0.2em] uppercase mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
              Input
            </h3>
            <div className="flex flex-col gap-8">
              {/* Scroll Direction */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-game-body text-white/70">
                  Scroll Direction
                </span>
                <button
                  onClick={() =>
                    settings.setScrollDirection(
                      settings.scrollDirection === "down" ? "up" : "down"
                    )
                  }
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 
                    text-sm font-game-mono text-white hover:bg-white/10 hover:border-cyan-500/50 hover:text-cyan-300 transition-all duration-200 cursor-pointer shadow-[0_4px_10px_rgba(0,0,0,0.2)]"
                >
                  {settings.scrollDirection === "down" ? (
                    <>
                      <ArrowDown className="w-4 h-4" /> Down
                    </>
                  ) : (
                    <>
                      <ArrowUp className="w-4 h-4" /> Up
                    </>
                  )}
                </button>
              </div>

              {/* Scroll Speed */}
              <GameSlider
                label="Scroll Speed"
                value={settings.scrollSpeed}
                min={1}
                max={40}
                step={0.1}
                onChange={settings.setScrollSpeed}
              />

              <div className="w-full h-px bg-white/5 my-2" />

              {/* Keybinds */}
              <div className="space-y-6">
                <KeybindRow
                  label="4K"
                  keys={settings.keybinds["4k"]}
                  mode="4k"
                  rebindingKey={rebindingKey}
                  onRebind={(index) => setRebindingKey({ mode: "4k", index })}
                />
                <KeybindRow
                  label="7K"
                  keys={settings.keybinds["7k"]}
                  mode="7k"
                  rebindingKey={rebindingKey}
                  onRebind={(index) => setRebindingKey({ mode: "7k", index })}
                />
              </div>
            </div>
          </section>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}


function KeybindRow({
  label,
  keys,
  mode,
  rebindingKey,
  onRebind,
}: {
  label: string;
  keys: string[];
  mode: "4k" | "7k";
  rebindingKey: { mode: string; index: number } | null;
  onRebind: (index: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-game-display tracking-[0.2em] text-white/40 uppercase">{label} Mode</span>
      <div className="flex gap-2">
        {keys.map((key, i) => {
          const isRebinding = rebindingKey?.mode === mode && rebindingKey?.index === i;
          return (
            <button
              key={i}
              onClick={() => onRebind(i)}
              className={`relative h-12 flex-1 rounded-xl flex items-center justify-center text-lg font-game-mono font-bold uppercase
                transition-all duration-200 cursor-pointer overflow-hidden
                ${
                  isRebinding
                    ? "bg-cyan-500/20 border-2 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,229,255,0.4)] animate-pulse"
                    : "bg-white/5 border border-white/10 border-b-[3px] border-b-white/20 text-white hover:bg-white/10 hover:border-cyan-500/50 hover:text-cyan-300 shadow-[0_4px_10px_rgba(0,0,0,0.2)]"
                }`}
            >
              {isRebinding ? "..." : key === " " ? "SPC" : key}
            </button>
          );
        })}
      </div>
    </div>
  );
}
