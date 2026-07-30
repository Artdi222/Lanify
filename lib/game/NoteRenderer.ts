import * as PIXI from "pixi.js";
import type { ParsedNote, ScrollDirection } from "@/types/game";

const COLUMN_COLORS_4K = ["#3399ff", "#ffffff", "#ffffff", "#3399ff"];
const COLUMN_COLORS_7K = [
  "#3399ff",
  "#00e5ff",
  "#ffffff",
  "#ffdd00",
  "#ffffff",
  "#00e5ff",
  "#3399ff",
];
const HIT_ZONE_COLOR = 0x00e5ff;
const COLUMN_FLASH_COLOR = 0x00e5ff;

// Pre-parsed colors to avoid parseInt on every frame
const PARSED_COLORS_4K = COLUMN_COLORS_4K.map((c) =>
  parseInt(c.replace("#", ""), 16),
);
const PARSED_COLORS_7K = COLUMN_COLORS_7K.map((c) =>
  parseInt(c.replace("#", ""), 16),
);

interface HoldBodySprite {
  sprite: PIXI.NineSlicePlane;
  inUse: boolean;
}

export class NoteRenderer {
  private app: PIXI.Application;
  private laneContainer: PIXI.Container;
  private notesContainer: PIXI.Container;
  private hitZone: PIXI.Graphics;
  private columnFlashes: PIXI.Graphics[];
  private backgroundSprite: PIXI.Sprite | null = null;
  private backgroundContainer: PIXI.Container;
  private keyCount: number;
  private columnWidth: number;
  private laneWidth: number;
  private laneX: number;
  private hitZoneY: number;
  private scrollDirection: ScrollDirection;
  private scrollSpeed: number;
  private parsedColors: number[];
  private laneGap: number = 18;
  private radius: number;
  private centerXs: number[]; // pre-computed per column
  private backgroundDim: number = 60;
  private backgroundBlur: number = 0;
  private dimGraphics: PIXI.Graphics | null = null;
  private blurFilter: PIXI.BlurFilter | null = null;

  // Head note sprite pool
  private notePool: PIXI.Sprite[] = [];
  private activeNotes: PIXI.Sprite[] = [];
  private noteTexture: PIXI.RenderTexture | null = null;

  // Hold body sprite pool
  private holdPool: HoldBodySprite[] = [];
  private holdTexture: PIXI.RenderTexture | null = null;
  private activeHolds: HoldBodySprite[] = [];
  private holdCapSize: number = 0; // cap height in pixels for NineSlicePlane

  // Flash dedup
  private flashingColumns: Set<number> = new Set();

  // Reusable Set to avoid allocation per frame
  private holdEndTimes: Set<string> = new Set();

  constructor(
    app: PIXI.Application,
    keyCount: number,
    scrollDirection: ScrollDirection,
    scrollSpeed: number,
  ) {
    this.app = app;
    this.keyCount = keyCount;
    this.scrollDirection = scrollDirection;
    this.scrollSpeed = scrollSpeed;
    const isBigger = app.screen.height > 1000;
    const sizeScale = isBigger ? 1.2 : 1.0;
    
    const baseOffset = 130;
    const adjustment = isBigger ? 50 : 0;

    this.columnWidth = (keyCount === 4 ? 128 : 92) * sizeScale;
    this.laneGap = 18 * sizeScale;
    this.laneWidth =
      this.columnWidth * keyCount + this.laneGap * (keyCount - 1);
    this.laneX = (app.screen.width - this.laneWidth) / 2;
    this.hitZoneY = scrollDirection === "down" 
      ? app.screen.height - (baseOffset + adjustment) 
      : (baseOffset - adjustment);
    this.parsedColors = keyCount === 4 ? PARSED_COLORS_4K : PARSED_COLORS_7K;
    this.radius = this.columnWidth / 2 - 4;

    // Pre-compute centerX per column — avoids repeated math in the hot loop
    this.centerXs = [];
    for (let i = 0; i < keyCount; i++) {
      this.centerXs.push(
        this.laneX +
          i * (this.columnWidth + this.laneGap) +
          this.columnWidth / 2,
      );
    }

    // Background container
    this.backgroundContainer = new PIXI.Container();
    app.stage.addChildAt(this.backgroundContainer, 0);

    this.laneContainer = new PIXI.Container();
    this.notesContainer = new PIXI.Container();
    this.laneContainer.addChild(this.notesContainer);
    app.stage.addChild(this.laneContainer);

    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.7);
    bg.drawRect(this.laneX, 0, this.laneWidth, app.screen.height);
    bg.endFill();
    this.laneContainer.addChildAt(bg, 0);

    // Hit zone (drawn once, never redrawn)
    this.hitZone = new PIXI.Graphics();
    for (let i = 0; i < keyCount; i++) {
      const centerX = this.centerXs[i];
      this.hitZone.lineStyle(4, HIT_ZONE_COLOR, 0.8);
      this.hitZone.drawCircle(centerX, this.hitZoneY, this.radius);
      this.hitZone.lineStyle(8, HIT_ZONE_COLOR, 0.15);
      this.hitZone.drawCircle(centerX, this.hitZoneY, this.radius);
    }
    this.laneContainer.addChild(this.hitZone);

    // Column flashes (drawn once, alpha-animated)
    this.columnFlashes = [];
    for (let i = 0; i < keyCount; i++) {
      const flash = new PIXI.Graphics();
      flash.beginFill(COLUMN_FLASH_COLOR, 0.6);
      flash.drawCircle(this.centerXs[i], this.hitZoneY, this.radius);
      flash.endFill();
      flash.alpha = 0;
      this.laneContainer.addChild(flash);
      this.columnFlashes.push(flash);
    }

    // Build note head texture (white circle, tinted per column at runtime)
    const headG = new PIXI.Graphics();
    headG.beginFill(0xffffff);
    headG.drawCircle(this.radius, this.radius, this.radius);
    headG.endFill();
    this.noteTexture = PIXI.RenderTexture.create({
      width: this.radius * 2,
      height: this.radius * 2,
      scaleMode: PIXI.SCALE_MODES.LINEAR,
      resolution: app.renderer.resolution,
    });
    app.renderer.render(headG, { renderTexture: this.noteTexture });
    headG.destroy();

    // Build hold body texture — sharp tail, circular start (ponytail)
    const holdW = Math.round(this.radius * 1.8);
    const holdCapR = Math.round(holdW / 2);
    const holdTexH = holdCapR * 2 + 4;
    this.holdCapSize = holdCapR;
    const holdG = new PIXI.Graphics();
    holdG.beginFill(0xffffff);
    if (this.scrollDirection === "down") {
      holdG.moveTo(holdW / 2, 0); // top tip (tail)
      holdG.lineTo(holdW, holdCapR);
      holdG.lineTo(holdW, holdCapR + 4);
      holdG.arc(holdW / 2, holdCapR + 4, holdCapR, 0, Math.PI); // bottom circular (start)
      holdG.lineTo(0, holdCapR);
      holdG.lineTo(holdW / 2, 0);
    } else {
      holdG.arc(holdW / 2, holdCapR, holdCapR, Math.PI, 0); // top circular (start)
      holdG.lineTo(holdW, holdCapR + 4);
      holdG.lineTo(holdW / 2, holdTexH); // bottom tip (tail)
      holdG.lineTo(0, holdCapR + 4);
      holdG.lineTo(0, holdCapR);
    }
    holdG.endFill();
    this.holdTexture = PIXI.RenderTexture.create({
      width: holdW,
      height: holdTexH,
      scaleMode: PIXI.SCALE_MODES.LINEAR,
      resolution: app.renderer.resolution,
    });
    app.renderer.render(holdG, { renderTexture: this.holdTexture });
    holdG.destroy();

    // Pre-warm pools
    for (let i = 0; i < 100; i++) {
      const s = new PIXI.Sprite(this.noteTexture);
      s.anchor.set(0.5);
      s.visible = false;
      this.notesContainer.addChild(s);
      this.notePool.push(s);
    }
    for (let i = 0; i < 50; i++) {
      const s = new PIXI.NineSlicePlane(
        this.holdTexture!,
        0,
        this.holdCapSize,
        0,
        this.holdCapSize, // left, top, right, bottom slices
      );
      s.pivot.set(holdW / 2, 0);
      s.visible = false;
      this.notesContainer.addChildAt(s, 0);
      this.holdPool.push({ sprite: s, inUse: false });
    }

    // Initialize blur filter
    this.blurFilter = new PIXI.BlurFilter();
    this.blurFilter.blur = 0;
  }

  async setBackground(url: string | null): Promise<void> {
    if (!url || !this.app) return;

    try {
      const loadUrl = url;

      const texture = await new Promise<PIXI.Texture>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const base = new PIXI.BaseTexture(img, {
            scaleMode: PIXI.SCALE_MODES.LINEAR,
          });
          // Data URLs may resolve synchronously.
          if (base.valid) {
            resolve(new PIXI.Texture(base));
            return;
          }
          base.on("loaded", () => resolve(new PIXI.Texture(base)));
          base.on("error", (_b: unknown, e: unknown) =>
            reject(new Error(`BaseTexture error: ${e}`)),
          );
        };
        img.onerror = () =>
          reject(
            new Error(`Image decode failed (url length=${loadUrl.length})`),
          );
        img.src = loadUrl;
      });

      if (!texture?.baseTexture?.valid) {
        texture.destroy(true);
        throw new Error("Texture loaded but baseTexture is invalid");
      }

      // Guard: app may have been destroyed while we were awaiting.
      if (!this.app?.renderer) {
        texture.destroy(true);
        return;
      }

      // Capture old texture BEFORE reassigning — destroying it first would null
      // out uvsFloat32 on any sprite still referencing that BaseTexture, which
      // is the root cause of the "Cannot read properties of null (reading
      // 'uvsFloat32')" crash.
      const oldTexture = this.backgroundSprite?.texture ?? null;

      if (this.backgroundSprite) {
        this.backgroundSprite.texture = texture;
      } else {
        this.backgroundSprite = new PIXI.Sprite(texture);
        this.backgroundSprite.anchor.set(0.5);
        this.backgroundContainer.addChild(this.backgroundSprite);

        this.dimGraphics = new PIXI.Graphics();
        this.updateDim();
        this.backgroundContainer.addChild(this.dimGraphics);
      }

      // Apply initial blur
      this.updateBlur();

      // destroyBase=false: discard only this Texture wrapper, not the underlying
      // BaseTexture. Passing true is what triggers the uvsFloat32 crash when
      // PIXI's internal cache still holds a reference to that BaseTexture.
      if (oldTexture && oldTexture !== texture) {
        oldTexture.destroy(false);
      }

      const screenW = this.app.renderer.width;
      const screenH = this.app.renderer.height;
      const screenRatio = screenW / screenH;
      const texRatio = texture.width / texture.height;

      if (texRatio > screenRatio) {
        this.backgroundSprite.height = screenH;
        this.backgroundSprite.width = screenH * texRatio;
      } else {
        this.backgroundSprite.width = screenW;
        this.backgroundSprite.height = screenW / texRatio;
      }

      this.backgroundSprite.x = screenW / 2;
      this.backgroundSprite.y = screenH / 2;
    } catch (e) {
      console.error(
        "Failed to load background:",
        e instanceof Error ? e.message : e,
      );
    }
  }

  flashColumn(column: number): void {
    const flash = this.columnFlashes[column];
    if (!flash || !this.app?.ticker || this.flashingColumns.has(column)) return;

    this.flashingColumns.add(column);
    flash.alpha = 0.6;
    const fadeOut = () => {
      if (!this.app?.ticker || flash.destroyed) {
        this.flashingColumns.delete(column);
        return;
      }
      flash.alpha -= 0.05;
      if (flash.alpha <= 0) {
        flash.alpha = 0;
        this.app.ticker.remove(fadeOut);
        this.flashingColumns.delete(column);
      }
    };
    this.app.ticker.add(fadeOut);
  }

  updateNotes(notes: ParsedNote[], currentTime: number): void {
    if (!this.app) return;

    // --- Return everything to pools (reuse arrays, no allocation) ---
    for (let i = 0; i < this.activeNotes.length; i++) {
      this.activeNotes[i].visible = false;
      this.notePool.push(this.activeNotes[i]);
    }
    this.activeNotes.length = 0;

    for (let i = 0; i < this.activeHolds.length; i++) {
      this.activeHolds[i].sprite.visible = false;
      this.activeHolds[i].inUse = false;
      this.holdPool.push(this.activeHolds[i]);
    }
    this.activeHolds.length = 0;

    this.holdEndTimes.clear();

    const pxPerMs = this.scrollSpeed * 0.08;
    const isDown = this.scrollDirection === "down";
    const screenH = this.app.screen.height;
    // Look-ahead must cover the full travel distance: from spawn edge to hit zone.
    // spawnDistance = hitZoneY (down) or screenH - hitZoneY (up), plus a small buffer.
    const spawnDistance = isDown
      ? this.hitZoneY + 100
      : screenH - this.hitZoneY + 100;
    const lookAheadMs = spawnDistance / pxPerMs;
    const visibleEnd = currentTime + lookAheadMs;
    const visibleStart = currentTime - 500;

    for (let ni = 0; ni < notes.length; ni++) {
      const note = notes[ni];
      if (note.startTime > visibleEnd) break;

      if (
        note.isHoldNote
          ? note.endTime < visibleStart
          : note.startTime < visibleStart
      )
        continue;
      if (
        (!note.isHoldNote && note.hit) ||
        (note.isHoldNote && note.tailHit && !note.holdMissed)
      )
        continue;

      const colKey = `${note.column}-`;
      if (note.isHoldNote) {
        this.holdEndTimes.add(colKey + note.endTime);
      } else if (this.holdEndTimes.has(colKey + note.startTime)) {
        continue;
      }

      const timeDiff = note.startTime - currentTime;
      const y = isDown
        ? this.hitZoneY - timeDiff * pxPerMs
        : this.hitZoneY + timeDiff * pxPerMs;
      const color = note.isHoldNote ? 0xd4b6ea : 0x86aae8;
      const tailColor = 0xcccccc;
      const centerX = this.centerXs[note.column];

      // ─── HOLD BODY (sprite-based, no Graphics redraw) ───
      if (note.isHoldNote || note.isActiveHold) {
        const endDiff = note.endTime - currentTime;
        const endY = isDown
          ? this.hitZoneY - endDiff * pxPerMs
          : this.hitZoneY + endDiff * pxPerMs;
        const startY = note.isActiveHold ? this.hitZoneY : y;

        if (!isDown || endY < this.hitZoneY || note.holdMissed) {
          const top = Math.min(startY, endY);
          const bodyH = Math.abs(endY - startY);

          let hold = this.holdPool.pop();
          if (!hold) {
            const s = new PIXI.NineSlicePlane(
              this.holdTexture!,
              0,
              this.holdCapSize,
              0,
              this.holdCapSize,
            );
            const holdW = Math.round(this.radius * 1.8);
            s.pivot.set(holdW / 2, 0);
            s.visible = false;
            this.notesContainer.addChildAt(s, 0);
            hold = { sprite: s, inUse: true };
          }

          hold.sprite.visible = true;
          if (note.holdMissed) {
            hold.sprite.tint = this.darkenColor(tailColor, 0.4);
            hold.sprite.alpha = 0.6;
          } else {
            hold.sprite.tint = tailColor;
            hold.sprite.alpha = 1.0;
          }
          hold.sprite.height = Math.max(bodyH, this.holdCapSize * 2 + 4);
          hold.sprite.x = centerX;
          hold.sprite.y = top;
          hold.inUse = true;
          this.activeHolds.push(hold);
        }
      }

      // ─── HEAD SPRITE ───
      if (!note.isActiveHold && y > -100 && y < screenH + 100) {
        let sprite = this.notePool.pop();
        if (!sprite) {
          sprite = new PIXI.Sprite(this.noteTexture!);
          sprite.anchor.set(0.5);
          this.notesContainer.addChild(sprite);
        }
        sprite.visible = true;
        if (note.isHoldNote && note.holdMissed) {
          sprite.tint = this.darkenColor(color, 0.2);
          sprite.alpha = 0.4;
        } else {
          sprite.tint = color;
          sprite.alpha = 1.0;
        }
        sprite.position.set(centerX, y);
        this.activeNotes.push(sprite);
      }
    }
  }

  setScrollSpeed(speed: number): void {
    this.scrollSpeed = speed;
  }

  setBackgroundDim(dim: number): void {
    this.backgroundDim = dim;
    this.updateDim();
  }

  setBackgroundBlur(blur: number): void {
    this.backgroundBlur = blur;
    this.updateBlur();
  }

  private updateDim(): void {
    if (!this.dimGraphics || !this.app) return;
    this.dimGraphics.clear();
    this.dimGraphics.beginFill(0x000000, this.backgroundDim / 100);
    this.dimGraphics.drawRect(0, 0, this.app.renderer.width, this.app.renderer.height);
    this.dimGraphics.endFill();
  }

  private updateBlur(): void {
    if (!this.backgroundSprite || !this.blurFilter) return;
    // Map 0-100 to something reasonable for blur, say 0-20
    const blurValue = (this.backgroundBlur / 100) * 20;
    this.blurFilter.blur = blurValue;
    
    if (blurValue > 0) {
      this.backgroundSprite.filters = [this.blurFilter];
    } else {
      this.backgroundSprite.filters = null;
    }
  }

  private darkenColor(color: number, factor: number = 0.6): number {
    const r = Math.floor(((color >> 16) & 0xff) * factor);
    const g = Math.floor(((color >> 8) & 0xff) * factor);
    const b = Math.floor((color & 0xff) * factor);
    return (r << 16) | (g << 8) | b;
  }

  getHitZoneY(): number {
    return this.hitZoneY;
  }
  getScrollDirection(): ScrollDirection {
    return this.scrollDirection;
  }
  getScrollSpeed(): number {
    return this.scrollSpeed;
  }
  getLaneBounds() {
    return { x: this.laneX, width: this.laneWidth };
  }

  destroy(): void {
    this.laneContainer.destroy({ children: true });
    this.backgroundContainer.destroy({ children: true });
    this.noteTexture?.destroy(true);
    this.holdTexture?.destroy(true);
    this.notePool.length = 0;
    this.activeNotes.length = 0;
    this.holdPool.length = 0;
    this.activeHolds.length = 0;
    this.flashingColumns.clear();
    this.holdEndTimes.clear();
  }
}
