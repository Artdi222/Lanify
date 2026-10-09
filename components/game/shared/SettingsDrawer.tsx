"use client";

import { Settings } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import SettingsPanel from "@/components/settings/SettingsPanel";

/** Panel Settings gaya lazer: menempel di kiri, di bawah top bar (48px). Spec: docs/ui-spec/settings.md. */
export default function SettingsDrawer({ children }: { children?: React.ReactNode }) {
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
        side="left"
        overlayClassName="top-12 bg-black/50 backdrop-blur-none supports-backdrop-filter:backdrop-blur-none"
        className="data-[side=left]:inset-y-auto data-[side=left]:top-12 data-[side=left]:h-[calc(100dvh-3rem)] data-[side=left]:w-[min(46rem,100vw)] data-[side=left]:sm:max-w-none gap-0 border-r border-lf-border bg-lf-surface p-0 shadow-lf-panel"
      >
        <SheetTitle className="sr-only">Settings</SheetTitle>
        <SheetDescription className="sr-only">Konfigurasi gameplay, input, audio, grafis, dan antarmuka.</SheetDescription>
        <SettingsPanel />
      </SheetContent>
    </Sheet>
  );
}
