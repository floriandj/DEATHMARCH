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
  private enemyColor: number = 0xff6b6b;

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
    this.enemyColor = stats.color;
    this.setAlpha(1);
    this.setScale(1);
    this.play(`enemy_${stats.type}_walk`);
  }

  updateMovement(delta: number, targetX: number, targetY: number, armyWorldY: number): boolean {
    if (!this.active) return false;
    const dt = delta / 1000;
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 10) return true;

    // Speed boost if enemy got behind the army line
    const behindLine = this.y > armyWorldY;
    const currentSpeed = behindLine ? this.speed * 2.5 : this.speed;

    this.x += (dx / dist) * currentSpeed * dt;
    this.y += (dy / dist) * currentSpeed * dt;
    return false;
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.playDeathEffect();
      this.despawn();
      return true;
    }
    this.setTint(0xffffff);
    this.scene.time.delayedCall(50, () => {
      if (this.active) this.clearTint();
    });
    return false;
  }

  private playDeathEffect(): void {
    const x = this.x;
    const y = this.y;
    const color = this.enemyColor;
    const count = 6;

    for (let i = 0; i < count; i++) {
      const p = this.scene.add.sprite(x, y, 'death_particle');
      p.setTint(color);
      p.setAlpha(1);
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 20 + Math.random() * 25;
      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: 250 + Math.random() * 150,
        onComplete: () => p.destroy(),
      });
    }
  }

  despawn(): void {
    this.stop();
    this.setVisible(false);
    this.setActive(false);
  }
}
