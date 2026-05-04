"use client";

import { useEffect} from "react";
import { useGameStore } from "@/lib/store/useGameStore";

export default function ResumeCountdown() {
  const { status, resumeGame } = useGameStore();
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
