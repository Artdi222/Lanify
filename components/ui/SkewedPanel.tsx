import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Panel miring ala strip menu lazer: bingkai di-skew, isi di-skew balik supaya tegak.
 * Kemiringan tetap -12deg (`--lf-skew`). Lihat docs/design-system.md.
 */

const VARIANTS = {
  default: "bg-[#1b1c26] hover:bg-lf-surface-hover/60",
  primary: "bg-lf-primary hover:bg-lf-primary-hover",
} as const;

type SkewedPanelProps = ComponentProps<"button"> & {
  variant?: keyof typeof VARIANTS;
  /** Kelas untuk isi yang sudah tegak kembali. */
  contentClassName?: string;
  children: ReactNode;
};

export function SkewedPanel({ variant = "default", className, contentClassName, children, ...props }: SkewedPanelProps) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "flex flex-col items-center justify-center shrink-0 -skew-x-12 border-y-2 border-r-2 border-lf-primary-hover shadow-lg transition-colors cursor-pointer group",
        VARIANTS[variant],
        className,
      )}
    >
      <div className={cn("flex flex-col items-center gap-2 skew-x-12", contentClassName)}>{children}</div>
    </button>
  );
}
