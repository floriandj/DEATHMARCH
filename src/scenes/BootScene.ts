// src/scenes/BootScene.ts
import Phaser from 'phaser';
import { LevelManager } from '@/config/progression';

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

    // Enemy spritesheets — load from ALL levels so switching levels works
    const loadedTypes = new Set<string>();
    const mgr = LevelManager.instance;
    for (let i = 0; i < mgr.totalLevels; i++) {
      mgr.setLevel(i);
      for (const [type, stats] of Object.entries(mgr.enemies)) {
        if (loadedTypes.has(type)) continue;
        loadedTypes.add(type);
        const size = stats.size * 2;
        this.load.spritesheet(`enemy_${type}`, `assets/sprites/enemy_${type}.svg`, {
          frameWidth: size,
          frameHeight: size,
        });
      }
    }
    mgr.setLevel(0); // reset to first level

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

    // Generate VFX textures
    this.generateVfxTextures();

    // Create animations
    this.createAnimations();

    this.scene.start('SplashScene');
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

  private generateVfxTextures(): void {
    // Hit spark (small bright square)
    const spark = this.add.graphics();
    spark.fillStyle(0xffffff, 1);
    spark.fillRect(0, 0, 3, 3);
    spark.generateTexture('vfx_spark', 3, 3);
    spark.destroy();

    // Slam shockwave ring segment
    const ring = this.add.graphics();
    ring.fillStyle(0xff0000, 1);
    ring.fillRect(0, 0, 6, 6);
    ring.generateTexture('vfx_ring', 6, 6);
    ring.destroy();

    // Charge trail particle
    const trail = this.add.graphics();
    trail.fillStyle(0xff4400, 1);
    trail.fillRect(0, 0, 5, 5);
    trail.generateTexture('vfx_trail', 5, 5);
    trail.destroy();

    // Enrage burst particle
    const burst = this.add.graphics();
    burst.fillStyle(0xff0000, 1);
    burst.fillRect(0, 0, 4, 4);
    burst.generateTexture('vfx_burst', 4, 4);
    burst.destroy();
  }

  private createAnimations(): void {
    // Player unit march
    this.anims.create({
      key: 'unit_march',
      frames: this.anims.generateFrameNumbers('unit', { start: 0, end: 1 }),
      frameRate: 4,
      repeat: -1,
    });

    // Enemy walk animations — create for all loaded types
    const mgr = LevelManager.instance;
    const createdAnims = new Set<string>();
    for (let i = 0; i < mgr.totalLevels; i++) {
      mgr.setLevel(i);
      for (const type of Object.keys(mgr.enemies)) {
        const animKey = `enemy_${type}_walk`;
        if (createdAnims.has(animKey)) continue;
        createdAnims.add(animKey);
        this.anims.create({
          key: animKey,
          frames: this.anims.generateFrameNumbers(`enemy_${type}`, { start: 0, end: 1 }),
          frameRate: 4,
          repeat: -1,
        });
      }
    }
    mgr.setLevel(0);

    // Boss idle
    this.anims.create({
      key: 'boss_idle',
      frames: this.anims.generateFrameNumbers('boss', { start: 0, end: 1 }),
      frameRate: 2,
      repeat: -1,
    });
  }
}
