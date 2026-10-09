"use client";

import { useEffect, useRef } from "react";

/** PRNG deterministik supaya SSR dan klien menghasilkan segitiga yang sama. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
}

type Tri = { points: string; filled: boolean };

function makeTriangles(seed: number, count: number, filledRatio: number): Tri[] {
  const r = rng(seed);
  return Array.from({ length: count }, () => {
    const cx = r() * 1920;
    const cy = r() * 1080;
    const size = 60 + r() * 220;
    const h = size * 0.87;
    return {
      points: `${cx},${cy - h / 2} ${cx - size / 2},${cy + h / 2} ${cx + size / 2},${cy + h / 2}`,
      filled: r() < filledRatio,
    };
  });
}

const BACK = makeTriangles(7, 14, 1);
const FRONT = makeTriangles(21, 16, 0);

/** Parallax maksimum (px) per lapis. */
const SHIFT = { back: 10, front: 22 };

/** Background menu buatan sendiri: segitiga statis 2 lapis, parallax ringan mengikuti pointer. */
export default function MenuBackground() {
  const back = useRef<SVGSVGElement>(null);
  const front = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      if (back.current) back.current.style.transform = `translate(${-x * SHIFT.back}px, ${-y * SHIFT.back}px) scale(1.04)`;
      if (front.current) front.current.style.transform = `translate(${-x * SHIFT.front}px, ${-y * SHIFT.front}px) scale(1.04)`;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const layer = "absolute inset-0 h-full w-full transition-transform duration-300 ease-out will-change-transform";

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden bg-linear-to-br from-[#0b2a5c] via-[#0a1d42] to-[#060b14]">
      <svg ref={back} className={layer} viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        {BACK.map((t, i) => (
          <polygon key={i} points={t.points} fill="#040a18" fillOpacity={0.35} />
        ))}
      </svg>
      <svg ref={front} className={layer} viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        {FRONT.map((t, i) => (
          <polygon key={i} points={t.points} fill="none" stroke="#00e5ff" strokeOpacity={0.28} strokeWidth={2} />
        ))}
      </svg>
    </div>
  );
}
