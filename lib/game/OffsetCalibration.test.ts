import { describe, expect, test } from "bun:test";
import {
  analyzeErrors,
  DEFAULT_CALIBRATION,
  OFFSET_LIMIT,
  OffsetCalibrator,
  type CalibrationAudioContext,
} from "./OffsetCalibration";

/** Deterministic PRNG so jitter-based tests never flake. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

describe("analyzeErrors", () => {
  test("a player who taps 30ms early gets a +30ms offset", () => {
    const rand = rng(3);
    const errors = Array.from({ length: 16 }, () => -30 + (rand() - 0.5) * 6);
    const r = analyzeErrors(errors);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.offsetMs).toBeGreaterThanOrEqual(28);
      expect(r.offsetMs).toBeLessThanOrEqual(32);
      expect(r.stdMs).toBeLessThan(3);
    }
  });

  test("a player who taps 40ms late gets a -40ms offset", () => {
    const r = analyzeErrors(Array.from({ length: 12 }, () => 40));
    expect(r.ok && r.offsetMs).toBe(-40);
  });

  test("rejects stray taps (double-hit, lapse) instead of letting them skew the mean", () => {
    const errors = [...Array.from({ length: 14 }, (_, i) => -20 + (i % 3)), 180, 210];
    const r = analyzeErrors(errors);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.rejected).toBe(2);
      expect(r.used).toBe(14);
      expect(r.offsetMs).toBeGreaterThanOrEqual(18);
      expect(r.offsetMs).toBeLessThanOrEqual(20);
    }
  });

  test("refuses to answer from too few taps", () => {
    const r = analyzeErrors([10, 12, 9, 11]);
    expect(r).toEqual({ ok: false, reason: "not-enough-taps", used: 4 });
  });

  test("clamps to the Audio Offset slider range", () => {
    const r = analyzeErrors(Array.from({ length: 10 }, () => 400));
    expect(r.ok && r.offsetMs).toBe(-OFFSET_LIMIT);
    const r2 = analyzeErrors(Array.from({ length: 10 }, () => -400));
    expect(r2.ok && r2.offsetMs).toBe(OFFSET_LIMIT);
  });

  test("a real 0 stays 0 (no -0)", () => {
    const r = analyzeErrors(Array.from({ length: 10 }, () => 0));
    expect(r.ok && Object.is(r.offsetMs, 0)).toBe(true);
  });
});

/**
 * Fake Web Audio context on a controllable clock.
 * ctx time at perf P = (P - perfT0)/1000 + c0; the sample being OUTPUT at P was rendered `latencyMs` earlier.
 */
function makeFake(opts: { latencyMs?: number; withOutputTimestamp?: boolean } = {}) {
  const latencyMs = opts.latencyMs ?? 40;
  const perfT0 = 10_000;
  const c0 = 5;
  const state = { nowPerf: perfT0 };
  const started: number[] = [];
  const stopped: number[] = [];
  let resumed = 0;
  let closed = 0;

  const ctxNow = (p: number) => (p - perfT0) / 1000 + c0;
  const audibleCtx = (p: number) => ctxNow(p) - latencyMs / 1000;
  /** perf time at which the sample scheduled for ctx time `c` is audible */
  const perfAudibleAt = (c: number) => perfT0 + (c - c0) * 1000 + latencyMs;

  const ctx: CalibrationAudioContext = {
    get currentTime() {
      return ctxNow(state.nowPerf);
    },
    destination: {},
    outputLatency: latencyMs / 1000,
    baseLatency: 0.01,
    ...(opts.withOutputTimestamp === false
      ? {}
      : {
          getOutputTimestamp: () => {
            const p = state.nowPerf - 1.3; // the output timestamp is slightly older than "now"
            return { contextTime: audibleCtx(p), performanceTime: p };
          },
        }),
    createOscillator: () => {
      const osc = {
        frequency: { value: 0 },
        connect: () => undefined,
        start: (when: number) => void started.push(when),
        stop: (when: number) => void stopped.push(when),
      };
      return osc;
    },
    createGain: () => ({
      gain: { setValueAtTime: () => undefined, linearRampToValueAtTime: () => undefined },
      connect: () => undefined,
    }),
    resume: async () => void resumed++,
    close: async () => void closed++,
  };

  return { ctx, state, started, stopped, perfAudibleAt, counts: () => ({ resumed, closed }) };
}

describe("OffsetCalibrator", () => {
  const cfg = DEFAULT_CALIBRATION;
  const total = cfg.warmup + cfg.measured;

  test("schedules every click ahead of time on the audio clock", async () => {
    const f = makeFake();
    const cal = new OffsetCalibrator(() => f.ctx);
    await cal.start();

    expect(f.counts().resumed).toBe(1);
    expect(f.started.length).toBe(total);
    const first = f.ctx.currentTime + cfg.leadMs / 1000;
    f.started.forEach((when, i) => expect(when).toBeCloseTo(first + (i * cfg.intervalMs) / 1000, 6));
    expect(f.stopped.length).toBe(total);
  });

  /** Tap at the moment click `i` is audible, plus `lateMs`; handler runs 2ms later. */
  const tapAt = (f: ReturnType<typeof makeFake>, cal: OffsetCalibrator, i: number, lateMs: number) => {
    const first = f.started[0];
    const p = f.perfAudibleAt(first + (i * cfg.intervalMs) / 1000) + lateMs;
    f.state.nowPerf = p + 2;
    return cal.tap(p, p + 2);
  };

  test("measures lateness relative to what is AUDIBLE (output latency included)", async () => {
    const f = makeFake({ latencyMs: 40 });
    const cal = new OffsetCalibrator(() => f.ctx);
    await cal.start();

    const fb = tapAt(f, cal, cfg.warmup, 25);
    expect(fb?.errorMs).toBeCloseTo(25, 4);
    expect(fb?.counted).toBe(true);
  });

  test("a full run of taps 40ms late yields a -40ms offset", async () => {
    const f = makeFake();
    const cal = new OffsetCalibrator(() => f.ctx);
    await cal.start();
    for (let i = 0; i < total; i++) tapAt(f, cal, i, 40);

    const r = cal.result();
    expect(r.ok && r.offsetMs).toBe(-40);
  });

  test("tapping on the nominal schedule (ignoring latency) reads as early by the output latency", async () => {
    // A script that clicks at the *scheduled* ctx time, not the audible one, is early by `latency`.
    const f = makeFake({ latencyMs: 40 });
    const cal = new OffsetCalibrator(() => f.ctx);
    await cal.start();
    for (let i = 0; i < total; i++) tapAt(f, cal, i, -40);

    const r = cal.result();
    expect(r.ok && r.offsetMs).toBe(40);
  });

  test("warm-up taps are shown but do not count", async () => {
    const f = makeFake();
    const cal = new OffsetCalibrator(() => f.ctx);
    await cal.start();
    expect(tapAt(f, cal, 0, 500 / 10)?.counted).toBe(false);
    // 8 measured taps at +30 and the warm-up one at +50 must not drag the answer
    for (let i = cfg.warmup; i < cfg.warmup + 8; i++) tapAt(f, cal, i, 30);
    const r = cal.result();
    expect(r.ok && r.offsetMs).toBe(-30);
  });

  test("when two taps hit the same click the closer one wins", async () => {
    const f = makeFake();
    const cal = new OffsetCalibrator(() => f.ctx);
    await cal.start();
    // All three stay inside the outlier limit, so only the "closest wins" rule can produce -10:
    // first-wins would give +30 and last-wins +20, shifting the mean to -12 / -11.
    tapAt(f, cal, cfg.warmup, 30);
    tapAt(f, cal, cfg.warmup, 10);
    tapAt(f, cal, cfg.warmup, 20);
    for (let i = cfg.warmup + 1; i < cfg.warmup + 9; i++) tapAt(f, cal, i, 10);

    const r = cal.result();
    expect(r.ok && r.offsetMs).toBe(-10);
  });

  test("taps outside the click train are ignored", async () => {
    const f = makeFake();
    const cal = new OffsetCalibrator(() => f.ctx);
    await cal.start();
    expect(tapAt(f, cal, -3, 0)).toBeNull();
    expect(tapAt(f, cal, total + 2, 0)).toBeNull();
  });

  test("falls back to outputLatency when getOutputTimestamp is unavailable", async () => {
    const f = makeFake({ latencyMs: 40, withOutputTimestamp: false });
    const cal = new OffsetCalibrator(() => f.ctx);
    await cal.start();
    for (let i = 0; i < total; i++) tapAt(f, cal, i, 25);

    const r = cal.result();
    expect(r.ok).toBe(true);
    if (r.ok) expect(Math.abs(r.offsetMs + 25)).toBeLessThanOrEqual(1);
  });

  test("an invalid event timeStamp falls back to handler time", async () => {
    const f = makeFake();
    const cal = new OffsetCalibrator(() => f.ctx);
    await cal.start();
    const first = f.started[0];
    const p = f.perfAudibleAt(first + (cfg.warmup * cfg.intervalMs) / 1000) + 12;
    f.state.nowPerf = p;
    const fb = cal.tap(0, p); // timeStamp 0 => use `now`
    expect(fb?.errorMs).toBeCloseTo(12, 3);
  });

  test("status goes from counting-in to running to finished, and cancel closes the context", async () => {
    const f = makeFake();
    const cal = new OffsetCalibrator(() => f.ctx);
    expect(cal.status().phase).toBe("idle");
    await cal.start();
    expect(cal.status().phase).toBe("counting-in");

    f.state.nowPerf = f.perfAudibleAt(f.started[3]);
    expect(cal.status().phase).toBe("running");
    expect(cal.status().beat).toBeGreaterThanOrEqual(2);

    f.state.nowPerf = f.perfAudibleAt(f.started[total - 1]) + cfg.intervalMs + 100;
    expect(cal.status().phase).toBe("finished");

    cal.cancel();
    expect(f.counts().closed).toBe(1);
    expect(cal.status().phase).toBe("idle");
  });
});
