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

    // Generate weapon icons
    this.generateWeaponIcons();

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

  private generateWeaponIcons(): void {
    // Small weapon silhouette icons (24x24) drawn procedurally
    const iconSize = 24;

    // Generic gun icon helper: barrel + grip
    const drawGun = (key: string, color: number, barrelW: number, barrelH: number, hasStock: boolean) => {
      const g = this.add.graphics();
      // Barrel
      g.fillStyle(color, 1);
      g.fillRect(iconSize / 2 - barrelW / 2, 2, barrelW, barrelH);
      // Body
      g.fillRect(iconSize / 2 - 5, barrelH, 10, 8);
      // Grip
      g.fillStyle(color, 0.8);
      g.fillRect(iconSize / 2 - 3, barrelH + 6, 6, 8);
      // Stock
      if (hasStock) {
        g.fillStyle(color, 0.6);
        g.fillRect(iconSize / 2 + 3, barrelH + 2, 8, 4);
      }
      g.generateTexture(key, iconSize, iconSize);
      g.destroy();
    };

    // Pistol - small, compact
    drawGun('weapon_icon_pistol', 0xffd43b, 4, 8, false);
    // SMG - slightly longer
    drawGun('weapon_icon_smg', 0x00d4ff, 5, 10, false);
    // Assault Rifle - long barrel + stock
    drawGun('weapon_icon_ar', 0x51cf66, 4, 12, true);
    // LMG - thick barrel + stock
    drawGun('weapon_icon_lmg', 0xff6b6b, 6, 12, true);

    // Minigun - multi-barrel
    const mg = this.add.graphics();
    mg.fillStyle(0xff8800, 1);
    for (let i = -3; i <= 3; i += 3) {
      mg.fillRect(iconSize / 2 + i - 1, 1, 3, 14);
    }
    mg.fillRect(iconSize / 2 - 6, 13, 12, 6);
    mg.fillStyle(0xff8800, 0.7);
    mg.fillRect(iconSize / 2 - 3, 17, 6, 6);
    mg.generateTexture('weapon_icon_minigun', iconSize, iconSize);
    mg.destroy();

    // Cryo cannon - wide barrel with frost tip
    const cc = this.add.graphics();
    cc.fillStyle(0x88ddff, 1);
    cc.fillRect(iconSize / 2 - 4, 2, 8, 10);
    cc.fillStyle(0xccffff, 1);
    cc.fillRect(iconSize / 2 - 5, 0, 10, 4);
    cc.fillStyle(0x88ddff, 0.8);
    cc.fillRect(iconSize / 2 - 5, 10, 10, 6);
    cc.fillRect(iconSize / 2 - 3, 14, 6, 8);
    cc.generateTexture('weapon_icon_cryo_cannon', iconSize, iconSize);
    cc.destroy();

    // Railgun - long thin barrel with glow
    drawGun('weapon_icon_railgun', 0xaa66ff, 3, 14, true);

    // Plasma Rifle
    drawGun('weapon_icon_plasma_rifle', 0xff44ff, 5, 11, true);

    // Void Beam - wide energy barrel
    const vb = this.add.graphics();
    vb.fillStyle(0x8844ff, 1);
    vb.fillRect(iconSize / 2 - 3, 1, 6, 13);
    vb.fillStyle(0xcc88ff, 1);
    vb.fillRect(iconSize / 2 - 5, 0, 10, 3);
    vb.fillStyle(0x8844ff, 0.8);
    vb.fillRect(iconSize / 2 - 5, 12, 10, 6);
    vb.fillRect(iconSize / 2 - 3, 16, 6, 6);
    vb.generateTexture('weapon_icon_void_beam', iconSize, iconSize);
    vb.destroy();

    // Godslayer - big ornate
    const gs = this.add.graphics();
    gs.fillStyle(0xffd700, 1);
    gs.fillRect(iconSize / 2 - 4, 0, 8, 14);
    gs.fillStyle(0xffee88, 1);
    gs.fillRect(iconSize / 2 - 6, 1, 12, 3);
    gs.fillStyle(0xffd700, 0.8);
    gs.fillRect(iconSize / 2 - 6, 12, 12, 6);
    gs.fillRect(iconSize / 2 - 3, 16, 6, 7);
    gs.generateTexture('weapon_icon_godslayer', iconSize, iconSize);
    gs.destroy();

    // Fallback generic icon
    const fb = this.add.graphics();
    fb.fillStyle(0xcccccc, 1);
    fb.fillRect(iconSize / 2 - 3, 2, 6, 12);
    fb.fillRect(iconSize / 2 - 5, 12, 10, 6);
    fb.fillRect(iconSize / 2 - 3, 16, 6, 6);
    fb.generateTexture('weapon_icon_default', iconSize, iconSize);
    fb.destroy();
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
