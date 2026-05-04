"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState} from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Play, LogIn, LogOut, Settings as SettingsIcon } from "lucide-react";
import SettingsDrawer from "@/components/game/shared/SettingsDrawer";
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
  const [tip, setTip] = useState("");
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
            {/* Brighter background treatment with less blur */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          </motion.div>
        ) : (
          <motion.div 
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-linear-to-br from-[#1a0b2e] via-[#0d1b2a] to-black" 
          />
        )}
      </AnimatePresence>

      {/* Subtle animated particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/20 blur-[1px]"
            style={{
              width: p.width + "px",
              height: p.height + "px",
              left: p.left + "%",
              top: "100%",
            }}
            animate={{
              y: [0, p.yOffset],
              opacity: [0, 0.8, 0],
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

      {/* Ambient glow effects */}
      <div className="absolute inset-0 pointer-events-none mix-blend-screen">
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-[120px]" 
        />
        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] rounded-full bg-cyan-600/10 blur-[150px]" />
        <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full bg-cyan-400/10 blur-[150px]" />
      </div>

      {/* Subtle animated particles */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center pb-16">
        
        {/* Pulsing Center Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
          className="relative z-20 flex flex-col items-center"
        >
          <motion.div
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            {/* Inner dynamic ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-4 rounded-full border border-dashed border-cyan-400/50"
            />
            
            {/* Outer dynamic ring */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-8 rounded-full border border-cyan-500/20"
            />

            {/* Core logo circle */}
            <div className="relative w-64 h-64 rounded-full bg-black/60 border border-cyan-500/30 flex items-center justify-center backdrop-blur-md shadow-[0_0_50px_rgba(0,229,255,0.3)] overflow-hidden group">
              <div className="absolute inset-0 bg-linear-to-br from-cyan-500/10 to-cyan-400/10 group-hover:from-cyan-500/30 group-hover:to-cyan-400/30 transition-all duration-500" />
              <span className="px-4 text-5xl font-game-display font-bold text-transparent bg-clip-text bg-linear-to-r from-cyan-300 via-white to-cyan-300 tracking-[0.15em] drop-shadow-[0_0_15px_rgba(0,229,255,0.8)] z-10">
                LANIFY
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, type: "spring", bounce: 0.4 }}
          className="flex flex-row items-center justify-center gap-6 mt-16 z-20 relative"
        >
          {/* Settings */}
          <SettingsDrawer>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center w-20 h-20 rounded-full bg-[#0a1929] border-2 border-cyan-500/50 hover:border-cyan-400 hover:bg-cyan-950 transition-all cursor-pointer group shadow-[0_4px_15px_rgba(0,0,0,0.5)]"
            >
              <SettingsIcon className="w-8 h-8 text-cyan-400 group-hover:rotate-90 transition-transform duration-500" />
            </motion.button>
          </SettingsDrawer>

          {/* PLAY BUTTON - HUGE & VIVID */}
          <motion.button
            onClick={() => router.push("/select")}
            whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(0, 229, 255, 0.6)" }}
            whileTap={{ scale: 0.95 }}
            className="group relative flex items-center justify-center w-72 h-20 rounded-full bg-linear-to-r from-cyan-400 to-cyan-600 shadow-[0_0_20px_rgba(0,229,255,0.4)] cursor-pointer overflow-hidden"
          >
            {/* Shine effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-linear-to-r from-transparent via-white/30 to-transparent skew-x-12" />
            <div className="relative flex items-center justify-center z-10">
               <Play className="w-8 h-8 mr-3 fill-white text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
               <span className="text-3xl font-game-display font-bold text-white tracking-[0.2em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">Play</span>
            </div>
          </motion.button>

          {/* Login / Logout */}
          {isGuest ? (
            <motion.button
              onClick={() => router.push("/login")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center w-20 h-20 rounded-full bg-[#0a1929] border-2 border-cyan-500/50 hover:border-cyan-400 hover:bg-cyan-950 transition-all cursor-pointer group shadow-[0_4px_15px_rgba(0,0,0,0.5)]"
            >
              <LogIn className="w-8 h-8 text-cyan-400 group-hover:translate-x-1 transition-transform duration-300" />
            </motion.button>
          ) : (
            <motion.button
              onClick={() => logout()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center w-20 h-20 rounded-full bg-[#0a1929] border-2 border-cyan-500/50 hover:border-cyan-400 hover:bg-cyan-950 transition-all cursor-pointer group shadow-[0_4px_15px_rgba(0,0,0,0.5)]"
            >
              <LogOut className="w-8 h-8 text-cyan-400 group-hover:-translate-x-1 transition-transform duration-300" />
            </motion.button>
          )}
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
           <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_15px_rgba(0,229,255,0.2)]">
             <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></div>
           </div>
           <div>
             <div className="text-[10px] font-game-mono text-cyan-400/70 uppercase tracking-widest mb-1">System Message</div>
             <span className="text-sm font-game-body text-white/90">
               {tip}
             </span>
           </div>
        </div>

        {/* Global Offset */}
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-game-mono text-white/40 uppercase tracking-widest mb-1">Global Offset</span>
          <span className="text-sm font-game-mono text-cyan-300 tabular-nums bg-cyan-950/40 border border-cyan-900/50 px-3 py-1.5 rounded-lg backdrop-blur-md shadow-[inset_0_0_10px_rgba(0,229,255,0.1)]">
            {globalOffset >= 0 ? "+" : ""}{globalOffset}ms
          </span>
        </div>
      </motion.div>
    </div>
  );
}
