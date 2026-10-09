/**
 * Audio offset calibration: the player taps along to a metronome, and the average distance between
 * their taps and the beeps *as heard* becomes the Audio Offset.
 *
 * Sign convention (same as `globalOffset`, see AudioEngine): game time = audible song time + offset.
 * A player who taps `d` ms late judges `d` ms late, so the fix is offset = -d.
 *
 * Beeps and taps are compared on the audio clock, mapped with `getOutputTimestamp()` exactly like
 * the game clock (AudioClock.ts), so output latency is already accounted for. What remains is the
 * player's own input/perception delay, which is what the offset is for.
 */
import { resolveEventTime } from "./AudioClock";

export interface CalibrationConfig {
  /** Time between beeps. */
  intervalMs: number;
  /** Leading beeps shown but not measured (the player is still locking on). */
  warmup: number;
  /** Beeps that count. */
  measured: number;
  /** Delay before the first beep so scheduling never races the audio thread. */
  leadMs: number;
}

export const DEFAULT_CALIBRATION: CalibrationConfig = {
  intervalMs: 600,
  warmup: 4,
  measured: 16,
  leadMs: 1200,
};

/** Matches the Audio Offset slider range. */
export const OFFSET_LIMIT = 200;
/** Fewer usable taps than this and the answer is not trustworthy. */
export const MIN_TAPS = 8;

export type CalibrationResult =
  | {
      ok: true;
      /** Value for `globalOffset`, clamped to +-OFFSET_LIMIT. */
      offsetMs: number;
      /** Average tap error (positive = late). */
      meanErrorMs: number;
      medianErrorMs: number;
      /** Spread of the kept taps; large = inconsistent tapping. */
      stdMs: number;
      used: number;
      rejected: number;
    }
  | { ok: false; reason: "not-enough-taps"; used: number };

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Turn per-tap errors (ms, positive = late) into an offset. Stray taps are rejected via MAD. */
export function analyzeErrors(errors: number[], minTaps = MIN_TAPS): CalibrationResult {
  if (errors.length < minTaps) return { ok: false, reason: "not-enough-taps", used: errors.length };

  const med = median(errors);
  const mad = median(errors.map((e) => Math.abs(e - med)));
  const limit = Math.max(25, 3 * 1.4826 * mad);
  const kept = errors.filter((e) => Math.abs(e - med) <= limit);
  if (kept.length < minTaps) return { ok: false, reason: "not-enough-taps", used: kept.length };

  const mean = kept.reduce((a, b) => a + b, 0) / kept.length;
  const variance = kept.reduce((a, b) => a + (b - mean) ** 2, 0) / kept.length;
  const rounded = Math.round(-mean) + 0; // + 0 turns -0 into 0

  return {
    ok: true,
    offsetMs: Math.max(-OFFSET_LIMIT, Math.min(OFFSET_LIMIT, rounded)),
    meanErrorMs: mean,
    medianErrorMs: median(kept),
    stdMs: Math.sqrt(variance),
    used: kept.length,
    rejected: errors.length - kept.length,
  };
}

/** The slice of Web Audio the calibrator needs; a real `AudioContext` satisfies it. */
export interface CalibrationAudioContext {
  readonly currentTime: number;
  readonly destination: unknown;
  readonly outputLatency?: number;
  readonly baseLatency?: number;
  getOutputTimestamp?: () => { contextTime?: number; performanceTime?: number };
  createOscillator(): {
    frequency: { value: number };
    connect(node: unknown): unknown;
    start(when: number): void;
    stop(when: number): void;
  };
  createGain(): {
    gain: {
      setValueAtTime(value: number, time: number): unknown;
      linearRampToValueAtTime(value: number, time: number): unknown;
    };
    connect(node: unknown): unknown;
  };
  resume?(): Promise<void>;
  close?(): Promise<void>;
}

export interface TapFeedback {
  /** Which beep this tap was matched to (0-based). */
  index: number;
  /** Positive = late, negative = early. */
  errorMs: number;
  /** False for warm-up beeps. */
  counted: boolean;
}

export type CalibrationPhase = "idle" | "counting-in" | "running" | "finished";

export interface CalibrationStatus {
  phase: CalibrationPhase;
  /** Index of the latest beep that has started, -1 before the first. */
  beat: number;
  total: number;
  /** Leading beeps that are shown but not measured. */
  warmup: number;
  /** Beeps that count (total - warmup). */
  measured: number;
  /** Measured (non warm-up) taps recorded so far. */
  tapsCounted: number;
}

export class OffsetCalibrator {
  private ctx: CalibrationAudioContext | null = null;
  private firstClick = 0;
  /** beep index -> error ms; the closest tap to each beep wins. */
  private errors = new Map<number, number>();

  constructor(
    private readonly createContext: () => CalibrationAudioContext,
    private readonly config: CalibrationConfig = DEFAULT_CALIBRATION,
  ) {}

  private get total(): number {
    return this.config.warmup + this.config.measured;
  }

  /** Must be called from a user gesture (autoplay policy). */
  async start(): Promise<void> {
    this.cancel();
    const ctx = this.createContext();
    this.ctx = ctx;
    this.errors.clear();
    await ctx.resume?.();

    this.firstClick = ctx.currentTime + this.config.leadMs / 1000;
    for (let i = 0; i < this.total; i++) {
      this.scheduleBeep(ctx, this.firstClick + (i * this.config.intervalMs) / 1000, i % 4 === 0);
    }
  }

  private scheduleBeep(ctx: CalibrationAudioContext, when: number, accent: boolean): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = accent ? 1500 : 1000;
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(0.6, when + 0.002);
    gain.gain.linearRampToValueAtTime(0, when + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(when);
    osc.stop(when + 0.06);
  }

  /** Audio-clock time at which the sample that is audible at `perfMs` was rendered. */
  private audibleCtxTimeAt(ctx: CalibrationAudioContext, perfMs: number, nowMs: number): number {
    const ts = ctx.getOutputTimestamp?.();
    if (ts && ts.contextTime && ts.performanceTime) {
      return ts.contextTime + (perfMs - ts.performanceTime) / 1000;
    }
    const latency = ctx.outputLatency || ctx.baseLatency || 0;
    return ctx.currentTime - latency + (perfMs - nowMs) / 1000;
  }

  /**
   * Record a tap. `eventTimeStamp` is `KeyboardEvent.timeStamp` / `PointerEvent.timeStamp`.
   * Returns null when the tap is outside the beep train.
   */
  tap(eventTimeStamp: number, nowMs: number = performance.now()): TapFeedback | null {
    const ctx = this.ctx;
    if (!ctx) return null;

    const tapPerf = resolveEventTime(eventTimeStamp, nowMs);
    const tapCtx = this.audibleCtxTimeAt(ctx, tapPerf, nowMs);

    const interval = this.config.intervalMs;
    const index = Math.round(((tapCtx - this.firstClick) * 1000) / interval);
    if (index < 0 || index >= this.total) return null;

    const errorMs = (tapCtx - (this.firstClick + (index * interval) / 1000)) * 1000;
    const existing = this.errors.get(index);
    if (existing === undefined || Math.abs(errorMs) < Math.abs(existing)) this.errors.set(index, errorMs);

    return { index, errorMs, counted: index >= this.config.warmup };
  }

  result(): CalibrationResult {
    const measured: number[] = [];
    for (const [index, error] of this.errors) if (index >= this.config.warmup) measured.push(error);
    return analyzeErrors(measured);
  }

  status(): CalibrationStatus {
    const ctx = this.ctx;
    const total = this.total;
    const { warmup, measured } = this.config;
    if (!ctx) return { phase: "idle", beat: -1, total, warmup, measured, tapsCounted: 0 };

    const elapsedMs = (ctx.currentTime - this.firstClick) * 1000;
    const beat = elapsedMs < 0 ? -1 : Math.min(total - 1, Math.floor(elapsedMs / this.config.intervalMs));
    const finished = elapsedMs > (total - 1) * this.config.intervalMs + this.config.intervalMs;
    const phase: CalibrationPhase = finished ? "finished" : elapsedMs < 0 ? "counting-in" : "running";

    let tapsCounted = 0;
    for (const index of this.errors.keys()) if (index >= this.config.warmup) tapsCounted++;
    return { phase, beat, total, warmup, measured, tapsCounted };
  }

  cancel(): void {
    const ctx = this.ctx;
    this.ctx = null;
    this.errors.clear();
    void ctx?.close?.();
  }
}
