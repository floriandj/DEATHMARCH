// src/scenes/HUDScene.ts
// Slim mobile-first HUD: score top-left, units top-right, distance top-center,
// weapon bottom-left, boss HP replaces top bar when active, floating kill streaks.
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';
import { LevelManager } from '@/config/progression';

/** Safe margin from edges to avoid ENVELOP cropping */
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

    // ── Level banner (animated intro) ──
    this.levelBanner = this.add.container(GAME_WIDTH / 2, 180).setDepth(20);
    const bannerBg = this.add.graphics();
    bannerBg.fillStyle(0x000000, 0.7);
    bannerBg.fillRoundedRect(-220, -50, 440, 100, 24);
    bannerBg.lineStyle(2, accentColor, 0.6);
    bannerBg.strokeRoundedRect(-220, -50, 440, 100, 24);
    this.levelBanner.add(bannerBg);
    this.levelBanner.add(this.add.text(0, -22, `LEVEL ${levelIndex + 1}`, {
      fontSize: '18px', color: accentHex, fontFamily: 'monospace', fontStyle: 'bold', letterSpacing: 5,
    }).setOrigin(0.5));
    this.levelBanner.add(this.add.text(0, 8, level.name.toUpperCase(), {
      fontSize: '26px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5));
    this.levelBanner.add(this.add.text(0, 36, level.theme.worldName, {
      fontSize: '13px', color: '#888888', fontFamily: 'monospace', letterSpacing: 3,
    }).setOrigin(0.5));
    this.levelBanner.setAlpha(0);
    this.tweens.add({ targets: this.levelBanner, alpha: 1, y: { from: 160, to: 180 }, duration: 500, ease: 'Power2' });
    this.tweens.add({ targets: this.levelBanner, alpha: 0, y: 160, duration: 600, delay: 2800, ease: 'Power2' });

    // ── Top bar (slim 70px) ──
    this.topElements = this.add.container(0, 0);

    const topBarBg = this.add.graphics();
    topBarBg.fillStyle(0x000000, 0.5);
    topBarBg.fillRect(0, 0, GAME_WIDTH, 70);
    topBarBg.fillStyle(0x000000, 0.2);
    topBarBg.fillRect(0, 70, GAME_WIDTH, 10);
    this.topElements.add(topBarBg);

    // Score (top-left)
    const scorePill = this.add.graphics();
    scorePill.fillStyle(0xffd43b, 0.12);
    scorePill.fillRoundedRect(PAD, 10, 180, 36, 18);
    this.topElements.add(scorePill);
    this.topElements.add(this.add.text(PAD + 12, 22, '\u2605', { fontSize: '18px', color: '#ffd43b' }).setOrigin(0, 0.5));
    this.scoreText = this.add.text(PAD + 34, 22, '0', {
      fontSize: '20px', color: '#ffd43b', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    this.topElements.add(this.scoreText);

    // Distance (top-center, subtle)
    this.distanceText = this.add.text(GAME_WIDTH / 2, 22, '0m', {
      fontSize: '14px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.topElements.add(this.distanceText);

    // Units (top-right)
    const unitPill = this.add.graphics();
    unitPill.fillStyle(0x00d4ff, 0.12);
    unitPill.fillRoundedRect(GAME_WIDTH - PAD - 140, 10, 140, 36, 18);
    this.topElements.add(unitPill);
    this.topElements.add(this.add.text(GAME_WIDTH - PAD - 128, 22, '\u2694', { fontSize: '18px', color: '#00d4ff' }).setOrigin(0, 0.5));
    this.unitText = this.add.text(GAME_WIDTH - PAD - 8, 22, '0', {
      fontSize: '20px', color: '#00d4ff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(1, 0.5);
    this.topElements.add(this.unitText);

    // Gold (below score, small)
    this.goldText = this.add.text(PAD + 12, 50, '0g', {
      fontSize: '13px', color: '#ffd700', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    this.topElements.add(this.goldText);

    // Boss distance progress bar (below top bar, thin)
    this.progressBar = this.add.graphics();

    // ── Boss HP bar (hidden, replaces top bar when active) ──
    const barWidth = 560;
    const barX = (GAME_WIDTH - barWidth) / 2;
    const barY = 20;
    this.bossHpBg = this.add.graphics().setVisible(false);
    this.bossHpBar = this.add.graphics().setVisible(false);
    this.bossHpLabel = this.add.text(GAME_WIDTH / 2, barY + 16, '', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setVisible(false);

    this.bossHpBg.fillStyle(0xffffff, 0.1);
    this.bossHpBg.fillRoundedRect(barX - 4, barY, barWidth + 8, 32, 16);
    this.bossHpBg.lineStyle(1, 0xff6b6b, 0.35);
    this.bossHpBg.strokeRoundedRect(barX - 4, barY, barWidth + 8, 32, 16);

    // ── Weapon indicator (bottom-left, above thumb zone) ──
    this.weaponIcon = this.add.sprite(PAD + 16, GAME_HEIGHT - 80, 'weapon_svg_pistol')
      .setDisplaySize(32, 32).setAlpha(0).setOrigin(0.5);
    this.weaponLabel = this.add.text(PAD + 38, GAME_HEIGHT - 80, '', {
      fontSize: '14px', color: '#cccccc', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0, 0.5).setAlpha(0);

    // ── Pause button (top-right, above unit count) ──
    const pauseBg = this.add.graphics();
    pauseBg.fillStyle(0xffffff, 0.08);
    pauseBg.fillRoundedRect(GAME_WIDTH - PAD - 44, 52, 44, 44, 12);
    this.topElements.add(pauseBg);

    const pauseBtn = this.add.text(GAME_WIDTH - PAD - 22, 68, '\u23F8', {
      fontSize: '22px', color: '#999999',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(5);
    this.topElements.add(pauseBtn);

    pauseBtn.on('pointerdown', () => {
      // Pause the game scene (whichever is running)
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
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    overlay.setDepth(30);

    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.35, 'PAUSED', {
      fontSize: '44px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      letterSpacing: 8,
    }).setOrigin(0.5).setDepth(31);

    // Resume button
    const resumeContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT * 0.50).setDepth(31);
    const rBg = this.add.graphics();
    rBg.fillStyle(0x51cf66, 0.18);
    rBg.fillRoundedRect(-140, -32, 280, 64, 32);
    rBg.lineStyle(2, 0x51cf66, 0.6);
    rBg.strokeRoundedRect(-140, -32, 280, 64, 32);
    resumeContainer.add(rBg);
    resumeContainer.add(this.add.text(0, 0, '\u25B6  RESUME', {
      fontSize: '24px', color: '#51cf66', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5));
    const rHit = this.add.zone(0, 0, 280, 64).setInteractive({ useHandCursor: true });
    resumeContainer.add(rHit);

    // Quit button
    const quitContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT * 0.60).setDepth(31);
    const qBg = this.add.graphics();
    qBg.fillStyle(0xff6b6b, 0.12);
    qBg.fillRoundedRect(-120, -26, 240, 52, 26);
    qBg.lineStyle(1, 0xff6b6b, 0.4);
    qBg.strokeRoundedRect(-120, -26, 240, 52, 26);
    quitContainer.add(qBg);
    quitContainer.add(this.add.text(0, 0, '\u2630  QUIT', {
      fontSize: '20px', color: '#ff6b6b', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5));
    const qHit = this.add.zone(0, 0, 240, 52).setInteractive({ useHandCursor: true });
    quitContainer.add(qHit);

    const cleanup = () => {
      overlay.destroy();
      title.destroy();
      resumeContainer.destroy();
      quitContainer.destroy();
    };

    rHit.on('pointerdown', () => {
      cleanup();
      pausedScene.scene.resume();
    });

    qHit.on('pointerdown', () => {
      cleanup();
      pausedScene.scene.stop();
      this.scene.stop();
      this.scene.start('MenuScene');
    });
  }

  update(): void {
    this.scoreText.setText(this.formatNumber(this.score));
    this.distanceText.setText(`${Math.floor(this.distance)}m`);
    this.unitText.setText(String(this.unitCount));
    this.goldText.setText(`${this.levelGold}g`);

    // Floating kill streak popup (only when streak changes)
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
      // Background track
      this.progressBar.fillStyle(0xffffff, 0.06);
      this.progressBar.fillRect(PAD, 68, GAME_WIDTH - PAD * 2, 4);
      this.progressBar.fillStyle(0xff4040, 0.4);
      this.progressBar.fillRect(PAD, 68, (GAME_WIDTH - PAD * 2) * progress, 4);
      if (progress < 0.98) {
        this.progressBar.fillStyle(0xff4040, 0.6);
        this.progressBar.fillCircle(PAD + (GAME_WIDTH - PAD * 2) * progress, 70, 3);
      }
    } else {
      this.progressBar.clear();
    }

    // Boss HP bar
    this.bossHpBg.setVisible(showBoss);
    this.bossHpBar.setVisible(showBoss);
    this.bossHpLabel.setVisible(showBoss);

    // Hide normal top elements when boss bar is showing
    this.topElements.setVisible(!showBoss);

    if (showBoss) {
      const barWidth = 560;
      const barX = (GAME_WIDTH - barWidth) / 2;
      const barY = 20;
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

    // Weapon display (bottom-left)
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

  /** Floating kill streak text near center of action */
  private showStreakPopup(streak: number): void {
    const x = GAME_WIDTH / 2 + (Math.random() - 0.5) * 100;
    const y = GAME_HEIGHT * 0.45;
    const size = Math.min(48, 24 + streak * 3);
    const txt = this.add.text(x, y, `x${streak}`, {
      fontSize: `${size}px`, color: '#ff6b6b', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(15);

    this.tweens.add({
      targets: txt,
      y: y - 80,
      alpha: 0,
      scale: 1.5,
      duration: 800,
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
