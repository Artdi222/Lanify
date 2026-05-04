"use client";

interface ProgressBarProps {
  progress: number; // 0-100
}

export default function ProgressBar({ progress }: ProgressBarProps) {
  // To create a pie chart effect with stroke, strokeWidth = radius, and circle radius = radius / 2
  const outerRadius = 12;
  const normalizedRadius = outerRadius / 2;
  const strokeWidth = outerRadius;
  const circumference = normalizedRadius * 2 * Math.PI;
  // Progress is drawn by reducing the dash offset
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg className="transform -rotate-90" width={outerRadius * 2} height={outerRadius * 2} viewBox={`0 0 ${outerRadius * 2} ${outerRadius * 2}`}>
        {/* Background full circle */}
        <circle
          cx={outerRadius}
          cy={outerRadius}
          r={outerRadius}
          fill="rgba(255,255,255,0.15)"
        />
        {/* Foreground pie slice filling up */}
        <circle
          cx={outerRadius}
          cy={outerRadius}
          r={normalizedRadius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="text-lanify-accent transition-all duration-100 ease-linear"
        />
      </svg>
    </div>
  );
}
