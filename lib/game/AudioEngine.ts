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
  private leadInMs: number = 0;
  private audioStarted: boolean = false;

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
    if (this.howl) {
      this.howl.stop();
      this.howl.seek(0);
    }
    this.startTimestamp = 0;
    this.pauseTime = 0;
    this.playing = false;
    this.soundId = null;
    this.leadInMs = 0;
    this.audioStarted = false;
  }

  play(leadInMs: number = 0): void {
    if (!this.howl) return;
    
    this.leadInMs = leadInMs;
    this.startTimestamp = performance.now();
    this.playing = true;

    if (leadInMs > 0) {
      this.audioStarted = false;
      this.pauseTime = -leadInMs;
    } else {
      this.audioStarted = true;
      this.soundId = this.howl.play();
    }
  }

  pause(): void {
    if (!this.howl) return;
    this.pauseTime = this.getCurrentTime();
    if (this.audioStarted && this.soundId !== null) {
      this.howl.pause(this.soundId);
    }
    this.playing = false;
  }

  resume(): void {
    if (!this.howl) return;
    const current = this.audioStarted ? this.getCurrentTime() : this.pauseTime;
    if (!this.audioStarted) {
      this.startTimestamp = performance.now() - (current + this.leadInMs);
    } else {
      this.startTimestamp = performance.now() - current;
      if (this.soundId !== null) {
        this.howl.play(this.soundId);
      }
    }
    this.playing = true;
  }

  /**
   * Get current playback time in milliseconds.
   * Handles negative lead-in time before actual audio start.
   */
  getCurrentTime(): number {
    if (!this.howl) return 0;

    if (!this.playing) return this.pauseTime;

    if (!this.audioStarted) {
      const elapsed = performance.now() - this.startTimestamp;
      const current = -this.leadInMs + elapsed;
      if (current >= 0) {
        this.audioStarted = true;
        this.soundId = this.howl.play();
        this.startTimestamp = performance.now() - current;
        return current + this.globalOffset;
      }
      return current + this.globalOffset;
    }

    const timeSinceStart = performance.now() - this.startTimestamp;
    return timeSinceStart + this.globalOffset;
  }

  seek(timeMs: number): void {
    if (!this.howl) return;

    if (timeMs < 0) {
      if (this.audioStarted && this.soundId !== null) {
        this.howl.stop();
        this.soundId = null;
      }
      this.audioStarted = false;
      this.leadInMs = -timeMs;
      this.startTimestamp = performance.now();
      if (!this.playing) {
        this.pauseTime = timeMs;
      }
      return;
    }

    if (!this.audioStarted) {
      this.audioStarted = true;
      this.soundId = this.howl.play();
    }

    const seekSeconds = (timeMs - this.globalOffset) / 1000;
    if (this.soundId !== null) {
      this.howl.seek(Math.max(0, seekSeconds), this.soundId);
    }

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
