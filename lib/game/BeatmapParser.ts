import type { ParsedNote } from "@/types/game";

export interface ParsedOsuData {
  difficultyName: string;
  keyCount: number;
  od: number;
  hp: number;
  bpm: number;
  audioFilename: string;
  backgroundFilename: string | null;
  notes: ParsedNote[];
}

export class BeatmapParser {
  /** Parse .osu file content into structured data */
  static parse(content: string): ParsedOsuData {
    const lines = content.split(/\r?\n/);
    const data: Partial<ParsedOsuData> = {
      notes: [],
    };

    let inHitObjects = false;
    let inGeneral = false;
    let inMetadata = false;
    let inDifficulty = false;
    let inEvents = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed === "[General]") { inGeneral = true; inMetadata = inDifficulty = inEvents = inHitObjects = false; continue; }
      if (trimmed === "[Metadata]") { inMetadata = true; inGeneral = inDifficulty = inEvents = inHitObjects = false; continue; }
      if (trimmed === "[Difficulty]") { inDifficulty = true; inGeneral = inMetadata = inEvents = inHitObjects = false; continue; }
      if (trimmed === "[Events]") { inEvents = true; inGeneral = inMetadata = inDifficulty = inHitObjects = false; continue; }
      if (trimmed === "[HitObjects]") { inHitObjects = true; inGeneral = inMetadata = inDifficulty = inEvents = false; continue; }
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        inGeneral = inMetadata = inDifficulty = inEvents = inHitObjects = false;
        continue;
      }

      if (inGeneral) {
        if (trimmed.startsWith("AudioFilename:")) {
          data.audioFilename = trimmed.split(":")[1].trim();
        }
      }

      if (inMetadata) {
        if (trimmed.startsWith("Version:")) {
          data.difficultyName = trimmed.split(":")[1].trim();
        }
      }

      if (inDifficulty) {
        if (trimmed.startsWith("CircleSize:")) {
          data.keyCount = parseInt(trimmed.split(":")[1].trim());
        } else if (trimmed.startsWith("OverallDifficulty:")) {
          data.od = parseFloat(trimmed.split(":")[1].trim());
        } else if (trimmed.startsWith("HPDrainRate:")) {
          data.hp = parseFloat(trimmed.split(":")[1].trim());
        }
      }

      if (inEvents) {
        // Look for background image: 0,0,"bg.jpg" or 0,0,bg.jpg
        const bgMatch = trimmed.match(/^0\s*,\s*0\s*,\s*"?([^",]+)"?/);
        if (bgMatch) {
          data.backgroundFilename = bgMatch[1];
        }
      }

      if (inHitObjects) {
        const parts = trimmed.split(",");
        if (parts.length < 5) continue;

        const x = parseInt(parts[0]);
        const startTime = parseInt(parts[2]);
        const type = parseInt(parts[3]);
        const keyCount = data.keyCount || 4; // fallback
        const column = Math.floor((x * keyCount) / 512);
        const isHold = (type & 128) !== 0;

        let endTime = startTime;
        let totalTicks = 0;
        if (isHold && parts[5]) {
          const endParts = parts[5].split(":");
          endTime = parseInt(endParts[0]) || startTime;
          totalTicks = Math.max(0, Math.floor((endTime - startTime - 100) / 100));
        }

        data.notes!.push({
          column,
          startTime,
          endTime,
          isHoldNote: isHold,
          hit: false,
          judgement: null,
          headHit: false,
          tailHit: false,
          isActiveHold: false,
          holdMissed: false,
          totalTicks,
          ticksHit: 0,
          nextTickTime: isHold ? startTime + 100 : undefined,
        });
      }
    }

    data.notes!.sort((a, b) => a.startTime - b.startTime);

    return data as ParsedOsuData;
  }
}
