"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { User as UserIcon, LogIn, LogOut, Shield, Eye, EyeOff, Loader2 } from "lucide-react";
import MusicPlayer from "./MusicPlayer";
import RegisterModal from "./RegisterModal";
import ProfilePanel from "./ProfilePanel";
import { apiClient } from "@/lib/api/client";
import type { User } from "@/types/user";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function GameNavbar() {
  const { user, isGuest, login, logout } = useAuthStore();
  const [time, setTime] = useState("");
  const [mounted, setMounted] = useState(false);

  // Dropdown & Modal states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isProfilePanelOpen, setIsProfilePanelOpen] = useState(false);

  // Login form state inside dropdown
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Banner color placeholder
  const bannerColors = [
    "from-blue-700 to-indigo-900",
    "from-cyan-700 to-blue-900",
    "from-purple-700 to-pink-950",
    "from-emerald-700 to-teal-950",
  ];
  const [bannerColor] = useState(() => bannerColors[Math.floor(Math.random() * bannerColors.length)]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
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

    return () => clearInterval(clockInterval);
  }, []);

  // Listen for open-auth-dropdown custom event
  useEffect(() => {
    const handleOpenAuth = () => {
      setIsDropdownOpen(true);
    };
    window.addEventListener("open-auth-dropdown", handleOpenAuth);
    return () => window.removeEventListener("open-auth-dropdown", handleOpenAuth);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiClient<{ token: string; user: User }>("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      login(res.token, res.user);
      toast.success("Welcome back!");
      setIsDropdownOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-9 bg-[#060a12] border-b border-blue-900/30 transition-opacity duration-300 ${mounted ? "opacity-100" : "opacity-0"}`}>
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-3">
          <Link href="/" className="font-game-display font-bold text-xs tracking-widest text-blue-400 hover:text-white transition-colors">
            LANIFY
          </Link>
        </div>

        {/* Right: Music + Clock + Profile Button */}
        <div className="flex items-center gap-3 font-game-mono">
          <MusicPlayer />
          
          <span className="text-[11px] text-cyan-50/70 tabular-nums tracking-widest">
            {time || "00:00:00"}
          </span>

          <div className="w-px h-3 bg-white/20" />

          {/* Profile Button - Rounded Rectangle */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#0c1424] hover:bg-blue-900/40 border border-blue-800/40 transition-all cursor-pointer group"
            >
              {isGuest ? (
                <>
                  <div className="w-5 h-5 rounded-md bg-blue-950 border border-blue-500/30 flex items-center justify-center">
                    <UserIcon className="w-3 h-3 text-blue-400 group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-xs font-game-body text-blue-200 group-hover:text-white transition-colors">Guest</span>
                </>
              ) : (
                <>
                  <div className="w-5 h-5 rounded-md bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center overflow-hidden">
                    {user?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="text-xs font-game-display tracking-wider text-white font-semibold">{user?.username}</span>
                </>
              )}
            </button>

            {/* Dropdown Menu - Anchored Right Below */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-72 bg-[#090e17] border border-blue-900/50 rounded-2xl shadow-2xl p-4 z-50"
                >
                  {isGuest ? (
                    /* Guest Dropdown Form */
                    <form onSubmit={handleLogin} className="space-y-3">
                      <div className="text-xs font-game-mono text-blue-400 uppercase tracking-widest pb-1 border-b border-white/5">
                        Sign In
                      </div>

                      <div>
                        <label className="text-[10px] font-game-mono text-white/60 uppercase tracking-wider mb-1 block">
                          Email
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full px-3 py-1.5 rounded-lg bg-[#040810] border border-blue-900/50 text-white text-xs font-game-body
                            placeholder:text-white/30 focus:outline-none focus:border-blue-400 transition-colors"
                          placeholder="player@lanify.gg"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-game-mono text-white/60 uppercase tracking-wider mb-1 block">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-3 py-1.5 pr-8 rounded-lg bg-[#040810] border border-blue-900/50 text-white text-xs font-game-body
                              placeholder:text-white/30 focus:outline-none focus:border-blue-400 transition-colors"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-game-display font-semibold transition-all cursor-pointer disabled:opacity-50"
                        >
                          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
                          Login
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsDropdownOpen(false);
                            setIsRegisterOpen(true);
                          }}
                          className="flex-1 py-2 rounded-xl bg-blue-950/60 hover:bg-blue-900/80 border border-blue-800/40 text-blue-300 hover:text-white text-xs font-game-display font-semibold transition-all cursor-pointer"
                        >
                          Create Account
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Logged-In Dropdown Profile Card (NO ROLE BADGE) */
                    <div className="space-y-3">
                      <div className="text-[11px] font-game-mono text-white/50 uppercase tracking-widest">
                        Signed in
                      </div>

                      {/* Profile Card Button - Click to open 50% width panel */}
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setIsProfilePanelOpen(true);
                        }}
                        className="w-full text-left rounded-xl overflow-hidden border border-blue-800/40 bg-[#060a12] hover:border-blue-500 transition-all cursor-pointer group"
                      >
                        {/* Banner */}
                        <div className={`h-12 ${user?.bannerUrl ? 'bg-black' : `bg-linear-to-r ${bannerColor}`} relative`}>
                          {user?.bannerUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.bannerUrl} alt="Banner" className="w-full h-full object-cover opacity-80" />
                          )}
                        </div>

                        {/* Profile Info Overlay */}
                        <div className="p-3 pt-0 flex items-center gap-3 relative">
                          <div className="-mt-5 w-12 h-12 rounded-xl bg-[#040810] overflow-hidden flex items-center justify-center shrink-0 shadow-md">
                            {user?.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                            ) : (
                              <UserIcon className="w-6 h-6 text-blue-400" />
                            )}
                          </div>

                          <div className="overflow-hidden flex-1">
                            <h4 className="text-sm font-game-display font-bold text-white group-hover:text-blue-300 transition-colors truncate">
                              {user?.username}
                            </h4>
                          </div>
                        </div>
                      </button>

                      {/* Admin Dashboard button if admin role */}
                      {user?.role === "admin" && (
                        <Link
                          href="/admin"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-game-body font-semibold transition-all cursor-pointer"
                        >
                          <Shield className="w-4 h-4 text-amber-400" />
                          Admin Dashboard
                        </Link>
                      )}

                      {/* Log Out Button */}
                      <button
                        onClick={() => {
                          logout();
                          setIsDropdownOpen(false);
                        }}
                        className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-900/40 text-red-300 text-xs font-game-body font-semibold transition-all cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Log Out
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {/* Registration Modal Overlay */}
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
      />

      {/* osu!-style Profile Details Panel */}
      <ProfilePanel
        isOpen={isProfilePanelOpen}
        onClose={() => setIsProfilePanelOpen(false)}
      />
    </>
  );
}
