"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Music2, 
  User, 
  Clock, 
  Activity, 
  Zap, 
  Layers,
  FileText
} from "lucide-react";
import type { DifficultyInfo } from "@/types/beatmap";
import { cn } from "@/lib/utils";

interface BeatmapPreviewProps {
  info: DifficultyInfo;
  className?: string;
}

export default function BeatmapPreview({ info, className }: BeatmapPreviewProps) {
  const formatLength = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className={cn("overflow-hidden border-border/50 bg-secondary/20 shadow-xl shadow-black/50", className)}>
      <CardHeader className="bg-secondary/40 px-6 py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-bold glow-blue">
            <Music2 className="h-5 w-5 text-primary" />
            Beatmap Preview
          </CardTitle>
          <Badge variant="outline" className="font-mono bg-background/50">
            {info.mode === 3 ? "osu!mania" : "Other Mode"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Metadata Section */}
          <div className="p-6 space-y-4 border-r border-border/50">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Title</span>
              <p className="font-heading text-lg font-bold leading-none">{info.title}</p>
              {info.titleUnicode !== info.title && (
                <p className="text-sm text-muted-foreground">{info.titleUnicode}</p>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Artist</span>
              <p className="text-base font-medium flex items-center gap-2">
                <Music2 className="h-3.5 w-3.5 text-muted-foreground" />
                {info.artist}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Creator</span>
              <p className="text-base font-medium flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                {info.creator}
              </p>
            </div>

            <div className="pt-2">
              <div className="flex items-center gap-2 rounded-lg bg-card/50 p-3 ring-1 ring-border/50">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-mono text-muted-foreground truncate" title={info.filename}>
                  {info.filename}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="p-6 space-y-6 bg-card/20">
            <div className="grid grid-cols-2 gap-4">
              <StatItem 
                icon={Layers} 
                label="Keys" 
                value={`${info.keyCount}K`} 
                highlight 
              />
              <StatItem 
                icon={Activity} 
                label="BPM" 
                value={info.bpm} 
              />
              <StatItem 
                icon={Clock} 
                label="Length" 
                value={formatLength(info.lengthSeconds)} 
              />
              <StatItem 
                icon={Zap} 
                label="Difficulty" 
                value={info.version} 
              />
            </div>

            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Difficulty Settings</span>
              <div className="space-y-2">
                <ProgressBar label="OD" value={info.od} max={10} color="bg-primary" />
                <ProgressBar label="HP" value={info.hp} max={10} color="bg-accent" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatItem({ 
  icon: Icon, 
  label, 
  value, 
  highlight 
}: { 
  icon: React.ComponentType<{ className?: string }>, 
  label: string, 
  value: string | number,
  highlight?: boolean
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className={cn(
        "text-xl font-bold font-mono",
        highlight ? "text-primary glow-blue" : "text-foreground"
      )}>
        {value}
      </p>
    </div>
  );
}

function ProgressBar({ 
  label, 
  value, 
  max, 
  color 
}: { 
  label: string, 
  value: number, 
  max: number,
  color: string 
}) {
  const percentage = (value / max) * 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-mono font-bold">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all duration-500", color)} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
