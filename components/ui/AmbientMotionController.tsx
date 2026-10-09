"use client";

import { useEffect, useSyncExternalStore } from "react";
import { MotionConfig } from "framer-motion";
import { usePathname } from "next/navigation";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { shouldPauseAmbient, shouldReduceMotion } from "@/lib/motion/ambientMotion";

const ATTR = "data-lf-motion";

function subscribeAttr(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: [ATTR] });
  return () => obs.disconnect();
}

/** true bila animasi dekoratif tak berujung harus berhenti (untuk loop framer-motion `repeat: Infinity`). */
export function useAmbientPaused(): boolean {
  return useSyncExternalStore(
    subscribeAttr,
    () => document.documentElement.getAttribute(ATTR) === "paused",
    () => false,
  );
}

function subscribeMedia(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  document.addEventListener("visibilitychange", cb);
  return () => {
    mq.removeEventListener("change", cb);
    document.removeEventListener("visibilitychange", cb);
  };
}

/** Pasang sekali di layout. Mengatur `data-lf-motion` di <html> dan `MotionConfig.reducedMotion`. */
export default function AmbientMotionController({ children }: { children: React.ReactNode }) {
  const setting = useSettingsStore((s) => s.reduceMotion);
  const pathname = usePathname();
  const prefersReduced = useSyncExternalStore(
    subscribeMedia,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
  const hidden = useSyncExternalStore(subscribeMedia, () => document.hidden, () => false);

  const reduce = shouldReduceMotion(setting, prefersReduced);
  const paused = shouldPauseAmbient({ hidden, playing: pathname.includes("/play/"), reduceMotion: reduce });

  useEffect(() => {
    document.documentElement.setAttribute(ATTR, paused ? "paused" : "running");
  }, [paused]);

  return <MotionConfig reducedMotion={reduce ? "always" : "never"}>{children}</MotionConfig>;
}
