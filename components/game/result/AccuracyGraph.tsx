"use client";
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { AccuracyPoint } from "@/types/game";

interface AccuracyGraphProps {
  data: AccuracyPoint[];
}

export default function AccuracyGraph({ data }: AccuracyGraphProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Delay mounting the chart slightly to allow parent animations (framer-motion) 
    // and layout to stabilize, preventing Recharts from seeing 0 or -1 dimensions.
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  if (!isMounted || data.length === 0) return (
    <div className="w-full h-[160px] flex items-center justify-center bg-white/5 rounded-lg">
      <span className="text-[10px] font-game-mono text-white/20">Loading Graph...</span>
    </div>
  );

  const formatted = data.map((p) => ({ time: (p.time / 1000).toFixed(1), accuracy: parseFloat(p.accuracy.toFixed(2)) }));

  return (
    <div className="w-full h-[160px] relative overflow-hidden">
      <div className="absolute inset-0">
        <ResponsiveContainer width="100%" height="100%" debounce={100} minWidth={0} minHeight={0}>
          <LineChart data={formatted} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#a3a4bd" }} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#a3a4bd" }} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1b1c26", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "#a3a4bd" }}
              itemStyle={{ color: "#b9bde6" }}
            />
            <Line type="monotone" dataKey="accuracy" stroke="#b9bde6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
