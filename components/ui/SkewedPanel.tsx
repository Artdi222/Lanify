import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Panel miring ala strip menu lazer: bingkai di-skew, isi di-skew balik supaya tegak.
 * Kemiringan tetap -12deg (`--lf-skew`). Lihat docs/design-system.md.
 */

const VARIANTS = {
  default: "bg-[#0a1424] hover:bg-blue-900/60",
  primary: "bg-blue-600 hover:bg-blue-500",
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
        "flex flex-col items-center justify-center shrink-0 -skew-x-12 border-y-2 border-r-2 border-blue-500 shadow-lg transition-colors cursor-pointer group",
        VARIANTS[variant],
        className,
      )}
    >
      <div className={cn("flex flex-col items-center gap-2 skew-x-12", contentClassName)}>{children}</div>
    </button>
  );
}
