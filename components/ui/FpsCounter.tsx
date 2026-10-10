"use client";

import { useEffect, useRef } from "react";
import { useSettingsStore } from "@/lib/store/useSettingsStore";

/** Indikator FPS/ms pojok kanan bawah (debug). Teks ditulis langsung ke DOM tiap 500 ms, tanpa re-render React. */
export default function FpsCounter() {
  const show = useSettingsStore((s) => s.showFps);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show) return;
    let raf = 0;
    let frames = 0;
    let start = performance.now();
    const tick = (now: number) => {
      frames++;
      const elapsed = now - start;
      if (elapsed >= 500 && ref.current) {
        ref.current.textContent = `${Math.round((frames * 1000) / elapsed)} fps · ${(elapsed / frames).toFixed(1)} ms`;
        frames = 0;
        start = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [show]);

  if (!show) return null;
  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed bottom-2 right-2 z-[100] rounded-lf-sm bg-black/70 px-2 py-1 font-game-mono text-lf-caption tabular-nums text-lf-accent"
    >
      -- fps
    </div>
  );
}
