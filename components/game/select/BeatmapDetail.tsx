"use client";

import { Music } from "lucide-react";
import type { Beatmap } from "@/types/beatmap";
import BeatmapInfoPanel from "@/components/select/BeatmapInfoPanel";
import RankingPanel from "@/components/select/RankingPanel";

/** Kolom kiri layar select: info beatmap + ranking. Spec: docs/ui-spec/song-select.md. */
export default function BeatmapDetail({ beatmap }: { beatmap: Beatmap | null }) {
  if (!beatmap) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div>
          <Music className="mx-auto mb-3 h-12 w-12 text-white/30" aria-hidden />
          <p className="font-game-display text-[17px] text-white/70">Select a beatmap to view details</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <BeatmapInfoPanel beatmap={beatmap} />
      <RankingPanel beatmap={beatmap} key={beatmap.id} />
    </div>
  );
}
