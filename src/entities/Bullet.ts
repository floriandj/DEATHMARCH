import Phaser from 'phaser';
import { BULLET_SPEED, BULLET_DAMAGE } from '@/config/GameConfig';

export class Bullet extends Phaser.GameObjects.Sprite {
  active: boolean = false;
  velocityX: number = 0;
  velocityY: number = 0;
  damage: number = BULLET_DAMAGE;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'bullet');
    scene.add.existing(this);
    this.setVisible(false);
    this.setActive(false);
  }

  fire(fromX: number, fromY: number): void {
    this.setPosition(fromX, fromY);
    this.setVisible(true);
    this.setActive(true);

    // Always fire straight up
    this.velocityX = 0;
    this.velocityY = -BULLET_SPEED;
  }

  updateMovement(delta: number): void {
    if (!this.active) return;
    const dt = delta / 1000;
    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;
  }

  despawn(): void {
    this.setVisible(false);
    this.setActive(false);
  }
}
