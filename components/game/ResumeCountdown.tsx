"use client";

import { useEffect} from "react";
import { useGameStore } from "@/lib/store/useGameStore";

export default function ResumeCountdown() {
  const status = useGameStore((s) => s.status);
  const resumeGame = useGameStore((s) => s.resumeGame);
  const isResuming = status === "resuming";

  useEffect(() => {
    if (!isResuming) return;

    const timer = setTimeout(() => {
      resumeGame();
    }, 500); 

    return () => clearTimeout(timer);
  }, [isResuming, resumeGame]);

  return null; // No visual display as requested
}
