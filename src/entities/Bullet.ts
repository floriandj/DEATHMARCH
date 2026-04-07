import Phaser from 'phaser';
import { BULLET_SPEED, BULLET_DAMAGE, ENTITY_SCALE, SVG_RENDER_SCALE } from '@/config/GameConfig';

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
    this.setScale(1.5 * ENTITY_SCALE / SVG_RENDER_SCALE);
  }

  fire(fromX: number, fromY: number, tint?: number): void {
    this.setPosition(fromX, fromY);
    this.setVisible(true);
    this.setActive(true);
    this.setAlpha(1);
    this.velocityX = 0;
    this.velocityY = -BULLET_SPEED;

    if (tint) {
      this.setTint(tint);
    } else {
      this.clearTint();
    }
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
