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
  private lastScoreText: string = '';
  private lastDistanceText: string = '';
  private lastUnitText: string = '';
  private lastGoldText: string = '';
  private lastBossHpText: string = '';
  private lastWeaponText: string = '';

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
    this.lastScoreText = '';
    this.lastDistanceText = '';
    this.lastUnitText = '';
    this.lastGoldText = '';
    this.lastBossHpText = '';
    this.lastWeaponText = '';

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
      fontSize: '16px', color: '#a8c8d8', fontFamily: 'Arial, Helvetica, sans-serif', letterSpacing: 3,
      stroke: '#1a3a4a', strokeThickness: 2,
      shadow: HUD_SHADOW,
    }).setOrigin(0.5));
    this.levelBanner.setAlpha(0);
    this.tweens.add({ targets: this.levelBanner, alpha: 1, y: { from: 160, to: 180 }, duration: 500, ease: 'Power2' });
    this.tweens.add({ targets: this.levelBanner, alpha: 0, y: 160, duration: 600, delay: 2800, ease: 'Power2' });

    // ── Top bar (beveled with gold trim) ──
    this.topElements = this.add.container(0, 0);

    const topBarBg = this.add.graphics();
    topBarBg.fillStyle(0x3aa0e0, 0.92);
    topBarBg.fillRect(0, 0, GAME_WIDTH, 106);
    // Subtle light edge at the top for a polished feel
    topBarBg.fillStyle(0xffffff, 0.12);
    topBarBg.fillRect(0, 0, GAME_WIDTH, 8);
    topBarBg.fillStyle(0xffffff, 0.06);
    topBarBg.fillRect(0, 8, GAME_WIDTH, 5);
    // Prominent gold accent line at bottom
    topBarBg.fillStyle(0xebb654, 0.78);
    topBarBg.fillRect(0, 103, GAME_WIDTH, 4);
    topBarBg.fillStyle(0x000000, 0.1);
    topBarBg.fillRect(0, 106, GAME_WIDTH, 12);
    this.topElements.add(topBarBg);

    // Top header (pause, level, gold)
    this.pauseGlow = this.add.graphics();
    this.pauseGlow.fillStyle(0xebb654, 0.22);
    this.pauseGlow.fillRoundedRect(PAD - 6, 18, 76, 76, 24);
    this.topElements.add(this.pauseGlow);
    this.tweens.add({
      targets: this.pauseGlow,
      alpha: { from: 0.75, to: 0.18 },
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const pauseBg = this.add.graphics();
    pauseBg.fillStyle(0x4ea4f0, 0.96);
    pauseBg.fillRoundedRect(PAD, 22, 68, 68, 22);
    pauseBg.lineStyle(1.8, 0xebb654, 0.55);
    pauseBg.strokeRoundedRect(PAD, 22, 68, 68, 22);
    this.topElements.add(pauseBg);

    const pauseBtn = this.add.text(PAD + 34, 56, '\u23F8', {
      fontSize: '32px', color: '#ebb654', stroke: '#1a3a4e', strokeThickness: 2,
      shadow: HUD_SHADOW,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.topElements.add(pauseBtn);

    const levelBadgeW = 210;
    const levelBadgeH = 56;
    const levelBadgeX = (GAME_WIDTH - levelBadgeW) / 2;
    const levelBadgeY = 24;
    const levelBadge = this.add.graphics();
    levelBadge.fillStyle(0x4ea4f0, 0.95);
    levelBadge.fillRoundedRect(levelBadgeX, levelBadgeY, levelBadgeW, levelBadgeH, 24);
    levelBadge.lineStyle(1.8, accentColor, 0.88);
    levelBadge.strokeRoundedRect(levelBadgeX, levelBadgeY, levelBadgeW, levelBadgeH, 24);
    this.topElements.add(levelBadge);
    this.topElements.add(this.add.text(GAME_WIDTH / 2, 56, `Lv.${levelIndex + 1}`, {
      fontSize: '26px', color: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif', fontStyle: 'bold',
      stroke: '#1a3a4a', strokeThickness: 2,
      shadow: HUD_SHADOW,
    }).setOrigin(0.5));

    const goldBadgeW = 220;
    const goldBadgeH = 64;
    const goldBadgeX = GAME_WIDTH - PAD - goldBadgeW;
    const goldBadgeY = 20;
    const goldBadge = this.add.graphics();
    goldBadge.fillStyle(0x63c0ff, 0.95);
    goldBadge.fillRoundedRect(goldBadgeX, goldBadgeY, goldBadgeW, goldBadgeH, 28);
    goldBadge.lineStyle(1.8, 0xebb654, 0.55);
    goldBadge.strokeRoundedRect(goldBadgeX, goldBadgeY, goldBadgeW, goldBadgeH, 28);
    this.topElements.add(goldBadge);
    this.goldText = this.add.text(goldBadgeX + goldBadgeW / 2, goldBadgeY + goldBadgeH / 2, `\u{1FA99}  0g`, {
      fontSize: '24px', color: '#f4d860', fontFamily: 'Arial, Helvetica, sans-serif', fontStyle: 'bold',
      stroke: '#1a3a4a', strokeThickness: 3,
      shadow: HUD_SHADOW,
    }).setOrigin(0.5);
    this.topElements.add(this.goldText);

    pauseBtn.on('pointerdown', () => {
      const gameScene = this.scene.get('GameScene');
      const bossScene = this.scene.get('BossScene');
      const activeScene = gameScene.scene.isActive() ? gameScene : bossScene;
      if (activeScene.scene.isActive()) {
        activeScene.scene.pause();
        this.showPauseOverlay(activeScene);
      }
    });

    // Hidden legacy HUD texts for data updates
    this.scoreText = this.add.text(0, 0, '0', { fontSize: '1px', color: '#000000' }).setVisible(false);
    this.distanceText = this.add.text(0, 0, '0m', { fontSize: '1px', color: '#000000' }).setVisible(false);
    this.unitText = this.add.text(0, 0, '0', { fontSize: '1px', color: '#000000' }).setVisible(false);

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
    const scoreStr = this.formatNumber(this.score);
    if (scoreStr !== this.lastScoreText) {
      this.scoreText.setText(scoreStr);
      this.lastScoreText = scoreStr;
    }
    const distanceStr = `${Math.floor(this.distance)}m`;
    if (distanceStr !== this.lastDistanceText) {
      this.distanceText.setText(distanceStr);
      this.lastDistanceText = distanceStr;
    }
    const unitStr = String(this.unitCount);
    if (unitStr !== this.lastUnitText) {
      this.unitText.setText(unitStr);
      this.lastUnitText = unitStr;
    }
    const goldStr = `${this.levelGold}g`;
    if (goldStr !== this.lastGoldText) {
      this.goldText.setText(goldStr);
      this.lastGoldText = goldStr;
    }

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
      const barHeight = 18;
      const barY = 108;
      const barX = PAD;
      const barW = GAME_WIDTH - PAD * 2;
      this.progressBar.fillStyle(0xffffff, 0.18);
      this.progressBar.fillRoundedRect(barX, barY, barW, barHeight, barHeight / 2);
      this.progressBar.fillStyle(0xe85454, 0.64);
      this.progressBar.fillRoundedRect(barX, barY, barW * progress, barHeight, barHeight / 2);
      if (progress < 0.98) {
        this.progressBar.fillStyle(0xe85454, 0.92);
        this.progressBar.fillCircle(barX + barW * progress, barY + barHeight / 2, 9);
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

      const bossHpStr = `${this.bossName || 'BOSS'}  ${Math.ceil(this.bossHpPercent * 100)}%`;
      if (bossHpStr !== this.lastBossHpText) {
        this.bossHpLabel.setText(bossHpStr);
        this.lastBossHpText = bossHpStr;
      }
    }

    // Weapon display (bottom-left)
    if (this.weaponType) {
      this.weaponIcon.setAlpha(0.8).setVisible(true);
      this.weaponLabel.setAlpha(0.8).setVisible(true);
      if (this.weaponName !== this.lastWeaponText) {
        this.weaponLabel.setText(this.weaponName);
        this.lastWeaponText = this.weaponName;
      }
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
