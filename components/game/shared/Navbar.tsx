"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { User, LogIn } from "lucide-react";
import MusicPlayer from "./MusicPlayer";

export default function GameNavbar() {
  const { user, isGuest } = useAuthStore();
  const [time, setTime] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    // Live clock
    const clockInterval = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    }, 1000);

    return () => {
      clearInterval(clockInterval);
    };
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-9 bg-[#0a0a18] transition-opacity duration-300 ${mounted ? "opacity-100" : "opacity-0"}`}>
      {/* Left: User info */}
      <div className="flex items-center gap-3">
        {isGuest ? (
          <div className="flex items-center gap-2 text-xs font-game-body">
            <span className="text-white/50">Guest</span>
            <div className="w-px h-3 bg-white/20" />
            <Link
              href="/login"
              className="flex items-center gap-1 text-lime-400 hover:text-lime-300 transition-all duration-200 cursor-pointer"
            >
              <LogIn className="w-3 h-3" />
              <span className="font-semibold tracking-wide text-[10px]">Login</span>
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <User className="w-3 h-3 text-white" />
            </div>
            <span className="text-white font-game-display tracking-wider text-xs">{user?.username}</span>
          </div>
        )}
      </div>

      {/* Right: Music + Clock */}
      <div className="flex items-center font-game-mono">
        <MusicPlayer />
        <span className="text-[11px] text-cyan-50/70 tabular-nums tracking-widest">
          {time || "00:00:00"}
        </span>
      </div>
    </nav>
  );
}
