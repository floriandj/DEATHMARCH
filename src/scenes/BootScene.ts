// src/scenes/BootScene.ts
import Phaser from 'phaser';
import { getAllBaseEnemySprites, getAllBossSprites } from '@/config/progression';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Player unit spritesheet (2 frames, 20x20 each)
    this.load.spritesheet('unit', 'assets/sprites/unit.svg', {
      frameWidth: 20,
      frameHeight: 20,
    });

    // Enemy spritesheets — load all base sprites (procedural enemies reuse these with tinting)
    for (const { type, size } of getAllBaseEnemySprites()) {
      const frameSize = size * 2;
      this.load.spritesheet(`enemy_${type}`, `assets/sprites/enemy_${type}.svg`, {
        frameWidth: frameSize,
        frameHeight: frameSize,
      });
    }

    // Boss spritesheets — one per world theme
    for (const bossSprite of getAllBossSprites()) {
      this.load.spritesheet(bossSprite, `assets/sprites/${bossSprite}.svg`, {
        frameWidth: 88,
        frameHeight: 88,
      });
    }
    // Legacy 'boss' key
    this.load.spritesheet('boss', 'assets/sprites/boss.svg', {
      frameWidth: 88,
      frameHeight: 88,
    });

    // Weapon icon SVGs
    const weaponIcons = [
      'pistol', 'smg', 'ar', 'lmg', 'minigun',
      'cryo', 'railgun', 'plasma', 'voidbeam', 'godslayer', 'flamer',
    ];
    for (const w of weaponIcons) {
      this.load.image(`weapon_svg_${w}`, `assets/sprites/weapon_${w}.svg`);
    }

    // Death particle
    this.load.image('death_particle', 'assets/sprites/death_particle.svg');

    // Gold pouch
    this.load.image('gold_pouch', 'assets/sprites/gold_pouch.svg');
  }

  create(): void {
    this.generateGateTextures();
    this.generateVfxTextures();
    this.createAnimations();
    this.scene.start('SplashScene');
  }

  private generateGateTextures(): void {
    const w = 120, h = 60, r = 14;

    // Multiply gate — bright green, inviting, rounded with glow
    const gGreen = this.add.graphics();
    gGreen.fillStyle(0x2a8a3e, 1);
    gGreen.fillRoundedRect(0, 0, w, h, r);
    gGreen.fillStyle(0x51cf66, 1);
    gGreen.fillRoundedRect(3, 3, w - 6, h - 6, r - 2);
    // Inner shine
    gGreen.fillStyle(0x7ddf8a, 0.5);
    gGreen.fillRoundedRect(6, 6, w - 12, h / 2 - 6, r - 4);
    gGreen.generateTexture('gate_multiply', w, h);
    gGreen.destroy();

    // Add gate — bright blue, friendly, rounded with glow
    const gBlue = this.add.graphics();
    gBlue.fillStyle(0x0088aa, 1);
    gBlue.fillRoundedRect(0, 0, w, h, r);
    gBlue.fillStyle(0x00d4ff, 1);
    gBlue.fillRoundedRect(3, 3, w - 6, h - 6, r - 2);
    gBlue.fillStyle(0x66e4ff, 0.5);
    gBlue.fillRoundedRect(6, 6, w - 12, h / 2 - 6, r - 4);
    gBlue.generateTexture('gate_add', w, h);
    gBlue.destroy();

    // Subtract/divide gate — dark red, spiky border, warning feel
    const gRed = this.add.graphics();
    gRed.fillStyle(0x881111, 1);
    gRed.fillRoundedRect(0, 0, w, h, r);
    gRed.fillStyle(0xcc2222, 1);
    gRed.fillRoundedRect(3, 3, w - 6, h - 6, r - 2);
    // Danger stripes
    gRed.fillStyle(0x991111, 0.6);
    for (let sx = 10; sx < w; sx += 16) {
      gRed.fillRect(sx, 3, 8, h - 6);
    }
    // Dark top
    gRed.fillStyle(0xaa1515, 0.4);
    gRed.fillRoundedRect(6, 6, w - 12, h / 2 - 6, r - 4);
    gRed.generateTexture('gate_subtract', w, h);
    gRed.destroy();

    // Boss gate — wide ominous banner spanning the battlefield
    const bw = 600, bh = 70, br = 12;
    const gBoss = this.add.graphics();
    // Dark outer edge
    gBoss.fillStyle(0x220011, 1);
    gBoss.fillRoundedRect(0, 0, bw, bh, br);
    // Deep crimson body
    gBoss.fillStyle(0x660022, 1);
    gBoss.fillRoundedRect(3, 3, bw - 6, bh - 6, br - 2);
    // Danger stripes
    gBoss.fillStyle(0x440016, 0.6);
    for (let sx = 8; sx < bw; sx += 20) {
      gBoss.fillRect(sx, 3, 10, bh - 6);
    }
    // Inner glow
    gBoss.fillStyle(0x990033, 0.4);
    gBoss.fillRoundedRect(6, 6, bw - 12, bh / 2 - 6, br - 4);
    gBoss.generateTexture('gate_boss', bw, bh);
    gBoss.destroy();
  }

  private generateVfxTextures(): void {
    const spark = this.add.graphics();
    spark.fillStyle(0xffffff, 1);
    spark.fillRect(0, 0, 3, 3);
    spark.generateTexture('vfx_spark', 3, 3);
    spark.destroy();

    const ring = this.add.graphics();
    ring.fillStyle(0xff0000, 1);
    ring.fillRect(0, 0, 6, 6);
    ring.generateTexture('vfx_ring', 6, 6);
    ring.destroy();

    const trail = this.add.graphics();
    trail.fillStyle(0xff4400, 1);
    trail.fillRect(0, 0, 5, 5);
    trail.generateTexture('vfx_trail', 5, 5);
    trail.destroy();

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

    // Enemy walk animations — one per base sprite type
    for (const { type } of getAllBaseEnemySprites()) {
      this.anims.create({
        key: `enemy_${type}_walk`,
        frames: this.anims.generateFrameNumbers(`enemy_${type}`, { start: 0, end: 1 }),
        frameRate: 4,
        repeat: -1,
      });
    }

    // Boss idle animations
    this.anims.create({
      key: 'boss_idle',
      frames: this.anims.generateFrameNumbers('boss', { start: 0, end: 1 }),
      frameRate: 2,
      repeat: -1,
    });

    for (const bossSprite of getAllBossSprites()) {
      this.anims.create({
        key: `${bossSprite}_idle`,
        frames: this.anims.generateFrameNumbers(bossSprite, { start: 0, end: 1 }),
        frameRate: 2,
        repeat: -1,
      });
    }
  }
}
