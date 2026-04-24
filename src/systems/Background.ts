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

    // Road/path down center — tiled stones per world when useStonePath is on
    const pathColor = t.pathColor ?? this.blendColor(t.groundColor, 0x000000, 0.2);
    const pathLight = this.blendColor(pathColor, 0xffffff, 0.25);
    const pathDark = this.blendColor(pathColor, 0x000000, 0.35);
    const roadWidth = 72;

    if (t.useStonePath) {
      // Dirt bed underneath for contrast
      const bed = this.scene.add.rectangle(
        GAME_WIDTH / 2, CHUNK_HEIGHT / 2,
        roadWidth + 10, CHUNK_HEIGHT,
        pathDark, 0.45,
      );
      container.add(bed);

      // 2-column cobblestone pattern
      const tile = 12;
      const rows = Math.ceil(CHUNK_HEIGHT / tile) + 1;
      for (let row = 0; row < rows; row++) {
        const ty = row * tile;
        const stagger = (row % 2) * (tile / 2);
        for (let col = -2; col <= 2; col++) {
          const tx = GAME_WIDTH / 2 + col * tile + stagger;
          const variation = rng(row * 7 + col * 13);
          const tileColor = variation < 0.5 ? pathColor : pathLight;
          const stone = this.scene.add.rectangle(tx, ty, tile - 2, tile - 2, tileColor, 0.85);
          container.add(stone);
          // Small highlight corner
          if (variation < 0.35) {
            const hl = this.scene.add.rectangle(tx - 2, ty - 2, 3, 1, 0xffffff, 0.15);
            container.add(hl);
          }
        }
      }
      // Road edge shadow
      const edgeL = this.scene.add.rectangle(GAME_WIDTH / 2 - roadWidth / 2 - 1, CHUNK_HEIGHT / 2, 2, CHUNK_HEIGHT, pathDark, 0.6);
      const edgeR = this.scene.add.rectangle(GAME_WIDTH / 2 + roadWidth / 2 + 1, CHUNK_HEIGHT / 2, 2, CHUNK_HEIGHT, pathDark, 0.6);
      container.add(edgeL); container.add(edgeR);
    } else {
      // Plain dirt path (swamp / plague uses this — squishy feel)
      const road = this.scene.add.rectangle(GAME_WIDTH / 2, CHUNK_HEIGHT / 2, roadWidth, CHUNK_HEIGHT, pathColor, 0.45);
      container.add(road);
      for (let r = 0; r < 4; r++) {
        const ry = rng(300 + r) * CHUNK_HEIGHT;
        const rx = GAME_WIDTH / 2 + (rng(310 + r) - 0.5) * (roadWidth - 10);
        const puddle = this.scene.add.ellipse(rx, ry, 20 + rng(320 + r) * 14, 6, pathDark, 0.5);
        container.add(puddle);
      }
      const edgeL = this.scene.add.rectangle(GAME_WIDTH / 2 - roadWidth / 2, CHUNK_HEIGHT / 2, 2, CHUNK_HEIGHT, pathDark, 0.4);
      const edgeR = this.scene.add.rectangle(GAME_WIDTH / 2 + roadWidth / 2, CHUNK_HEIGHT / 2, 2, CHUNK_HEIGHT, pathDark, 0.4);
      container.add(edgeL); container.add(edgeR);
    }

    // Color variation bands (richer)
    const bandCount = 3 + Math.floor(rng(50) * 4);
    for (let b = 0; b < bandCount; b++) {
      const bandY = rng(60 + b) * CHUNK_HEIGHT;
      const bandH = 30 + rng(70 + b) * 120;
      const bandColor = t.detailColors[Math.floor(rng(80 + b) * t.detailColors.length)];
      const band = this.scene.add.rectangle(
        GAME_WIDTH / 2, bandY,
        GAME_WIDTH, bandH,
        bandColor, 0.25,
      );
      container.add(band);
    }

    // Ambient glow patches
    if (rng(90) < 0.5) {
      const glowColor = t.glowColors[Math.floor(rng(91) * t.glowColors.length)];
      const glowX = rng(92) * GAME_WIDTH;
      const glowY = rng(93) * CHUNK_HEIGHT;
      const glow = this.scene.add.ellipse(
        glowX, glowY,
        140 + rng(94) * 220, 90 + rng(95) * 140,
        glowColor, 0.15,
      );
      container.add(glow);
    }

    // Ground details (procedural shapes)
    const detailCount = 8 + Math.floor(rng(0) * 10);
    for (let i = 0; i < detailCount; i++) {
      const x = rng(i * 3 + 1) * GAME_WIDTH;
      const y = rng(i * 3 + 2) * CHUNK_HEIGHT;
      const type = rng(i * 3 + 4);

      if (type < 0.2) {
        const color = t.detailColors[Math.floor(rng(i * 3 + 3) * t.detailColors.length)];
        const w = 20 + rng(i * 3 + 5) * 60;
        const h = 10 + rng(i * 3 + 6) * 30;
        container.add(this.scene.add.ellipse(x, y, w, h, color, 0.4));
      } else if (type < 0.35) {
        const size = 2 + rng(i * 3 + 7) * 8;
        container.add(this.scene.add.circle(x, y, size, t.detailColors[0], 0.4));
        container.add(this.scene.add.circle(x - size * 0.2, y - size * 0.2, size * 0.3, t.glowColors[0], 0.25));
      } else if (type < 0.55) {
        const grassColor = this.blendColor(t.groundColor, t.glowColors[0], 0.4);
        for (let b = 0; b < 3; b++) {
          const blade = this.scene.add.rectangle(x + b * 3 - 3, y, 2, 6 + rng(i * 3 + 8 + b) * 8, grassColor, 0.5);
          blade.setAngle(rng(i * 3 + 12 + b) * 30 - 15);
          container.add(blade);
        }
      } else if (type < 0.7) {
        const flowerColor = t.glowColors[Math.floor(rng(i * 3 + 20) * t.glowColors.length)];
        container.add(this.scene.add.circle(x, y, 2 + rng(i * 3 + 21) * 2, flowerColor, 0.5));
      } else {
        container.add(this.scene.add.ellipse(x, y, 30 + rng(i * 3 + 23) * 40, 15, 0x000000, 0.06));
      }
    }

    // Decoration sprites from the world's themed decor pool
    const decorKeys = (t.decorKeys && t.decorKeys.length) ? t.decorKeys : ['decor_tree', 'decor_rock', 'decor_bush'];
    const decorCount = 4 + Math.floor(rng(200) * 5);
    for (let d = 0; d < decorCount; d++) {
      const dx = rng(210 + d * 3);
      // Avoid center road area
      const decorX = dx < 0.5
        ? 20 + rng(211 + d * 3) * (GAME_WIDTH * 0.35 - 20)
        : GAME_WIDTH * 0.65 + rng(211 + d * 3) * (GAME_WIDTH * 0.35 - 20);
      const decorY = rng(212 + d * 3) * CHUNK_HEIGHT;
      const key = decorKeys[Math.floor(rng(213 + d * 3) * decorKeys.length)];

      if (this.scene.textures.exists(key)) {
        const sprite = this.scene.add.image(decorX, decorY, key);
        sprite.setAlpha(0.75 + rng(214 + d * 3) * 0.25);
        sprite.setScale(1.2 + rng(215 + d * 3) * 1.0);
        // Only tint neutral-colored decor (trees/bones/stones) so themed items keep their color
        const neutralKeys = ['decor_tree', 'decor_pine', 'decor_bush', 'decor_stump', 'decor_log', 'decor_column'];
        if (neutralKeys.includes(key)) {
          sprite.setTint(t.detailColors[Math.floor(rng(216 + d * 3) * t.detailColors.length)]);
        }
        container.add(sprite);
      }
    }

    // Worn path (occasional)
    if (rng(99) < 0.25) {
      const pathX = GAME_WIDTH * 0.2 + rng(100) * GAME_WIDTH * 0.6;
      const pathW = 10 + rng(101) * 16;
      const pc = t.detailColors[1] ?? t.detailColors[0];
      const p = this.scene.add.rectangle(pathX, CHUNK_HEIGHT / 2, pathW, CHUNK_HEIGHT, pc, 0.15);
      container.add(p);
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
