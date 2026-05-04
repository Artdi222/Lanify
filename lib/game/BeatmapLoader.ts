import JSZip from "jszip";
import { BeatmapParser, ParsedOsuData } from "./BeatmapParser";

export interface LoadedBeatmapData {
  id: string;
  difficulties: Map<string, ParsedOsuData>;
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
      
      // Store by difficulty name (Version)
      difficulties.set(parsed.difficultyName.toLowerCase(), parsed);
      
      // Usually all difficulties share the same audio and background
      if (!audioFilename) audioFilename = parsed.audioFilename;
      if (!backgroundFilename) backgroundFilename = parsed.backgroundFilename;
    }

    if (!audioFilename) throw new Error("No AudioFilename found in any .osu file");

    // Extract audio
    const audioFile = zip.files[audioFilename] || zip.files[audioFilename.replace(/\\/g, "/")];
    if (!audioFile) {
      // Try to find any audio file if the specified one is missing
      const anyAudio = Object.keys(zip.files).find(f => f.endsWith(".mp3") || f.endsWith(".ogg"));
      if (!anyAudio) throw new Error(`Audio file "${audioFilename}" not found in archive`);
      audioFilename = anyAudio;
    }

    const audioArrayBuffer = await zip.files[audioFilename!].async("arraybuffer");
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

    const data: LoadedBeatmapData = {
      id: archiveKey,
      difficulties,
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


