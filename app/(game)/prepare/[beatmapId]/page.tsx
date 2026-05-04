"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Play, ArrowLeft, Music, Clock, Gauge, Heart, Target, Hash, User } from "lucide-react";
import GameNavbar from "@/components/game/shared/Navbar";
import SettingsDrawer from "@/components/game/shared/SettingsDrawer";
import LoadingOverlay from "@/components/game/shared/LoadingOverlay";
import GuestPill from "@/components/game/shared/GuestPill";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useGameStore } from "@/lib/store/useGameStore";
import { getBeatmap, getBeatmapUrl } from "@/lib/api/beatmaps";
import { BeatmapLoader } from "@/lib/game/BeatmapLoader";
import { getStarRatingColor, formatDuration } from "@/types/game";
import type { Beatmap } from "@/types/beatmap";
import Image from "next/image";

interface LoadingStep {
  label: string;
  status: "pending" | "loading" | "done";
}

export default function PreparePage() {
  const router = useRouter();
  const params = useParams();
  const beatmapId = params.beatmapId as string;
  const { isGuest } = useAuthStore();
  const { setSelectedBeatmapId } = useGameStore();

  const [beatmap, setBeatmap] = useState<Beatmap | null>(() => {
    // Try to reuse the already selected beatmap from the store immediately
    const storeBeatmap = useGameStore.getState().selectedBeatmap;
    if (storeBeatmap && storeBeatmap.id === beatmapId) {
      return storeBeatmap;
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSteps, setLoadingSteps] = useState<LoadingStep[]>([
    { label: "Downloading beatmap...", status: "pending" },
    { label: "Extracting files...", status: "pending" },
    { label: "Parsing notes...", status: "pending" },
    { label: "Loading audio...", status: "pending" },
    { label: "Ready!", status: "pending" },
  ]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // If we already have the correct beatmap (from initializer), don't fetch
    if (beatmap && beatmap.id === beatmapId) return;

    getBeatmap(beatmapId)
      .then(setBeatmap)
      .catch(() => router.push("/select"));
  }, [beatmapId, router, beatmap]);

  const updateStep = useCallback((index: number, status: "loading" | "done") => {
    setLoadingSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, status } : s))
    );
  }, []);

  const handlePlay = async () => {
    if (!beatmap) return;
    setIsLoading(true);
    setSelectedBeatmapId(beatmapId);

    try {
      // Step 1: Download / Get URL
      updateStep(0, "loading");
      setProgress(10);
      
      let signedUrl = "";
      if (BeatmapLoader.hasCache(beatmap.filePath)) {
        // If cached, we don't need a fresh signed URL
        setProgress(25);
      } else {
        const urlData = await getBeatmapUrl(beatmapId, "");
        signedUrl = urlData.url;
        setProgress(25);
      }
      updateStep(0, "done");

      // Step 2-4: Extract & Parse & Audio (all handled by BeatmapLoader.load)
      updateStep(1, "loading");
      updateStep(2, "loading");
      updateStep(3, "loading");
      
      await BeatmapLoader.load(beatmap.filePath, signedUrl);
      
      updateStep(1, "done");
      setProgress(50);
      updateStep(2, "done");
      setProgress(75);
      updateStep(3, "done");
      setProgress(95);

      // Step 5: Ready
      updateStep(4, "done");
      setProgress(100);

      await new Promise((r) => setTimeout(r, 400));
      router.push(`/play/${beatmapId}`);
    } catch (err) {
      console.error("Failed to load beatmap:", err);
      setIsLoading(false);
    }
  };

  if (!beatmap) {
    return (
      <div className="min-h-screen bg-lanify-bg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-lanify-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const starColor = getStarRatingColor(beatmap.starRating);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      {beatmap.coverUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${beatmap.coverUrl})` }}
        >
          <div className="absolute inset-0 bg-lanify-bg/80 backdrop-blur-xl" />
        </div>
      )}
      {!beatmap.coverUrl && (
        <div className="absolute inset-0 bg-linear-to-br from-lanify-bg via-lanify-surface to-lanify-bg" />
      )}

      <GameNavbar />

      {/* Settings button (top right) */}
      <div className="absolute top-16 right-6 z-20">
        <SettingsDrawer />
      </div>

      {/* Center Card */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-lg"
        >
          <div className="bg-lanify-surface/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-6">
            {/* Logo */}
            <div className="text-center">
              <span className="text-sm font-game-display font-bold text-lanify-accent glow-cyan">
                lanify
              </span>
            </div>

            {/* Cover art */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-lanify-bg border border-white/5">
              {beatmap.coverUrl ? (
                <Image width={300} height={300} unoptimized src={beatmap.coverUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-12 h-12 text-lanify-text-secondary/20" />
                </div>
              )}
            </div>

            {/* Title & Artist */}
            <div className="text-center">
              <h1 className="text-2xl font-game-display font-bold text-white">
                {beatmap.title}
              </h1>
              <p className="text-sm font-game-body text-lanify-text-secondary mt-1">
                {beatmap.artist}
              </p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-game-mono font-bold"
                  style={{ backgroundColor: `${starColor}15`, color: starColor, border: `1px solid ${starColor}30` }}
                >
                  ★ {beatmap.starRating.toFixed(2)} — {beatmap.difficultyName}
                </span>
                <span className="px-2 py-1 rounded-full text-xs font-game-mono bg-lanify-accent/10 text-lanify-accent border border-lanify-accent/20">
                  {beatmap.keyCount}K
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <StatBlock icon={<Hash className="w-3.5 h-3.5" />} label="Key Count" value={`${beatmap.keyCount}K`} />
              <StatBlock icon={<Gauge className="w-3.5 h-3.5" />} label="BPM" value={String(Math.round(beatmap.bpm))} />
              <StatBlock icon={<Clock className="w-3.5 h-3.5" />} label="Length" value={formatDuration(beatmap.lengthSeconds)} />
              <StatBlock icon={<Heart className="w-3.5 h-3.5" />} label="HP Drain" value={beatmap.hp.toFixed(1)} />
              <StatBlock icon={<Target className="w-3.5 h-3.5" />} label="OD" value={beatmap.od.toFixed(1)} />
              <StatBlock icon={<User className="w-3.5 h-3.5" />} label="Mapper" value={beatmap.creator} small />
            </div>

            {/* Guest notice */}
            {isGuest && (
              <div className="flex justify-center">
                <GuestPill message="Playing as guest · scores won't be saved" />
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <motion.button
                onClick={handlePlay}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-lanify-accent text-lanify-bg font-game-display font-semibold text-lg
                  hover:shadow-[0_0_30px_rgba(0,229,255,0.4)] transition-all duration-200 cursor-pointer disabled:opacity-50"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Play className="w-6 h-6 fill-current" />
                Play
              </motion.button>
              <motion.button
                onClick={() => router.push("/select")}
                className="px-6 py-3.5 rounded-xl border border-white/10 text-white font-game-body
                  hover:border-lanify-accent/30 transition-all duration-200 cursor-pointer"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Loading overlay */}
      <LoadingOverlay visible={isLoading} steps={loadingSteps} progress={progress} />
    </div>
  );
}

function StatBlock({ icon, label, value, small = false }: { icon: React.ReactNode; label: string; value: string; small?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg bg-white/3 border border-white/5">
      <span className="text-lanify-accent">{icon}</span>
      <span className="text-[10px] font-game-mono text-lanify-text-secondary uppercase">{label}</span>
      <span className={`font-game-mono text-white ${small ? "text-[10px] truncate max-w-full" : "text-sm"}`}>{value}</span>
    </div>
  );
}
