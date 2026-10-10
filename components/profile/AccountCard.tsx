"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, User as UserIcon } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { PRESENCE_OPTIONS, usePresenceStore } from "@/lib/store/usePresenceStore";
import { countryName } from "@/lib/country";
import Flag from "./Flag";
import { useUserProfile } from "./useUserProfile";

const ROW = "block w-full cursor-pointer px-4 py-2 text-left font-game-body text-base text-white transition-colors hover:bg-white/10";

/** Signed-in panel under the top bar. Spec: docs/ui-spec/profile.md. */
export default function AccountCard({ onOpenProfile, onDone }: { onOpenProfile: () => void; onDone: () => void }) {
  const { user, logout } = useAuthStore();
  const profile = useUserProfile(user?.id);
  const { status, setStatus } = usePresenceStore();
  const [statusOpen, setStatusOpen] = useState(false);
  const current = PRESENCE_OPTIONS.find((o) => o.value === status)!;
  if (!user) return null;

  return (
    <div className="space-y-4 p-7 pt-6">
      <h2 className="text-center font-game-display text-[17px] font-bold text-white">Signed in</h2>

      <button type="button" onClick={onOpenProfile} className="block w-full cursor-pointer overflow-hidden rounded-lf-md bg-black/25 text-left transition-[filter] hover:brightness-110">
        <div className="relative h-[110px] bg-linear-to-r from-lf-primary/60 to-lf-bg">
          {user.bannerUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
          <span className="absolute left-[13px] top-[9px] flex h-[82px] w-[82px] items-center justify-center overflow-hidden rounded-lf-md bg-lf-bg">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <UserIcon className="h-9 w-9 text-lf-text-muted" />
            )}
          </span>
          <div className="absolute top-[9px] left-[107px] right-3 flex min-w-0 flex-col gap-1.5">
            {profile?.country ? (
              <span className="block" title={countryName(profile.country)}>
                <Flag code={profile.country} height={30} />
              </span>
            ) : (
              <span className="font-game-body text-xs text-white/60">Set country in player info</span>
            )}
            <span className="block truncate font-game-display text-base font-bold text-white">{user.username}</span>
          </div>
        </div>
        <div className="flex gap-12 px-3 pb-3 pt-2.5">
          <div>
            <div className="font-game-body text-xs text-white/70">Global Ranking</div>
            <div className="font-game-display text-[30px] font-bold leading-9 text-lf-warning">{profile && profile.globalRank > 0 ? `#${profile.globalRank.toLocaleString("en-US")}` : "-"}</div>
          </div>
          <div>
            <div className="font-game-body text-xs text-white/70">Country Ranking</div>
            <div className="font-game-display text-[30px] font-bold leading-9 text-white/80">{profile?.countryRank != null ? `#${profile.countryRank.toLocaleString("en-US")}` : "-"}</div>
          </div>
        </div>
      </button>

      <div className="overflow-hidden rounded-lf-sm bg-black/25">
        <button type="button" onClick={() => setStatusOpen((o) => !o)} aria-expanded={statusOpen} className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left font-game-body text-base text-white transition-colors hover:bg-white/10">
          <span className={`h-3 w-3 rounded-full ${current.dot}`} />
          {current.label}
          <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${statusOpen ? "rotate-180" : ""}`} />
        </button>
        {statusOpen && (
          <div className="border-t border-white/10 py-1">
            {PRESENCE_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  setStatus(o.value);
                  setStatusOpen(false);
                }}
                className={`${ROW} ${o.value === status ? "bg-lf-primary hover:bg-lf-primary" : ""}`}
              >
                {o.label}
              </button>
            ))}
            {user.role === "admin" && (
              <Link href="/admin" onClick={onDone} className={ROW}>
                Admin Dashboard
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                logout();
                onDone();
              }}
              className={ROW}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
