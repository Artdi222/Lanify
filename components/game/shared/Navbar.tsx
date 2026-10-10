"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { User as UserIcon, LogOut, Shield } from "lucide-react";
import MusicPlayer from "./MusicPlayer";
import SettingsDrawer from "./SettingsDrawer";
import TopBarClock from "./TopBarClock";
import { Icon } from "@/components/ui/icons/Icon";
import RegisterModal from "./RegisterModal";
import AccountPanel from "@/components/auth/AccountPanel";
import ProfilePanel from "./ProfilePanel";
import { motion, AnimatePresence } from "framer-motion";

export default function GameNavbar() {
  const { user, isGuest, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // Dropdown & Modal states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isProfilePanelOpen, setIsProfilePanelOpen] = useState(false);

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

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 flex items-stretch justify-between h-12 bg-lf-bg-raised text-lf-text transition-opacity duration-300 ${mounted ? "opacity-100" : "opacity-0"}`}>
        {/* Left: settings, home, ruleset */}
        <div className="flex items-stretch">
          <SettingsDrawer>
            <button
              aria-label="Settings"
              className="m-1 flex w-[58px] cursor-pointer items-center justify-center rounded-lf-md transition-colors hover:bg-lf-surface-hover data-[state=open]:bg-lf-primary"
            >
              <Icon name="settings" size={22} />
            </button>
          </SettingsDrawer>
          <Link href="/" aria-label="Home" className="flex w-[68px] items-center justify-center transition-colors hover:bg-lf-surface-hover">
            <Icon name="home" size={22} />
          </Link>
          {/* Ruleset: Lanify hanya punya mania, jadi satu ikon terpilih */}
          <div className="relative flex w-12 items-center justify-center" aria-label="Mania">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-lf-accent text-lf-bg">
              <Icon name="ruleset-mania" size={24} title="Mania" />
            </span>
            <span className="absolute bottom-[3px] h-[2px] w-[21px] rounded-full bg-lf-text" />
          </div>
        </div>

        {/* Right: chat, globe, music, user, clock, notifications */}
        <div className="flex items-stretch">
          <button disabled title="Segera" aria-label="Chat" className="flex w-12 items-center justify-center text-lf-text-dim">
            <Icon name="chat" size={22} />
          </button>
          <button disabled title="Segera" aria-label="Online" className="flex w-12 items-center justify-center text-lf-text-dim">
            <Icon name="globe" size={22} />
          </button>
          <MusicPlayer />
          <div className="mx-1 my-2.5 w-0.5 rounded-full bg-lf-text" />

          {/* User: tombol dropdown login/profil */}
          <div className="relative flex" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex cursor-pointer items-center gap-3 px-3 transition-colors ${isDropdownOpen ? "bg-lf-primary" : "hover:bg-lf-surface-hover"}`}
            >
              <span className="max-w-44 truncate text-[15px] font-game-body text-lf-text">
                {isGuest ? "Guest" : user?.username}
              </span>
              <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lf-sm bg-lf-bg">
                {user?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatarUrl} alt={user.username} className="h-full w-full object-cover" />
                ) : (
                  <UserIcon className="h-5 w-5 text-lf-text-muted" />
                )}
              </span>
            </button>

            {/* Dropdown Menu - Anchored Right Below */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className={isGuest ? "fixed right-0 top-12 z-50 w-[min(506px,100vw)] bg-lf-bg-raised shadow-lf-panel" : "absolute right-0 top-full mt-2 w-72 bg-[#090e17] border border-blue-900/50 rounded-2xl shadow-2xl p-4 z-50"}
                >
                  {isGuest ? (
                    <AccountPanel
                      onDone={() => setIsDropdownOpen(false)}
                      onRegister={() => {
                        setIsDropdownOpen(false);
                        setIsRegisterOpen(true);
                      }}
                    />
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
          <TopBarClock />
          <button disabled title="Segera" aria-label="Notifications" className="flex w-12 items-center justify-center text-lf-text-dim">
            <Icon name="bell" size={22} />
          </button>
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
