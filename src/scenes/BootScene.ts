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
    this.generateDeathParticleTexture();

    this.scene.start('MenuScene');
  }

  // ── Player unit: 2-frame march spritesheet (20×20 per frame, 40×20 sheet) ──
  private generatePlayerUnitTexture(): void {
    const g = this.add.graphics();
    const w = 20, h = 20;

    // Frame 0: standing
    this.drawSoldier(g, 0, 0, w, h, 0x00d4ff, 0x0099cc, 0);
    // Frame 1: mid-step
    this.drawSoldier(g, w, 0, w, h, 0x00d4ff, 0x0099cc, 1);

    g.generateTexture('unit_sheet', w * 2, h);
    g.destroy();

    // Create spritesheet from the generated texture
    const srcTex = this.textures.get('unit_sheet');
    this.textures.addSpriteSheet('unit', srcTex.getSourceImage() as HTMLImageElement, {
      frameWidth: w,
      frameHeight: h,
    });
    this.textures.remove('unit_sheet');

    // Create animation
    this.anims.create({
      key: 'unit_march',
      frames: this.anims.generateFrameNumbers('unit', { start: 0, end: 1 }),
      frameRate: 4,
      repeat: -1,
    });
  }

  private drawSoldier(
    g: Phaser.GameObjects.Graphics,
    ox: number, oy: number,
    _w: number, _h: number,
    bodyColor: number, darkColor: number,
    frame: number,
  ): void {
    // Head
    g.fillStyle(bodyColor, 1);
    g.fillRect(ox + 7, oy, 6, 5);
    // Helmet highlight
    g.fillStyle(0x66eeff, 1);
    g.fillRect(ox + 8, oy + 1, 4, 2);

    // Torso
    g.fillStyle(darkColor, 1);
    g.fillRect(ox + 5, oy + 5, 10, 7);

    // Arms
    g.fillStyle(bodyColor, 1);
    if (frame === 0) {
      g.fillRect(ox + 3, oy + 5, 2, 6);
      g.fillRect(ox + 15, oy + 5, 2, 6);
    } else {
      g.fillRect(ox + 2, oy + 6, 3, 5);
      g.fillRect(ox + 15, oy + 4, 3, 5);
    }

    // Legs
    g.fillStyle(darkColor, 1);
    if (frame === 0) {
      g.fillRect(ox + 6, oy + 12, 3, 8);
      g.fillRect(ox + 11, oy + 12, 3, 8);
    } else {
      g.fillRect(ox + 5, oy + 12, 3, 7);
      g.fillRect(ox + 12, oy + 13, 3, 7);
    }
  }

  // ── Bullet ──
  private generateBulletTexture(): void {
    const g = this.add.graphics();
    g.fillStyle(0xffd43b, 1);
    g.fillCircle(3, 3, 3);
    g.generateTexture('bullet', 6, 6);
    g.destroy();
  }

  // ── Enemies: 2-frame walk spritesheets ──
  private generateEnemyTextures(): void {
    for (const [type, stats] of Object.entries(ENEMY_STATS)) {
      const size = stats.size * 2;
      const g = this.add.graphics();

      // Frame 0
      this.drawEnemy(g, 0, 0, size, type as EnemyType, stats.color, 0);
      // Frame 1
      this.drawEnemy(g, size, 0, size, type as EnemyType, stats.color, 1);

      const sheetKey = `enemy_${type}_sheet`;
      g.generateTexture(sheetKey, size * 2, size);
      g.destroy();

      const srcTex = this.textures.get(sheetKey);
      this.textures.addSpriteSheet(`enemy_${type}`, srcTex.getSourceImage() as HTMLImageElement, {
        frameWidth: size,
        frameHeight: size,
      });
      this.textures.remove(sheetKey);

      this.anims.create({
        key: `enemy_${type}_walk`,
        frames: this.anims.generateFrameNumbers(`enemy_${type}`, { start: 0, end: 1 }),
        frameRate: 4,
        repeat: -1,
      });
    }
  }

  private drawEnemy(
    g: Phaser.GameObjects.Graphics,
    ox: number, oy: number,
    size: number,
    type: EnemyType, color: number,
    frame: number,
  ): void {
    const dark = Phaser.Display.Color.ValueToColor(color).darken(30).color;
    const half = Math.floor(size / 2);
    const quarter = Math.floor(size / 4);

    switch (type) {
      case 'goblin': {
        // Small hunched body
        g.fillStyle(color, 1);
        g.fillRect(ox + quarter, oy + quarter, half, half);
        // Head
        g.fillRect(ox + quarter + 1, oy + 1, half - 2, quarter);
        // Eyes
        g.fillStyle(0xffffff, 1);
        g.fillRect(ox + quarter + 2, oy + 3, 2, 2);
        g.fillRect(ox + half + 1, oy + 3, 2, 2);
        // Legs
        g.fillStyle(dark, 1);
        const gLegShift = frame === 0 ? 0 : 2;
        g.fillRect(ox + quarter + 1, oy + half + quarter, 3, quarter - gLegShift);
        g.fillRect(ox + half + 1, oy + half + quarter - gLegShift, 3, quarter);
        break;
      }
      case 'orc': {
        // Bulky body
        g.fillStyle(color, 1);
        g.fillRect(ox + 3, oy + quarter, size - 6, half + 2);
        // Head
        g.fillStyle(dark, 1);
        g.fillRect(ox + quarter, oy + 1, half, quarter + 2);
        // Eyes
        g.fillStyle(0xff0000, 1);
        g.fillRect(ox + quarter + 2, oy + 3, 3, 2);
        g.fillRect(ox + half + 1, oy + 3, 3, 2);
        // Legs
        g.fillStyle(dark, 1);
        if (frame === 0) {
          g.fillRect(ox + quarter + 1, oy + size - quarter - 2, 4, quarter + 2);
          g.fillRect(ox + half + 2, oy + size - quarter - 2, 4, quarter + 2);
        } else {
          g.fillRect(ox + quarter, oy + size - quarter - 1, 4, quarter);
          g.fillRect(ox + half + 3, oy + size - quarter - 3, 4, quarter + 2);
        }
        break;
      }
      case 'troll': {
        // Very large body
        g.fillStyle(color, 1);
        g.fillRect(ox + 4, oy + 6, size - 8, size - 12);
        // Head
        g.fillStyle(dark, 1);
        g.fillRect(ox + quarter + 2, oy + 1, half - 4, 8);
        // Horns
        g.fillStyle(0xdddddd, 1);
        g.fillRect(ox + quarter, oy, 3, 5);
        g.fillRect(ox + size - quarter - 3, oy, 3, 5);
        // Eyes
        g.fillStyle(0xffff00, 1);
        g.fillRect(ox + quarter + 4, oy + 3, 3, 3);
        g.fillRect(ox + half + 2, oy + 3, 3, 3);
        // Arms
        g.fillStyle(color, 1);
        g.fillRect(ox + 1, oy + 10, 4, size - 22);
        g.fillRect(ox + size - 5, oy + 10, 4, size - 22);
        // Legs
        g.fillStyle(dark, 1);
        const tlegY = oy + size - 8;
        if (frame === 0) {
          g.fillRect(ox + quarter + 2, tlegY, 5, 8);
          g.fillRect(ox + half + 2, tlegY, 5, 8);
        } else {
          g.fillRect(ox + quarter + 1, tlegY + 1, 5, 7);
          g.fillRect(ox + half + 3, tlegY - 1, 5, 8);
        }
        break;
      }
      case 'demon': {
        // Fiery body
        g.fillStyle(color, 1);
        g.fillRect(ox + quarter, oy + 4, half, half + 2);
        // Head
        g.fillStyle(dark, 1);
        g.fillRect(ox + quarter + 1, oy + 1, half - 2, 6);
        // Crown spikes
        g.fillStyle(0xff4400, 1);
        g.fillRect(ox + quarter + 1, oy, 2, 3);
        g.fillRect(ox + half, oy, 2, 2);
        g.fillRect(ox + size - quarter - 3, oy, 2, 3);
        // Eyes
        g.fillStyle(0xff0000, 1);
        g.fillRect(ox + quarter + 3, oy + 3, 2, 2);
        g.fillRect(ox + half + 1, oy + 3, 2, 2);
        // Wings
        g.fillStyle(0xff8800, 1);
        g.fillRect(ox + 1, oy + 6, quarter - 1, half - 4);
        g.fillRect(ox + size - quarter, oy + 6, quarter - 1, half - 4);
        // Legs
        g.fillStyle(dark, 1);
        if (frame === 0) {
          g.fillRect(ox + quarter + 2, oy + half + 4, 3, quarter);
          g.fillRect(ox + half + 1, oy + half + 4, 3, quarter);
        } else {
          g.fillRect(ox + quarter + 1, oy + half + 5, 3, quarter - 1);
          g.fillRect(ox + half + 2, oy + half + 3, 3, quarter);
        }
        break;
      }
    }
  }

  // ── Boss: 2-frame idle (88×88 per frame) ──
  private generateBossTexture(): void {
    const g = this.add.graphics();
    const s = 88;

    for (let frame = 0; frame < 2; frame++) {
      const ox = frame * s;
      const armDrop = frame === 0 ? 0 : 3;

      // Body
      g.fillStyle(0xff6b6b, 1);
      g.fillRect(ox + 8, 16, 72, 56);
      // Inner core
      g.fillStyle(0xbe4bdb, 1);
      g.fillRect(ox + 16, 24, 56, 40);

      // Head/crown
      g.fillStyle(0xff4040, 1);
      g.fillRect(ox + 24, 4, 40, 16);
      // Crown spikes
      g.fillStyle(0xffcc00, 1);
      g.fillRect(ox + 28, 0, 6, 8);
      g.fillRect(ox + 41, 0, 6, 8);
      g.fillRect(ox + 54, 0, 6, 8);

      // Eyes
      g.fillStyle(0xff0000, 1);
      g.fillRect(ox + 26, 20, 10, 6);
      g.fillRect(ox + 52, 20, 10, 6);
      // Pupils
      g.fillStyle(0x000000, 1);
      g.fillRect(ox + 30, 22, 4, 4);
      g.fillRect(ox + 54, 22, 4, 4);

      // Mouth
      g.fillStyle(0x880000, 1);
      g.fillRect(ox + 30, 32, 28, 6);
      // Teeth
      g.fillStyle(0xffffff, 1);
      for (let t = 0; t < 5; t++) {
        g.fillRect(ox + 32 + t * 6, 32, 3, 3);
      }

      // Arms
      g.fillStyle(0xff6b6b, 1);
      g.fillRect(ox + 0, 20 + armDrop, 10, 40 - armDrop);
      g.fillRect(ox + 78, 20 - armDrop, 10, 40 + armDrop);
      // Fists
      g.fillStyle(0xcc4444, 1);
      g.fillRect(ox + 0, 56 + armDrop, 12, 12);
      g.fillRect(ox + 76, 56 - armDrop, 12, 12);

      // Legs
      g.fillStyle(0xcc4444, 1);
      if (frame === 0) {
        g.fillRect(ox + 20, 72, 16, 16);
        g.fillRect(ox + 52, 72, 16, 16);
      } else {
        g.fillRect(ox + 18, 72, 16, 14);
        g.fillRect(ox + 54, 73, 16, 15);
      }
    }

    const sheetKey = 'boss_sheet';
    g.generateTexture(sheetKey, s * 2, s);
    g.destroy();

    const srcTex = this.textures.get(sheetKey);
    this.textures.addSpriteSheet('boss', srcTex.getSourceImage() as HTMLImageElement, {
      frameWidth: s,
      frameHeight: s,
    });
    this.textures.remove(sheetKey);

    this.anims.create({
      key: 'boss_idle',
      frames: this.anims.generateFrameNumbers('boss', { start: 0, end: 1 }),
      frameRate: 2,
      repeat: -1,
    });
  }

  // ── Gate textures ──
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

  // ── Small particle for death effects ──
  private generateDeathParticleTexture(): void {
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 4, 4);
    g.generateTexture('death_particle', 4, 4);
    g.destroy();
  }
}
