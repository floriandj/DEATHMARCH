// src/scenes/BootScene.ts
import Phaser from 'phaser';
import { getAllBaseEnemySprites, getAllBossSprites } from '@/config/progression';

/** SVG sprites are rendered at 4x their viewBox size for sharp display */
const SVG_RENDER_SCALE = 4;

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Player unit spritesheet (2 frames, 20x20 each)
    this.load.spritesheet('unit', 'assets/sprites/unit.svg', {
      frameWidth: 20 * SVG_RENDER_SCALE,
      frameHeight: 20 * SVG_RENDER_SCALE,
    });

    // Enemy spritesheets — load all base sprites (procedural enemies reuse these with tinting)
    for (const { type, size } of getAllBaseEnemySprites()) {
      const frameSize = size * 2 * SVG_RENDER_SCALE;
      this.load.spritesheet(`enemy_${type}`, `assets/sprites/enemy_${type}.svg`, {
        frameWidth: frameSize,
        frameHeight: frameSize,
      });
    }

    // Boss spritesheets — one per world theme
    for (const bossSprite of getAllBossSprites()) {
      this.load.spritesheet(bossSprite, `assets/sprites/${bossSprite}.svg`, {
        frameWidth: 88 * SVG_RENDER_SCALE,
        frameHeight: 88 * SVG_RENDER_SCALE,
      });
    }
    // Legacy 'boss' key
    this.load.spritesheet('boss', 'assets/sprites/boss.svg', {
      frameWidth: 88 * SVG_RENDER_SCALE,
      frameHeight: 88 * SVG_RENDER_SCALE,
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

    // Decoration sprites for background
    this.load.image('decor_tree', 'assets/sprites/decor_tree.svg');
    this.load.image('decor_rock', 'assets/sprites/decor_rock.svg');
    this.load.image('decor_bush', 'assets/sprites/decor_bush.svg');
  }

  create(): void {
    this.generateGateTextures();
    this.generateVfxTextures();
    this.createAnimations();
    this.scene.start('SplashScene');
  }

  private generateGateTextures(): void {
    const w = 120, h = 60, r = 14;

    // Multiply gate — bright green with bevel and "×" icon
    const gGreen = this.add.graphics();
    gGreen.fillStyle(0x1a5c2a, 1);
    gGreen.fillRoundedRect(0, 2, w, h, r);
    gGreen.fillStyle(0x2a8a3e, 1);
    gGreen.fillRoundedRect(0, 0, w, h - 2, r);
    gGreen.fillStyle(0x51cf66, 1);
    gGreen.fillRoundedRect(4, 3, w - 8, h - 8, r - 3);
    gGreen.fillStyle(0x7ddf8a, 0.6);
    gGreen.fillRoundedRect(8, 5, w - 16, (h - 8) / 3, r - 5);
    gGreen.lineStyle(4, 0xffffff, 0.9);
    gGreen.beginPath();
    gGreen.moveTo(w / 2 - 8, h / 2 - 8); gGreen.lineTo(w / 2 + 8, h / 2 + 8);
    gGreen.moveTo(w / 2 + 8, h / 2 - 8); gGreen.lineTo(w / 2 - 8, h / 2 + 8);
    gGreen.strokePath();
    gGreen.generateTexture('gate_multiply', w, h);
    gGreen.destroy();

    // Add gate — bright blue with bevel and "+" icon
    const gBlue = this.add.graphics();
    gBlue.fillStyle(0x006688, 1);
    gBlue.fillRoundedRect(0, 2, w, h, r);
    gBlue.fillStyle(0x0088aa, 1);
    gBlue.fillRoundedRect(0, 0, w, h - 2, r);
    gBlue.fillStyle(0x00d4ff, 1);
    gBlue.fillRoundedRect(4, 3, w - 8, h - 8, r - 3);
    gBlue.fillStyle(0x66e4ff, 0.6);
    gBlue.fillRoundedRect(8, 5, w - 16, (h - 8) / 3, r - 5);
    gBlue.lineStyle(4, 0xffffff, 0.9);
    gBlue.beginPath();
    gBlue.moveTo(w / 2, h / 2 - 10); gBlue.lineTo(w / 2, h / 2 + 10);
    gBlue.moveTo(w / 2 - 10, h / 2); gBlue.lineTo(w / 2 + 10, h / 2);
    gBlue.strokePath();
    gBlue.generateTexture('gate_add', w, h);
    gBlue.destroy();

    // Subtract gate — dark red with bevel, stripes, and "−" icon
    const gRed = this.add.graphics();
    gRed.fillStyle(0x660a0a, 1);
    gRed.fillRoundedRect(0, 2, w, h, r);
    gRed.fillStyle(0x881111, 1);
    gRed.fillRoundedRect(0, 0, w, h - 2, r);
    gRed.fillStyle(0xcc2222, 1);
    gRed.fillRoundedRect(4, 3, w - 8, h - 8, r - 3);
    gRed.fillStyle(0x991111, 0.5);
    for (let sx = 12; sx < w - 8; sx += 16) {
      gRed.fillRect(sx, 5, 8, h - 12);
    }
    gRed.fillStyle(0xdd3333, 0.4);
    gRed.fillRoundedRect(8, 5, w - 16, (h - 8) / 3, r - 5);
    gRed.lineStyle(4, 0xffffff, 0.9);
    gRed.beginPath();
    gRed.moveTo(w / 2 - 10, h / 2); gRed.lineTo(w / 2 + 10, h / 2);
    gRed.strokePath();
    gRed.generateTexture('gate_subtract', w, h);
    gRed.destroy();

    // Boss gate — wide ominous banner with skull icon
    const bw = 600, bh = 70, br = 12;
    const gBoss = this.add.graphics();
    gBoss.fillStyle(0x15000a, 1);
    gBoss.fillRoundedRect(0, 3, bw, bh, br);
    gBoss.fillStyle(0x220011, 1);
    gBoss.fillRoundedRect(0, 0, bw, bh - 3, br);
    gBoss.fillStyle(0x660022, 1);
    gBoss.fillRoundedRect(4, 3, bw - 8, bh - 10, br - 3);
    gBoss.fillStyle(0x440016, 0.5);
    for (let sx = 10; sx < bw - 8; sx += 20) {
      gBoss.fillRect(sx, 5, 10, bh - 14);
    }
    gBoss.fillStyle(0x990033, 0.35);
    gBoss.fillRoundedRect(8, 5, bw - 16, (bh - 10) / 3, br - 5);
    const cx = bw / 2, cy = bh / 2;
    gBoss.fillStyle(0xffffff, 0.6);
    gBoss.fillCircle(cx, cy - 2, 12);
    gBoss.fillRect(cx - 6, cy + 6, 12, 8);
    gBoss.fillStyle(0x660022, 1);
    gBoss.fillCircle(cx - 4, cy - 3, 3);
    gBoss.fillCircle(cx + 4, cy - 3, 3);
    gBoss.fillRect(cx - 4, cy + 8, 2, 4);
    gBoss.fillRect(cx - 1, cy + 8, 2, 4);
    gBoss.fillRect(cx + 2, cy + 8, 2, 4);
    gBoss.generateTexture('gate_boss', bw, bh);
    gBoss.destroy();
  }

  private generateVfxTextures(): void {
    // Spark — radial bright center
    const spark = this.add.graphics();
    spark.fillStyle(0xffffff, 1);
    spark.fillCircle(4, 4, 4);
    spark.fillStyle(0xffffff, 0.5);
    spark.fillCircle(4, 4, 2);
    spark.generateTexture('vfx_spark', 8, 8);
    spark.destroy();

    // Ring — donut shape
    const ring = this.add.graphics();
    ring.lineStyle(2, 0xff4444, 0.8);
    ring.strokeCircle(6, 6, 4);
    ring.fillStyle(0xff0000, 0.3);
    ring.fillCircle(6, 6, 2);
    ring.generateTexture('vfx_ring', 12, 12);
    ring.destroy();

    // Trail — elongated teardrop
    const trail = this.add.graphics();
    trail.fillStyle(0xff6600, 0.8);
    trail.fillEllipse(6, 4, 12, 6);
    trail.fillStyle(0xffaa00, 0.6);
    trail.fillEllipse(4, 4, 6, 4);
    trail.fillStyle(0xffffff, 0.4);
    trail.fillEllipse(3, 4, 3, 2);
    trail.generateTexture('vfx_trail', 12, 8);
    trail.destroy();

    // Burst — star cross shape
    const burst = this.add.graphics();
    burst.fillStyle(0xff2200, 0.9);
    burst.fillRect(2, 0, 4, 8);
    burst.fillRect(0, 2, 8, 4);
    burst.fillStyle(0xffaa00, 0.7);
    burst.fillRect(3, 1, 2, 6);
    burst.fillRect(1, 3, 6, 2);
    burst.fillStyle(0xffffff, 0.5);
    burst.fillCircle(4, 4, 1.5);
    burst.generateTexture('vfx_burst', 8, 8);
    burst.destroy();

    // Entity shadow
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillEllipse(16, 4, 32, 8);
    shadow.generateTexture('vfx_shadow', 32, 8);
    shadow.destroy();
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
