/* eslint-disable @next/next/no-img-element */
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type LogoButtonProps = ComponentProps<"button"> & {
  /** Gambar logo buatan user. Tanpa ini, dipakai placeholder teks "Lanify". */
  src?: string;
  /** Berdenyut pelan (musik sedang diputar). */
  pulsing?: boolean;
  /** Kelas tambahan untuk lingkaran (mis. ukuran lain). */
  circleClassName?: string;
};

/** Logo menu: lingkaran dengan cincin putih. Placeholder sampai aset mascot/logo ada (docs/mascot-brief.md). */
export function LogoButton({ src, pulsing, circleClassName, className, ...props }: LogoButtonProps) {
  return (
    <button type="button" aria-label="Lanify" {...props} className={cn("group relative cursor-pointer focus:outline-hidden", className)}>
      <div
        className={cn(
          "relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-[6px] border-white bg-linear-to-br from-lf-primary-hover to-lf-primary text-3xl sm:text-5xl shadow-lf-glow transition-transform duration-200 ease-lf-out group-hover:scale-105 group-active:scale-95 sm:h-64 sm:w-64",
          pulsing && "animate-breathe",
          circleClassName,
        )}
      >
        {src ? (
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="font-game-display font-bold tracking-wide text-white">Lanify</span>
        )}
      </div>
    </button>
  );
}
