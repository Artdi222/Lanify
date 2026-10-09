/**
 * Aturan kapan animasi dekoratif tak berujung (kelas `.lf-ambient`, framer-motion `repeat: Infinity`)
 * harus berhenti. Dipakai oleh `AmbientMotionController` yang memasang `data-lf-motion` di <html>.
 */

export type ReduceMotionSetting = "system" | "on" | "off";

export const REDUCE_MOTION_OPTIONS = [
  { label: "System", value: "system" },
  { label: "On", value: "on" },
  { label: "Off", value: "off" },
] as const satisfies readonly { label: string; value: ReduceMotionSetting }[];

export function shouldReduceMotion(setting: ReduceMotionSetting | undefined, prefersReduced: boolean): boolean {
  if (setting === "on") return true;
  if (setting === "off") return false;
  return prefersReduced;
}

export function shouldPauseAmbient(state: { hidden: boolean; playing: boolean; reduceMotion: boolean }): boolean {
  return state.hidden || state.playing || state.reduceMotion;
}
