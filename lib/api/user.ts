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

export interface RankingEntry {
  id: string;
  rank: number;
  username: string;
  avatarUrl: string | null;
  country: string | null;
  totalPp: number;
  accuracy: number;
  playCount: number;
  ss: number;
  s: number;
  a: number;
}

export interface CountryRankingEntry {
  rank: number;
  country: string;
  activeUsers: number;
  playCount: number;
  performance: number;
  avgPerformance: number;
}

export function getRankings(page = 1, country?: string) {
  return apiClient<{ page: number; pageCount: number; entries: RankingEntry[] }>(`/users/rankings?page=${page}${country ? `&country=${country}` : ""}`);
}

export function getCountryRankings() {
  return apiClient<CountryRankingEntry[]>("/users/rankings/countries");
}
