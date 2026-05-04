"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Plus, 
  Search,
  ChevronLeft, 
  ChevronRight,
  Music2,
  RefreshCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BeatmapTable from "@/components/admin/BeatmapTable";
import { listBeatmaps, deleteBeatmap } from "@/lib/api/beatmaps";
import { useAdminStore } from "@/lib/store/useAdminStore";
import type { Beatmap } from "@/types/beatmap";
import { toast } from "sonner";
import Link from "next/link";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";
import { cn } from "@/lib/utils";

const LIMIT = 10;

export default function BeatmapsListPage() {
  const [beatmaps, setBeatmaps] = useState<Beatmap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const { token } = useAdminStore();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchBeatmaps = useCallback(async (p: number, s: string) => {
    setIsLoading(true);
    try {
      const response = await listBeatmaps(p, LIMIT, token, s);
      setBeatmaps(response.data);
      setTotal(response.total);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch beatmaps");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBeatmaps(page, debouncedSearch);
  }, [page, debouncedSearch, fetchBeatmaps]);

  const handleDelete = async () => {
    if (!deleteId || !token) return;
    setIsDeleting(true);
    try {
      await deleteBeatmap(deleteId, token);
      toast.success("Beatmap deleted successfully");
      fetchBeatmaps(page, debouncedSearch); // Refresh current page
      setDeleteId(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete beatmap");
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading glow-blue flex items-center gap-3">
            <Music2 className="h-8 w-8 text-primary" />
            Beatmap Repository
          </h1>
          <p className="text-muted-foreground mt-1">Manage and audit all mania beatmaps in the system.</p>
        </div>
        <Link href="/admin/beatmaps/upload">
          <Button className="w-full md:w-auto gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" /> Upload New Beatmap
          </Button>
        </Link>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by title, artist, or creator..." 
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // Reset to first page on search
            }}
            className="pl-10 bg-card/50 border-border/50 focus:border-primary/50"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => fetchBeatmaps(page, debouncedSearch)}>
            <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="space-y-4">
        <BeatmapTable 
          beatmaps={beatmaps} 
          isLoading={isLoading} 
          onDelete={(id) => setDeleteId(id)}
        />

        {/* Pagination */}
        {total > LIMIT && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-bold text-foreground">{(page - 1) * LIMIT + 1}</span> to{" "}
              <span className="font-bold text-foreground">
                {Math.min(page * LIMIT, total)}
              </span>{" "}
              of <span className="font-bold text-foreground">{total}</span> results
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || isLoading}
                className="gap-1"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
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
