import { useEffect, useState } from "react";
import { getUserProfile, type UserProfileResponse } from "@/lib/api/user";

// ponytail: module-level cache shared by every mount, mirrored to sessionStorage so a page reload
// still shows the last profile at once; refetched in the background at most once per STALE_MS.
type Entry = { data: UserProfileResponse; at: number };
const STORE_KEY = "lanify-profiles";
const STALE_MS = 60_000;
const cache = new Map<string, Entry>(readStored());

function readStored(): [string, Entry][] {
  try {
    return Object.entries(JSON.parse(sessionStorage.getItem(STORE_KEY) ?? "{}"));
  } catch {
    return [];
  }
}

function persist() {
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(Object.fromEntries(cache)));
  } catch {}
}

/** Drop a cached profile (e.g. after editing it) so the next mount refetches. */
export const invalidateUserProfile = (id: string) => {
  cache.delete(id);
  persist();
};

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
        persist();
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
