import Phaser from 'phaser';
import { GAME_WIDTH } from '@/config/GameConfig';
import { LevelManager } from '@/config/progression';
import type { LevelTheme } from '@/config/progression';

const CHUNK_HEIGHT = 400;

/** Procedural scrolling background that uses the current level's theme colors */
export class Background {
  private scene: Phaser.Scene;
  private chunks: Map<number, Phaser.GameObjects.Container> = new Map();
  private theme: LevelTheme;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.theme = LevelManager.instance.current.theme;
  }

  /** Call each frame with camera scrollY */
  update(cameraTop: number): void {
    const topChunk = Math.floor(cameraTop / CHUNK_HEIGHT) - 1;
    const bottomChunk = topChunk + 5;

    // Generate new chunks ahead
    for (let i = topChunk; i <= bottomChunk; i++) {
      if (!this.chunks.has(i)) {
        this.generateChunk(i);
      }
    }

    // Remove chunks far behind
    for (const [idx, container] of this.chunks) {
      if (idx > bottomChunk + 2 || idx < topChunk - 2) {
        container.destroy();
        this.chunks.delete(idx);
      }
    }
  }

  private generateChunk(index: number): void {
    const t = this.theme;
    const container = this.scene.add.container(0, index * CHUNK_HEIGHT);
    container.setDepth(-100);

    // Seed RNG from chunk index for consistent regeneration
    const seed = Math.abs(index * 7919 + 1327);
    const rng = (n: number) => {
      const x = Math.sin(seed + n * 9973) * 43758.5453;
      return x - Math.floor(x);
    };

    // Ground base
    const bg = this.scene.add.rectangle(
      GAME_WIDTH / 2, CHUNK_HEIGHT / 2,
      GAME_WIDTH, CHUNK_HEIGHT,
      t.groundColor,
    );
    container.add(bg);

    // Subtle terrain color variation bands
    const bandCount = 2 + Math.floor(rng(50) * 3);
    for (let b = 0; b < bandCount; b++) {
      const bandY = rng(60 + b) * CHUNK_HEIGHT;
      const bandH = 40 + rng(70 + b) * 100;
      const bandColor = t.detailColors[Math.floor(rng(80 + b) * t.detailColors.length)];
      const band = this.scene.add.rectangle(
        GAME_WIDTH / 2, bandY,
        GAME_WIDTH, bandH,
        bandColor, 0.3,
      );
      container.add(band);
    }

    // Ambient glow patches (faint colored fog)
    if (rng(90) < 0.4) {
      const glowColor = t.glowColors[Math.floor(rng(91) * t.glowColors.length)];
      const glowX = rng(92) * GAME_WIDTH;
      const glowY = rng(93) * CHUNK_HEIGHT;
      const glow = this.scene.add.ellipse(
        glowX, glowY,
        120 + rng(94) * 200, 80 + rng(95) * 120,
        glowColor, 0.18,
      );
      container.add(glow);
    }

    // Scattered ground details
    const detailCount = 10 + Math.floor(rng(0) * 12);
    for (let i = 0; i < detailCount; i++) {
      const x = rng(i * 3 + 1) * GAME_WIDTH;
      const y = rng(i * 3 + 2) * CHUNK_HEIGHT;
      const type = rng(i * 3 + 4);

      if (type < 0.25) {
        // Cracked earth patch
        const color = t.detailColors[Math.floor(rng(i * 3 + 3) * t.detailColors.length)];
        const w = 20 + rng(i * 3 + 5) * 70;
        const h = 10 + rng(i * 3 + 6) * 35;
        const patch = this.scene.add.ellipse(x, y, w, h, color, 0.5);
        container.add(patch);
        const crack = this.scene.add.rectangle(x, y, w * 0.6, 1, 0x080810, 0.6);
        crack.setAngle(rng(i * 3 + 11) * 60 - 30);
        container.add(crack);
      } else if (type < 0.45) {
        // Rocks
        const size = 3 + rng(i * 3 + 7) * 10;
        const rock = this.scene.add.circle(x, y, size, t.detailColors[0], 0.6);
        container.add(rock);
        const highlight = this.scene.add.circle(x - size * 0.2, y - size * 0.2, size * 0.4, t.detailColors[2] ?? t.detailColors[0], 0.4);
        container.add(highlight);
      } else if (type < 0.65) {
        // Dead grass / thorns — tinted with a hint of the accent color
        const bladeColor = this.blendColor(0x1a2810, t.accentColor, 0.15);
        const g = this.scene.add.rectangle(x, y, 2, 8 + rng(i * 3 + 8) * 8, bladeColor, 0.5);
        g.setAngle(rng(i * 3 + 12) * 20 - 10);
        container.add(g);
        if (rng(i * 3 + 9) > 0.4) {
          const g2 = this.scene.add.rectangle(x + 4, y + 1, 2, 6 + rng(i * 3 + 10) * 6, bladeColor, 0.4);
          g2.setAngle(rng(i * 3 + 13) * 30 - 15);
          container.add(g2);
        }
        if (rng(i * 3 + 14) > 0.6) {
          const g3 = this.scene.add.rectangle(x - 3, y + 2, 2, 5 + rng(i * 3 + 15) * 5, bladeColor, 0.35);
          g3.setAngle(rng(i * 3 + 16) * 20 + 5);
          container.add(g3);
        }
      } else if (type < 0.8) {
        // Skull / bone fragments
        const boneColor = t.detailColors[t.detailColors.length - 1];
        const bone = this.scene.add.circle(x, y, 3 + rng(i * 3 + 17) * 3, boneColor, 0.35);
        container.add(bone);
        const frag = this.scene.add.rectangle(x + 5, y + 1, 6 + rng(i * 3 + 18) * 4, 2, boneColor, 0.3);
        frag.setAngle(rng(i * 3 + 19) * 90);
        container.add(frag);
      } else {
        // Embers / faint glow dots — use glow colors
        const emberColor = t.glowColors[Math.floor(rng(i * 3 + 20) * t.glowColors.length)];
        const ember = this.scene.add.circle(x, y, 2 + rng(i * 3 + 21) * 3, emberColor, 0.35);
        container.add(ember);
      }
    }

    // Occasional worn path / trail
    if (rng(99) < 0.3) {
      const pathX = GAME_WIDTH * 0.25 + rng(100) * GAME_WIDTH * 0.5;
      const pathW = 10 + rng(101) * 16;
      const pathColor = t.detailColors[1] ?? t.detailColors[0];
      const path = this.scene.add.rectangle(pathX, CHUNK_HEIGHT / 2, pathW, CHUNK_HEIGHT, pathColor, 0.2);
      container.add(path);
    }

    this.chunks.set(index, container);
  }

  /** Simple channel-blend between two colors */
  private blendColor(a: number, b: number, t: number): number {
    const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
    const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
    const r = Math.round(ar + (br - ar) * t);
    const g = Math.round(ag + (bg - ag) * t);
    const bl = Math.round(ab + (bb - ab) * t);
    return (r << 16) | (g << 8) | bl;
  }

  destroy(): void {
    for (const [, container] of this.chunks) {
      container.destroy();
    }
    this.chunks.clear();
  }
}
