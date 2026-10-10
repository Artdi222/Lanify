import { apiClient } from "./client";
import type { User } from "@/types/user";

export interface UserStats {
  playCount: number;
  avgAccuracy: number;
}

export interface UserProfileResponse extends User {
  globalRank: number;
  countryRank: number | null;
  stats: UserStats;
}

/** Fetch user profile and stats by user ID */
export async function getUserProfile(id: string): Promise<UserProfileResponse> {
  return apiClient<UserProfileResponse>(`/users/${id}`);
}

/** Update current user's profile (username and/or avatarUrl) */
export async function updateProfile(
  token: string,
  payload: { username?: string; avatarUrl?: string; bannerUrl?: string; country?: string }
): Promise<User> {
  return apiClient<User>("/users/me", {
    method: "PUT",
    body: payload,
    token,
  });
}
