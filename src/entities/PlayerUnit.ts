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

  /** Smoothly move toward target and apply separation from neighbors */
  updatePhysics(delta: number, allUnits: PlayerUnit[]): void {
    if (!this.active) return;
    const dt = delta / 1000;
    const moveSpeed = 400;

    // Move toward formation target
    let dx = this.targetX - this.x;
    let dy = this.targetY - this.y;
    const distToTarget = Math.sqrt(dx * dx + dy * dy);
    if (distToTarget > 1) {
      this.x += (dx / distToTarget) * Math.min(moveSpeed * dt, distToTarget);
      this.y += (dy / distToTarget) * Math.min(moveSpeed * dt, distToTarget);
    }

    // Separation: push apart from overlapping neighbors
    const separationRadius = 18;
    const pushForce = 150;
    let pushX = 0;
    let pushY = 0;

    for (const other of allUnits) {
      if (other === this || !other.active) continue;
      dx = this.x - other.x;
      dy = this.y - other.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < separationRadius && dist > 0.1) {
        const overlap = separationRadius - dist;
        pushX += (dx / dist) * overlap;
        pushY += (dy / dist) * overlap;
      }
    }

    this.x += pushX * pushForce * dt;
    this.y += pushY * pushForce * dt;
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
