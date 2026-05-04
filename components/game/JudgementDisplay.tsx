"use client";
import { useEffect, useState } from "react";
import { JUDGEMENT_COLORS } from "@/types/game";
import { useGameStore } from "@/lib/store/useGameStore";

export default function JudgementDisplay() {
  const latestJudgement = useGameStore((s) => s.latestJudgement);
  const combo = useGameStore((s) => s.combo);
  const [isBigger, setIsBigger] = useState(false);

  useEffect(() => {
    const checkSize = () => setIsBigger(window.innerHeight > 1000);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  return (
    <div 
      className="fixed z-30 pointer-events-none w-full flex flex-col items-center transition-all duration-500" 
      style={{ top: isBigger ? "14%" : "20%" }}
    >
      {/* Judgement Text */}
      <div className="h-12 flex items-center justify-center">
        {latestJudgement && (
          <div key={latestJudgement.time} className="animate-judgement text-center">
            <span
              className={`${isBigger ? "text-4xl" : "text-3xl"} font-game-display font-bold tracking-wider transition-all`}
              style={{ color: JUDGEMENT_COLORS[latestJudgement.type], textShadow: `0 0 20px ${JUDGEMENT_COLORS[latestJudgement.type]}60` }}
            >
              {latestJudgement.type}
            </span>
          </div>
        )}
      </div>

      {/* Combo below */}
      {combo > 0 && (
        <div className="mt-2 text-center">
          <span className={`${isBigger ? "text-5xl" : "text-4xl"} font-game-display font-bold text-white tabular-nums drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-all`}>
            {combo}x
          </span>
        </div>
      )}
    </div>
  );
}
