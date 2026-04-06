// src/scenes/BootScene.ts
import Phaser from 'phaser';
import { LevelManager, generateLevel } from '@/config/progression';

/** We only need to load assets for the 5 world themes (they cycle). */
const WORLDS_COUNT = 5;

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

    // Bullet
    this.load.image('bullet', 'assets/sprites/bullet.svg');

    // Enemy spritesheets — load one representative level per world (first of each cycle)
    const loadedTypes = new Set<string>();
    for (let w = 0; w < WORLDS_COUNT; w++) {
      const lvl = generateLevel(w * 5); // first level of each world
      for (const [type, stats] of Object.entries(lvl.enemies)) {
        if (loadedTypes.has(type)) continue;
        loadedTypes.add(type);
        const size = stats.size * 2;
        this.load.spritesheet(`enemy_${type}`, `assets/sprites/enemy_${type}.svg`, {
          frameWidth: size,
          frameHeight: size,
        });
      }
    }

    // Boss spritesheets — one per world theme
    const loadedBosses = new Set<string>();
    for (let w = 0; w < WORLDS_COUNT; w++) {
      const lvl = generateLevel(w * 5);
      const bossSprite = lvl.boss.sprite;
      if (!loadedBosses.has(bossSprite)) {
        loadedBosses.add(bossSprite);
        this.load.spritesheet(bossSprite, `assets/sprites/${bossSprite}.svg`, {
          frameWidth: 88,
          frameHeight: 88,
        });
      }
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
  }

  create(): void {
    this.generateGateTextures();
    this.generateVfxTextures();
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

    // Enemy walk animations — one per unique enemy type across all worlds
    const createdAnims = new Set<string>();
    for (let w = 0; w < WORLDS_COUNT; w++) {
      const lvl = generateLevel(w * 5);
      for (const type of Object.keys(lvl.enemies)) {
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

    // Boss idle animations
    this.anims.create({
      key: 'boss_idle',
      frames: this.anims.generateFrameNumbers('boss', { start: 0, end: 1 }),
      frameRate: 2,
      repeat: -1,
    });

    const createdBossAnims = new Set<string>();
    for (let w = 0; w < WORLDS_COUNT; w++) {
      const lvl = generateLevel(w * 5);
      const spriteKey = lvl.boss.sprite;
      const animKey = `${spriteKey}_idle`;
      if (!createdBossAnims.has(animKey)) {
        createdBossAnims.add(animKey);
        this.anims.create({
          key: animKey,
          frames: this.anims.generateFrameNumbers(spriteKey, { start: 0, end: 1 }),
          frameRate: 2,
          repeat: -1,
        });
      }
    }
  }
}
