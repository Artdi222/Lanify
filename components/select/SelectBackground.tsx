"use client";

import { AnimatePresence, motion } from "framer-motion";

/** Latar layar select: cover beatmap terpilih (terang) + gradien gelap di belakang kolom kiri. Foto: cover tidak dihitamkan pekat. */
export default function SelectBackground({ coverUrl }: { coverUrl: string | null }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 bg-select-bar">
      <AnimatePresence>
        <motion.div
          key={coverUrl ?? "fallback"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className={`absolute inset-0 bg-cover bg-center ${coverUrl ? "" : "bg-linear-to-br from-select-panel via-select-bar to-select-tile-dim"}`}
          style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
        />
      </AnimatePresence>
      <div className="absolute inset-y-0 left-0 w-[58%] bg-linear-to-r from-black/30 via-black/10 to-transparent" />
    </div>
  );
}
