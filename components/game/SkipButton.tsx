"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Forward } from "lucide-react";

interface SkipButtonProps {
  onSkip: () => void;
  visible: boolean;
}

export default function SkipButton({ onSkip, visible }: SkipButtonProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
        >
          <button
            onClick={onSkip}
            className="group relative flex items-center gap-3 px-8 py-3 bg-lanify-bg-secondary/80 backdrop-blur-md border border-lanify-border rounded-full hover:border-lanify-primary transition-all duration-300 overflow-hidden shadow-2xl"
          >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-linear-to-r from-lanify-primary/0 via-lanify-primary/10 to-lanify-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <Forward className="w-5 h-5 text-lanify-primary group-hover:scale-110 transition-transform duration-300" />
            
            <span className="text-lanify-text font-game-display text-sm tracking-widest group-hover:text-lanify-primary transition-colors">
              SKIP <span className="text-lanify-text-secondary ml-2">[SPACE]</span>
            </span>

            {/* Bottom Accent */}
            <motion.div 
              className="absolute bottom-0 left-0 h-[2px] bg-lanify-primary"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.3 }}
            />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
