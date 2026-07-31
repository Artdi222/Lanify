"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Music, 
  Users, 
  Trophy, 
  TrendingUp, 
  Plus,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/admin/StatsCard";
import BeatmapTable from "@/components/admin/BeatmapTable";
import { listBeatmaps, deleteBeatmap } from "@/lib/api/beatmaps";
import { getAdminStats } from "@/lib/api/admin";
import { useAuthStore } from "@/lib/store/useAuthStore";
import type { Beatmap } from "@/types/beatmap";
import { toast } from "sonner";
import Link from "next/link";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";

export default function DashboardPage() {
  const [beatmaps, setBeatmaps] = useState<Beatmap[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBeatmaps: 0,
    totalScores: 0,
    dailyActive: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { token } = useAuthStore();

  const fetchData = useCallback(async () => {
    try {
      const [beatmapsRes, statsRes] = await Promise.all([
        listBeatmaps(1, 10, token),
        getAdminStats(token!)
      ]);
      setBeatmaps(beatmapsRes.data);
      setStats(statsRes);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchData();
    }
  }, [fetchData, token]);

  const handleDelete = async () => {
    if (!deleteId || !token) return;
    setIsDeleting(true);
    try {
      await deleteBeatmap(deleteId, token);
      toast.success("Beatmap deleted successfully");
      setBeatmaps(prev => prev.filter(b => b.id !== deleteId));
      setDeleteId(null);
      // Refresh stats
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete beatmap");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading glow-blue">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">System status and recent activity summary.</p>
        </div>
        <Link href="/admin/beatmaps/upload">
          <Button className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" /> Upload New Beatmap
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          label="Total Beatmaps" 
          value={stats.totalBeatmaps.toLocaleString()} 
          icon={Music} 
          description="Total maps in repository"
        />
        <StatsCard 
          label="Total Users" 
          value={stats.totalUsers.toLocaleString()} 
          icon={Users} 
          description="Registered players"
        />
        <StatsCard 
          label="Scores Submitted" 
          value={stats.totalScores > 1000 ? `${(stats.totalScores / 1000).toFixed(1)}K` : stats.totalScores.toString()} 
          icon={Trophy} 
          description="All-time mania plays"
        />
        <StatsCard 
          label="Daily Active" 
          value={stats.dailyActive.toLocaleString()} 
          icon={TrendingUp} 
          description="Users active today"
        />
      </div>

      {/* Recent Activity Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-heading">Recent Uploads</h2>
          <Link href="/admin/beatmaps" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
            View all beatmaps <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        
        <BeatmapTable 
          beatmaps={beatmaps} 
          isLoading={isLoading} 
          onDelete={(id) => setDeleteId(id)}
        />
      </div>

      <DeleteConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title={beatmaps.find(b => b.id === deleteId)?.title ?? "this beatmap"}
      />
    </div>
  );
}
