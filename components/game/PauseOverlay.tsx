"use client";
import { motion } from "framer-motion";
import { Play, RotateCcw, X, Settings } from "lucide-react";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import GameSlider from "./shared/GameSlider";

interface PauseOverlayProps {
  onResume: () => void;
  onRetry: () => void;
  onQuit: () => void;
}

export default function PauseOverlay({ onResume, onRetry, onQuit }: PauseOverlayProps) {
  const settings = useSettingsStore();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#050508]/80 backdrop-blur-md"
    >
      <div className="max-w-3xl w-full mx-4 flex flex-col md:flex-row items-center justify-center gap-12">
        {/* Left Side: Pause Menu Buttons */}
        <div className="text-center space-y-8 min-w-[280px]">
          <h2 className="text-5xl font-game-display font-bold text-white tracking-widest uppercase">
            Paused
          </h2>
          <div className="flex flex-col gap-4">
            <button 
              onClick={onResume} 
              className="group relative flex items-center justify-center gap-3 py-4 rounded-2xl bg-lanify-accent text-lanify-bg font-game-display font-bold text-lg hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] hover:scale-[1.02] active:scale-95 transition-all duration-200 cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <Play className="w-6 h-6 fill-current relative z-10" /> 
              <span className="relative z-10">Resume Game</span>
            </button>
            
            <button 
              onClick={onRetry} 
              className="flex items-center justify-center gap-3 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-game-body hover:bg-white/10 hover:border-lanify-accent/40 transition-all duration-200 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" /> Retry
            </button>
            
            <button 
              onClick={onQuit} 
              className="flex items-center justify-center gap-3 py-3 rounded-2xl border border-lanify-danger/20 text-lanify-danger/80 font-game-body hover:bg-lanify-danger/10 hover:border-lanify-danger/40 transition-all duration-200 cursor-pointer"
            >
              <X className="w-5 h-5" /> Quit to Menu
            </button>
          </div>
        </div>

        {/* Vertical Divider (Desktop Only) */}
        <div className="hidden md:block w-px h-64 bg-linear-to-b from-transparent via-white/10 to-transparent" />

        {/* Right Side: Quick Settings */}
        <div className="w-full max-w-[320px] bg-white/5 p-8 rounded-3xl border border-white/10 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] space-y-8">
          <h3 className="flex items-center gap-2 text-sm font-game-display font-bold text-cyan-400 tracking-[0.2em] uppercase">
            <Settings className="w-4 h-4" />
            Quick Settings
          </h3>
          
          <div className="space-y-8">
            <GameSlider
              label="Background Dim"
              value={settings.backgroundDim}
              min={0}
              max={100}
              suffix="%"
              onChange={settings.setBackgroundDim}
            />
            
            <GameSlider
              label="Background Blur"
              value={settings.backgroundBlur}
              min={0}
              max={100}
              suffix="%"
              onChange={settings.setBackgroundBlur}
            />
            
            <GameSlider
              label="Scroll Speed"
              value={settings.scrollSpeed}
              min={1}
              max={40}
              step={0.1}
              onChange={settings.setScrollSpeed}
            />

            <GameSlider
              label="Master Volume"
              value={Math.round(settings.volume * 100)}
              min={0}
              max={100}
              suffix="%"
              onChange={(v) => settings.setVolume(v / 100)}
            />
          </div>

          <p className="text-[10px] text-white/30 text-center font-game-mono uppercase tracking-wider">
            Changes are applied immediately
          </p>
        </div>
      </div>
    </motion.div>
  );
}

