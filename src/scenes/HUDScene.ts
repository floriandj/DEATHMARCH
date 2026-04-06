// src/scenes/HUDScene.ts
import Phaser from 'phaser';
import { GAME_WIDTH } from '@/config/GameConfig';
import { LevelManager } from '@/config/progression';

export class HUDScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private distanceText!: Phaser.GameObjects.Text;
  private unitText!: Phaser.GameObjects.Text;
  private killStreakText!: Phaser.GameObjects.Text;
  private bossHpBar!: Phaser.GameObjects.Graphics;
  private bossHpBg!: Phaser.GameObjects.Graphics;
  private bossHpLabel!: Phaser.GameObjects.Text;
  private weaponIcon!: Phaser.GameObjects.Sprite;
  private weaponLabel!: Phaser.GameObjects.Text;
  private weaponPill!: Phaser.GameObjects.Graphics;
  private levelBanner!: Phaser.GameObjects.Container;

  score: number = 0;
  distance: number = 0;
  unitCount: number = 0;
  killStreak: number = 0;
  bossHpPercent: number = -1; // -1 = hidden
  weaponType: string = '';
  weaponName: string = '';
  bossName: string = '';

  constructor() {
    super({ key: 'HUDScene' });
  }

  create(): void {
    // Reset state on (re)launch
    this.score = 0;
    this.distance = 0;
    this.unitCount = 0;
    this.killStreak = 0;
    this.bossHpPercent = -1;
    this.weaponType = '';
    this.weaponName = '';
    this.bossName = '';

    const level = LevelManager.instance.current;
    const levelIndex = LevelManager.instance.currentLevelIndex;
    const accentHex = level.theme.accentHex;
    const accentColor = level.theme.accentColor;

    // ── Level banner (animated intro, fades out) ──
    this.levelBanner = this.add.container(GAME_WIDTH / 2, 160);
    this.levelBanner.setDepth(20);

    const bannerBg = this.add.graphics();
    bannerBg.fillStyle(0x000000, 0.6);
    bannerBg.fillRoundedRect(-180, -40, 360, 80, 20);
    bannerBg.lineStyle(2, accentColor, 0.5);
    bannerBg.strokeRoundedRect(-180, -40, 360, 80, 20);
    this.levelBanner.add(bannerBg);

    const levelNum = this.add
      .text(0, -18, `LEVEL ${levelIndex + 1}`, {
        fontSize: '13px',
        color: accentHex,
        fontFamily: 'monospace',
        fontStyle: 'bold',
        letterSpacing: 4,
      })
      .setOrigin(0.5);
    this.levelBanner.add(levelNum);

    const levelName = this.add
      .text(0, 8, level.name.toUpperCase(), {
        fontSize: '20px',
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.levelBanner.add(levelName);

    const worldName = this.add
      .text(0, 30, level.theme.worldName, {
        fontSize: '10px',
        color: '#666666',
        fontFamily: 'monospace',
        letterSpacing: 3,
      })
      .setOrigin(0.5);
    this.levelBanner.add(worldName);

    // Animate banner: fade in, hold, fade out
    this.levelBanner.setAlpha(0);
    this.tweens.add({
      targets: this.levelBanner,
      alpha: 1,
      y: { from: 140, to: 160 },
      duration: 500,
      ease: 'Power2',
    });
    this.tweens.add({
      targets: this.levelBanner,
      alpha: 0,
      y: 140,
      duration: 600,
      delay: 2500,
      ease: 'Power2',
    });

    // ── Top bar background ──
    const topBarBg = this.add.graphics();
    topBarBg.fillStyle(0x000000, 0.5);
    topBarBg.fillRect(0, 0, GAME_WIDTH, 90);
    topBarBg.fillStyle(0x000000, 0.25);
    topBarBg.fillRect(0, 90, GAME_WIDTH, 20);

    // ── Left stat cluster - Score ──
    const leftPill = this.add.graphics();
    leftPill.fillStyle(0xffd43b, 0.1);
    leftPill.fillRoundedRect(12, 12, 180, 30, 15);
    leftPill.lineStyle(1, 0xffd43b, 0.2);
    leftPill.strokeRoundedRect(12, 12, 180, 30, 15);

    this.add.text(24, 20, '\u2605', { fontSize: '14px', color: '#ffd43b' }).setOrigin(0, 0.5);

    this.scoreText = this.add.text(42, 20, '0', {
      fontSize: '16px',
      color: '#ffd43b',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    // ── Left stat cluster - Distance ──
    const distPill = this.add.graphics();
    distPill.fillStyle(0xffffff, 0.06);
    distPill.fillRoundedRect(12, 48, 150, 26, 13);

    this.distanceText = this.add.text(24, 54, '0m', {
      fontSize: '13px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
    }).setOrigin(0, 0.5);

    // ── Right stat cluster - Units ──
    const rightPill = this.add.graphics();
    rightPill.fillStyle(0x00d4ff, 0.1);
    rightPill.fillRoundedRect(GAME_WIDTH - 152, 12, 140, 30, 15);
    rightPill.lineStyle(1, 0x00d4ff, 0.2);
    rightPill.strokeRoundedRect(GAME_WIDTH - 152, 12, 140, 30, 15);

    this.unitText = this.add.text(GAME_WIDTH - 24, 20, '0', {
      fontSize: '16px',
      color: '#00d4ff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(1, 0.5);

    this.add.text(GAME_WIDTH - 140, 20, '\u2694', { fontSize: '14px', color: '#00d4ff' }).setOrigin(0, 0.5);

    // ── Right stat cluster - Kill streak ──
    const streakPill = this.add.graphics();
    streakPill.fillStyle(0xff6b6b, 0.08);
    streakPill.fillRoundedRect(GAME_WIDTH - 130, 48, 118, 26, 13);

    this.killStreakText = this.add.text(GAME_WIDTH - 24, 54, 'x0', {
      fontSize: '13px',
      color: '#ff6b6b',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(1, 0.5);

    this.add.text(GAME_WIDTH - 118, 54, '\u26A1', { fontSize: '11px', color: '#ff6b6b' }).setOrigin(0, 0.5);

    // ── Boss HP bar (hidden by default) ──
    const barWidth = 400;
    const barX = (GAME_WIDTH - barWidth) / 2;
    const barY = 52;

    this.bossHpBg = this.add.graphics().setVisible(false);
    this.bossHpBar = this.add.graphics().setVisible(false);
    this.bossHpLabel = this.add
      .text(GAME_WIDTH / 2, barY + 12, '', {
        fontSize: '12px',
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.bossHpBg.fillStyle(0xffffff, 0.08);
    this.bossHpBg.fillRoundedRect(barX - 4, barY, barWidth + 8, 24, 12);
    this.bossHpBg.lineStyle(1, 0xff6b6b, 0.3);
    this.bossHpBg.strokeRoundedRect(barX - 4, barY, barWidth + 8, 24, 12);

    // ── Weapon indicator pill ──
    this.weaponPill = this.add.graphics().setVisible(false);
    this.weaponIcon = this.add.sprite(GAME_WIDTH / 2 - 50, 86, 'weapon_svg_pistol')
      .setDisplaySize(20, 20)
      .setAlpha(0.9)
      .setVisible(false);
    this.weaponLabel = this.add.text(GAME_WIDTH / 2 - 30, 86, '', {
      fontSize: '12px',
      color: '#cccccc',
      fontFamily: 'monospace',
    }).setOrigin(0, 0.5).setVisible(false);
  }

  update(): void {
    this.scoreText.setText(this.formatNumber(this.score));
    this.distanceText.setText(`${Math.floor(this.distance)}m`);
    this.unitText.setText(String(this.unitCount));
    this.killStreakText.setText(`x${this.killStreak}`);

    const showBoss = this.bossHpPercent >= 0;
    this.bossHpBg.setVisible(showBoss);
    this.bossHpBar.setVisible(showBoss);
    this.bossHpLabel.setVisible(showBoss);

    if (showBoss) {
      const barWidth = 400;
      const barX = (GAME_WIDTH - barWidth) / 2;
      const barY = 52;
      const fillWidth = barWidth * this.bossHpPercent;

      this.bossHpBar.clear();
      const hpColor = this.bossHpPercent > 0.5 ? 0xff4040 :
                       this.bossHpPercent > 0.2 ? 0xff6b00 : 0xff2020;
      this.bossHpBar.fillStyle(hpColor, 0.8);
      this.bossHpBar.fillRoundedRect(barX, barY + 2, fillWidth, 20, 10);
      this.bossHpBar.fillStyle(0xffffff, 0.15);
      this.bossHpBar.fillRoundedRect(barX + 4, barY + 4, Math.max(fillWidth - 8, 0), 8, 4);

      const name = this.bossName || 'BOSS';
      this.bossHpLabel.setText(`${name}  ${Math.ceil(this.bossHpPercent * 100)}%`);
    }

    // Update weapon display
    if (this.weaponType) {
      this.weaponPill.setVisible(true);
      this.weaponIcon.setVisible(true);
      this.weaponLabel.setVisible(true);
      this.weaponLabel.setText(this.weaponName);

      const pillW = 120;
      this.weaponPill.clear();
      this.weaponPill.fillStyle(0xffffff, 0.06);
      this.weaponPill.fillRoundedRect(GAME_WIDTH / 2 - 60, 76, pillW, 22, 11);

      const svgKey = this.getWeaponSvgKey(this.weaponType);
      if (this.weaponIcon.texture.key !== svgKey) {
        this.weaponIcon.setTexture(svgKey);
        this.weaponIcon.setDisplaySize(20, 20);
      }
    }
  }

  private formatNumber(n: number): string {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return String(n);
  }

  private getWeaponSvgKey(weaponType: string): string {
    const map: Record<string, string> = {
      pistol: 'weapon_svg_pistol',
      smg: 'weapon_svg_smg',
      ar: 'weapon_svg_ar',
      lmg: 'weapon_svg_lmg',
      minigun: 'weapon_svg_minigun',
      cryo: 'weapon_svg_cryo',
      railgun: 'weapon_svg_railgun',
      plasma: 'weapon_svg_plasma',
      voidbeam: 'weapon_svg_voidbeam',
      godslayer: 'weapon_svg_godslayer',
      flamer: 'weapon_svg_flamer',
    };
    return map[weaponType] || 'weapon_svg_pistol';
  }
}
