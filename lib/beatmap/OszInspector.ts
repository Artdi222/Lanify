import JSZip from "jszip";
import type { DifficultyInfo } from "@/types/beatmap";

/**
 * OszInspector — Opens an .osz file (zip archive) and parses all .osu
 * files inside it, extracting metadata, difficulty settings, BPM, and
 * estimated song length for each difficulty.
 */
export class OszInspector {
  /**
   * Inspect an .osz file and return an array of parsed difficulty info.
   */
  static async inspect(file: File): Promise<DifficultyInfo[]> {
    const zip = await JSZip.loadAsync(file);
    const results: DifficultyInfo[] = [];

    // Find all .osu files in the archive
    const osuFiles = Object.keys(zip.files).filter((name) =>
      name.endsWith(".osu")
    );

    for (const filename of osuFiles) {
      const content = await zip.files[filename].async("text");
      const info = OszInspector.parseOsuFile(filename, content);
      if (info) {
        results.push(info);
      }
    }

    // Extract cover image if found in any difficulty
    let coverFile: File | undefined;
    const coverFileName = results.find(r => r.coverFileName)?.coverFileName;

    if (coverFileName && zip.files[coverFileName]) {
      const coverBlob = await zip.files[coverFileName].async("blob");
      coverFile = new File([coverBlob], coverFileName, { type: coverBlob.type || "image/jpeg" });
      
      // Attach to all parsed difficulties
      for (const res of results) {
        res.coverFile = coverFile;
      }
    }

    return results;
  }

  /**
   * Parse a single .osu file's text content into DifficultyInfo.
   */
  private static parseOsuFile(
    filename: string,
    content: string
  ): DifficultyInfo | null {
    const lines = content.split(/\r?\n/);

    let currentSection = "";

    // [General]
    let mode = 0;

    // [Metadata]
    let title = "";
    let titleUnicode = "";
    let artist = "";
    let artistUnicode = "";
    let creator = "";
    let version = "";

    // [Difficulty]
    let circleSize = 4;
    let od = 0;
    let hp = 0;

    // [TimingPoints]
    let bpm = 0;
    let foundUninheritedTp = false;

    // [HitObjects]
    let lastTimestamp = 0;
    let noteCount = 0;
    let holdCount = 0;

    // [Events]
    let coverFileName: string | undefined;

    for (const line of lines) {
      const trimmed = line.trim();

      // Section headers
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        currentSection = trimmed;
        continue;
      }

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith("//")) continue;

      switch (currentSection) {
        case "[General]": {
          const [key, value] = OszInspector.splitKeyValue(trimmed);
          if (key === "Mode") mode = parseInt(value, 10);
          break;
        }

        case "[Metadata]": {
          const [key, value] = OszInspector.splitKeyValue(trimmed);
          switch (key) {
            case "Title":
              title = value;
              break;
            case "TitleUnicode":
              titleUnicode = value;
              break;
            case "Artist":
              artist = value;
              break;
            case "ArtistUnicode":
              artistUnicode = value;
              break;
            case "Creator":
              creator = value;
              break;
            case "Version":
              version = value;
              break;
          }
          break;
        }

        case "[Difficulty]": {
          const [key, value] = OszInspector.splitKeyValue(trimmed);
          switch (key) {
            case "CircleSize":
              circleSize = parseFloat(value);
              break;
            case "OverallDifficulty":
              od = parseFloat(value);
              break;
            case "HPDrainRate":
              hp = parseFloat(value);
              break;
          }
          break;
        }

        case "[TimingPoints]": {
          if (!foundUninheritedTp) {
            const parts = trimmed.split(",");
            if (parts.length >= 2) {
              const beatLength = parseFloat(parts[1]);
              // Uninherited timing points have positive beatLength
              // In newer format, check column 7 (1 = uninherited)
              const isUninherited =
                parts.length >= 7
                  ? parts[6].trim() === "1"
                  : beatLength > 0;

              if (isUninherited && beatLength > 0) {
                bpm = Math.round(60000 / beatLength);
                foundUninheritedTp = true;
              }
            }
          }
          break;
        }

        case "[HitObjects]": {
          const parts = trimmed.split(",");
          if (parts.length >= 3) {
            const timestamp = parseInt(parts[2], 10);
            if (timestamp > lastTimestamp) {
              lastTimestamp = timestamp;
            }

            // Mania-specific note parsing
            const type = parseInt(parts[3], 10);
            const isHold = (type & 128) !== 0;
            if (isHold) {
              holdCount++;
            } else {
              noteCount++;
            }
          }
          break;
        }

        case "[Events]": {
          if (trimmed.startsWith("0,0,")) {
            const parts = trimmed.split(",");
            if (parts.length >= 3) {
              let bgStr = parts[2].trim();
              if (bgStr.startsWith('"') && bgStr.endsWith('"')) {
                bgStr = bgStr.slice(1, -1);
              }
              if (!coverFileName) {
                coverFileName = bgStr;
              }
            }
          }
          break;
        }
      }
    }

    // Fill unicode fallbacks
    if (!titleUnicode) titleUnicode = title;
    if (!artistUnicode) artistUnicode = artist;

    return {
      filename,
      title,
      titleUnicode,
      artist,
      artistUnicode,
      creator,
      version,
      mode,
      keyCount: Math.round(circleSize),
      od,
      hp,
      bpm,
      lengthSeconds: Math.round(lastTimestamp / 1000),
      noteCount,
      holdCount,
      coverFileName,
    };
  }

  /** Split "Key: Value" or "Key:Value" lines */
  private static splitKeyValue(line: string): [string, string] {
    const idx = line.indexOf(":");
    if (idx === -1) return [line, ""];
    return [line.substring(0, idx).trim(), line.substring(idx + 1).trim()];
  }
}
