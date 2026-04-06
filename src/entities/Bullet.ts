import Phaser from 'phaser';
import { BULLET_SPEED, BULLET_DAMAGE } from '@/config/GameConfig';

export class Bullet extends Phaser.GameObjects.Sprite {
  active: boolean = false;
  velocityX: number = 0;
  velocityY: number = 0;
  damage: number = BULLET_DAMAGE;
  private trail: Phaser.GameObjects.Sprite | null = null;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'bullet');
    scene.add.existing(this);
    this.setVisible(false);
    this.setActive(false);
    this.setScale(1.8);

    // Pre-create a trail sprite (reused, not spawned per frame)
    this.trail = scene.add.sprite(0, 0, 'bullet');
    this.trail.setVisible(false);
    this.trail.setActive(false);
    this.trail.setAlpha(0.3);
    this.trail.setScale(1.2);
  }

  fire(fromX: number, fromY: number, tint?: number): void {
    this.setPosition(fromX, fromY);
    this.setVisible(true);
    this.setActive(true);
    this.velocityX = 0;
    this.velocityY = -BULLET_SPEED;

    if (tint) {
      this.setTint(tint);
      this.trail?.setTint(tint);
    } else {
      this.clearTint();
      this.trail?.clearTint();
    }
  }

  updateMovement(delta: number): void {
    if (!this.active) return;
    const dt = delta / 1000;

    // Update trail position (trails behind by a few pixels)
    if (this.trail) {
      this.trail.setPosition(this.x, this.y + 8);
      this.trail.setVisible(true);
      this.trail.setActive(true);
    }

    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;
  }

  despawn(): void {
    this.setVisible(false);
    this.setActive(false);
    if (this.trail) {
      this.trail.setVisible(false);
      this.trail.setActive(false);
    }
  }
}
