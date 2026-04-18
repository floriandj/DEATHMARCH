import Phaser from 'phaser';
import {
  ENTITY_SCALE,
  SVG_RENDER_SCALE,
} from '@/config/GameConfig';

export class PlayerUnit extends Phaser.GameObjects.Sprite {
  active: boolean = false;
  fireTimer: number = 0;
  stunTimer: number = 0;
  /** Target position this unit moves toward */
  targetX: number = 0;
  targetY: number = 0;
  /** Permanent offset so each unit fires at its own rhythm */
  private readonly fireOffset: number;
  /** Pool index — used for bullet-to-unit tracking */
  readonly poolIndex: number;

  constructor(scene: Phaser.Scene, index: number = 0) {
    super(scene, 0, 0, 'unit');
    scene.add.existing(this);
    this.setVisible(false);
    this.setActive(false);
    this.poolIndex = index;
    this.fireOffset = (index * 37) % 200; // spread across base fire rate
  }

  get isStunned(): boolean {
    return this.stunTimer > 0;
  }

  stun(durationMs: number): void {
    this.stunTimer = durationMs;
    this.setTint(0xffff00);
  }

  spawn(x: number, y: number): void {
    this.setPosition(x, y);
    this.targetX = x;
    this.targetY = y;
    this.setVisible(true);
    this.setActive(true);
    this.fireTimer = this.fireOffset;
    this.stunTimer = 0;
    this.setAlpha(1);
    this.setScale(1.5 * ENTITY_SCALE / SVG_RENDER_SCALE);
    this.clearTint();
    this.play('unit_march');
  }

  /** Set target without resetting fire timer */
  moveTo(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
  }

  /** Physics: gentle pull toward target + strong separation = organic blob */
  updatePhysics(delta: number, allUnits: PlayerUnit[]): void {
    if (!this.active) return;

    // Tick stun timer
    if (this.stunTimer > 0) {
      this.stunTimer -= delta;
      if (this.stunTimer <= 0) {
        this.stunTimer = 0;
        this.clearTint();
      }
    }

    const dt = delta / 1000;

    // Pull toward formation target (keeps the group together)
    const pullStrength = 10;
    this.x += (this.targetX - this.x) * pullStrength * dt;
    this.y += (this.targetY - this.y) * pullStrength * dt;

    // Strong separation: units push apart, forming a natural blob
    const count = allUnits.length;
    const separationRadius = count > 50 ? 30 + Math.sqrt(count) * 1.5 : 30;
    let pushX = 0;
    let pushY = 0;

    for (const other of allUnits) {
      if (other === this || !other.active) continue;
      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < separationRadius && dist > 0.1) {
        const force = (separationRadius - dist) / separationRadius;
        pushX += (dx / dist) * force;
        pushY += (dy / dist) * force;
      }
    }

    const pushStrength = 200;
    this.x += pushX * pushStrength * dt;
    this.y += pushY * pushStrength * dt;
  }

  despawn(): void {
    this.stop();
    this.setVisible(false);
    this.setActive(false);
  }

  /** Plays a small death burst before despawning */
  despawnWithEffect(): void {
    const x = this.x;
    const y = this.y;
    this.despawn();

    // Spawn a few tinted particles
    for (let i = 0; i < 4; i++) {
      const p = this.scene.add.sprite(x, y, 'death_particle');
      p.setTint(0x00d4ff);
      p.setAlpha(0.8);
      const angle = Math.random() * Math.PI * 2;
      const dist = 15 + Math.random() * 20;
      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.3,
        duration: 300 + Math.random() * 200,
        onComplete: () => p.destroy(),
      });
    }
  }

  /**
   * Advance the fire timer. Returns true when a shot should be fired.
   * When `holdFire` is true the timer is clamped at `fireRate` so the unit stays
   * "loaded" and shoots immediately on the first frame a target is in range.
   */
  updateFiring(delta: number, fireRate: number, holdFire: boolean = false): boolean {
    if (!this.active || this.isStunned) return false;
    this.fireTimer += delta;
    if (this.fireTimer >= fireRate) {
      if (holdFire) {
        this.fireTimer = fireRate;
        return false;
      }
      this.fireTimer -= fireRate;
      return true;
    }
    return false;
  }
}
