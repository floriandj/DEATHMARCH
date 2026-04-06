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

  private goldText!: Phaser.GameObjects.Text;

  score: number = 0;
  distance: number = 0;
  unitCount: number = 0;
  killStreak: number = 0;
  levelGold: number = 0;
  bossHpPercent: number = -1;
  weaponType: string = '';
  weaponName: string = '';
  bossName: string = '';

  constructor() {
    super({ key: 'HUDScene' });
  }

  create(): void {
    this.score = 0;
    this.distance = 0;
    this.unitCount = 0;
    this.killStreak = 0;
    this.bossHpPercent = -1;
    this.levelGold = 0;
    this.weaponType = '';
    this.weaponName = '';
    this.bossName = '';

    const level = LevelManager.instance.current;
    const levelIndex = LevelManager.instance.currentLevelIndex;
    const accentHex = level.theme.accentHex;
    const accentColor = level.theme.accentColor;

    // ── Level banner (animated intro) ──
    this.levelBanner = this.add.container(GAME_WIDTH / 2, 180);
    this.levelBanner.setDepth(20);

    const bannerBg = this.add.graphics();
    bannerBg.fillStyle(0x000000, 0.7);
    bannerBg.fillRoundedRect(-220, -50, 440, 100, 24);
    bannerBg.lineStyle(2, accentColor, 0.6);
    bannerBg.strokeRoundedRect(-220, -50, 440, 100, 24);
    this.levelBanner.add(bannerBg);

    this.levelBanner.add(this.add
      .text(0, -22, `LEVEL ${levelIndex + 1}`, {
        fontSize: '18px', color: accentHex, fontFamily: 'monospace',
        fontStyle: 'bold', letterSpacing: 5,
      }).setOrigin(0.5));

    this.levelBanner.add(this.add
      .text(0, 8, level.name.toUpperCase(), {
        fontSize: '26px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5));

    this.levelBanner.add(this.add
      .text(0, 36, level.theme.worldName, {
        fontSize: '13px', color: '#888888', fontFamily: 'monospace', letterSpacing: 3,
      }).setOrigin(0.5));

    this.levelBanner.setAlpha(0);
    this.tweens.add({ targets: this.levelBanner, alpha: 1, y: { from: 160, to: 180 }, duration: 500, ease: 'Power2' });
    this.tweens.add({ targets: this.levelBanner, alpha: 0, y: 160, duration: 600, delay: 2800, ease: 'Power2' });

    // ── Top bar ──
    const topBarBg = this.add.graphics();
    topBarBg.fillStyle(0x000000, 0.6);
    topBarBg.fillRect(0, 0, GAME_WIDTH, 110);
    topBarBg.fillStyle(0x000000, 0.3);
    topBarBg.fillRect(0, 110, GAME_WIDTH, 20);

    // ── Score (top-left) ──
    const leftPill = this.add.graphics();
    leftPill.fillStyle(0xffd43b, 0.12);
    leftPill.fillRoundedRect(12, 12, 220, 40, 20);
    leftPill.lineStyle(1, 0xffd43b, 0.25);
    leftPill.strokeRoundedRect(12, 12, 220, 40, 20);

    this.add.text(26, 25, '\u2605', { fontSize: '20px', color: '#ffd43b' }).setOrigin(0, 0.5);
    this.scoreText = this.add.text(52, 25, '0', {
      fontSize: '22px', color: '#ffd43b', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    // ── Distance (below score) ──
    const distPill = this.add.graphics();
    distPill.fillStyle(0xffffff, 0.07);
    distPill.fillRoundedRect(12, 60, 180, 34, 17);

    this.distanceText = this.add.text(26, 70, '0m', {
      fontSize: '16px', color: '#cccccc', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    // Gold earned this level (right side of distance pill)
    this.goldText = this.add.text(185, 70, '0g', {
      fontSize: '16px', color: '#ffd700', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(1, 0.5);

    // ── Units (top-right) ──
    const rightPill = this.add.graphics();
    rightPill.fillStyle(0x00d4ff, 0.12);
    rightPill.fillRoundedRect(GAME_WIDTH - 192, 12, 180, 40, 20);
    rightPill.lineStyle(1, 0x00d4ff, 0.25);
    rightPill.strokeRoundedRect(GAME_WIDTH - 192, 12, 180, 40, 20);

    this.add.text(GAME_WIDTH - 178, 25, '\u2694', { fontSize: '20px', color: '#00d4ff' }).setOrigin(0, 0.5);
    this.unitText = this.add.text(GAME_WIDTH - 24, 25, '0', {
      fontSize: '22px', color: '#00d4ff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(1, 0.5);

    // ── Kill streak (below units) ──
    const streakPill = this.add.graphics();
    streakPill.fillStyle(0xff6b6b, 0.1);
    streakPill.fillRoundedRect(GAME_WIDTH - 160, 60, 148, 34, 17);

    this.add.text(GAME_WIDTH - 146, 70, '\u26A1', { fontSize: '16px', color: '#ff6b6b' }).setOrigin(0, 0.5);
    this.killStreakText = this.add.text(GAME_WIDTH - 24, 70, 'x0', {
      fontSize: '18px', color: '#ff6b6b', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(1, 0.5);

    // ── Boss HP bar ──
    const barWidth = 500;
    const barX = (GAME_WIDTH - barWidth) / 2;
    const barY = 62;

    this.bossHpBg = this.add.graphics().setVisible(false);
    this.bossHpBar = this.add.graphics().setVisible(false);
    this.bossHpLabel = this.add
      .text(GAME_WIDTH / 2, barY + 16, '', {
        fontSize: '16px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      })
      .setOrigin(0.5).setVisible(false);

    this.bossHpBg.fillStyle(0xffffff, 0.1);
    this.bossHpBg.fillRoundedRect(barX - 4, barY, barWidth + 8, 32, 16);
    this.bossHpBg.lineStyle(1, 0xff6b6b, 0.35);
    this.bossHpBg.strokeRoundedRect(barX - 4, barY, barWidth + 8, 32, 16);

    // ── Weapon indicator ──
    this.weaponPill = this.add.graphics().setVisible(false);
    this.weaponIcon = this.add.sprite(GAME_WIDTH / 2 - 60, 108, 'weapon_svg_pistol')
      .setDisplaySize(28, 28).setAlpha(0.9).setVisible(false);
    this.weaponLabel = this.add.text(GAME_WIDTH / 2 - 38, 108, '', {
      fontSize: '16px', color: '#dddddd', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0, 0.5).setVisible(false);
  }

  update(): void {
    this.scoreText.setText(this.formatNumber(this.score));
    this.distanceText.setText(`${Math.floor(this.distance)}m`);
    this.unitText.setText(String(this.unitCount));
    this.killStreakText.setText(`x${this.killStreak}`);
    this.goldText.setText(`${this.levelGold}g`);

    const showBoss = this.bossHpPercent >= 0;
    this.bossHpBg.setVisible(showBoss);
    this.bossHpBar.setVisible(showBoss);
    this.bossHpLabel.setVisible(showBoss);

    if (showBoss) {
      const barWidth = 500;
      const barX = (GAME_WIDTH - barWidth) / 2;
      const barY = 62;
      const fillWidth = barWidth * this.bossHpPercent;

      this.bossHpBar.clear();
      const hpColor = this.bossHpPercent > 0.5 ? 0xff4040 :
                       this.bossHpPercent > 0.2 ? 0xff6b00 : 0xff2020;
      this.bossHpBar.fillStyle(hpColor, 0.85);
      this.bossHpBar.fillRoundedRect(barX, barY + 2, fillWidth, 28, 14);
      this.bossHpBar.fillStyle(0xffffff, 0.15);
      this.bossHpBar.fillRoundedRect(barX + 4, barY + 5, Math.max(fillWidth - 8, 0), 10, 5);

      this.bossHpLabel.setText(`${this.bossName || 'BOSS'}  ${Math.ceil(this.bossHpPercent * 100)}%`);
    }

    if (this.weaponType) {
      this.weaponPill.setVisible(true);
      this.weaponIcon.setVisible(true);
      this.weaponLabel.setVisible(true);
      this.weaponLabel.setText(this.weaponName);

      const pillW = 160;
      this.weaponPill.clear();
      this.weaponPill.fillStyle(0xffffff, 0.08);
      this.weaponPill.fillRoundedRect(GAME_WIDTH / 2 - 80, 94, pillW, 30, 15);

      const svgKey = this.getWeaponSvgKey(this.weaponType);
      if (this.weaponIcon.texture.key !== svgKey) {
        this.weaponIcon.setTexture(svgKey);
        this.weaponIcon.setDisplaySize(28, 28);
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
      pistol: 'weapon_svg_pistol', smg: 'weapon_svg_smg', ar: 'weapon_svg_ar',
      lmg: 'weapon_svg_lmg', minigun: 'weapon_svg_minigun', cryo: 'weapon_svg_cryo',
      railgun: 'weapon_svg_railgun', plasma: 'weapon_svg_plasma',
      voidbeam: 'weapon_svg_voidbeam', godslayer: 'weapon_svg_godslayer',
      flamer: 'weapon_svg_flamer',
    };
    return map[weaponType] || 'weapon_svg_pistol';
  }
}
