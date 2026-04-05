// src/scenes/BootScene.ts
import Phaser from 'phaser';
import { ENEMY_STATS } from '@/config/EnemyConfig';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Player unit spritesheet (2 frames, 20×20 each)
    this.load.spritesheet('unit', 'assets/sprites/unit.svg', {
      frameWidth: 20,
      frameHeight: 20,
    });

    // Bullet
    this.load.image('bullet', 'assets/sprites/bullet.svg');

    // Enemy spritesheets (2 frames each)
    for (const [type, stats] of Object.entries(ENEMY_STATS)) {
      const size = stats.size * 2;
      this.load.spritesheet(`enemy_${type}`, `assets/sprites/enemy_${type}.svg`, {
        frameWidth: size,
        frameHeight: size,
      });
    }

    // Boss spritesheet (2 frames, 88×88 each)
    this.load.spritesheet('boss', 'assets/sprites/boss.svg', {
      frameWidth: 88,
      frameHeight: 88,
    });

    // Death particle
    this.load.image('death_particle', 'assets/sprites/death_particle.svg');
  }

  create(): void {
    // Generate gate textures procedurally (simple colored blocks, no art needed)
    this.generateGateTextures();

    // Create animations
    this.createAnimations();

    this.scene.start('MenuScene');
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

  private createAnimations(): void {
    // Player unit march
    this.anims.create({
      key: 'unit_march',
      frames: this.anims.generateFrameNumbers('unit', { start: 0, end: 1 }),
      frameRate: 4,
      repeat: -1,
    });

    // Enemy walk animations
    for (const type of Object.keys(ENEMY_STATS)) {
      this.anims.create({
        key: `enemy_${type}_walk`,
        frames: this.anims.generateFrameNumbers(`enemy_${type}`, { start: 0, end: 1 }),
        frameRate: 4,
        repeat: -1,
      });
    }

    // Boss idle
    this.anims.create({
      key: 'boss_idle',
      frames: this.anims.generateFrameNumbers('boss', { start: 0, end: 1 }),
      frameRate: 2,
      repeat: -1,
    });
  }
}
