// src/scenes/BootScene.ts
import Phaser from 'phaser';
import { ENEMY_STATS, EnemyType } from '@/config/EnemyConfig';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    this.generatePlayerUnitTexture();
    this.generateBulletTexture();
    this.generateEnemyTextures();
    this.generateBossTexture();
    this.generateGateTextures();

    this.scene.start('MenuScene');
  }

  private generatePlayerUnitTexture(): void {
    const g = this.add.graphics();
    g.fillStyle(0x00d4ff, 1);
    g.fillRect(0, 0, 20, 20);
    g.generateTexture('unit', 20, 20);
    g.destroy();
  }

  private generateBulletTexture(): void {
    const g = this.add.graphics();
    g.fillStyle(0xffd43b, 1);
    g.fillCircle(3, 3, 3);
    g.generateTexture('bullet', 6, 6);
    g.destroy();
  }

  private generateEnemyTextures(): void {
    for (const [type, stats] of Object.entries(ENEMY_STATS)) {
      const g = this.add.graphics();
      g.fillStyle(stats.color, 1);
      const size = stats.size * 2;
      g.fillRect(0, 0, size, size);
      g.generateTexture(`enemy_${type}`, size, size);
      g.destroy();
    }
  }

  private generateBossTexture(): void {
    const g = this.add.graphics();
    g.fillStyle(0xff6b6b, 1);
    g.fillRect(0, 0, 88, 88);
    g.fillStyle(0xbe4bdb, 1);
    g.fillRect(10, 10, 68, 68);
    g.generateTexture('boss', 88, 88);
    g.destroy();
  }

  private generateGateTextures(): void {
    const gGreen = this.add.graphics();
    gGreen.fillStyle(0x51cf66, 1);
    gGreen.fillRect(0, 0, 120, 60);
    gGreen.generateTexture('gate_multiply', 120, 60);
    gGreen.destroy();

    const gBlue = this.add.graphics();
    gBlue.fillStyle(0x00d4ff, 1);
    gBlue.fillRect(0, 0, 120, 60);
    gBlue.generateTexture('gate_add', 120, 60);
    gBlue.destroy();

    const gRed = this.add.graphics();
    gRed.fillStyle(0xff6b6b, 1);
    gRed.fillRect(0, 0, 120, 60);
    gRed.generateTexture('gate_subtract', 120, 60);
    gRed.destroy();
  }
}
