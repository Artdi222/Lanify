"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Calendar, Edit3, Save, Upload, Loader2, Trophy, Target, Activity } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { getUserProfile, updateProfile, type UserStats } from "@/lib/api/user";
import { uploadToSupabase } from "@/lib/api/beatmaps";
import { toast } from "sonner";

interface ProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfilePanel({ isOpen, onClose }: ProfilePanelProps) {
  const { user, token, login } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Real user stats
  const [stats, setStats] = useState<UserStats | null>(null);
  const [globalRank, setGlobalRank] = useState<number | null>(null);
  const [totalPp, setTotalPp] = useState<number | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Random color for banner placeholder
  const bannerColors = [
    "from-blue-700 via-indigo-800 to-purple-950",
    "from-cyan-700 via-blue-900 to-slate-950",
    "from-purple-700 via-pink-900 to-slate-950",
    "from-emerald-700 via-teal-900 to-slate-950",
  ];
  const [bannerColor] = useState(() => bannerColors[Math.floor(Math.random() * bannerColors.length)]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user?.username) setUsername(user.username);
  }, [user]);

  // Fetch real player stats from backend
  useEffect(() => {
    if (isOpen && user?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoadingStats(true);
      getUserProfile(user.id)
        .then((res) => {
          setStats(res.stats);
          setGlobalRank(res.globalRank);
          setTotalPp(res.totalPp ?? 0);
        })
        .catch((err) => {
          console.error("Failed to load user stats:", err);
        })
        .finally(() => {
          setIsLoadingStats(false);
        });
    }
  }, [isOpen, user?.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user) return;

    setIsSaving(true);
    try {
      let avatarUrl = user.avatarUrl;
      let bannerUrl = user.bannerUrl;

      // Upload avatar image to Backblaze B2 bucket if selected
      if (avatarFile) {
        const path = await uploadToSupabase(avatarFile);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        avatarUrl = `${apiUrl}/beatmaps/bg?path=${encodeURIComponent(path)}`;
      }

      if (bannerFile) {
        const path = await uploadToSupabase(bannerFile);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        bannerUrl = `${apiUrl}/beatmaps/bg?path=${encodeURIComponent(path)}`;
      }

      // Update backend user profile
      const updatedUser = await updateProfile(token, {
        username: username !== user.username ? username : undefined,
        avatarUrl: avatarUrl || undefined,
        bannerUrl: bannerUrl || undefined,
      });

      login(token, updatedUser);
      toast.success("Profile updated successfully!");
      setIsEditing(false);
      setAvatarFile(null);
      setBannerFile(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 pointer-events-auto">
          {/* Solid dimmed backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75"
          />

          {/* Sliding Panel - 50% width of screen, full height below 56px navbar */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 z-10 w-full sm:w-[50vw] h-[calc(100vh-56px)] bg-[#070b14] border-t-2 border-x-2 border-blue-600/60 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Close Button Header */}
            <div className="absolute top-4 right-6 z-30">
              <button
                onClick={onClose}
                className="p-2 text-white/70 hover:text-white bg-black/60 hover:bg-black/80 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {/* Banner Area */}
              <div className={`relative h-48 sm:h-56 ${bannerPreview || user?.bannerUrl ? 'bg-black' : `bg-linear-to-r ${bannerColor}`}`}>
                {bannerPreview || user?.bannerUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={bannerPreview || user?.bannerUrl || ""} alt="Banner" className="w-full h-full object-cover opacity-80" />
                ) : (
                  <div className="absolute inset-0 bg-black/20" />
                )}
              </div>

              {/* Body Content */}
              <div className="px-6 sm:px-8 py-6 space-y-6">
                {/* Player Details Card */}
                <div className="p-5 bg-[#0a1220] border border-white/5 rounded-2xl space-y-4">
                  {/* Action Row Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-xs font-game-mono text-blue-400 uppercase tracking-widest">
                      PLAYER DETAILS
                    </span>

                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-game-body font-semibold transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      {isEditing ? "Cancel" : "Edit Profile"}
                    </button>
                  </div>

                  {/* Player Profile Info (Avatar, Name, Join Date) */}
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#040810] border border-blue-500/20 overflow-hidden flex items-center justify-center shadow-xl shrink-0">
                      {avatarPreview || user?.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarPreview || user?.avatarUrl || ""} alt={user?.username} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-10 h-10 text-blue-400" />
                      )}
                    </div>

                    <div>
                      <h1 className="text-2xl sm:text-3xl font-game-display font-bold text-white tracking-wide">
                        {user?.username || "Player"}
                      </h1>
                      <p className="text-xs font-game-mono text-white/60 flex items-center gap-1.5 mt-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-400" />
                        Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Recently"}
                        {globalRank !== null && globalRank > 0 && (
                          <>
                            <span className="mx-1">•</span>
                            <span className="text-amber-400 font-bold">#{globalRank.toLocaleString()} Global</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Edit Profile Section */}
                {isEditing && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleSaveProfile}
                    className="p-5 bg-[#0c1424] border border-blue-900/40 rounded-2xl space-y-4"
                  >
                    <h3 className="text-xs font-game-display font-bold text-white tracking-wide uppercase">
                      Edit Profile Info
                    </h3>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] font-game-mono text-white/70 uppercase tracking-wider mb-1 block">
                          Username
                        </label>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#060a12] border border-blue-900/50 text-white text-xs font-game-body focus:outline-none focus:border-blue-400"
                        />
                      </div>

                      {/* Avatar File Upload */}
                      <div>
                        <label className="text-[11px] font-game-mono text-white/70 uppercase tracking-wider mb-1 block">
                          Avatar Picture
                        </label>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl bg-[#060a12] border border-dashed border-blue-900/70 hover:border-blue-400 text-white/70 hover:text-white text-xs font-game-body transition-colors cursor-pointer"
                        >
                          <Upload className="w-4 h-4 text-blue-400" />
                          {avatarFile ? avatarFile.name : "Choose avatar image file..."}
                        </button>
                      </div>

                      {/* Banner File Upload */}
                      <div>
                        <label className="text-[11px] font-game-mono text-white/70 uppercase tracking-wider mb-1 block">
                          Banner Picture
                        </label>
                        <input
                          type="file"
                          ref={bannerInputRef}
                          onChange={handleBannerChange}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => bannerInputRef.current?.click()}
                          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl bg-[#060a12] border border-dashed border-blue-900/70 hover:border-blue-400 text-white/70 hover:text-white text-xs font-game-body transition-colors cursor-pointer"
                        >
                          <Upload className="w-4 h-4 text-blue-400" />
                          {bannerFile ? bannerFile.name : "Choose banner image file..."}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-game-display font-semibold text-xs cursor-pointer transition-colors disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Save Profile
                    </button>
                  </motion.form>
                )}

                {/* Real Player Statistics Grid */}
                <div>
                  <div className="text-xs font-game-mono text-white/50 uppercase tracking-wider mb-3">
                    Statistics
                  </div>

                  {isLoadingStats ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-4 bg-[#0a1220] border border-white/5 rounded-2xl flex flex-col">
                        <div className="flex items-center gap-2 text-emerald-400 mb-1">
                          <Activity className="w-4 h-4" />
                          <span className="text-[11px] font-game-mono uppercase tracking-wider text-white/60">Play Count</span>
                        </div>
                        <span className="text-xl font-game-display font-bold text-white">
                          {stats?.playCount ?? 0}
                        </span>
                      </div>

                      <div className="p-4 bg-[#0a1220] border border-white/5 rounded-2xl flex flex-col">
                        <div className="flex items-center gap-2 text-cyan-400 mb-1">
                          <Target className="w-4 h-4" />
                          <span className="text-[11px] font-game-mono uppercase tracking-wider text-white/60">Avg Accuracy</span>
                        </div>
                        <span className="text-xl font-game-display font-bold text-white">
                          {stats?.avgAccuracy ? `${stats.avgAccuracy.toFixed(2)}%` : "0.00%"}
                        </span>
                      </div>

                      <div className="p-4 bg-[#0a1220] border border-white/5 rounded-2xl flex flex-col">
                        <div className="flex items-center gap-2 text-amber-400 mb-1">
                          <Trophy className="w-4 h-4" />
                          <span className="text-[11px] font-game-mono uppercase tracking-wider text-white/60">Total PP</span>
                        </div>
                        <span className="text-xl font-game-display font-bold text-white">
                          {totalPp ? Math.round(totalPp).toLocaleString() : "0"} <span className="text-sm text-white/50">pp</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
