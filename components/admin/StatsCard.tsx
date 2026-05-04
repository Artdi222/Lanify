"use client";

import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export default function StatsCard({
  label,
  value,
  icon: Icon,
  description,
  trend,
  className,
}: StatsCardProps) {
  return (
    <Card className={cn("overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/50", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold tracking-tight glow-blue">{value}</h3>
              {trend && (
                <span className={cn(
                  "text-xs font-semibold",
                  trend.isPositive ? "text-emerald-500" : "text-destructive"
                )}>
                  {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground opacity-70">{description}</p>
            )}
          </div>
          
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/80 ring-1 ring-border">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
      
      {/* Decorative gradient blur */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 blur-3xl" />
    </Card>
  );
}
