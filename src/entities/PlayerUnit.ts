import Phaser from 'phaser';
import { UNIT_FIRE_RATE } from '@/config/GameConfig';

export class PlayerUnit extends Phaser.GameObjects.Sprite {
  active: boolean = false;
  fireTimer: number = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'unit');
    scene.add.existing(this);
    this.setVisible(false);
    this.setActive(false);
  }

  spawn(x: number, y: number): void {
    this.setPosition(x, y);
    this.setVisible(true);
    this.setActive(true);
    // Randomize start timer so units don't all fire at the same instant
    this.fireTimer = Math.random() * UNIT_FIRE_RATE;
  }

  /** Reposition without resetting fire timer */
  moveTo(x: number, y: number): void {
    this.setPosition(x, y);
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
