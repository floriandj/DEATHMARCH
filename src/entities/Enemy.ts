import Phaser from 'phaser';
import { EnemyStats } from '@/config/EnemyConfig';

export class Enemy extends Phaser.GameObjects.Sprite {
  active: boolean = false;
  hp: number = 0;
  speed: number = 0;
  contactDamage: number = 0;
  splashRadius: number = 0;
  splashDamage: number = 0;
  scoreValue: number = 0;
  enemyType: string = '';

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'enemy_goblin');
    scene.add.existing(this);
    this.setVisible(false);
    this.setActive(false);
  }

  spawn(x: number, y: number, stats: EnemyStats): void {
    this.setPosition(x, y);
    this.setTexture(`enemy_${stats.type}`);
    this.setVisible(true);
    this.setActive(true);
    this.hp = stats.hp;
    this.speed = stats.speed;
    this.contactDamage = stats.contactDamage;
    this.splashRadius = stats.splashRadius;
    this.splashDamage = stats.splashDamage;
    this.scoreValue = stats.scoreValue;
    this.enemyType = stats.type;
  }

  updateMovement(delta: number, targetY: number): boolean {
    if (!this.active) return false;
    const dt = delta / 1000;
    const direction = targetY > this.y ? 1 : -1;
    this.y += direction * this.speed * dt;
    return Math.abs(this.y - targetY) < 10;
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.despawn();
      return true;
    }
    this.setTint(0xffffff);
    this.scene.time.delayedCall(50, () => {
      if (this.active) this.clearTint();
    });
    return false;
  }

  despawn(): void {
    this.setVisible(false);
    this.setActive(false);
  }
}
