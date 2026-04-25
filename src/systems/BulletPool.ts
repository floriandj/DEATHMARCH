// src/systems/BulletPool.ts
// Data-driven bullet pool with O(1) spawn/despawn.
// Supports per-bullet texture/scale (set by weapon) and lightweight trails.

import Phaser from 'phaser';
import { BULLET_SPEED, BULLET_DAMAGE } from '@/config/GameConfig';
import type { TrailKind } from '@/config/WeaponFx';
import type { ParticlePool } from '@/systems/ParticlePool';

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
  /** How many more enemies this bullet can pierce through */
  pierceCount: number;
  /** Trail effect kind — determines particle cadence/size */
  trail: TrailKind;
  /** ms until next trail particle spawn */
  trailTimer: number;
}

/** Fallback pill texture used when a weapon doesn't specify one. */
const FALLBACK_TEX = '__bullet_pool_fallback';

export class BulletPool {
  private scene: Phaser.Scene;
  private pool: BulletData[];
  private sprites: Phaser.GameObjects.Sprite[];
  private freeStack: number[];
  private depth: number;
  private particles: ParticlePool | null;

  constructor(scene: Phaser.Scene, capacity: number, depth: number = 5, particles: ParticlePool | null = null) {
    this.scene = scene;
    this.depth = depth;
    this.particles = particles;

    if (!scene.textures.exists(FALLBACK_TEX)) {
      const g = scene.add.graphics();
      g.fillStyle(0xffffff, 1);
      g.fillRoundedRect(0, 0, 4, 8, 2);
      g.generateTexture(FALLBACK_TEX, 4, 8);
      g.destroy();
    }

    this.pool = new Array(capacity);
    this.sprites = new Array(capacity);
    this.freeStack = new Array(capacity);

    for (let i = 0; i < capacity; i++) {
      this.pool[i] = { x: 0, y: 0, vy: 0, damage: BULLET_DAMAGE, color: 0xffd43b, active: false, ownerIndex: -1, pierceCount: 0, trail: 'none', trailTimer: 0 };
      this.freeStack[i] = capacity - 1 - i;

      const s = scene.add.sprite(0, 0, FALLBACK_TEX);
      s.setVisible(false);
      s.setActive(false);
      s.setDepth(depth);
      this.sprites[i] = s;
    }
  }

  /** Spawn a bullet. Returns false if pool is exhausted. */
  fire(
    x: number, y: number, color: number,
    ownerIndex: number = -1, damageMult: number = 1, pierceCount: number = 0,
    textureKey: string = FALLBACK_TEX, scale: number = 1, trail: TrailKind = 'none',
  ): boolean {
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
    b.pierceCount = pierceCount;
    b.trail = trail;
    b.trailTimer = 0;

    const s = this.sprites[idx];
    const texKey = this.scene.textures.exists(textureKey) ? textureKey : FALLBACK_TEX;
    s.setTexture(texKey);
    s.setScale(scale);
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

  /** Move all active bullets and sync sprite positions. Spawns trail particles. */
  update(delta: number): void {
    const dt = delta / 1000;
    const len = this.pool.length;
    for (let i = 0; i < len; i++) {
      const b = this.pool[i];
      if (!b.active) continue;
      b.y += b.vy * dt;
      this.sprites[i].y = b.y;

      if (b.trail !== 'none') {
        b.trailTimer -= delta;
        if (b.trailTimer <= 0) {
          this.emitTrailParticle(b);
          b.trailTimer = this.trailInterval(b.trail);
        }
      }
    }
  }

  private trailInterval(kind: TrailKind): number {
    switch (kind) {
      case 'rail':   return 18;
      case 'plasma': return 28;
      case 'void':   return 26;
      case 'holy':   return 22;
      default:       return 9999;
    }
  }

  private emitTrailParticle(b: BulletData): void {
    const scale = b.trail === 'holy' ? 2.0 : b.trail === 'plasma' ? 1.6 : 1.3;
    const life = b.trail === 'rail' ? 120 : 200;

    if (this.particles && this.particles.spawn({
      x: b.x + (Math.random() - 0.5) * 2,
      y: b.y + 4,
      textureKey: 'trail_dot',
      tint: b.color,
      scale,
      endScale: scale * 0.3,
      alpha: 0.9,
      life,
      depth: this.depth - 1,
    })) return;

    // Fallback (no shared pool wired up): legacy sprite + tween path.
    const p = this.scene.add.sprite(b.x + (Math.random() - 0.5) * 2, b.y + 4, 'trail_dot');
    p.setTint(b.color);
    p.setDepth(this.depth - 1);
    p.setScale(scale);
    p.setAlpha(0.9);
    this.scene.tweens.add({
      targets: p,
      alpha: 0,
      scale: scale * 0.3,
      duration: life,
      onComplete: () => p.destroy(),
    });
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
