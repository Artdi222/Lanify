"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Pencil, Save, Upload, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { updateProfile } from "@/lib/api/user";
import { uploadToSupabase } from "@/lib/api/beatmaps";
import { COUNTRIES, countryName } from "@/lib/country";
import Flag from "@/components/profile/Flag";
import { invalidateUserProfile, useUserProfile } from "@/components/profile/useUserProfile";
import { toast } from "sonner";

interface ProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const LABEL = "font-game-body text-xs text-white/70";
const FILE_BUTTON =
  "flex w-full cursor-pointer items-center gap-2 rounded-lf-sm border-2 border-dashed border-white/20 bg-black/30 px-3 py-2 font-game-body text-sm text-white/80 transition-colors hover:border-lf-accent";

function uploadedUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/beatmaps/bg?path=${encodeURIComponent(path)}`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-8 font-game-body text-sm">
      <span className="text-white/75">{label}</span>
      <span className="text-white">{value}</span>
    </div>
  );
}

/** "player info" sheet. Spec: docs/ui-spec/profile.md. */
export default function ProfilePanel({ isOpen, onClose }: ProfilePanelProps) {
  const { user, token, login } = useAuthStore();
  const profile = useUserProfile(user?.id, isOpen);
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [country, setCountry] = useState("");
  const [savedCountry, setSavedCountry] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const avatarSrc = useMemo(() => (avatarFile ? URL.createObjectURL(avatarFile) : user?.avatarUrl), [avatarFile, user?.avatarUrl]);
  const bannerSrc = useMemo(() => (bannerFile ? URL.createObjectURL(bannerFile) : user?.bannerUrl), [bannerFile, user?.bannerUrl]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const startEditing = () => {
    setUsername(user?.username ?? "");
    setCountry(profile?.country ?? "");
    setAvatarFile(null);
    setBannerFile(null);
    setIsEditing(true);
  };

  const pickImage = (setFile: (f: File | null) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    setFile(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user) return;

    setIsSaving(true);
    try {
      const avatarUrl = avatarFile ? uploadedUrl(await uploadToSupabase(avatarFile)) : user.avatarUrl;
      const bannerUrl = bannerFile ? uploadedUrl(await uploadToSupabase(bannerFile)) : user.bannerUrl;

      const updatedUser = await updateProfile(token, {
        username: username !== user.username ? username : undefined,
        avatarUrl: avatarUrl || undefined,
        bannerUrl: bannerUrl || undefined,
        country: country && country !== profile?.country ? country : undefined,
      });

      login(token, updatedUser);
      invalidateUserProfile(user.id);
      if (country) setSavedCountry(country);
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const shownCountry = savedCountry ?? profile?.country;
  const rank = profile && profile.globalRank > 0 ? `#${profile.globalRank.toLocaleString("en-US")}` : "-";
  const pp = profile ? `${Math.round(profile.totalPp ?? 0).toLocaleString("en-US")}pp` : "-";
  const joined = user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "recently";

  return (
    <AnimatePresence>
      {isOpen && user && (
        <div className="fixed inset-x-0 bottom-0 top-12 z-40">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60" />

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-y-0 left-1/2 flex w-[min(1632px,100%)] -translate-x-1/2 flex-col bg-lf-surface shadow-lf-panel"
          >
            <header className="flex h-[77px] shrink-0 items-center gap-4 bg-lf-bg-raised px-12">
              <User className="h-8 w-8 text-white" aria-hidden />
              <h1 className="font-game-display text-[22px] text-white">player info</h1>
              <button type="button" onClick={onClose} aria-label="Close" className="ml-auto cursor-pointer rounded-full p-2 text-white/70 transition-colors hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="shrink-0 bg-lf-bg-raised px-12 pb-0 font-game-body text-sm text-white">
              <span className="inline-block border-b-[3px] border-lf-primary pb-1">info</span>
            </div>

            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
              <div className="relative h-48 bg-linear-to-r from-lf-primary/50 to-lf-bg lg:h-[350px]">
                {bannerSrc && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={bannerSrc} alt="" className="absolute inset-0 h-full w-full object-cover" />
                )}
              </div>

              <div className="relative flex h-[120px] items-center bg-lf-bg-raised pl-[270px] pr-12">
                <span className="absolute -top-16 left-[70px] flex h-28 w-28 items-center justify-center overflow-hidden rounded-xl bg-lf-bg shadow-lf-panel">
                  {avatarSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-12 w-12 text-lf-text-muted" />
                  )}
                </span>
                <div className="min-w-0">
                  <h2 className="truncate font-game-display text-2xl font-bold text-white">{user.username}</h2>
                  {shownCountry && (
                    <div className="mt-1 flex items-center gap-2 font-game-body text-sm text-white/85">
                      <Flag code={shownCountry} height={20} />
                      {countryName(shownCountry)}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => (isEditing ? setIsEditing(false) : startEditing())}
                  aria-label={isEditing ? "Cancel editing" : "Edit profile"}
                  className="ml-3 cursor-pointer rounded-lf-sm p-1.5 text-white/60 transition-colors hover:text-white"
                >
                  {isEditing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                </button>
              </div>

              {isEditing && (
                <form onSubmit={handleSaveProfile} className="mx-[70px] mt-6 max-w-xl space-y-3">
                  <input value={username} onChange={(e) => setUsername(e.target.value)} minLength={3} maxLength={50} required placeholder="username" className="block h-11 w-full rounded-lf-sm border-2 border-transparent bg-black/40 px-4 font-game-body text-base text-white outline-hidden focus:border-lf-accent" />
                  <select value={country} onChange={(e) => setCountry(e.target.value)} aria-label="Country" className="block h-11 w-full rounded-lf-sm border-2 border-transparent bg-black/40 px-3 font-game-body text-base text-white outline-hidden focus:border-lf-accent">
                    <option value="">Country (not set)</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <label className={FILE_BUTTON}>
                    <Upload className="h-4 w-4 text-lf-accent" />
                    {avatarFile ? avatarFile.name : "Choose avatar image..."}
                    <input type="file" accept="image/*" onChange={pickImage(setAvatarFile)} className="hidden" />
                  </label>
                  <label className={FILE_BUTTON}>
                    <Upload className="h-4 w-4 text-lf-accent" />
                    {bannerFile ? bannerFile.name : "Choose banner image..."}
                    <input type="file" accept="image/*" onChange={pickImage(setBannerFile)} className="hidden" />
                  </label>
                  <button type="submit" disabled={isSaving} className="flex cursor-pointer items-center gap-2 rounded-lf-sm bg-lf-primary px-5 py-2 font-game-display text-sm font-bold text-white transition-[filter] hover:brightness-110 disabled:opacity-60">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save
                  </button>
                </form>
              )}

              <div className="flex flex-wrap items-start justify-between gap-8 px-[70px] py-9">
                <div className="flex gap-16">
                  <div>
                    <div className={LABEL}>Global Ranking</div>
                    <div className="font-game-display text-[30px] font-bold leading-9 text-lf-warning">{rank}</div>
                  </div>
                  {(
                    <div>
                      <div className={LABEL}>Country Ranking</div>
                      <div className="font-game-display text-[30px] font-bold leading-9 text-white/80">{profile?.countryRank != null && savedCountry === null ? `#${profile.countryRank.toLocaleString("en-US")}` : "-"}</div>
                    </div>
                  )}
                  <div>
                    <div className={LABEL}>Performance</div>
                    <div className="font-game-display text-[30px] font-bold leading-9 text-white">{pp}</div>
                  </div>
                </div>
                <div className="w-72 space-y-1.5">
                  <Stat label="Hit Accuracy" value={profile ? `${profile.stats.avgAccuracy.toFixed(2)}%` : "-"} />
                  <Stat label="Play Count" value={profile ? profile.stats.playCount.toLocaleString("en-US") : "-"} />
                </div>
              </div>

              <p className="px-[70px] pb-8 font-game-body text-[13px] text-white/70">Joined {joined}</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
