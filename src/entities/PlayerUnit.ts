import Phaser from 'phaser';
import { UNIT_FIRE_RATE } from '@/config/GameConfig';

export class PlayerUnit extends Phaser.GameObjects.Sprite {
  active: boolean = false;
  fireTimer: number = 0;
  /** Target position this unit moves toward */
  targetX: number = 0;
  targetY: number = 0;
  /** Permanent offset so each unit fires at its own rhythm */
  private readonly fireOffset: number;

  constructor(scene: Phaser.Scene, index: number = 0) {
    super(scene, 0, 0, 'unit');
    scene.add.existing(this);
    this.setVisible(false);
    this.setActive(false);
    this.fireOffset = (index * 37) % UNIT_FIRE_RATE;
  }

  spawn(x: number, y: number): void {
    this.setPosition(x, y);
    this.targetX = x;
    this.targetY = y;
    this.setVisible(true);
    this.setActive(true);
    this.fireTimer = this.fireOffset;
  }

  /** Set target without resetting fire timer */
  moveTo(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
  }

  /** Snap to formation target, then apply small bump from overlapping neighbors */
  updatePhysics(delta: number, allUnits: PlayerUnit[]): void {
    if (!this.active) return;
    const dt = delta / 1000;

    // Snap toward formation position (strong pull)
    this.x += (this.targetX - this.x) * Math.min(1, 12 * dt);
    this.y += (this.targetY - this.y) * Math.min(1, 12 * dt);

    // Light bump: push apart when overlapping, creates jiggle not drift
    const bumpRadius = 16;
    let pushX = 0;
    let pushY = 0;

    for (const other of allUnits) {
      if (other === this || !other.active) continue;
      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bumpRadius && dist > 0.1) {
        pushX += (dx / dist) * 2;
        pushY += (dy / dist) * 2;
      }
    }

    this.x += pushX;
    this.y += pushY;
  }

  despawn(): void {
    this.setVisible(false);
    this.setActive(false);
  }

  updateFiring(delta: number): boolean {
    if (!this.active) return false;
    this.fireTimer += delta;
    if (this.fireTimer >= UNIT_FIRE_RATE) {
      this.fireTimer -= UNIT_FIRE_RATE;
      return true;
    }
    return false;
  }
}
