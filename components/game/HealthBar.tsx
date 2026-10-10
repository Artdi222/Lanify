import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/store/useGameStore";

export default function HealthBar() {
  const hp = useGameStore((s) => s.hp);
  const currentBeatmap = useGameStore((s) => s.currentBeatmap);
  const [isBigger, setIsBigger] = useState(false);

  useEffect(() => {
    const checkSize = () => setIsBigger(window.innerHeight > 1000);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  const color = hp > 50 ? "#b9bde6" : hp > 25 ? "#e6cf94" : "#e07a86";
  
  const keyCount = currentBeatmap?.keyCount || 4;
  const sizeScale = isBigger ? 1.2 : 1.0;
  const colWidth = (keyCount === 4 ? 128 : 92) * sizeScale;
  const gap = 18 * sizeScale;
  const laneWidth = colWidth * keyCount + gap * (keyCount - 1);
  const laneRightOffset = laneWidth / 2;
  const leftPos = `calc(50vw + ${laneRightOffset + (24 * sizeScale)}px)`;

  return (
    <div 
      className="fixed top-1/4 bottom-1/4 z-30 pointer-events-none w-1.5 transition-all duration-300"
      style={{ left: leftPos }}
    >
      <div className="relative w-full h-full rounded-full bg-white/5 overflow-hidden">
        <div
          className="absolute bottom-0 w-full rounded-full transition-all duration-150"
          style={{ height: `${hp}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}60` }}
        />
      </div>
    </div>
  );
}
