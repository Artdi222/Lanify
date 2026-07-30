import JSZip from "jszip";
import { BeatmapParser, ParsedOsuData } from "./BeatmapParser";

export interface LoadedBeatmapData {
  id: string;
  difficulties: Map<string, ParsedOsuData>;
  getDifficulty: (difficultyName: string, keyCount?: number) => ParsedOsuData | undefined;
  audioUrl: string;
  backgroundUrl: string | null;
  audioBlob: Blob;
  backgroundBlob: Blob | null;
}

/**
 * BeatmapLoader — Downloads and extracts .osz files.
 * Caches all difficulties and parsed data to avoid re-processing.
 * Uses an archiveKey (usually filePath) to identify unique archives.
 */
export class BeatmapLoader {
  private static cache = new Map<string, LoadedBeatmapData>();
  
  static hasCache(archiveKey: string): boolean {
    return this.cache.has(archiveKey);
  }

  static getCache(archiveKey: string): LoadedBeatmapData | undefined {
    return this.cache.get(archiveKey);
  }

  /**
   * Load a beatmap archive from a signed URL.
   * Extracts and parses ALL difficulties in the archive.
   */
  static async load(archiveKey: string, signedUrl: string): Promise<LoadedBeatmapData> {
    // Check cache first
    const cached = this.cache.get(archiveKey);
    if (cached) {
      return cached;
    }

    if (!signedUrl) {
      throw new Error(`Archive "${archiveKey}" is not cached and no signed URL was provided.`);
    }

    // Download the .osz file
    const response = await fetch(signedUrl);
    if (!response.ok) throw new Error(`Failed to download beatmap archive: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();

    // Extract ZIP
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Find all .osu files
    const osuFiles = Object.keys(zip.files).filter((f) => f.endsWith(".osu"));
    if (osuFiles.length === 0) throw new Error("No .osu file found in archive");

    const difficulties = new Map<string, ParsedOsuData>();
    let audioFilename: string | null = null;
    let backgroundFilename: string | null = null;

    // Parse all .osu files
    for (const fileName of osuFiles) {
      const content = await zip.files[fileName].async("text");
      const parsed = BeatmapParser.parse(content);
      
      const key = parsed.difficultyName.toLowerCase().trim();
      const existing = difficulties.get(key);
      // Prefer mania mode (3) over non-mania mode if there's a difficulty name collision
      if (!existing || (parsed.mode === 3 && existing.mode !== 3)) {
        difficulties.set(key, parsed);
      }
      
      // Usually all difficulties share the same audio and background
      if (!audioFilename) audioFilename = parsed.audioFilename;
      if (!backgroundFilename) backgroundFilename = parsed.backgroundFilename;
    }

    if (!audioFilename) throw new Error("No AudioFilename found in any .osu file");

    // Extract audio
    let audioFile = zip.files[audioFilename] || zip.files[audioFilename.replace(/\\/g, "/")];
    if (!audioFile) {
      const lowerName = audioFilename.toLowerCase().replace(/\\/g, "/");
      const foundAudio = Object.keys(zip.files).find(f => {
        const l = f.toLowerCase().replace(/\\/g, "/");
        return l === lowerName || l.endsWith(".mp3") || l.endsWith(".ogg") || l.endsWith(".wav");
      });
      if (!foundAudio) throw new Error(`Audio file "${audioFilename}" not found in archive`);
      audioFilename = foundAudio;
      audioFile = zip.files[audioFilename];
    }

    const audioArrayBuffer = await audioFile.async("arraybuffer");
    const audioBlob = new Blob([audioArrayBuffer], { type: "audio/mpeg" });
    const audioUrl = URL.createObjectURL(audioBlob);

    // Extract background
    let backgroundBlob: Blob | null = null;
    let backgroundUrl: string | null = null;

    if (backgroundFilename) {
      let bgFile = zip.files[backgroundFilename] || zip.files[backgroundFilename.replace(/\\/g, "/")];
      if (!bgFile) {
        const lowerName = backgroundFilename.toLowerCase().replace(/\\/g, "/");
        const found = Object.keys(zip.files).find(f => f.toLowerCase().replace(/\\/g, "/") === lowerName);
        if (found) bgFile = zip.files[found];
      }

      if (bgFile) {
        let mimeType = "image/jpeg";
        const lowerName = bgFile.name.toLowerCase();
        if (lowerName.endsWith(".png")) mimeType = "image/png";
        else if (lowerName.endsWith(".gif")) mimeType = "image/gif";
        else if (lowerName.endsWith(".webp")) mimeType = "image/webp";

        const bgBuffer = await bgFile.async("arraybuffer");
        backgroundBlob = new Blob([bgBuffer], { type: mimeType });
        backgroundUrl = URL.createObjectURL(backgroundBlob);
      }
    }

    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, "");

    const getDifficulty = (difficultyName: string, keyCount?: number): ParsedOsuData | undefined => {
      if (!difficultyName && difficulties.size > 0) {
        return difficulties.values().next().value;
      }
      const targetLower = difficultyName.toLowerCase().trim();
      
      // 1. Direct lowercase lookup
      if (difficulties.has(targetLower)) {
        return difficulties.get(targetLower);
      }

      // 2. Normalized alphanumeric match
      const targetNorm = normalize(difficultyName);
      for (const [key, parsed] of difficulties.entries()) {
        if (normalize(key) === targetNorm) {
          return parsed;
        }
      }

      // 3. Mania-only filtering + keyCount match
      const maniaDiffs = Array.from(difficulties.values()).filter(d => d.mode === 3);
      if (keyCount !== undefined) {
        const keyMatched = maniaDiffs.find(d => 
          d.keyCount === keyCount && 
          (normalize(d.difficultyName).includes(targetNorm) || targetNorm.includes(normalize(d.difficultyName)))
        );
        if (keyMatched) return keyMatched;
      }

      // 4. Single mania diff fallback or first matching keyCount
      if (keyCount !== undefined) {
        const keyMatchedAny = maniaDiffs.find(d => d.keyCount === keyCount);
        if (keyMatchedAny) return keyMatchedAny;
      }

      if (maniaDiffs.length > 0) {
        return maniaDiffs[0];
      }

      // 5. Fallback: first difficulty in map
      return difficulties.values().next().value;
    };

    const data: LoadedBeatmapData = {
      id: archiveKey,
      difficulties,
      getDifficulty,
      audioUrl,
      backgroundUrl,
      audioBlob,
      backgroundBlob,
    };

    // Store in cache
    this.cache.set(archiveKey, data);

    return data;
  }

  /** Cleanup blob URLs and clear cache */
  static cleanup() {
    // Keep cache unless explicitly cleared
  }

  /** Clear specific archive from cache */
  static clearCache(archiveKey: string) {
    const data = this.cache.get(archiveKey);
    if (data) {
      URL.revokeObjectURL(data.audioUrl);
      if (data.backgroundUrl) URL.revokeObjectURL(data.backgroundUrl);
      this.cache.delete(archiveKey);
    }
  }

  /** Clear entire cache */
  static clearAll() {
    this.cache.forEach((_, archiveKey) => this.clearCache(archiveKey));
  }
}


