import type { ParsedNote } from "@/types/game";

/**
 * Fresh copy of a chart for one play (the engine mutates note flags as it goes).
 * A parsed note is a flat record of primitives, so a shallow copy is a full copy; this replaces
 * `JSON.parse(JSON.stringify(notes))`, which re-serialised thousands of notes on every start and retry.
 */
export function cloneNotes(notes: ParsedNote[]): ParsedNote[] {
  return notes.map((n) => ({ ...n }));
}

/**
 * Numeric key for "a hold ends at `time` in `column`". Used to hide a tap that sits exactly on a hold's tail.
 * Replaces a per-note, per-frame template string key (garbage every frame). Columns are < 16.
 */
export function holdEndKey(column: number, time: number): number {
  return time * 16 + column;
}

/**
 * First index worth rendering. Notes are sorted by start time, so everything before the returned index is
 * entirely behind `visibleStart` (a hold counts as behind only once its tail is). `from` is the previous
 * result, so each frame only advances a few notes instead of rescanning the whole chart.
 */
export function advanceFirstVisible(notes: ParsedNote[], from: number, visibleStart: number): number {
  let i = from;
  while (i < notes.length) {
    const n = notes[i];
    const past = n.isHoldNote ? n.endTime < visibleStart : n.startTime < visibleStart;
    if (!past) break;
    i++;
  }
  return i;
}
