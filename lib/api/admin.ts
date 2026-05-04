import { apiClient } from "./client";

export interface AdminStats {
  totalUsers: number;
  totalBeatmaps: number;
  totalScores: number;
  dailyActive: number;
}

export async function getAdminStats(token: string): Promise<AdminStats> {
  return apiClient<AdminStats>('/admin/stats', { token });
}
