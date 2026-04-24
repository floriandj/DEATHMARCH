// src/scenes/BootScene.ts
import Phaser from 'phaser';

interface CharacterSpec {
  name: string;
  w: number;
  h: number;
}

const CHARACTER_SPECS: CharacterSpec[] = [
  { name: 'knight_m',     w: 16, h: 28 },
  { name: 'goblin',       w: 16, h: 16 },
  { name: 'tiny_zombie',  w: 16, h: 16 },
  { name: 'imp',          w: 16, h: 16 },
  { name: 'swampy',       w: 16, h: 16 },
  { name: 'skelet',       w: 16, h: 16 },
  { name: 'orc_warrior',  w: 16, h: 23 },
  { name: 'masked_orc',   w: 16, h: 23 },
  { name: 'wogol',        w: 16, h: 23 },
  { name: 'slug',         w: 16, h: 23 },
  { name: 'necromancer',  w: 16, h: 23 },
  { name: 'muddy',        w: 16, h: 16 },
  { name: 'ice_zombie',   w: 16, h: 16 },
  { name: 'pumpkin_dude', w: 16, h: 23 },
  { name: 'lizard_f',     w: 16, h: 28 },
  { name: 'chort',        w: 16, h: 23 },
  { name: 'big_demon',    w: 32, h: 36 },
  { name: 'big_zombie',   w: 32, h: 36 },
  { name: 'ogre',         w: 32, h: 36 },
];

const WEAPON_KEYS = [
  'pistol', 'smg', 'ar', 'lmg', 'minigun',
  'cryo', 'railgun', 'plasma', 'voidbeam', 'godslayer', 'flamer',
];

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Character spritesheet strips — 8 frames each (idle 0-3, run 4-7)
    for (const spec of CHARACTER_SPECS) {
      this.load.spritesheet(`char_${spec.name}`, `assets/sprites-pixel/characters/${spec.name}.png`, {
        frameWidth: spec.w,
        frameHeight: spec.h,
        endFrame: 8,
      });
    }

    // Weapon icons — fantasy pixel weapons from 0x72 pack (keys keep old gun names)
    for (const w of WEAPON_KEYS) {
      this.load.image(`weapon_svg_${w}`, `assets/sprites-pixel/weapons/weapon_${w}.png`);
    }
  }

  create(): void {
    this.applyNearestFilter();
    this.generateDecorTextures();
    this.generateMiscTextures();
    this.generateBulletTextures();
    this.generateMuzzleFlashTextures();
    this.generateBarrelTextures();
    this.generateGateTextures();
    this.generateVfxTextures();
    this.createAnimations();
    this.scene.start('SplashScene');
  }

  private applyNearestFilter(): void {
    for (const spec of CHARACTER_SPECS) {
      const tex = this.textures.get(`char_${spec.name}`);
      tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
    for (const w of WEAPON_KEYS) {
      this.textures.get(`weapon_svg_${w}`).setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
  }

  private createAnimations(): void {
    for (const spec of CHARACTER_SPECS) {
      const key = `char_${spec.name}`;
      this.anims.create({
        key: `${key}_idle`,
        frames: this.anims.generateFrameNumbers(key, { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1,
      });
      this.anims.create({
        key: `${key}_run`,
        frames: this.anims.generateFrameNumbers(key, { start: 4, end: 7 }),
        frameRate: 10,
        repeat: -1,
      });
    }
  }

  // ── Procedural pixel-art decor. 16-bit style, small palette per item. ──
  private generateDecorTextures(): void {
    const shadow = (g: Phaser.GameObjects.Graphics, cx: number, cy: number, w: number) => {
      g.fillStyle(0x000000, 0.35);
      g.fillEllipse(cx, cy, w, 2);
    };

    // ── decor_tree — bare skeletal tree, 16x24 ──
    {
      const g = this.add.graphics();
      shadow(g, 8, 23, 10);
      g.fillStyle(0x3e2723, 1); g.fillRect(7, 13, 2, 10);
      g.fillStyle(0x5d4037, 1); g.fillRect(7, 13, 1, 10);
      g.fillStyle(0x4e342e, 1);
      g.fillRect(3, 10, 4, 1); g.fillRect(9, 10, 4, 1);
      g.fillRect(4, 7, 3, 1); g.fillRect(9, 7, 3, 1);
      g.fillRect(5, 4, 2, 1); g.fillRect(9, 4, 2, 1);
      g.fillStyle(0x2d4a2a, 1);
      g.fillRect(2, 9, 2, 2); g.fillRect(12, 9, 2, 2);
      g.fillRect(3, 6, 2, 2); g.fillRect(11, 6, 2, 2);
      g.fillRect(6, 3, 2, 2); g.fillRect(8, 3, 2, 2);
      g.generateTexture('decor_tree', 16, 24);
      g.destroy();
    }

    // ── decor_pine — dense evergreen, 16x24 ──
    {
      const g = this.add.graphics();
      shadow(g, 8, 23, 10);
      g.fillStyle(0x3e2723, 1); g.fillRect(7, 19, 2, 4);
      g.fillStyle(0x1f3d1a, 1);
      g.fillTriangle(8, 2, 2, 12, 14, 12);
      g.fillTriangle(8, 7, 1, 18, 15, 18);
      g.fillStyle(0x2d5a2a, 1);
      g.fillTriangle(8, 3, 3, 11, 13, 11);
      g.fillTriangle(8, 8, 2, 17, 14, 17);
      g.fillStyle(0x4d8a4a, 0.5);
      g.fillRect(7, 3, 2, 3); g.fillRect(7, 9, 2, 3);
      g.generateTexture('decor_pine', 16, 24);
      g.destroy();
    }

    // ── decor_rock — gray cluster, 16x12 ──
    {
      const g = this.add.graphics();
      shadow(g, 8, 11, 14);
      g.fillStyle(0x4a4a4a, 1); g.fillRect(3, 6, 10, 5); g.fillRect(4, 5, 8, 1); g.fillRect(5, 4, 6, 1);
      g.fillStyle(0x6a6a6a, 1); g.fillRect(4, 6, 6, 1); g.fillRect(5, 5, 3, 1);
      g.fillStyle(0x2a2a2a, 1); g.fillRect(3, 10, 10, 1); g.fillRect(4, 9, 2, 1); g.fillRect(11, 9, 2, 1);
      g.generateTexture('decor_rock', 16, 12);
      g.destroy();
    }

    // ── decor_bush — dense green dome, 16x12 ──
    {
      const g = this.add.graphics();
      shadow(g, 8, 11, 14);
      g.fillStyle(0x2d4a2a, 1); g.fillRect(2, 6, 12, 5); g.fillRect(3, 5, 10, 1); g.fillRect(4, 4, 8, 1); g.fillRect(5, 3, 6, 1);
      g.fillStyle(0x3d6a3a, 1); g.fillRect(3, 6, 3, 2); g.fillRect(9, 7, 3, 2); g.fillRect(6, 4, 2, 1);
      g.fillStyle(0x4d8a4a, 1); g.fillRect(4, 5, 2, 1); g.fillRect(10, 5, 2, 1);
      g.fillStyle(0x1d2d1a, 1); g.fillRect(2, 10, 12, 1);
      g.generateTexture('decor_bush', 16, 12);
      g.destroy();
    }

    // ── decor_mushroom — red cap with white spots, 14x14 ──
    {
      const g = this.add.graphics();
      shadow(g, 7, 13, 10);
      g.fillStyle(0xf0e4b0, 1); g.fillRect(5, 7, 4, 5);
      g.fillStyle(0xcc3333, 1); g.fillRect(2, 3, 10, 4); g.fillRect(3, 2, 8, 1); g.fillRect(4, 1, 6, 1);
      g.fillStyle(0xee5555, 1); g.fillRect(3, 3, 3, 1); g.fillRect(7, 4, 3, 1);
      g.fillStyle(0xffffff, 1); g.fillRect(4, 3, 1, 1); g.fillRect(8, 4, 1, 1); g.fillRect(6, 2, 1, 1); g.fillRect(9, 2, 1, 1);
      g.fillStyle(0x8b6914, 1); g.fillRect(5, 11, 4, 1);
      g.generateTexture('decor_mushroom', 14, 14);
      g.destroy();
    }

    // ── decor_log — horizontal fallen log, 20x10 ──
    {
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.3); g.fillEllipse(10, 9, 18, 2);
      g.fillStyle(0x5d4037, 1); g.fillRect(2, 3, 16, 5);
      g.fillStyle(0x8b5a2b, 1); g.fillRect(2, 3, 16, 2);
      g.fillStyle(0x3e2723, 1); g.fillRect(2, 7, 16, 1);
      g.fillStyle(0xa67850, 1); g.fillCircle(3, 5, 2); g.fillCircle(17, 5, 2);
      g.fillStyle(0x3e2723, 1); g.fillCircle(3, 5, 1); g.fillCircle(17, 5, 1);
      g.generateTexture('decor_log', 20, 10);
      g.destroy();
    }

    // ── decor_stump — tree stump with rings, 14x10 ──
    {
      const g = this.add.graphics();
      shadow(g, 7, 9, 12);
      g.fillStyle(0x5d4037, 1); g.fillRect(3, 4, 8, 4);
      g.fillStyle(0xa67850, 1); g.fillRect(3, 2, 8, 3);
      g.fillStyle(0x8b5a2b, 1); g.fillRect(4, 3, 6, 1);
      g.fillStyle(0x5d4037, 1); g.fillRect(5, 3, 4, 1);
      g.fillStyle(0x3e2723, 1); g.fillRect(6, 3, 2, 1);
      g.generateTexture('decor_stump', 14, 10);
      g.destroy();
    }

    // ── decor_skull — bleached skull, 12x10 ──
    {
      const g = this.add.graphics();
      shadow(g, 6, 9, 10);
      g.fillStyle(0xe8e0c8, 1); g.fillRect(2, 1, 8, 6); g.fillRect(3, 7, 6, 1);
      g.fillStyle(0xf5f0d8, 1); g.fillRect(3, 1, 6, 2);
      g.fillStyle(0x000000, 1); g.fillRect(3, 3, 2, 2); g.fillRect(7, 3, 2, 2);
      g.fillStyle(0x000000, 1); g.fillRect(5, 5, 1, 2); g.fillRect(6, 5, 1, 2);
      g.fillStyle(0xbfb4a0, 1); g.fillRect(2, 7, 2, 1); g.fillRect(8, 7, 2, 1);
      g.generateTexture('decor_skull', 12, 10);
      g.destroy();
    }

    // ── decor_bones — crossed bone pile, 16x10 ──
    {
      const g = this.add.graphics();
      shadow(g, 8, 9, 14);
      g.fillStyle(0xe8e0c8, 1);
      g.fillRect(2, 3, 12, 2);
      g.fillRect(1, 2, 2, 4); g.fillRect(13, 2, 2, 4);
      g.fillRect(4, 6, 10, 2);
      g.fillRect(3, 5, 2, 4); g.fillRect(12, 5, 2, 4);
      g.fillStyle(0xbfb4a0, 1); g.fillRect(2, 4, 12, 1); g.fillRect(4, 7, 10, 1);
      g.generateTexture('decor_bones', 16, 10);
      g.destroy();
    }

    // ── decor_gravestone — RIP stone slab, 12x16 ──
    {
      const g = this.add.graphics();
      shadow(g, 6, 15, 10);
      g.fillStyle(0x5a5a5a, 1); g.fillRect(2, 4, 8, 10);
      g.fillStyle(0x5a5a5a, 1); g.fillRect(3, 2, 6, 2); g.fillRect(4, 1, 4, 1);
      g.fillStyle(0x7a7a7a, 1); g.fillRect(2, 4, 8, 2); g.fillRect(4, 1, 4, 1);
      g.fillStyle(0x3a3a3a, 1);
      g.fillRect(4, 7, 1, 1); g.fillRect(6, 7, 1, 1); g.fillRect(5, 9, 2, 1);
      g.fillRect(4, 11, 1, 2); g.fillRect(7, 11, 1, 2);
      g.generateTexture('decor_gravestone', 12, 16);
      g.destroy();
    }

    // ── decor_cactus — desert cactus, 12x20 ──
    {
      const g = this.add.graphics();
      shadow(g, 6, 19, 10);
      g.fillStyle(0x3d7a3d, 1); g.fillRect(5, 4, 2, 14);
      g.fillStyle(0x3d7a3d, 1); g.fillRect(2, 8, 2, 5); g.fillRect(1, 9, 1, 3); g.fillRect(3, 7, 1, 1);
      g.fillStyle(0x3d7a3d, 1); g.fillRect(8, 6, 2, 6); g.fillRect(10, 7, 1, 4); g.fillRect(8, 5, 1, 1);
      g.fillStyle(0x5d9a5d, 1); g.fillRect(5, 4, 1, 14); g.fillRect(8, 6, 1, 6); g.fillRect(2, 8, 1, 5);
      g.fillStyle(0xffffff, 0.9);
      g.fillRect(5, 6, 1, 1); g.fillRect(5, 9, 1, 1); g.fillRect(5, 12, 1, 1); g.fillRect(5, 15, 1, 1);
      g.fillRect(9, 8, 1, 1); g.fillRect(3, 10, 1, 1);
      g.generateTexture('decor_cactus', 12, 20);
      g.destroy();
    }

    // ── decor_flowers — tiny flower patch, 14x8 ──
    {
      const g = this.add.graphics();
      g.fillStyle(0x2d4a2a, 1); g.fillRect(1, 6, 12, 1);
      const petals: [number, number, number][] = [
        [2, 4, 0xff4455], [5, 2, 0xffe044], [9, 3, 0xaa44ff], [12, 5, 0xff88cc],
      ];
      for (const [x, y, c] of petals) {
        g.fillStyle(c, 1); g.fillRect(x, y, 2, 2);
        g.fillStyle(0xffffff, 0.7); g.fillRect(x, y, 1, 1);
        g.fillStyle(0x2d4a2a, 1); g.fillRect(x, y + 2, 1, 3);
      }
      g.generateTexture('decor_flowers', 14, 8);
      g.destroy();
    }

    // ── decor_icicle — ice shard, 8x14 ──
    {
      const g = this.add.graphics();
      g.fillStyle(0xa8d8f0, 1); g.fillTriangle(4, 13, 1, 2, 7, 2);
      g.fillStyle(0xd8f0ff, 1); g.fillTriangle(4, 11, 2, 3, 6, 3);
      g.fillStyle(0xffffff, 0.8); g.fillRect(3, 3, 1, 6);
      g.generateTexture('decor_icicle', 8, 14);
      g.destroy();
    }

    // ── decor_crystal — faceted gem, 10x14 ──
    {
      const g = this.add.graphics();
      shadow(g, 5, 13, 8);
      g.fillStyle(0x5d92c8, 1); g.fillTriangle(5, 1, 1, 8, 9, 8);
      g.fillStyle(0x5d92c8, 1); g.fillTriangle(1, 8, 9, 8, 5, 12);
      g.fillStyle(0x8fb4d8, 1); g.fillTriangle(5, 1, 5, 8, 1, 8);
      g.fillStyle(0xb8d8f0, 1); g.fillRect(4, 2, 1, 5);
      g.fillStyle(0xffffff, 0.8); g.fillRect(3, 3, 1, 2);
      g.generateTexture('decor_crystal', 10, 14);
      g.destroy();
    }

    // ── decor_crack — glowing fissure in earth, 20x8 ──
    {
      const g = this.add.graphics();
      g.fillStyle(0x1a0000, 1); g.fillRect(1, 3, 18, 2);
      g.fillStyle(0xff4400, 1); g.fillRect(2, 4, 16, 1);
      g.fillStyle(0xffaa33, 1); g.fillRect(4, 4, 3, 1); g.fillRect(10, 4, 4, 1); g.fillRect(15, 4, 2, 1);
      g.fillStyle(0x1a0000, 1); g.fillRect(3, 2, 2, 1); g.fillRect(8, 2, 2, 1); g.fillRect(14, 2, 2, 1);
      g.fillRect(5, 5, 2, 1); g.fillRect(11, 5, 2, 1);
      g.generateTexture('decor_crack', 20, 8);
      g.destroy();
    }

    // ── decor_column — broken ruined column, 12x20 ──
    {
      const g = this.add.graphics();
      shadow(g, 6, 19, 12);
      g.fillStyle(0xbfb4a0, 1); g.fillRect(3, 4, 6, 14);
      g.fillStyle(0xd8d0bc, 1); g.fillRect(3, 4, 2, 14);
      g.fillStyle(0x8b8270, 1); g.fillRect(8, 4, 1, 14);
      g.fillStyle(0xbfb4a0, 1); g.fillRect(1, 14, 10, 2); g.fillRect(2, 16, 8, 2);
      g.fillStyle(0x8b8270, 1); g.fillRect(1, 15, 10, 1); g.fillRect(2, 17, 8, 1);
      g.fillStyle(0x8b8270, 1); g.fillRect(4, 6, 1, 2); g.fillRect(7, 9, 1, 2);
      g.generateTexture('decor_column', 12, 20);
      g.destroy();
    }

    // ── decor_slime — green slime puddle, 14x6 ──
    {
      const g = this.add.graphics();
      g.fillStyle(0x4a8a3a, 0.8); g.fillEllipse(7, 4, 13, 4);
      g.fillStyle(0x6aba5a, 0.8); g.fillEllipse(6, 3, 9, 2);
      g.fillStyle(0xa8e898, 0.9); g.fillEllipse(4, 2, 3, 1);
      g.generateTexture('decor_slime', 14, 6);
      g.destroy();
    }

    // ── decor_sand_dune — pale sand mound, 18x8 ──
    {
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.15); g.fillEllipse(9, 7, 16, 1);
      g.fillStyle(0xd8b878, 1); g.fillEllipse(9, 5, 16, 5);
      g.fillStyle(0xe8c898, 1); g.fillEllipse(7, 3, 10, 3);
      g.fillStyle(0xf5dcb0, 0.8); g.fillEllipse(6, 3, 5, 1);
      g.generateTexture('decor_sand_dune', 18, 8);
      g.destroy();
    }
  }

  // ── Procedural bullet / death particle / gold pouch ──
  private generateMiscTextures(): void {
    // Bullet — small bright energy bolt, 8x4
    const bullet = this.add.graphics();
    bullet.fillStyle(0xffffff, 1);
    bullet.fillRect(1, 1, 6, 2);
    bullet.fillStyle(0x80dfff, 1);
    bullet.fillRect(0, 1, 1, 2);
    bullet.fillRect(7, 1, 1, 2);
    bullet.fillStyle(0xaad8ff, 0.6);
    bullet.fillRect(2, 0, 4, 1);
    bullet.fillRect(2, 3, 4, 1);
    bullet.generateTexture('bullet', 8, 4);
    bullet.destroy();

    // Death particle — small glow dot, 6x6
    const dp = this.add.graphics();
    dp.fillStyle(0xffab40, 1);
    dp.fillCircle(3, 3, 3);
    dp.fillStyle(0xffffff, 0.9);
    dp.fillCircle(3, 3, 1);
    dp.generateTexture('death_particle', 6, 6);
    dp.destroy();

    // Gold pouch — simple sack with coin, 14x14
    const gp = this.add.graphics();
    gp.fillStyle(0x000000, 0.35);
    gp.fillEllipse(7, 13, 10, 2);
    gp.fillStyle(0x8b6914, 1);
    gp.fillRect(3, 5, 8, 7);
    gp.fillRect(4, 4, 6, 1);
    gp.fillRect(2, 6, 1, 5);
    gp.fillRect(11, 6, 1, 5);
    gp.fillStyle(0xb8860b, 1);
    gp.fillRect(4, 6, 2, 2);
    gp.fillRect(4, 9, 2, 1);
    gp.fillStyle(0xffd700, 1);
    gp.fillRect(5, 2, 4, 2);
    gp.fillRect(4, 2, 1, 1);
    gp.fillRect(9, 2, 1, 1);
    gp.fillStyle(0xfff9c4, 0.8);
    gp.fillRect(6, 2, 1, 1);
    gp.generateTexture('gold_pouch', 14, 14);
    gp.destroy();
  }

  // ── Per-weapon bullet textures (tinted at fire time by weapon bulletColor) ──
  private generateBulletTextures(): void {
    // bullet_pistol — small round pill, 4x7
    {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 1); g.fillRect(1, 1, 2, 5);
      g.fillStyle(0xffffff, 1); g.fillRect(0, 2, 4, 3);
      g.fillStyle(0xffffff, 0.5); g.fillRect(1, 0, 2, 1); g.fillRect(1, 6, 2, 1);
      g.generateTexture('bullet_pistol', 4, 7);
      g.destroy();
    }
    // bullet_smg — tiny fast streak, 2x8
    {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 2, 8);
      g.fillStyle(0xffffff, 0.4); g.fillRect(0, 0, 2, 2);
      g.generateTexture('bullet_smg', 2, 8);
      g.destroy();
    }
    // bullet_ar — slightly fatter bolt, 4x9
    {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 1); g.fillRect(1, 0, 2, 9);
      g.fillStyle(0xffffff, 1); g.fillRect(0, 3, 4, 3);
      g.fillStyle(0xffffff, 0.4); g.fillRect(1, 8, 2, 1);
      g.generateTexture('bullet_ar', 4, 9);
      g.destroy();
    }
    // bullet_lmg — chunky heavy slug, 5x10
    {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 1); g.fillRect(0, 2, 5, 6);
      g.fillStyle(0xffffff, 1); g.fillRect(1, 1, 3, 8);
      g.fillStyle(0xffffff, 1); g.fillRect(1, 0, 3, 1); g.fillRect(1, 9, 3, 1);
      g.fillStyle(0xffffff, 0.5); g.fillRect(0, 5, 5, 2);
      g.generateTexture('bullet_lmg', 5, 10);
      g.destroy();
    }
    // bullet_minigun — long tracer, 3x14
    {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 1); g.fillRect(1, 0, 1, 14);
      g.fillStyle(0xffffff, 1); g.fillRect(0, 4, 3, 6);
      g.fillStyle(0xffffff, 0.4); g.fillRect(0, 10, 3, 4); g.fillRect(0, 0, 3, 4);
      g.generateTexture('bullet_minigun', 3, 14);
      g.destroy();
    }
    // bullet_flamer — fuzzy flame blob, 8x10
    {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 1); g.fillRect(2, 3, 4, 5);
      g.fillStyle(0xffffff, 1); g.fillRect(3, 1, 2, 8);
      g.fillStyle(0xffffff, 1); g.fillRect(1, 4, 6, 3);
      g.fillStyle(0xffffff, 0.55);
      g.fillRect(0, 4, 1, 2); g.fillRect(7, 4, 1, 2);
      g.fillRect(2, 0, 1, 1); g.fillRect(5, 0, 1, 1);
      g.fillRect(2, 9, 1, 1); g.fillRect(5, 9, 1, 1);
      g.generateTexture('bullet_flamer', 8, 10);
      g.destroy();
    }
    // bullet_cryo — ice shard diamond, 6x10
    {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 1); g.fillTriangle(3, 0, 0, 5, 6, 5);
      g.fillStyle(0xffffff, 1); g.fillTriangle(0, 5, 6, 5, 3, 10);
      g.fillStyle(0xffffff, 0.5); g.fillRect(2, 2, 2, 6);
      g.fillStyle(0xffffff, 0.3); g.fillRect(3, 0, 1, 10);
      g.generateTexture('bullet_cryo', 6, 10);
      g.destroy();
    }
    // bullet_railgun — thin lance, 2x16
    {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 2, 16);
      g.fillStyle(0xffffff, 0.5); g.fillRect(0, 0, 2, 2); g.fillRect(0, 14, 2, 2);
      g.generateTexture('bullet_railgun', 2, 16);
      g.destroy();
    }
    // bullet_plasma — glowing orb with halo, 10x10
    {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 0.25); g.fillCircle(5, 5, 5);
      g.fillStyle(0xffffff, 0.6); g.fillCircle(5, 5, 4);
      g.fillStyle(0xffffff, 1); g.fillCircle(5, 5, 2);
      g.fillStyle(0xffffff, 0.8); g.fillRect(4, 3, 1, 1); g.fillRect(3, 4, 1, 1);
      g.generateTexture('bullet_plasma', 10, 10);
      g.destroy();
    }
    // bullet_voidbeam — dark-cored bolt with halo, 6x12
    {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 0.4); g.fillEllipse(3, 6, 6, 11);
      g.fillStyle(0xffffff, 1); g.fillEllipse(3, 6, 3, 9);
      g.fillStyle(0x000000, 1); g.fillRect(2, 4, 2, 4);
      g.fillStyle(0xffffff, 0.7); g.fillRect(2, 5, 2, 1);
      g.generateTexture('bullet_voidbeam', 6, 12);
      g.destroy();
    }
    // bullet_godslayer — starburst cross, 12x12
    {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 0.3); g.fillCircle(6, 6, 6);
      g.fillStyle(0xffffff, 1);
      g.fillRect(5, 0, 2, 12);
      g.fillRect(0, 5, 12, 2);
      g.fillStyle(0xffffff, 0.6);
      g.fillRect(1, 1, 2, 2); g.fillRect(9, 1, 2, 2);
      g.fillRect(1, 9, 2, 2); g.fillRect(9, 9, 2, 2);
      g.fillStyle(0xffffff, 1); g.fillCircle(6, 6, 2);
      g.generateTexture('bullet_godslayer', 12, 12);
      g.destroy();
    }

    // Pixel-crisp filter for all bullet textures
    for (const key of [
      'bullet_pistol', 'bullet_smg', 'bullet_ar', 'bullet_lmg', 'bullet_minigun',
      'bullet_flamer', 'bullet_cryo', 'bullet_railgun', 'bullet_plasma',
      'bullet_voidbeam', 'bullet_godslayer',
    ]) {
      this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
  }

  // ── Shared muzzle flash + trail particle textures (tinted at spawn) ──
  private generateMuzzleFlashTextures(): void {
    // muzzle_flash — 4-point radial burst, 16x16
    const m = this.add.graphics();
    m.fillStyle(0xffffff, 1);
    m.fillCircle(8, 8, 4);
    m.fillStyle(0xffffff, 0.7);
    m.fillRect(7, 0, 2, 16);
    m.fillRect(0, 7, 16, 2);
    m.fillStyle(0xffffff, 0.55);
    m.fillRect(3, 3, 2, 2); m.fillRect(11, 3, 2, 2);
    m.fillRect(3, 11, 2, 2); m.fillRect(11, 11, 2, 2);
    m.fillStyle(0xffffff, 0.35);
    m.fillCircle(8, 8, 7);
    m.generateTexture('muzzle_flash', 16, 16);
    m.destroy();
    this.textures.get('muzzle_flash').setFilter(Phaser.Textures.FilterMode.NEAREST);

    // trail_dot — tiny soft blob for bullet trails, 6x6
    const t = this.add.graphics();
    t.fillStyle(0xffffff, 0.35); t.fillCircle(3, 3, 3);
    t.fillStyle(0xffffff, 0.75); t.fillCircle(3, 3, 2);
    t.fillStyle(0xffffff, 1); t.fillCircle(3, 3, 1);
    t.generateTexture('trail_dot', 6, 6);
    t.destroy();
    this.textures.get('trail_dot').setFilter(Phaser.Textures.FilterMode.NEAREST);
  }

  // ── Barrel textures (tinted at spawn by Barrel entity per op category) ──
  private generateBarrelTextures(): void {
    // barrel_body — wooden barrel with metal bands, 20x24
    const g = this.add.graphics();
    // Shadow
    g.fillStyle(0x000000, 0.35);
    g.fillEllipse(10, 23, 18, 2);
    // Main body
    g.fillStyle(0xffffff, 1);
    g.fillRect(2, 3, 16, 19);
    // Body shadow right side
    g.fillStyle(0xffffff, 0.7);
    g.fillRect(14, 3, 4, 19);
    // Body highlight left side
    g.fillStyle(0xffffff, 1);
    g.fillRect(3, 4, 2, 17);
    // Wood plank seams (vertical dark lines)
    g.fillStyle(0x000000, 0.25);
    g.fillRect(6, 4, 1, 17);
    g.fillRect(10, 4, 1, 17);
    g.fillRect(13, 4, 1, 17);
    // Top rim
    g.fillStyle(0xffffff, 1);
    g.fillEllipse(10, 3, 16, 3);
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(10, 4, 14, 2);
    // Metal bands
    g.fillStyle(0x333333, 1);
    g.fillRect(2, 7, 16, 2);
    g.fillRect(2, 17, 16, 2);
    g.fillStyle(0x666666, 1);
    g.fillRect(2, 7, 16, 1);
    g.fillRect(2, 17, 16, 1);
    // Rivets
    g.fillStyle(0x111111, 1);
    g.fillRect(4, 7, 1, 2); g.fillRect(15, 7, 1, 2);
    g.fillRect(4, 17, 1, 2); g.fillRect(15, 17, 1, 2);
    g.generateTexture('barrel_body', 20, 24);
    g.destroy();
    this.textures.get('barrel_body').setFilter(Phaser.Textures.FilterMode.NEAREST);

    // barrel_chunk — splinter particle for destruction, 4x6
    const c = this.add.graphics();
    c.fillStyle(0xffffff, 1); c.fillRect(0, 0, 4, 6);
    c.fillStyle(0x000000, 0.3); c.fillRect(0, 4, 4, 2);
    c.fillStyle(0xffffff, 0.5); c.fillRect(0, 0, 1, 6);
    c.generateTexture('barrel_chunk', 4, 6);
    c.destroy();
    this.textures.get('barrel_chunk').setFilter(Phaser.Textures.FilterMode.NEAREST);
  }

  private generateGateTextures(): void {
    // ── Boss gate — wide banner (the only remaining gate-style texture) ──
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
}
