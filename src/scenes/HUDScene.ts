// src/scenes/HUDScene.ts
// Supercell-style in-game HUD with beveled pills, gold score, and chunky boss HP bar
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';
import { LevelManager } from '@/config/progression';
import {
  BG, BORDER, GOLD, ACCENT, NEUTRAL, FONT, ANIM, Z,
  darken, lighten, toHex,
} from '@/ui/RoyaleTheme';
import { drawPill, drawHpBar, createButton } from '@/ui/RoyaleUI';

const PAD = 32;

export class HUDScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private distanceText!: Phaser.GameObjects.Text;
  private unitText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private bossHpBar!: Phaser.GameObjects.Graphics;
  private bossHpBg!: Phaser.GameObjects.Graphics;
  private bossHpLabel!: Phaser.GameObjects.Text;
  private weaponIcon!: Phaser.GameObjects.Sprite;
  private weaponLabel!: Phaser.GameObjects.Text;
  private levelBanner!: Phaser.GameObjects.Container;
  private progressBar!: Phaser.GameObjects.Graphics;
  private topElements!: Phaser.GameObjects.Container;

  score: number = 0;
  distance: number = 0;
  unitCount: number = 0;
  killStreak: number = 0;
  levelGold: number = 0;
  bossHpPercent: number = -1;
  weaponType: string = '';
  weaponName: string = '';
  bossName: string = '';
  bossTriggerDistance: number = 3000;
  private lastKillStreak: number = 0;

  constructor() {
    super({ key: 'HUDScene' });
  }

  create(): void {
    this.score = 0;
    this.distance = 0;
    this.unitCount = 0;
    this.killStreak = 0;
    this.lastKillStreak = 0;
    this.levelGold = 0;
    this.bossHpPercent = -1;
    this.weaponType = '';
    this.weaponName = '';
    this.bossName = '';

    const level = LevelManager.instance.current;
    const levelIndex = LevelManager.instance.currentLevelIndex;
    const accentHex = level.theme.accentHex;
    const accentColor = level.theme.accentColor;
    this.bossTriggerDistance = level.boss.triggerDistance;

    // ── Level banner (animated intro with overshoot) ──
    this.levelBanner = this.add.container(GAME_WIDTH / 2, 180).setDepth(Z.popup);
    const bannerBg = this.add.graphics();
    // Shadow
    bannerBg.fillStyle(ACCENT.shadowPurple, 0.5);
    bannerBg.fillRoundedRect(-218, -48, 440, 100, 24);
    // Body
    bannerBg.fillStyle(BG.panel, 0.85);
    bannerBg.fillRoundedRect(-220, -50, 440, 100, 24);
    bannerBg.lineStyle(2, accentColor, 0.6);
    bannerBg.strokeRoundedRect(-220, -50, 440, 100, 24);
    // Top accent bar
    bannerBg.fillStyle(accentColor, 0.8);
    bannerBg.fillRoundedRect(-217, -47, 434, 5, { tl: 22, tr: 22, bl: 0, br: 0 });
    this.levelBanner.add(bannerBg);
    this.levelBanner.add(this.add.text(0, -22, `LEVEL ${levelIndex + 1}`, {
      fontSize: '18px', color: accentHex, fontFamily: FONT.body, fontStyle: 'bold', letterSpacing: 5,
    }).setOrigin(0.5));
    this.levelBanner.add(this.add.text(0, 8, level.name.toUpperCase(), {
      fontSize: '26px', color: NEUTRAL.whiteHex, fontFamily: FONT.display, fontStyle: 'bold',
    }).setOrigin(0.5));
    this.levelBanner.add(this.add.text(0, 36, level.theme.worldName, {
      fontSize: '13px', color: NEUTRAL.dimHex, fontFamily: FONT.body, letterSpacing: 3,
    }).setOrigin(0.5));
    // Overshoot pop-in
    this.levelBanner.setAlpha(0).setScale(0);
    this.tweens.add({
      targets: this.levelBanner,
      alpha: 1, scale: 1,
      duration: ANIM.overshoot.duration,
      ease: ANIM.overshoot.ease,
    });
    this.tweens.add({ targets: this.levelBanner, alpha: 0, scale: 0.9, duration: 500, delay: 2800, ease: 'Power2' });

    // ── Top bar (slim 70px with bevel) ──
    this.topElements = this.add.container(0, 0);

    const topBarBg = this.add.graphics();
    topBarBg.fillStyle(BG.panel, 0.6);
    topBarBg.fillRect(0, 0, GAME_WIDTH, 70);
    // Bottom shadow edge
    topBarBg.fillStyle(ACCENT.shadowPurple, 0.25);
    topBarBg.fillRect(0, 70, GAME_WIDTH, 6);
    this.topElements.add(topBarBg);

    // Score (top-left) — gold pill
    const scorePill = drawPill(this, { x: PAD, y: 10, w: 180, h: 36, color: GOLD.bright });
    this.topElements.add(scorePill);
    this.topElements.add(this.add.text(PAD + 12, 22, '\u2605', { fontSize: '18px', color: GOLD.hex.bright }).setOrigin(0, 0.5));
    this.scoreText = this.add.text(PAD + 34, 22, '0', {
      fontSize: '20px', color: GOLD.hex.bright, fontFamily: FONT.body, fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    this.topElements.add(this.scoreText);

    // Distance (top-center, subtle)
    this.distanceText = this.add.text(GAME_WIDTH / 2, 22, '0m', {
      fontSize: '14px', color: NEUTRAL.dimHex, fontFamily: FONT.body,
    }).setOrigin(0.5);
    this.topElements.add(this.distanceText);

    // Units (top-right) — teal pill
    const unitPill = drawPill(this, { x: GAME_WIDTH - PAD - 140, y: 10, w: 140, h: 36, color: ACCENT.teal });
    this.topElements.add(unitPill);
    this.topElements.add(this.add.text(GAME_WIDTH - PAD - 128, 22, '\u2694', { fontSize: '18px', color: ACCENT.tealHex }).setOrigin(0, 0.5));
    this.unitText = this.add.text(GAME_WIDTH - PAD - 8, 22, '0', {
      fontSize: '20px', color: ACCENT.tealHex, fontFamily: FONT.body, fontStyle: 'bold',
    }).setOrigin(1, 0.5);
    this.topElements.add(this.unitText);

    // Gold (below score, small)
    this.goldText = this.add.text(PAD + 12, 50, '0g', {
      fontSize: '13px', color: GOLD.hex.bright, fontFamily: FONT.body, fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    this.topElements.add(this.goldText);

    // Boss distance progress bar
    this.progressBar = this.add.graphics();

    // ── Boss HP bar (hidden, replaces top bar when active) ──
    const barWidth = 560;
    const barX = (GAME_WIDTH - barWidth) / 2;
    const barY = 20;
    this.bossHpBg = this.add.graphics().setVisible(false);
    this.bossHpBar = this.add.graphics().setVisible(false);
    this.bossHpLabel = this.add.text(GAME_WIDTH / 2, barY + 16, '', {
      fontSize: '16px', color: NEUTRAL.whiteHex, fontFamily: FONT.display, fontStyle: 'bold',
      stroke: '#1a0a30', strokeThickness: 2,
    }).setOrigin(0.5).setVisible(false);

    // Boss HP background frame
    this.bossHpBg.fillStyle(ACCENT.shadowPurple, 0.5);
    this.bossHpBg.fillRoundedRect(barX - 3, barY + 2, barWidth + 6, 32, 16);
    this.bossHpBg.fillStyle(NEUTRAL.white, 0.08);
    this.bossHpBg.fillRoundedRect(barX - 4, barY, barWidth + 8, 32, 16);
    this.bossHpBg.lineStyle(2, ACCENT.red, 0.4);
    this.bossHpBg.strokeRoundedRect(barX - 4, barY, barWidth + 8, 32, 16);

    // ── Weapon indicator (bottom-left, above thumb zone) ──
    this.weaponIcon = this.add.sprite(PAD + 16, GAME_HEIGHT - 80, 'weapon_svg_pistol')
      .setDisplaySize(32, 32).setAlpha(0).setOrigin(0.5);
    this.weaponLabel = this.add.text(PAD + 38, GAME_HEIGHT - 80, '', {
      fontSize: '14px', color: NEUTRAL.lightHex, fontFamily: FONT.body, fontStyle: 'bold',
    }).setOrigin(0, 0.5).setAlpha(0);

    // ── Pause button (top-right) — beveled mini-button ──
    const pauseBg = this.add.graphics();
    pauseBg.fillStyle(ACCENT.shadowPurple, 0.3);
    pauseBg.fillRoundedRect(GAME_WIDTH - PAD - 43, 54, 44, 44, 12);
    pauseBg.fillStyle(BG.elevated, 0.4);
    pauseBg.fillRoundedRect(GAME_WIDTH - PAD - 44, 52, 44, 44, 12);
    pauseBg.lineStyle(1, BORDER.base, 0.4);
    pauseBg.strokeRoundedRect(GAME_WIDTH - PAD - 44, 52, 44, 44, 12);
    this.topElements.add(pauseBg);

    const pauseBtn = this.add.text(GAME_WIDTH - PAD - 22, 68, '\u23F8', {
      fontSize: '22px', color: NEUTRAL.midHex,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(Z.scrollContent);
    this.topElements.add(pauseBtn);

    pauseBtn.on('pointerdown', () => {
      const gameScene = this.scene.get('GameScene');
      const bossScene = this.scene.get('BossScene');
      const activeScene = gameScene.scene.isActive() ? gameScene : bossScene;
      if (activeScene.scene.isActive()) {
        activeScene.scene.pause();
        this.showPauseOverlay(activeScene);
      }
    });
  }

  private showPauseOverlay(pausedScene: Phaser.Scene): void {
    const overlay = this.add.graphics();
    overlay.fillStyle(BG.overlay, 0.8);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    overlay.setDepth(Z.overlay);

    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.35, 'PAUSED', {
      fontSize: '44px', color: NEUTRAL.whiteHex, fontFamily: FONT.display, fontStyle: 'bold',
      stroke: '#1a0a30', strokeThickness: 5, letterSpacing: 8,
    }).setOrigin(0.5).setDepth(Z.overlayText);

    // Resume button — green Royale style
    const resumeBtn = createButton(this, {
      x: GAME_WIDTH / 2, y: GAME_HEIGHT * 0.50,
      w: 280, h: 64,
      label: '\u25B6  RESUME',
      colorTop: ACCENT.greenBright,
      colorBot: ACCENT.greenDark,
      depth: Z.overlayText,
      onPress: () => { cleanup(); pausedScene.scene.resume(); },
    });

    // Quit button — red Royale style
    const quitBtn = createButton(this, {
      x: GAME_WIDTH / 2, y: GAME_HEIGHT * 0.62,
      w: 240, h: 52,
      label: '\u2630  QUIT',
      colorTop: ACCENT.redBright,
      colorBot: ACCENT.redDark,
      fontSize: '20px',
      depth: Z.overlayText,
      onPress: () => {
        cleanup();
        pausedScene.scene.stop();
        this.scene.stop();
        this.scene.start('MenuScene');
      },
    });

    const cleanup = () => {
      overlay.destroy();
      title.destroy();
      resumeBtn.destroy();
      quitBtn.destroy();
    };
  }

  update(): void {
    this.scoreText.setText(this.formatNumber(this.score));
    this.distanceText.setText(`${Math.floor(this.distance)}m`);
    this.unitText.setText(String(this.unitCount));
    this.goldText.setText(`${this.levelGold}g`);

    if (this.killStreak > 1 && this.killStreak !== this.lastKillStreak) {
      this.lastKillStreak = this.killStreak;
      this.showStreakPopup(this.killStreak);
    }
    if (this.killStreak <= 1) this.lastKillStreak = 0;

    // Boss distance progress bar
    const showBoss = this.bossHpPercent >= 0;
    if (!showBoss && this.bossTriggerDistance > 0) {
      const progress = Math.min(1, this.distance / this.bossTriggerDistance);
      this.progressBar.clear();
      this.progressBar.fillStyle(NEUTRAL.white, 0.04);
      this.progressBar.fillRect(PAD, 68, GAME_WIDTH - PAD * 2, 4);
      this.progressBar.fillStyle(ACCENT.red, 0.45);
      this.progressBar.fillRect(PAD, 68, (GAME_WIDTH - PAD * 2) * progress, 4);
      if (progress < 0.98) {
        this.progressBar.fillStyle(ACCENT.red, 0.65);
        this.progressBar.fillCircle(PAD + (GAME_WIDTH - PAD * 2) * progress, 70, 3);
      }
    } else {
      this.progressBar.clear();
    }

    // Boss HP bar
    this.bossHpBg.setVisible(showBoss);
    this.bossHpBar.setVisible(showBoss);
    this.bossHpLabel.setVisible(showBoss);
    this.topElements.setVisible(!showBoss);

    if (showBoss) {
      const barWidth = 560;
      const barX = (GAME_WIDTH - barWidth) / 2;
      const barY = 20;
      const fillWidth = barWidth * this.bossHpPercent;

      this.bossHpBar.clear();
      const hpColor = this.bossHpPercent > 0.5 ? ACCENT.red :
                       this.bossHpPercent > 0.2 ? ACCENT.orange : ACCENT.redDark;
      // Fill bar
      this.bossHpBar.fillStyle(hpColor, 0.9);
      this.bossHpBar.fillRoundedRect(barX, barY + 2, fillWidth, 28, 14);
      // Shine on HP bar
      this.bossHpBar.fillStyle(NEUTRAL.white, 0.18);
      this.bossHpBar.fillRoundedRect(barX + 4, barY + 5, Math.max(fillWidth - 8, 0), 10, 5);

      this.bossHpLabel.setText(`${this.bossName || 'BOSS'}  ${Math.ceil(this.bossHpPercent * 100)}%`);
    }

    // Weapon display
    if (this.weaponType) {
      this.weaponIcon.setAlpha(0.8).setVisible(true);
      this.weaponLabel.setAlpha(0.8).setVisible(true);
      this.weaponLabel.setText(this.weaponName);
      const svgKey = this.getWeaponSvgKey(this.weaponType);
      if (this.weaponIcon.texture.key !== svgKey) {
        this.weaponIcon.setTexture(svgKey);
        this.weaponIcon.setDisplaySize(32, 32);
      }
    }
  }

  private showStreakPopup(streak: number): void {
    const x = GAME_WIDTH / 2 + (Math.random() - 0.5) * 100;
    const y = GAME_HEIGHT * 0.45;
    const size = Math.min(48, 24 + streak * 3);
    const txt = this.add.text(x, y, `x${streak}`, {
      fontSize: `${size}px`, color: ACCENT.redHex, fontFamily: FONT.display, fontStyle: 'bold',
      stroke: '#1a0a30', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(Z.hud);

    // Overshoot pop then fade
    txt.setScale(0);
    this.tweens.add({
      targets: txt,
      scale: 1.5,
      duration: 200,
      ease: ANIM.overshoot.ease,
    });
    this.tweens.add({
      targets: txt,
      y: y - 80,
      alpha: 0,
      duration: 700,
      delay: 150,
      ease: 'Power2',
      onComplete: () => txt.destroy(),
    });
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
