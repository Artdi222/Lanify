"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

interface LoadingStep {
  label: string;
  status: "pending" | "loading" | "done";
}

interface LoadingOverlayProps {
  visible: boolean;
  steps: LoadingStep[];
  progress?: number;
}

export default function LoadingOverlay({ visible, steps, progress = 0 }: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-lanify-bg/95 backdrop-blur-sm"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <span className="text-3xl font-game-display font-bold text-lanify-accent glow-cyan">
              lanify
            </span>
          </motion.div>

          {/* Steps */}
          <div className="flex flex-col gap-3 min-w-[300px]">
            {steps.map((step, i) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                className="flex items-center gap-3 text-sm font-game-body"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  {step.status === "done" ? (
                    <Check className="w-4 h-4 text-lanify-success" />
                  ) : step.status === "loading" ? (
                    <Loader2 className="w-4 h-4 text-lanify-accent animate-spin" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-lanify-text-secondary/30" />
                  )}
                </div>
                <span
                  className={
                    step.status === "done"
                      ? "text-lanify-success"
                      : step.status === "loading"
                      ? "text-white"
                      : "text-lanify-text-secondary/50"
                  }
                >
                  {step.label}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="mt-8 w-[300px] h-1 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-linear-to-r from-lanify-accent to-lanify-accent2"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>

          {/* Percentage */}
          <span className="mt-2 text-xs font-game-mono text-lanify-text-secondary tabular-nums">
            {Math.round(progress)}%
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
