"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icons/Icon";

/**
 * Ikon jam di top bar. State waktu hanya hidup di komponen ini dan interval hanya jalan saat
 * kursor di atasnya, sehingga bar lain tidak ter-render ulang tiap detik.
 */
export default function TopBarClock() {
  const [hovered, setHovered] = useState(false);
  const [time, setTime] = useState("");

  useEffect(() => {
    if (!hovered) return;
    const tick = () => setTime(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [hovered]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        className="flex h-full w-12 items-center justify-center text-lf-text"
        style={{ "--lf-icon-accent": "var(--color-lf-accent)" } as React.CSSProperties}
      >
        <Icon name="clock" size={26} title="Clock" />
      </span>
      {hovered && (
        <span className="absolute right-0 top-full mt-1 rounded-lf-sm bg-lf-bg-raised px-2 py-1 text-lf-caption tabular-nums text-lf-text shadow-lf-panel">
          {time}
        </span>
      )}
    </div>
  );
}
