/** Graphics options that PixiJS reads once when a map starts. Pure helpers so bad saved values are safe. */

export const RENDER_SCALE_OPTIONS = [
  { label: "Auto", value: 0 },
  { label: "0.5x", value: 0.5 },
  { label: "0.75x", value: 0.75 },
  { label: "1x", value: 1 },
  { label: "1.5x", value: 1.5 },
  { label: "2x", value: 2 },
] as const;

export const FPS_LIMIT_OPTIONS = [
  { label: "Unlimited", value: 0 },
  { label: "60", value: 60 },
  { label: "120", value: 120 },
  { label: "144", value: 144 },
  { label: "240", value: 240 },
] as const;

const MIN_RESOLUTION = 0.5;
const MAX_RESOLUTION = 3;
/** Below this a cap makes the game unplayable; treat it as "no cap". */
const MIN_FPS_CAP = 30;

/** Renderer resolution for a `renderScale` setting. 0 / invalid = auto = the device pixel ratio. */
export function resolveResolution(renderScale: number, devicePixelRatio: number): number {
  const dpr = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1;
  if (!Number.isFinite(renderScale) || renderScale <= 0) return dpr;
  return Math.min(MAX_RESOLUTION, Math.max(MIN_RESOLUTION, renderScale));
}

/** PixiJS `ticker.maxFPS` for a `maxFps` setting. 0 = unlimited. */
export function resolveMaxFps(maxFps: number): number {
  if (!Number.isFinite(maxFps) || maxFps < MIN_FPS_CAP) return 0;
  return Math.floor(maxFps);
}
