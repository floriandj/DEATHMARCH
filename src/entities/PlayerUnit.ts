import Phaser from 'phaser';
import { UNIT_FIRE_RATE } from '@/config/GameConfig';

export class PlayerUnit extends Phaser.GameObjects.Sprite {
  active: boolean = false;
  fireTimer: number = 0;
  /** Permanent offset so each unit fires at its own rhythm */
  private readonly fireOffset: number;

  constructor(scene: Phaser.Scene, index: number = 0) {
    super(scene, 0, 0, 'unit');
    scene.add.existing(this);
    this.setVisible(false);
    this.setActive(false);
    // Each unit gets a unique offset based on its pool index
    this.fireOffset = (index * 37) % UNIT_FIRE_RATE;
  }

  spawn(x: number, y: number): void {
    this.setPosition(x, y);
    this.setVisible(true);
    this.setActive(true);
    this.fireTimer = this.fireOffset;
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
