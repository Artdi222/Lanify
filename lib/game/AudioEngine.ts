import { Howl } from "howler";

/**
 * AudioEngine — Howler.js wrapper for precise game audio timing.
 */
export class AudioEngine {
  private howl: Howl | null = null;
  private soundId: number | null = null;
  private globalOffset: number;
  private startTimestamp: number = 0;
  private pauseTime: number = 0;
  private playing: boolean = false;
  private currentUrl: string | null = null;

  constructor(globalOffset: number = 0) {
    this.globalOffset = globalOffset;
  }

  async load(url: string, volume: number = 0.8): Promise<void> {
    if (this.howl && this.currentUrl === url) {
      this.howl.stop();
      this.howl.seek(0);
      return Promise.resolve();
    }

    if (this.howl) {
      this.howl.stop();
      this.howl.unload();
    }

    return new Promise((resolve, reject) => {
      this.howl = new Howl({
        src: [url],
        format: ["mp3", "ogg", "wav"],
        volume,
        html5: false,
        onload: () => {
          this.currentUrl = url;
          resolve();
        },
        onloaderror: (_id, err) =>
          reject(new Error(`Audio load error: ${err}`)),
      });
    });
  }

  reset(): void {
    if (!this.howl) return;
    this.howl.stop();
    this.howl.seek(0);
    this.startTimestamp = 0;
    this.pauseTime = 0;
    this.playing = false;
    // FIX: Reset soundId so getCurrentTime() doesn't interpolate stale timestamps
    this.soundId = null;
  }

  play(): void {
    if (!this.howl) return;
    this.soundId = this.howl.play();
    this.startTimestamp = performance.now();
    this.playing = true;
  }

  pause(): void {
    if (!this.howl) return;
    this.pauseTime = this.getCurrentTime();
    if (this.soundId !== null) {
      this.howl.pause(this.soundId);
    } else {
      this.howl.pause();
    }
    this.playing = false;
  }

  resume(): void {
    if (!this.howl || this.soundId === null) return;
    this.howl.play(this.soundId);
    this.startTimestamp = performance.now() - this.pauseTime;
    this.playing = true;
  }

  /**
   * Get current playback time in milliseconds.
   *
   * FIX: Guard against soundId === null (pre-play state) returning a misleading 0.
   * Returns pauseTime (0 before first play) so callers get a stable, correct value
   * rather than triggering false early-note misses at t=0.
   */
  getCurrentTime(): number {
    if (!this.howl) return 0;

    // Not yet started or explicitly paused — return last known position
    if (this.soundId === null || !this.playing) return this.pauseTime;

    const timeSinceStart = performance.now() - this.startTimestamp;
    return timeSinceStart + this.globalOffset;
  }

  seek(timeMs: number): void {
    if (!this.howl || this.soundId === null) return;
    const seekSeconds = (timeMs - this.globalOffset) / 1000;
    this.howl.seek(Math.max(0, seekSeconds), this.soundId);

    if (this.playing) {
      this.startTimestamp = performance.now() - timeMs;
    } else {
      this.pauseTime = timeMs;
    }
  }

  setVolume(vol: number): void {
    if (this.howl && this.soundId !== null) this.howl.volume(vol, this.soundId);
    else if (this.howl) this.howl.volume(vol);
  }

  onEnd(callback: () => void): void {
    if (this.howl) this.howl.on("end", callback);
  }

  getDuration(): number {
    if (!this.howl) return 0;
    return (this.howl.duration() as number) * 1000;
  }

  isPlaying(): boolean {
    return this.playing;
  }

  destroy(): void {
    if (this.howl) {
      this.howl.stop();
      this.howl.unload();
      this.howl = null;
    }
    this.playing = false;
  }
}
