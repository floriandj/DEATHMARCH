import Phaser from 'phaser';
import { GAME_WIDTH } from '@/config/GameConfig';

const CHUNK_HEIGHT = 400;
const GROUND_COLOR = 0x1a1a0a;
const DETAIL_COLORS = [0x222210, 0x1e1e0e, 0x262612, 0x2a2a14, 0x161608];

/** Procedural scrolling background that generates terrain chunks on the fly */
export class Background {
  private scene: Phaser.Scene;
  private chunks: Map<number, Phaser.GameObjects.Container> = new Map();
  private lastGeneratedChunk: number = Infinity;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
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
    const container = this.scene.add.container(0, index * CHUNK_HEIGHT);
    container.setDepth(-100); // behind everything

    const worldY = index * CHUNK_HEIGHT;

    // Ground base
    const bg = this.scene.add.rectangle(
      GAME_WIDTH / 2, CHUNK_HEIGHT / 2,
      GAME_WIDTH, CHUNK_HEIGHT,
      GROUND_COLOR,
    );
    container.add(bg);

    // Seed RNG from chunk index for consistent regeneration
    const seed = Math.abs(index * 7919 + 1327);
    const rng = (n: number) => {
      const x = Math.sin(seed + n * 9973) * 43758.5453;
      return x - Math.floor(x);
    };

    // Scattered ground details (dirt patches, rocks, grass)
    const detailCount = 8 + Math.floor(rng(0) * 10);
    for (let i = 0; i < detailCount; i++) {
      const x = rng(i * 3 + 1) * GAME_WIDTH;
      const y = rng(i * 3 + 2) * CHUNK_HEIGHT;
      const color = DETAIL_COLORS[Math.floor(rng(i * 3 + 3) * DETAIL_COLORS.length)];
      const type = rng(i * 3 + 4);

      if (type < 0.4) {
        // Dirt patch
        const w = 20 + rng(i * 3 + 5) * 60;
        const h = 10 + rng(i * 3 + 6) * 30;
        const patch = this.scene.add.ellipse(x, y, w, h, color, 0.4);
        container.add(patch);
      } else if (type < 0.7) {
        // Small rocks
        const size = 3 + rng(i * 3 + 7) * 8;
        const rock = this.scene.add.circle(x, y, size, 0x333322, 0.5);
        container.add(rock);
      } else {
        // Grass tuft
        const g = this.scene.add.rectangle(x, y, 2, 6 + rng(i * 3 + 8) * 6, 0x2d4a1a, 0.4);
        container.add(g);
        if (rng(i * 3 + 9) > 0.5) {
          const g2 = this.scene.add.rectangle(x + 4, y + 1, 2, 5 + rng(i * 3 + 10) * 5, 0x2d4a1a, 0.35);
          container.add(g2);
        }
      }
    }

    // Occasional path/trail lines running vertically
    if (rng(99) < 0.3) {
      const pathX = GAME_WIDTH * 0.3 + rng(100) * GAME_WIDTH * 0.4;
      const path = this.scene.add.rectangle(pathX, CHUNK_HEIGHT / 2, 8 + rng(101) * 12, CHUNK_HEIGHT, 0x1f1f0f, 0.3);
      container.add(path);
    }

    this.chunks.set(index, container);
  }

  destroy(): void {
    for (const [, container] of this.chunks) {
      container.destroy();
    }
    this.chunks.clear();
  }
}
