import { useEffect, useState } from "react";
import { getUserProfile, type UserProfileResponse } from "@/lib/api/user";

// ponytail: module-level cache, shared by every mount; refetched in the background at most once per STALE_MS.
const cache = new Map<string, { data: UserProfileResponse; at: number }>();
const STALE_MS = 60_000;

/** Drop a cached profile (e.g. after editing it) so the next mount refetches. */
export const invalidateUserProfile = (id: string) => cache.delete(id);

/** Cached profile + rank for `id`: returns the last known value at once, refreshes when stale. */
export function useUserProfile(id: string | undefined, enabled = true): UserProfileResponse | null {
  const [profile, setProfile] = useState<UserProfileResponse | null>(() => (id ? cache.get(id)?.data ?? null : null));

  useEffect(() => {
    if (!id || !enabled) return;
    const hit = cache.get(id);
    if (hit && Date.now() - hit.at < STALE_MS) return;
    let alive = true;
    getUserProfile(id)
      .then((res) => {
        cache.set(id, { data: res, at: Date.now() });
        if (alive) setProfile(res);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [id, enabled]);

  if (!id) return null;
  return cache.get(id)?.data ?? (profile?.id === id ? profile : null);
}
