// src/systems/ParticlePool.ts
// Shared short-lived sprite VFX pool (hit sparks, muzzle flashes, trail dots,
// impact particles). Replaces the previous pattern of `scene.add.sprite + tween`
// per effect, which produced thousands of allocations per second at peak combat.
//
// Particles are updated manually each frame (linear alpha + scale lerp,
// optional velocity), so there's no per-particle Tween either.

import Phaser from 'phaser';

interface Particle {
  sprite: Phaser.GameObjects.Sprite;
  active: boolean;
  life: number;
  totalLife: number;
  vx: number;
  vy: number;
  startScale: number;
  endScale: number;
  startAlpha: number;
}

export interface ParticleSpawnConfig {
  x: number;
  y: number;
  textureKey: string;
  tint: number;
  scale: number;
  /** Final scale at end of life. Defaults to scale * 0.3. */
  endScale?: number;
  alpha?: number;
  vx?: number;
  vy?: number;
  life: number;
  blendAdd?: boolean;
  rotation?: number;
  depth?: number;
}

export class ParticlePool {
  private pool: Particle[];
  private freeStack: Particle[];
  private defaultDepth: number;

  constructor(scene: Phaser.Scene, capacity: number, seedTexture: string, defaultDepth: number = 4) {
    this.defaultDepth = defaultDepth;
    this.pool = new Array(capacity);
    this.freeStack = [];
    for (let i = 0; i < capacity; i++) {
      const sprite = scene.add.sprite(0, 0, seedTexture);
      sprite.setVisible(false).setActive(false).setDepth(defaultDepth);
      this.pool[i] = {
        sprite,
        active: false,
        life: 0,
        totalLife: 0,
        vx: 0,
        vy: 0,
        startScale: 1,
        endScale: 0,
        startAlpha: 1,
      };
    }
    // Push in reverse so the first acquire returns pool[0].
    for (let i = capacity - 1; i >= 0; i--) {
      this.freeStack.push(this.pool[i]);
    }
  }

  /** Returns false if the pool is exhausted (the spawn is silently dropped). */
  spawn(cfg: ParticleSpawnConfig): boolean {
    const p = this.freeStack.pop();
    if (!p) return false;
    p.active = true;
    p.life = cfg.life;
    p.totalLife = cfg.life;
    p.vx = cfg.vx ?? 0;
    p.vy = cfg.vy ?? 0;
    p.startScale = cfg.scale;
    p.endScale = cfg.endScale ?? cfg.scale * 0.3;
    p.startAlpha = cfg.alpha ?? 1;

    const s = p.sprite;
    if (s.texture.key !== cfg.textureKey) {
      s.setTexture(cfg.textureKey);
    }
    s.setPosition(cfg.x, cfg.y);
    s.setTint(cfg.tint);
    s.setScale(cfg.scale);
    s.setAlpha(p.startAlpha);
    s.setRotation(cfg.rotation ?? 0);
    s.setDepth(cfg.depth ?? this.defaultDepth);
    s.setBlendMode(cfg.blendAdd ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL);
    s.setVisible(true);
    s.setActive(true);
    return true;
  }

  update(delta: number): void {
    const dt = delta / 1000;
    const len = this.pool.length;
    for (let i = 0; i < len; i++) {
      const p = this.pool[i];
      if (!p.active) continue;
      p.life -= delta;
      if (p.life <= 0) {
        p.active = false;
        p.sprite.setVisible(false).setActive(false);
        this.freeStack.push(p);
        continue;
      }
      const s = p.sprite;
      if (p.vx !== 0 || p.vy !== 0) {
        s.x += p.vx * dt;
        s.y += p.vy * dt;
      }
      const t = 1 - p.life / p.totalLife;
      s.alpha = p.startAlpha * (1 - t);
      const scale = p.startScale + (p.endScale - p.startScale) * t;
      s.setScale(scale);
    }
  }

  releaseAll(): void {
    for (const p of this.pool) {
      if (!p.active) continue;
      p.active = false;
      p.sprite.setVisible(false).setActive(false);
      this.freeStack.push(p);
    }
  }

  destroy(): void {
    for (const p of this.pool) p.sprite.destroy();
  }
}
