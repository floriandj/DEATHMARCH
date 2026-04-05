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

  fire(fromX: number, fromY: number, targetX: number, targetY: number): void {
    this.setPosition(fromX, fromY);
    this.setVisible(true);
    this.setActive(true);

    const angle = Math.atan2(targetY - fromY, targetX - fromX);
    this.velocityX = Math.cos(angle) * BULLET_SPEED;
    this.velocityY = Math.sin(angle) * BULLET_SPEED;
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
