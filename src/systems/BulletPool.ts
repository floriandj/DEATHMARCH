// src/systems/BulletPool.ts
// Lightweight data-driven bullet pool.  All bullets are rendered in a single
// Graphics draw call instead of using one Phaser Sprite per bullet.

import Phaser from 'phaser';
import { BULLET_SPEED, BULLET_DAMAGE } from '@/config/GameConfig';

/** Per-bullet state — plain data, no Phaser overhead. */
export interface BulletData {
  x: number;
  y: number;
  vy: number;
  damage: number;
  color: number;
  active: boolean;
}

export class BulletPool {
  private pool: BulletData[];
  private freeStack: number[];
  private gfx: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, capacity: number, depth: number = 5) {
    this.gfx = scene.add.graphics().setDepth(depth);

    this.pool = new Array(capacity);
    this.freeStack = new Array(capacity);
    for (let i = 0; i < capacity; i++) {
      this.pool[i] = { x: 0, y: 0, vy: 0, damage: BULLET_DAMAGE, color: 0xffd43b, active: false };
      this.freeStack[i] = capacity - 1 - i; // top of stack = index 0
    }
  }

  /** Spawn a bullet. Returns false if pool is exhausted. */
  fire(x: number, y: number, color: number): boolean {
    if (this.freeStack.length === 0) return false;
    const idx = this.freeStack.pop()!;
    const b = this.pool[idx];
    b.x = x;
    b.y = y;
    b.vy = -BULLET_SPEED;
    b.damage = BULLET_DAMAGE;
    b.color = color;
    b.active = true;
    return true;
  }

  /** Return a bullet to the free list. */
  despawn(idx: number): void {
    const b = this.pool[idx];
    if (b.active) {
      b.active = false;
      this.freeStack.push(idx);
    }
  }

  /** Move all active bullets. */
  update(delta: number): void {
    const dt = delta / 1000;
    const len = this.pool.length;
    for (let i = 0; i < len; i++) {
      const b = this.pool[i];
      if (!b.active) continue;
      b.y += b.vy * dt;
    }
  }

  /** Render every active bullet via the single shared Graphics object. */
  draw(): void {
    const g = this.gfx;
    g.clear();
    const len = this.pool.length;
    for (let i = 0; i < len; i++) {
      const b = this.pool[i];
      if (!b.active) continue;
      // Colored body — small rounded pill shape
      g.fillStyle(b.color, 1);
      g.fillRoundedRect(b.x - 2, b.y - 4, 4, 8, 2);
      // Bright tip
      g.fillStyle(0xffffff, 0.7);
      g.fillCircle(b.x, b.y - 3, 1.5);
    }
  }

  /**
   * Iterate active bullets for collision / culling.
   * Callback receives the bullet data and its pool index.
   */
  forEachActive(fn: (b: BulletData, idx: number) => void): void {
    const len = this.pool.length;
    for (let i = 0; i < len; i++) {
      if (this.pool[i].active) fn(this.pool[i], i);
    }
  }

  destroy(): void {
    this.gfx.destroy();
  }
}
