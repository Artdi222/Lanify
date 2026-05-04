"use client";

interface GameSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (v: number) => void;
  className?: string;
}

export default function GameSlider({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = "",
  onChange,
  className = "",
}: GameSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div className={`flex flex-col gap-3 group ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-game-body text-white/70 group-hover:text-white transition-colors">
          {label}
        </span>
        <span className="text-xs font-game-mono text-cyan-300 tabular-nums font-bold bg-cyan-950/50 px-2 py-1 rounded-md border border-cyan-500/20 shadow-[inset_0_0_10px_rgba(0,229,255,0.05)]">
          {step < 1 ? value.toFixed(1) : value}{suffix}
        </span>
      </div>
      <div className="relative w-full h-5 flex items-center">
        {/* Track background */}
        <div className="absolute w-full h-1.5 bg-white/10 rounded-full overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
          {/* Filled part */}
          <div 
            className="absolute top-0 left-0 h-full bg-linear-to-r from-cyan-600 to-cyan-400"
            style={{ width: `${percentage}%` }}
          />
        </div>
        {/* Invisible input on top */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute w-full h-full opacity-0 cursor-pointer z-10"
        />
        {/* Custom thumb */}
        <div 
          className="absolute h-4 w-4 bg-white rounded-full shadow-[0_0_10px_rgba(0,229,255,0.8)] border-2 border-cyan-400 pointer-events-none transition-transform group-hover:scale-125"
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
      </div>
    </div>
  );
}
