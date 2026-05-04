"use client";

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MoreHorizontal, 
  Eye, 
  Trash2, 
  Music, 
  Clock, 
  Zap, 
  Layers 
} from "lucide-react";
import type { Beatmap } from "@/types/beatmap";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

interface BeatmapSet {
  filePath: string;
  title: string;
  artist: string;
  creator: string;
  coverUrl: string | null;
  createdAt: string;
  difficulties: Beatmap[];
}

interface BeatmapTableProps {
  beatmaps: Beatmap[];
  isLoading: boolean;
  onDelete: (id: string) => void;
}

export default function BeatmapTable({
  beatmaps,
  isLoading,
  onDelete,
}: BeatmapTableProps) {
  const groupedBeatmaps = useMemo(() => {
    const groups: Record<string, BeatmapSet> = {};
    
    beatmaps.forEach(b => {
      if (!groups[b.filePath]) {
        groups[b.filePath] = {
          filePath: b.filePath,
          title: b.title,
          artist: b.artist,
          creator: b.creator,
          coverUrl: b.coverUrl,
          createdAt: b.createdAt,
          difficulties: [],
        };
      }
      groups[b.filePath].difficulties.push(b);
    });
    
    // Sort difficulties within each group by star rating
    Object.values(groups).forEach(group => {
      group.difficulties.sort((a, b) => a.starRating - b.starRating);
    });

    return Object.values(groups).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [beatmaps]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card/30 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Cover</TableHead>
              <TableHead>Beatmap</TableHead>
              <TableHead>Key Count</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Stars</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-12 w-12 rounded-md" /></TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-3 w-[100px]" />
                  </div>
                </TableCell>
                <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-10" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell className="text-right"><Skeleton className="ml-auto h-8 w-8 rounded-full" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (beatmaps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-20 text-center bg-card/10">
        <div className="rounded-full bg-secondary p-4 mb-4">
          <Music className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">No beatmaps found</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Start by uploading your first .osz file to the database.
        </p>
        <Link href="/admin/beatmaps/upload">
          <Button variant="outline" className="mt-6">
            Upload New Beatmap
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card/30 overflow-hidden backdrop-blur-sm">
      <Table>
        <TableHeader className="bg-secondary/50">
          <TableRow>
            <TableHead className="w-[80px]">Cover</TableHead>
            <TableHead>Set Info</TableHead>
            <TableHead>
              <div className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" /> Difficulties
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-accent" /> Stars
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Created
              </div>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groupedBeatmaps.map((set) => {
            const minStars = Math.min(...set.difficulties.map(d => d.starRating));
            const maxStars = Math.max(...set.difficulties.map(d => d.starRating));
            const keys = Array.from(new Set(set.difficulties.map(d => d.keyCount))).sort((a, b) => a - b);
            
            return (
              <TableRow key={set.filePath} className="group hover:bg-primary/5 transition-colors">
                <TableCell>
                  <div className="relative h-12 w-12 overflow-hidden rounded-md border border-border bg-secondary shadow-sm">
                    {set.coverUrl ? (
                      <Image
                        src={set.coverUrl}
                        alt={set.title}
                        fill
                        unoptimized={true}
                        className="object-cover transition-transform group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Music className="h-5 w-5 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground truncate max-w-[200px]">
                      {set.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {set.artist} • <span className="opacity-70">by {set.creator}</span> • <span className="text-primary/70 font-mono font-bold">{keys.join("/")}K</span>
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-[300px]">
                    {set.difficulties.map(diff => (
                      <Link key={diff.id} href={`/admin/beatmaps/${diff.id}`}>
                        <Badge 
                          variant="secondary" 
                          className="text-[10px] py-0 px-1.5 h-5 bg-primary/10 hover:bg-primary/20 border-primary/20 text-primary transition-colors cursor-pointer"
                        >
                          {diff.keyCount}K {diff.difficultyName}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-mono font-bold text-accent glow-amber">
                    {minStars === maxStars 
                      ? minStars.toFixed(2) 
                      : `${minStars.toFixed(2)} - ${maxStars.toFixed(2)}`}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(set.createdAt), { addSuffix: true })}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        Manage Difficulties
                      </div>
                      {set.difficulties.map(diff => (
                        <DropdownMenuItem key={diff.id} asChild>
                          <div className="flex items-center justify-between group/item">
                            <Link href={`/admin/beatmaps/${diff.id}`} className="flex items-center gap-2 flex-1 cursor-pointer">
                              <Eye className="h-3 w-3" />
                              <span className="truncate max-w-[120px]">{diff.difficultyName}</span>
                            </Link>
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onDelete(diff.id);
                              }}
                              className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
