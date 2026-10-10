import { useEffect, useState } from "react";
import { getUserProfile, type UserProfileResponse } from "@/lib/api/user";

/** Fetches the profile + rank once per `id` while `enabled`; null until loaded or on error. */
export function useUserProfile(id: string | undefined, enabled = true): UserProfileResponse | null {
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);

  useEffect(() => {
    if (!id || !enabled) return;
    let alive = true;
    getUserProfile(id)
      .then((res) => alive && setProfile(res))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [id, enabled]);

  return profile;
}
