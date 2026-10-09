"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState} from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Play, LogIn, LogOut, Settings as SettingsIcon } from "lucide-react";
import SettingsDrawer from "@/components/game/shared/SettingsDrawer";
import { SkewedPanel } from "@/components/ui/SkewedPanel";
import { useAmbientPaused } from "@/components/ui/AmbientMotionController";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { useMusicStore } from "@/lib/store/useMusicStore";
import { listBeatmaps } from "@/lib/api/beatmaps";
import { GAMEPLAY_TIPS } from "@/types/game";

export default function MainMenuPage() {
  const router = useRouter();
  const { isGuest, logout } = useAuthStore();
  const { globalOffset } = useSettingsStore();
  const { playlist, currentIndex } = useMusicStore();
  const currentSong = playlist[currentIndex];
  const [fallbackBgUrl, setFallbackBgUrl] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [tip, setTip] = useState("");
  const ambientPaused = useAmbientPaused();
  const [particles, setParticles] = useState<Array<{
    width: number;
    height: number;
    left: number;
    yOffset: number;
    xOffset: number;
    duration: number;
    delay: number;
  }>>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setTip(GAMEPLAY_TIPS[Math.floor(Math.random() * GAMEPLAY_TIPS.length)]);
    
    // Generate particles
    setParticles([...Array(25)].map(() => ({
      width: Math.random() * 6 + 2,
      height: Math.random() * 6 + 2,
      left: Math.random() * 100,
      yOffset: -1000 - Math.random() * 500,
      xOffset: Math.random() * 100 - 50,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * 10,
    })));
  }, []);

  // Derive active background URL: current song's cover takes priority, then fallback
  const activeBgUrl = currentSong?.coverUrl || fallbackBgUrl;

  // Fetch a fallback background once if needed
  useEffect(() => {
    if (fallbackBgUrl) return;

    listBeatmaps(1, 10)
      .then((res) => {
        const withCover = res.data.filter((b) => b.coverUrl);
        if (withCover.length > 0) {
          const random = withCover[Math.floor(Math.random() * withCover.length)];
          setFallbackBgUrl(random.coverUrl);
        }
      })
      .catch(() => {
        // Silent fail
      });
  }, [fallbackBgUrl]);

  return (
    <div className={`relative flex-1 flex flex-col overflow-hidden bg-black selection:bg-lanify-accent/30 transition-opacity duration-300 ${mounted ? "opacity-100" : "opacity-0"}`}>
      {/* Background */}
      <AnimatePresence>
        {activeBgUrl ? (
          <motion.div
            key={activeBgUrl}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${activeBgUrl})` }}
          >
            {/* Sharp, darkened background treatment without blur */}
            <div className="absolute inset-0 bg-black/60" />
          </motion.div>
        ) : (
          <motion.div 
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-linear-to-br from-[#060e1a] via-[#040810] to-black" 
          />
        )}
      </AnimatePresence>

      {/* Subtle animated particles - now crisp dots instead of blur */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {!ambientPaused && particles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-blue-400/20"
            style={{
              width: p.width + "px",
              height: p.height + "px",
              left: p.left + "%",
              top: "100%",
            }}
            animate={{
              y: [0, p.yOffset],
              opacity: [0, 0.5, 0],
              x: p.xOffset,
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: "linear",
              delay: p.delay,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-1 flex-row items-center justify-center pb-16 h-full w-full max-w-6xl mx-auto px-4">
        <motion.div 
          layout
          className="flex flex-row items-center justify-center gap-0"
        >
          {/* Interactive Logo Toggle */}
          <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-30 flex flex-col items-center shrink-0"
          >
            <button 
              onClick={() => setIsMenuExpanded(!isMenuExpanded)}
              className="group relative focus:outline-hidden cursor-pointer"
            >
              {/* Core logo circle - clean and sharp, removed outer rings */}
              <div className="relative w-40 h-40 sm:w-64 sm:h-64 rounded-full bg-[#040b16] border-4 border-blue-500 flex items-center justify-center overflow-hidden transition-colors duration-500 group-hover:bg-[#071326] shadow-[0_0_30px_rgba(59,130,246,0.3)] z-30">
                <span className="px-4 text-3xl sm:text-5xl font-game-display font-bold text-blue-100 tracking-[0.15em] z-10 transition-colors group-hover:text-white">
                  LANIFY
                </span>
              </div>
            </button>
          </motion.div>

          {/* Action Buttons */}
          <AnimatePresence>
            {isMenuExpanded && (
              <motion.div
                initial={{ opacity: 0, width: 0, x: -50 }}
                animate={{ opacity: 1, width: "auto", x: -20 }}
                exit={{ opacity: 0, width: 0, x: -50 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-row items-center gap-0 z-10 relative overflow-hidden py-4 pr-6"
              >
                {/* Settings */}
                <SettingsDrawer>
                  <SkewedPanel className="w-40 h-24 sm:w-52 sm:h-32 hover:bg-blue-900 -ml-12 pl-12 sm:pl-16">
                    <SettingsIcon className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400 group-hover:text-white transition-colors" />
                    <span className="text-[10px] sm:text-sm font-game-display font-bold uppercase tracking-wider text-blue-400 group-hover:text-white">Settings</span>
                  </SkewedPanel>
                </SettingsDrawer>

                {/* PLAY BUTTON - CLEAN AND BOLD */}
                <SkewedPanel onClick={() => router.push("/select")} variant="primary" className="w-32 h-24 sm:w-40 sm:h-32">
                  <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white text-white group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] sm:text-sm font-game-display font-bold uppercase tracking-wider text-white">Play</span>
                </SkewedPanel>

                {/* Login / Logout */}
                {isGuest ? (
                  <SkewedPanel onClick={() => window.dispatchEvent(new CustomEvent("open-auth-dropdown"))} className="w-32 h-24 sm:w-40 sm:h-32 pr-2">
                    <LogIn className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400 group-hover:text-white transition-colors" />
                    <span className="text-[10px] sm:text-sm font-game-display font-bold uppercase tracking-wider text-blue-400 group-hover:text-white">Log In</span>
                  </SkewedPanel>
                ) : (
                  <SkewedPanel onClick={() => logout()} className="w-32 h-24 sm:w-40 sm:h-32 pr-2">
                    <LogOut className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400 group-hover:text-white transition-colors" />
                    <span className="text-[10px] sm:text-sm font-game-display font-bold uppercase tracking-wider text-blue-400 group-hover:text-white">Log Out</span>
                  </SkewedPanel>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Bottom: Info Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="absolute bottom-0 left-0 right-0 z-20 bg-linear-to-t from-black via-black/80 to-transparent pt-16 pb-6 px-8 flex justify-between items-end"
      >
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 rounded-full bg-blue-900/40 flex items-center justify-center border border-blue-500/40">
             <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse"></div>
           </div>
           <div>
             <div className="text-[10px] font-game-mono text-blue-400/80 uppercase tracking-widest mb-1">System Message</div>
             <span className="text-sm font-game-body text-white/90">
               {tip}
             </span>
           </div>
        </div>

        {/* Global Offset */}
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-game-mono text-white/50 uppercase tracking-widest mb-1">Global Offset</span>
          <span className="text-sm font-game-mono text-blue-300 tabular-nums bg-[#0a1424] border border-blue-800/60 px-3 py-1.5 rounded-sm">
            {globalOffset >= 0 ? "+" : ""}{globalOffset}ms
          </span>
        </div>
      </motion.div>
    </div>
  );
}
