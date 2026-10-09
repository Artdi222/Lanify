"use client";

export const dynamic = "force-dynamic";

import { useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import dynamic2 from "next/dynamic";
import { useGameStore } from "@/lib/store/useGameStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { useMusicStore } from "@/lib/store/useMusicStore";
import { useProgressStore } from "@/lib/store/useProgressStore";
import ScoreHUD from "@/components/game/ScoreHUD";
import JudgementDisplay from "@/components/game/JudgementDisplay";
import HealthBar from "@/components/game/HealthBar";
import PauseOverlay from "@/components/game/PauseOverlay";
import FailOverlay from "@/components/game/FailOverlay";
import GuestIndicator from "@/components/game/GuestIndicator";
import ResumeCountdown from "@/components/game/ResumeCountdown";

const GameCanvas = dynamic2(() => import("@/components/game/GameCanvas"), { ssr: false });

export default function PlayPage() {
  const router = useRouter();
  const params = useParams();
  const beatmapId = params.beatmapId as string;
  const status = useGameStore((s) => s.status);
  const currentBeatmap = useGameStore((s) => s.currentBeatmap);
  const retryGame = useGameStore((s) => s.retryGame);
  const startResuming = useGameStore((s) => s.startResuming);
  const backgroundDim = useSettingsStore((s) => s.backgroundDim);
  const backgroundBlur = useSettingsStore((s) => s.backgroundBlur);
  const pauseMusic = useMusicStore((s) => s.pauseMusic);
  // Stable function that writes song progress to its own store: a progress tick must not re-render this page.
  const setProgress = useProgressStore((s) => s.setProgress);

  // Stop music player if it's playing, and start the progress indicator from 0
  useEffect(() => {
    pauseMusic();
    setProgress(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePause = useCallback(() => { useGameStore.getState().pauseGame(); }, []);
  const handleResume = useCallback(() => { 
    const s = useGameStore.getState().status;
    if (s === "paused") {
      startResuming();
    } else {
      useGameStore.getState().resumeGame(); 
    }
  }, [startResuming]);
  const handleRetry = useCallback(() => { 
    retryGame();
  }, [retryGame]);
  const handleQuit = useCallback(() => { useGameStore.getState().resetGame(); router.push("/select"); }, [router]);

  // Escape key for pause
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const s = useGameStore.getState().status;
        if (s === "playing") handlePause();
        else if (s === "paused") handleResume();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handlePause, handleResume]);

  // Navigate to result on complete
  useEffect(() => {
    if (status === "complete") {
      setTimeout(() => router.push("/result"), 1000);
    }
  }, [status, router]);

  // (Interval removed, driven by GameCanvas)

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Background */}
      {currentBeatmap?.backgroundUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${currentBeatmap.backgroundUrl})`,
            filter: `blur(${backgroundBlur * 0.3}px)`,
          }}
        >
          <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${backgroundDim / 100})` }} />
        </div>
      )}

      {/* PixiJS Canvas */}
      <GameCanvas key={beatmapId} beatmapId={beatmapId} onProgress={setProgress} />

      {/* React HUD */}
      <ScoreHUD />
      <JudgementDisplay />
      <HealthBar />
      <GuestIndicator />

      {/* Overlays */}
      <ResumeCountdown />
      <AnimatePresence mode="wait">
        {status === "paused" && (
          <PauseOverlay key="pause" onResume={handleResume} onRetry={handleRetry} onQuit={handleQuit} />
        )}
        {status === "failed" && (
          <FailOverlay key="fail" onRetry={handleRetry} onQuit={handleQuit} />
        )}
      </AnimatePresence>
    </div>
  );
}
