"use client";
import { motion } from "framer-motion";
import { RotateCcw, X } from "lucide-react";

interface FailOverlayProps {
  onRetry: () => void;
  onQuit: () => void;
}

export default function FailOverlay({ onRetry, onQuit }: FailOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-red-950/60 backdrop-blur-sm"
    >
      <div className="text-center space-y-6">
        <motion.h2
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          className="text-6xl font-game-display font-bold text-lanify-danger"
          style={{ textShadow: "0 0 40px rgba(224,122,134,0.5)" }}
        >
          FAILED
        </motion.h2>
        <div className="flex gap-3">
          <button onClick={onRetry} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-lanify-accent text-lanify-bg font-game-display font-semibold cursor-pointer hover:shadow-[0_0_20px_rgba(185,189,230,0.4)] transition-all duration-200">
            <RotateCcw className="w-4 h-4" /> Retry
          </button>
          <button onClick={onQuit} className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-white font-game-body cursor-pointer hover:border-lanify-accent/30 transition-all duration-200">
            <X className="w-4 h-4" /> Quit
          </button>
        </div>
      </div>
    </motion.div>
  );
}
