// src/scenes/HUDScene.ts
// Slim mobile-first HUD: score top-left, units top-right, distance top-center,
// weapon bottom-left, boss HP replaces top bar when active, floating kill streaks.
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';
import { LevelManager } from '@/config/progression';
import { PerkManager } from '@/systems/PerkManager';

/** Safe margin from edges to avoid ENVELOP cropping */
const PAD = 32;

/** Archero 2-style drop shadow for HUD text */
const HUD_SHADOW: Phaser.Types.GameObjects.Text.TextShadow = {
  offsetX: 1, offsetY: 1, color: '#000', blur: 3, fill: true, stroke: false,
};

export class HUDScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private distanceText!: Phaser.GameObjects.Text;
  private unitText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private bossHpBar!: Phaser.GameObjects.Graphics;
  private bossHpBg!: Phaser.GameObjects.Graphics;
  private bossBackingPanel!: Phaser.GameObjects.Graphics;
  private bossHpLabel!: Phaser.GameObjects.Text;
  private weaponIcon!: Phaser.GameObjects.Sprite;
  private weaponLabel!: Phaser.GameObjects.Text;
  private levelBanner!: Phaser.GameObjects.Container;
  private progressBar!: Phaser.GameObjects.Graphics;
  private topElements!: Phaser.GameObjects.Container;
  private pauseGlow!: Phaser.GameObjects.Graphics;

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
    // Subtle glow behind banner
    const bannerGlow = this.add.graphics();
    bannerGlow.fillStyle(accentColor, 0.12);
    bannerGlow.fillRoundedRect(-280, -76, 560, 152, 40);
    this.levelBanner.add(bannerGlow);
    const bannerBg = this.add.graphics();
    bannerBg.fillStyle(0x000000, 0.7);
    bannerBg.fillRoundedRect(-264, -60, 528, 120, 29);
    bannerBg.lineStyle(2, accentColor, 0.6);
    bannerBg.strokeRoundedRect(-264, -60, 528, 120, 29);
    this.levelBanner.add(bannerBg);
    this.levelBanner.add(this.add.text(0, -26, `LEVEL ${levelIndex + 1}`, {
      fontSize: '22px', color: accentHex, fontFamily: 'Arial, Helvetica, sans-serif', fontStyle: 'bold', letterSpacing: 5,
      stroke: '#1a3a4a', strokeThickness: 2,
      shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 4, fill: true, stroke: false },
    }).setOrigin(0.5));
    this.levelBanner.add(this.add.text(0, 10, level.name.toUpperCase(), {
      fontSize: '32px', color: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif', fontStyle: 'bold',
      stroke: '#1a3a4a', strokeThickness: 2,
      shadow: { offsetX: 1, offsetY: 2, color: '#000', blur: 5, fill: true, stroke: false },
    }).setOrigin(0.5));
    this.levelBanner.add(this.add.text(0, 44, level.theme.worldName, {
      fontSize: '16px', color: '#6a8ea0', fontFamily: 'Arial, Helvetica, sans-serif', letterSpacing: 3,
      stroke: '#1a3a4a', strokeThickness: 2,
      shadow: HUD_SHADOW,
    }).setOrigin(0.5));
    this.levelBanner.setAlpha(0);
    this.tweens.add({ targets: this.levelBanner, alpha: 1, y: { from: 160, to: 180 }, duration: 500, ease: 'Power2' });
    this.tweens.add({ targets: this.levelBanner, alpha: 0, y: 160, duration: 600, delay: 2800, ease: 'Power2' });

    // ── Top bar (beveled with gold trim) ──
    this.topElements = this.add.container(0, 0);

    const topBarBg = this.add.graphics();
    topBarBg.fillStyle(0x1c6da3, 0.85);
    topBarBg.fillRect(0, 0, GAME_WIDTH, 89);
    // Darker edge at the top for subtle gradient feel
    topBarBg.fillStyle(0x000000, 0.2);
    topBarBg.fillRect(0, 0, GAME_WIDTH, 6);
    topBarBg.fillStyle(0x000000, 0.1);
    topBarBg.fillRect(0, 6, GAME_WIDTH, 4);
    // Prominent gold accent line at bottom (3px)
    topBarBg.fillStyle(0xebb654, 0.7);
    topBarBg.fillRect(0, 86, GAME_WIDTH, 3);
    topBarBg.fillStyle(0x000000, 0.15);
    topBarBg.fillRect(0, 89, GAME_WIDTH, 10);
    this.topElements.add(topBarBg);

    // Score badge (gold border + inner glow)
    const scoreBadge = this.add.graphics();
    scoreBadge.fillStyle(0xebb654, 0.1);
    scoreBadge.fillRoundedRect(PAD - 4, 10, 185, 48, 24);
    scoreBadge.fillStyle(0xffffff, 0.08);
    scoreBadge.fillRoundedRect(PAD, 13, 177, 42, 21);
    scoreBadge.lineStyle(1.5, 0xebb654, 0.5);
    scoreBadge.strokeRoundedRect(PAD - 4, 10, 185, 48, 24);
    this.topElements.add(scoreBadge);
    this.topElements.add(this.add.text(PAD + 10, 30, '\u2605', { fontSize: '24px', color: '#ebb654', stroke: '#1a3a4a', strokeThickness: 2, shadow: HUD_SHADOW }).setOrigin(0, 0.5));
    this.scoreText = this.add.text(PAD + 38, 30, '0', {
      fontSize: '26px', color: '#ebb654', fontFamily: 'Arial, Helvetica, sans-serif', fontStyle: 'bold',
      stroke: '#1a3a4a', strokeThickness: 2,
      shadow: HUD_SHADOW,
    }).setOrigin(0, 0.5);
    this.topElements.add(this.scoreText);

    // Distance (center, subtle gold)
    this.distanceText = this.add.text(GAME_WIDTH / 2, 30, '0m', {
      fontSize: '18px', color: '#c89530', fontFamily: 'Arial, Helvetica, sans-serif',
      stroke: '#000000', strokeThickness: 2,
      shadow: HUD_SHADOW,
    }).setOrigin(0.5);
    this.topElements.add(this.distanceText);

    // Units badge (blue border + inner glow)
    const unitBadge = this.add.graphics();
    unitBadge.fillStyle(0x40c4e8, 0.1);
    unitBadge.fillRoundedRect(GAME_WIDTH - PAD - 155, 10, 155, 48, 24);
    unitBadge.fillStyle(0xffffff, 0.08);
    unitBadge.fillRoundedRect(GAME_WIDTH - PAD - 151, 13, 147, 42, 21);
    unitBadge.lineStyle(1.5, 0x40c4e8, 0.5);
    unitBadge.strokeRoundedRect(GAME_WIDTH - PAD - 155, 10, 155, 48, 24);
    this.topElements.add(unitBadge);
    this.topElements.add(this.add.text(GAME_WIDTH - PAD - 140, 30, '\u2694', { fontSize: '24px', color: '#40c4e8', stroke: '#1a3a4a', strokeThickness: 2, shadow: HUD_SHADOW }).setOrigin(0, 0.5));
    this.unitText = this.add.text(GAME_WIDTH - PAD - 8, 30, '0', {
      fontSize: '26px', color: '#40c4e8', fontFamily: 'Arial, Helvetica, sans-serif', fontStyle: 'bold',
      stroke: '#1a3a4a', strokeThickness: 2,
      shadow: HUD_SHADOW,
    }).setOrigin(1, 0.5);
    this.topElements.add(this.unitText);

    // Gold (row 2, left)
    this.goldText = this.add.text(PAD + 10, 62, '\u{1FA99} 0g', {
      fontSize: '16px', color: '#ebb654', fontFamily: 'Arial, Helvetica, sans-serif', fontStyle: 'bold',
      stroke: '#1a3a4a', strokeThickness: 2,
      shadow: HUD_SHADOW,
    }).setOrigin(0, 0.5);
    this.topElements.add(this.goldText);

    // Boss distance progress bar (below top bar, thin)
    this.progressBar = this.add.graphics();

    // ── Boss HP bar (hidden, replaces top bar when active) ──
    const barWidth = 580;
    const barX = (GAME_WIDTH - barWidth) / 2;
    const barY = 20;

    // Dark backing panel behind boss HP area
    this.bossBackingPanel = this.add.graphics().setVisible(false);
    this.bossBackingPanel.fillStyle(0x1c6da3, 0.85);
    this.bossBackingPanel.fillRect(0, 0, GAME_WIDTH, 89);
    // Darker top edge for gradient feel
    this.bossBackingPanel.fillStyle(0x000000, 0.2);
    this.bossBackingPanel.fillRect(0, 0, GAME_WIDTH, 6);
    this.bossBackingPanel.fillStyle(0x000000, 0.1);
    this.bossBackingPanel.fillRect(0, 6, GAME_WIDTH, 4);
    this.bossBackingPanel.fillStyle(0xe85454, 0.5);
    this.bossBackingPanel.fillRect(0, 86, GAME_WIDTH, 3);
    this.bossBackingPanel.fillStyle(0x000000, 0.15);
    this.bossBackingPanel.fillRect(0, 89, GAME_WIDTH, 10);

    this.bossHpBg = this.add.graphics().setVisible(false);
    this.bossHpBar = this.add.graphics().setVisible(false);
    this.bossHpLabel = this.add.text(GAME_WIDTH / 2, barY + 19, '', {
      fontSize: '20px', color: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
      shadow: HUD_SHADOW,
    }).setOrigin(0.5).setVisible(false);

    this.bossHpBg.fillStyle(0xffffff, 0.1);
    this.bossHpBg.fillRoundedRect(barX - 4, barY, barWidth + 8, 38, 19);
    this.bossHpBg.lineStyle(1, 0xf07070, 0.35);
    this.bossHpBg.strokeRoundedRect(barX - 4, barY, barWidth + 8, 38, 19);

    // ── Weapon indicator (circular frame) ──
    const wFrame = this.add.graphics();
    wFrame.fillStyle(0x1c6da3, 0.8);
    wFrame.fillCircle(PAD + 28, GAME_HEIGHT - 80, 26);
    wFrame.lineStyle(2, 0x6a8ea0, 0.6);
    wFrame.strokeCircle(PAD + 28, GAME_HEIGHT - 80, 26);
    this.weaponIcon = this.add.sprite(PAD + 28, GAME_HEIGHT - 80, 'weapon_svg_pistol')
      .setDisplaySize(34, 34).setAlpha(0).setOrigin(0.5);
    this.weaponLabel = this.add.text(PAD + 60, GAME_HEIGHT - 80, '', {
      fontSize: '18px', color: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
      shadow: HUD_SHADOW,
    }).setOrigin(0, 0.5).setAlpha(0);

    // ── Active perks tray (bottom-center) ──
    this.drawPerkTray();

    // ── Pause button (bottom-right, always visible) ──
    // Pulsing glow behind the pause button
    this.pauseGlow = this.add.graphics();
    this.pauseGlow.fillStyle(0xebb654, 0.15);
    this.pauseGlow.fillCircle(GAME_WIDTH - PAD - 26, GAME_HEIGHT - 80, 34);
    this.tweens.add({
      targets: this.pauseGlow,
      alpha: { from: 0.6, to: 0.15 },
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const pauseBg = this.add.graphics();
    pauseBg.fillStyle(0x1c6da3, 0.8);
    pauseBg.fillRoundedRect(GAME_WIDTH - PAD - 52, GAME_HEIGHT - 80 - 26, 52, 52, 17);
    pauseBg.lineStyle(1, 0xebb654, 0.3);
    pauseBg.strokeRoundedRect(GAME_WIDTH - PAD - 52, GAME_HEIGHT - 80 - 26, 52, 52, 17);

    const pauseBtn = this.add.text(GAME_WIDTH - PAD - 26, GAME_HEIGHT - 80, '\u23F8', {
      fontSize: '26px', color: '#ebb654', stroke: '#1a3a4a', strokeThickness: 2,
      shadow: HUD_SHADOW,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(5);

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
      fontSize: '52px', color: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif', fontStyle: 'bold',
      letterSpacing: 10, stroke: '#1a3a4a', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(31);

    // Resume button
    const resumeContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT * 0.50).setDepth(31);
    const rBg = this.add.graphics();
    rBg.fillStyle(0x4cde39, 0.18);
    rBg.fillRoundedRect(-168, -38, 336, 76, 38);
    rBg.lineStyle(2, 0x4cde39, 0.6);
    rBg.strokeRoundedRect(-168, -38, 336, 76, 38);
    resumeContainer.add(rBg);
    resumeContainer.add(this.add.text(0, 0, '\u25B6  RESUME', {
      fontSize: '28px', color: '#4cde39', fontFamily: 'Arial, Helvetica, sans-serif', fontStyle: 'bold',
      stroke: '#1a3a4a', strokeThickness: 2,
    }).setOrigin(0.5));
    const rHit = this.add.zone(0, 0, 336, 76).setInteractive({ useHandCursor: true });
    resumeContainer.add(rHit);

    // Quit button
    const quitContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT * 0.62).setDepth(31);
    const qBg = this.add.graphics();
    qBg.fillStyle(0xf07070, 0.12);
    qBg.fillRoundedRect(-144, -31, 288, 62, 31);
    qBg.lineStyle(1, 0xf07070, 0.4);
    qBg.strokeRoundedRect(-144, -31, 288, 62, 31);
    quitContainer.add(qBg);
    quitContainer.add(this.add.text(0, 0, '\u2630  QUIT', {
      fontSize: '24px', color: '#f07070', fontFamily: 'Arial, Helvetica, sans-serif', fontStyle: 'bold',
      stroke: '#1a3a4a', strokeThickness: 2,
    }).setOrigin(0.5));
    const qHit = this.add.zone(0, 0, 288, 62).setInteractive({ useHandCursor: true });
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
      this.progressBar.fillRect(PAD, 94, GAME_WIDTH - PAD * 2, 6);
      this.progressBar.fillStyle(0xe85454, 0.4);
      this.progressBar.fillRect(PAD, 94, (GAME_WIDTH - PAD * 2) * progress, 6);
      if (progress < 0.98) {
        this.progressBar.fillStyle(0xe85454, 0.6);
        this.progressBar.fillCircle(PAD + (GAME_WIDTH - PAD * 2) * progress, 97, 4);
      }
    } else {
      this.progressBar.clear();
    }

    // Boss HP bar
    this.bossBackingPanel.setVisible(showBoss);
    this.bossHpBg.setVisible(showBoss);
    this.bossHpBar.setVisible(showBoss);
    this.bossHpLabel.setVisible(showBoss);

    // Hide normal top elements when boss bar is showing
    this.topElements.setVisible(!showBoss);

    if (showBoss) {
      const barWidth = 580;
      const barX = (GAME_WIDTH - barWidth) / 2;
      const barY = 20;
      const fillWidth = barWidth * this.bossHpPercent;

      this.bossHpBar.clear();
      const hpColor = this.bossHpPercent > 0.5 ? 0xe85454 :
                       this.bossHpPercent > 0.2 ? 0xe89040 : 0xe84040;
      this.bossHpBar.fillStyle(hpColor, 0.85);
      this.bossHpBar.fillRoundedRect(barX, barY + 2, fillWidth, 34, 17);
      // Glossy highlight strip at top of HP fill (Archero-style)
      this.bossHpBar.fillStyle(0xffffff, 0.15);
      this.bossHpBar.fillRoundedRect(barX + 4, barY + 4, Math.max(fillWidth - 8, 0), 6, 3);

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
        this.weaponIcon.setDisplaySize(38, 38);
      }
    }
  }

  private showStreakPopup(streak: number): void {
    const x = GAME_WIDTH / 2 + (Math.random() - 0.5) * 100;
    const y = GAME_HEIGHT * 0.45;
    const size = Math.min(62, 32 + streak * 3);
    const color = streak >= 10 ? '#ebb654' : streak >= 5 ? '#e8923a' : '#e85454';
    const txt = this.add.text(x, y, `x${streak}`, {
      fontSize: `${size}px`, color, fontFamily: 'Arial, Helvetica, sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 5,
      shadow: { offsetX: 0, offsetY: 0, color: color, blur: 8, fill: false, stroke: true },
    }).setOrigin(0.5).setDepth(15);

    this.tweens.add({
      targets: txt,
      y: y - 90,
      alpha: 0,
      scale: 1.6,
      duration: 900,
      ease: 'Power2',
      onComplete: () => txt.destroy(),
    });
  }

  private formatNumber(n: number): string {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return String(n);
  }

  private drawPerkTray(): void {
    const activePerks = PerkManager.instance.getAll();
    if (activePerks.length === 0) return;

    // Deduplicate perks
    const uniquePerks = new Map<string, { icon: string; count: number }>();
    for (const p of activePerks) {
      const existing = uniquePerks.get(p.id);
      if (existing) existing.count++;
      else uniquePerks.set(p.id, { icon: p.icon, count: 1 });
    }

    const perkCount = uniquePerks.size;
    const iconSize = 26;
    const spacing = 34;
    const totalW = perkCount * spacing;
    const trayY = GAME_HEIGHT - 44;
    const startX = GAME_WIDTH / 2 - totalW / 2 + spacing / 2;

    // Background pill
    const bg = this.add.graphics();
    bg.fillStyle(0x1c6da3, 0.7);
    bg.fillRoundedRect(startX - spacing / 2 - 8, trayY - 17, totalW + 16, 34, 17);
    bg.lineStyle(1, 0xebb654, 0.2);
    bg.strokeRoundedRect(startX - spacing / 2 - 8, trayY - 17, totalW + 16, 34, 17);

    let i = 0;
    for (const { icon, count } of uniquePerks.values()) {
      const ix = startX + i * spacing;
      this.add.text(ix, trayY, icon, {
        fontSize: `${iconSize - 4}px`,
      }).setOrigin(0.5);

      if (count > 1) {
        this.add.text(ix + 10, trayY + 7, `${count}`, {
          fontSize: '12px', color: '#ebb654', fontFamily: 'Arial, Helvetica, sans-serif', fontStyle: 'bold',
          stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5);
      }
      i++;
    }
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
