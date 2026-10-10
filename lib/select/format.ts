import type { RankGrade } from "@/types/game";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** Waktu relatif ringkas ala lazer di kartu skor: "now", "5m", "3h", "2d", "6mos", "1yr". */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const diff = Math.max(0, now - t);
  if (diff < MIN) return "now";
  if (diff < HOUR) return `${Math.floor(diff / MIN)}m`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h`;
  if (diff < 30 * DAY) return `${Math.floor(diff / DAY)}d`;
  if (diff < 365 * DAY) return `${Math.floor(diff / (30 * DAY))}mos`;
  return `${Math.floor(diff / (365 * DAY))}yr`;
}

/** Waktu relatif panjang untuk daftar skor profil: "just now", "5 minutes ago", "2 months ago", "1 year ago". */
export function relativeTimeLong(iso: string, now: number = Date.now()): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const diff = Math.max(0, now - t);
  if (diff < MIN) return "just now";
  const [n, unit] =
    diff < HOUR ? [Math.floor(diff / MIN), "minute"]
    : diff < DAY ? [Math.floor(diff / HOUR), "hour"]
    : diff < 30 * DAY ? [Math.floor(diff / DAY), "day"]
    : diff < 365 * DAY ? [Math.floor(diff / (30 * DAY)), "month"]
    : [Math.floor(diff / (365 * DAY)), "year"];
  return `${n} ${unit}${n === 1 ? "" : "s"} ago`;
}

/** Warna tile grade, diukur dari piksel bersih di foto (S #02b5c3, A #88da20; B/C/D dari chip di foto skor); SS tidak ada di foto (`?`, emas). */
export const GRADE_COLORS: Record<RankGrade, string> = {
  SS: "#f2d24b",
  S: "#02b5c3",
  A: "#88da20",
  B: "#e3b130",
  C: "#ea8356",
  D: "#ff5a5a",
};

/** Rank ringkas untuk tile Personal Best: 2915 -> "#2.9k", 12 -> "#12". */
export function shortRank(rank: number): string {
  return rank >= 1000 ? `#${(rank / 1000).toFixed(1)}k` : `#${rank}`;
}
