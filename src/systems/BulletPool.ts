// src/systems/BulletPool.ts
// Data-driven bullet pool with O(1) spawn/despawn.
// Uses a tiny procedural texture + Phaser Sprites for efficient batched rendering.

import Phaser from 'phaser';
import { BULLET_SPEED, BULLET_DAMAGE } from '@/config/GameConfig';

/** Per-bullet state. */
export interface BulletData {
  x: number;
  y: number;
  vy: number;
  damage: number;
  color: number;
  active: boolean;
  /** Index of the PlayerUnit that fired this bullet (-1 if unknown) */
  ownerIndex: number;
}

/** Texture key for the shared procedural bullet sprite. */
const TEX_KEY = '__bullet_pool';

export class BulletPool {
  private pool: BulletData[];
  private sprites: Phaser.GameObjects.Sprite[];
  private freeStack: number[];

  constructor(scene: Phaser.Scene, capacity: number, depth: number = 5) {
    // Generate a tiny white pill texture once (tinted per-bullet at fire time)
    if (!scene.textures.exists(TEX_KEY)) {
      const g = scene.add.graphics();
      g.fillStyle(0xffffff, 1);
      g.fillRoundedRect(0, 0, 4, 8, 2);
      g.generateTexture(TEX_KEY, 4, 8);
      g.destroy();
    }

    this.pool = new Array(capacity);
    this.sprites = new Array(capacity);
    this.freeStack = new Array(capacity);

    for (let i = 0; i < capacity; i++) {
      this.pool[i] = { x: 0, y: 0, vy: 0, damage: BULLET_DAMAGE, color: 0xffd43b, active: false, ownerIndex: -1 };
      this.freeStack[i] = capacity - 1 - i;

      const s = scene.add.sprite(0, 0, TEX_KEY);
      s.setVisible(false);
      s.setActive(false);
      s.setDepth(depth);
      this.sprites[i] = s;
    }
  }

  /** Spawn a bullet. Returns false if pool is exhausted. */
  fire(x: number, y: number, color: number, ownerIndex: number = -1, damageMult: number = 1): boolean {
    if (this.freeStack.length === 0) return false;
    const idx = this.freeStack.pop()!;
    const b = this.pool[idx];
    b.x = x;
    b.y = y;
    b.vy = -BULLET_SPEED;
    b.damage = Math.round(BULLET_DAMAGE * damageMult);
    b.color = color;
    b.active = true;
    b.ownerIndex = ownerIndex;

    const s = this.sprites[idx];
    s.setPosition(x, y);
    s.setTint(color);
    s.setVisible(true);
    s.setActive(true);
    return true;
  }

  /** Return a bullet to the free list. */
  despawn(idx: number): void {
    const b = this.pool[idx];
    if (b.active) {
      b.active = false;
      this.freeStack.push(idx);
      const s = this.sprites[idx];
      s.setVisible(false);
      s.setActive(false);
    }
  }

  /** Move all active bullets and sync sprite positions. */
  update(delta: number): void {
    const dt = delta / 1000;
    const len = this.pool.length;
    for (let i = 0; i < len; i++) {
      const b = this.pool[i];
      if (!b.active) continue;
      b.y += b.vy * dt;
      this.sprites[i].y = b.y;
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
    for (const s of this.sprites) s.destroy();
  }
}
