import type { RankGrade } from "@/types/game";
import { GRADE_COLORS } from "@/lib/select/format";

// Grade bands on the 0..1 accuracy circle (same thresholds as calculateRank); pills sit at each band's middle.
const BANDS: { grade: RankGrade; from: number; to: number }[] = [
  { grade: "D", from: 0, to: 0.7 },
  { grade: "C", from: 0.7, to: 0.8 },
  { grade: "B", from: 0.8, to: 0.9 },
  { grade: "A", from: 0.9, to: 0.95 },
  { grade: "S", from: 0.95, to: 1 },
];

const SIZE = 300;
const C = SIZE / 2;
const R_OUT = 122; // thick accuracy arc
const R_IN = 100; // thin band ring
const LEN = (r: number) => 2 * Math.PI * r;

/** Accuracy ring with the grade in the middle. Spec: docs/ui-spec/score.md. */
export default function GradeRing({ accuracy, rank }: { accuracy: number; rank: RankGrade }) {
  const acc = Math.min(1, Math.max(0, accuracy / 100));
  const color = GRADE_COLORS[rank] ?? "#8c9296";

  return (
    <div className="relative mx-auto" style={{ width: SIZE, height: SIZE }}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full -rotate-90">
        <circle cx={C} cy={C} r={R_OUT} fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth={26} />
        <circle cx={C} cy={C} r={R_OUT} fill="none" stroke={color} strokeWidth={26} strokeDasharray={`${LEN(R_OUT) * acc} ${LEN(R_OUT)}`} />
        {BANDS.map((b) => (
          <circle
            key={b.grade}
            cx={C}
            cy={C}
            r={R_IN}
            fill="none"
            stroke={GRADE_COLORS[b.grade]}
            strokeOpacity={0.85}
            strokeWidth={5}
            strokeDasharray={`${LEN(R_IN) * (b.to - b.from) - 3} ${LEN(R_IN)}`}
            strokeDashoffset={-LEN(R_IN) * b.from}
          />
        ))}
      </svg>
      {BANDS.map((b) => {
        const a = 2 * Math.PI * ((b.from + b.to) / 2) - Math.PI / 2;
        const r = R_OUT + 26;
        return (
          <span
            key={b.grade}
            className="absolute flex h-[18px] w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-game-display text-[11px] font-bold text-black/80"
            style={{ left: C + r * Math.cos(a), top: C + r * Math.sin(a), backgroundColor: GRADE_COLORS[b.grade] }}
          >
            {b.grade}
          </span>
        );
      })}
      <span className="absolute inset-0 flex items-center justify-center font-game-display text-[110px] font-bold leading-none text-white" style={{ textShadow: `0 0 24px ${color}` }}>
        {rank}
      </span>
    </div>
  );
}
