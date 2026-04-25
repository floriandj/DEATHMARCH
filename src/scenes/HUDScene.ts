// src/scenes/HUDScene.ts
// "Bright Casual" mobile HUD: chunky pills with thick white borders, a
// pulsing Add icon on the gold chip, a vibrant boss HP bar, and a squishy
// pause button. Public field/lifecycle API is preserved so GameScene and
// BossScene keep writing to score/distance/unitCount/etc unchanged.
//
// Layout uses cameras.main.width/height so it adapts to any phone aspect.

import Phaser from 'phaser';
import { LevelManager } from '@/config/progression';
import { PerkManager } from '@/systems/PerkManager';
import { UIFactory, UIPalette } from '@/systems/UIFactory';

const PAD = 28;

export class HUDScene extends Phaser.Scene {
  // ---- Public data contract (written by GameScene/BossScene each frame) ----
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

  // ---- Internal display objects ----
  private scoreText!: Phaser.GameObjects.Text;
  private distanceText!: Phaser.GameObjects.Text;
  private unitText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private weaponIcon!: Phaser.GameObjects.Sprite;
  private weaponLabel!: Phaser.GameObjects.Text;
  private weaponPill!: Phaser.GameObjects.Container;
  private topBar!: Phaser.GameObjects.Container;
  private levelBanner!: Phaser.GameObjects.Container;
  private bossBar!: Phaser.GameObjects.Container;
  private bossHpFill!: Phaser.GameObjects.Graphics;
  private bossHpLabel!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;
  private bossTriggerDistanceCached: number = 3000;

  // Memoized text values (avoid setText canvas churn each frame)
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
    // Reset state
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

    const camW = this.cameras.main.width;
    const camH = this.cameras.main.height;
    const level = LevelManager.instance.current;
    const levelIndex = LevelManager.instance.currentLevelIndex;
    const accentColor = level.theme.accentColor;
    this.bossTriggerDistance = level.boss.triggerDistance;
    this.bossTriggerDistanceCached = this.bossTriggerDistance;

    this.buildLevelBanner(camW, levelIndex, level.name, level.theme.worldName, accentColor);
    this.buildTopBar(camW, levelIndex);
    this.buildBossBar(camW);
    this.buildWeaponPill(camW, camH);
    this.buildPerkTray(camW, camH);

    this.progressBar = this.add.graphics();
  }

  // ──────────────────────── Top bar ────────────────────────

  private buildTopBar(camW: number, levelIndex: number): void {
    this.topBar = this.add.container(0, 0).setDepth(8);

    // Pause button (squishy circular button, top-left).
    const pauseBtn = UIFactory.createButton(
      this,
      PAD + 32,
      52,
      64,
      64,
      '⏸',
      () => this.pauseGame(),
      {
        fillColor: UIPalette.coral,
        cornerRadius: 32,
        fontSize: 32,
        fontColor: '#ffffff',
      },
    );
    this.topBar.add(pauseBtn);

    // Score pill (top-center-left). Sky-blue with a coin icon.
    const scorePillW = Math.min(280, Math.round(camW * 0.34));
    const scorePillX = PAD + 32 + 38 + scorePillW / 2;
    const scorePill = UIFactory.createPill(this, scorePillX, 52, scorePillW, 60, {
      fillColor: UIPalette.sky,
      borderColor: UIPalette.white,
      borderWidth: 4,
    });
    const scoreCoin = UIFactory.createCoinIcon(this, -scorePillW / 2 + 28, 0, 36);
    scorePill.add(scoreCoin);
    this.scoreText = this.add.text(8, 0, '0', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontStyle: 'bold',
      stroke: '#1a3a55',
      strokeThickness: 3,
    }).setOrigin(0.5);
    scorePill.add(this.scoreText);
    this.topBar.add(scorePill);

    // Level chip (small pill, center).
    const levelChipW = 130;
    const levelChip = UIFactory.createPill(this, camW / 2, 52, levelChipW, 52, {
      fillColor: UIPalette.panelDark,
      borderColor: UIPalette.gold,
      borderWidth: 4,
      highlightAlpha: 0.12,
    });
    levelChip.add(this.add.text(0, 0, `Lv.${levelIndex + 1}`, {
      fontSize: '24px',
      color: '#ffd866',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5));
    this.topBar.add(levelChip);

    // Gold pill (top-right) with pulsing Add icon.
    const goldPillW = Math.min(260, Math.round(camW * 0.32));
    const goldPillX = camW - PAD - goldPillW / 2;
    const goldPill = UIFactory.createPill(this, goldPillX, 52, goldPillW, 60, {
      fillColor: UIPalette.gold,
      borderColor: UIPalette.white,
      borderWidth: 4,
    });
    this.goldText = this.add.text(-12, 0, '0g', {
      fontSize: '26px',
      color: '#3a2400',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 2,
    }).setOrigin(0.5);
    goldPill.add(this.goldText);
    const plusIcon = UIFactory.createPlusIcon(this, goldPillW / 2 - 22, 0, 36);
    UIFactory.pulse(this, plusIcon, { from: 0.92, to: 1.10, duration: 750 });
    goldPill.add(plusIcon);
    this.topBar.add(goldPill);

    // Distance label (centered, just below the chips).
    this.distanceText = this.add.text(camW / 2, 96, '0m', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
      shadow: { offsetX: 0, offsetY: 2, color: '#000000', blur: 3, fill: true },
    }).setOrigin(0.5);
    this.topBar.add(this.distanceText);

    // Unit count text — small chip on the right side under the gold pill.
    this.unitText = this.add.text(goldPillX, 102, '\u{1F465} 0', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.topBar.add(this.unitText);
  }

  // ──────────────────────── Boss bar ────────────────────────

  private buildBossBar(camW: number): void {
    this.bossBar = this.add.container(0, 0).setDepth(9).setVisible(false);

    const barW = Math.min(720, Math.round(camW * 0.86));
    const barH = 48;
    const barX = (camW - barW) / 2;
    const barY = 24;

    const panel = UIFactory.createPanel(this, camW / 2, barY + barH / 2, barW, barH, {
      fillColor: UIPalette.panelDark,
      borderColor: UIPalette.white,
      borderWidth: 4,
      cornerRadius: barH / 2,
      shadowOffset: 6,
      highlightAlpha: 0.14,
    });
    this.bossBar.add(panel);

    this.bossHpFill = this.add.graphics();
    this.bossBar.add(this.bossHpFill);

    this.bossHpLabel = this.add.text(camW / 2, barY + barH / 2, '', {
      fontSize: '22px',
      color: '#ffffff',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
      shadow: { offsetX: 0, offsetY: 2, color: '#000000', blur: 3, fill: true },
    }).setOrigin(0.5);
    this.bossBar.add(this.bossHpLabel);

    // Cache the bar geometry for per-frame fill draws.
    (this.bossBar as any)._geo = { barX, barY, barW, barH };
  }

  // ──────────────────────── Weapon indicator ────────────────────────

  private buildWeaponPill(camW: number, camH: number): void {
    const pillW = 220;
    const pillH = 60;
    const pillX = PAD + pillW / 2;
    const pillY = camH - PAD - pillH / 2;

    this.weaponPill = UIFactory.createPill(this, pillX, pillY, pillW, pillH, {
      fillColor: UIPalette.panelDark,
      borderColor: UIPalette.gold,
      borderWidth: 4,
      highlightAlpha: 0.12,
    });
    this.weaponPill.setDepth(8);
    this.weaponPill.setVisible(false);

    this.weaponIcon = this.add.sprite(-pillW / 2 + 30, 0, 'weapon_svg_pistol')
      .setDisplaySize(38, 38)
      .setOrigin(0.5);
    this.weaponPill.add(this.weaponIcon);

    this.weaponLabel = this.add.text(10, 0, '', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.weaponPill.add(this.weaponLabel);
  }

  // ──────────────────────── Perk tray ────────────────────────

  private buildPerkTray(camW: number, camH: number): void {
    const activePerks = PerkManager.instance.getAll();
    if (activePerks.length === 0) return;

    const unique = new Map<string, { icon: string; count: number }>();
    for (const p of activePerks) {
      const e = unique.get(p.id);
      if (e) e.count++;
      else unique.set(p.id, { icon: p.icon, count: 1 });
    }

    const perkCount = unique.size;
    const spacing = 38;
    const totalW = perkCount * spacing + 24;
    const trayY = camH - PAD - 60 - 36;
    const tray = UIFactory.createPill(this, camW / 2, trayY, totalW, 38, {
      fillColor: UIPalette.panelDark,
      borderColor: UIPalette.sky,
      borderWidth: 3,
      highlightAlpha: 0.12,
    });
    tray.setDepth(7);

    let i = 0;
    const startX = -totalW / 2 + spacing / 2 + 12;
    for (const { icon, count } of unique.values()) {
      const ix = startX + i * spacing;
      tray.add(this.add.text(ix, 0, icon, { fontSize: '22px' }).setOrigin(0.5));
      if (count > 1) {
        tray.add(this.add.text(ix + 12, 8, `${count}`, {
          fontSize: '12px', color: '#ffd866', fontFamily: 'Arial, Helvetica, sans-serif',
          fontStyle: 'bold', stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5));
      }
      i++;
    }
  }

  // ──────────────────────── Level banner ────────────────────────

  private buildLevelBanner(camW: number, levelIndex: number, levelName: string, worldName: string, accent: number): void {
    this.levelBanner = this.add.container(camW / 2, 200).setDepth(20);

    const bannerW = Math.min(560, Math.round(camW * 0.86));
    const bannerH = 140;
    const bannerPanel = UIFactory.createPanel(this, 0, 0, bannerW, bannerH, {
      fillColor: UIPalette.panelDark,
      borderColor: UIPalette.white,
      borderWidth: 5,
      cornerRadius: 30,
      shadowOffset: 10,
      shadowAlpha: 0.45,
      highlightAlpha: 0.12,
    });
    this.levelBanner.add(bannerPanel);

    this.levelBanner.add(this.add.text(0, -32, `LEVEL ${levelIndex + 1}`, {
      fontSize: '22px',
      color: Phaser.Display.Color.IntegerToColor(accent).rgba,
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontStyle: 'bold',
      letterSpacing: 5,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5));
    this.levelBanner.add(this.add.text(0, 6, levelName.toUpperCase(), {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
      shadow: { offsetX: 0, offsetY: 3, color: '#000000', blur: 4, fill: true },
    }).setOrigin(0.5));
    this.levelBanner.add(this.add.text(0, 44, worldName, {
      fontSize: '15px',
      color: '#5de2ff',
      fontFamily: 'Arial, Helvetica, sans-serif',
      letterSpacing: 4,
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5));

    this.levelBanner.setAlpha(0);
    this.tweens.add({ targets: this.levelBanner, alpha: 1, y: { from: 180, to: 200 }, duration: 500, ease: 'Back.easeOut' });
    this.tweens.add({ targets: this.levelBanner, alpha: 0, y: 180, duration: 600, delay: 2800, ease: 'Power2' });
  }

  // ──────────────────────── Pause flow ────────────────────────

  private pauseGame(): void {
    const gameScene = this.scene.get('GameScene');
    const bossScene = this.scene.get('BossScene');
    const activeScene = gameScene.scene.isActive() ? gameScene : bossScene;
    if (!activeScene.scene.isActive()) return;
    activeScene.scene.pause();
    this.showPauseOverlay(activeScene);
  }

  private showPauseOverlay(pausedScene: Phaser.Scene): void {
    const camW = this.cameras.main.width;
    const camH = this.cameras.main.height;

    const overlay = this.add.rectangle(camW / 2, camH / 2, camW, camH, 0x000000, 0.65)
      .setDepth(30)
      .setInteractive();

    const title = this.add.text(camW / 2, camH * 0.32, 'PAUSED', {
      fontSize: '54px',
      color: '#ffffff',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontStyle: 'bold',
      letterSpacing: 8,
      stroke: '#000000',
      strokeThickness: 4,
      shadow: { offsetX: 0, offsetY: 4, color: '#000000', blur: 6, fill: true },
    }).setOrigin(0.5).setDepth(31);

    const resume = UIFactory.createButton(
      this, camW / 2, camH * 0.50, 320, 80, '▶  RESUME',
      () => {
        overlay.destroy(); title.destroy();
        resume.destroy(); quit.destroy();
        pausedScene.scene.resume();
      },
      { fillColor: UIPalette.sky, fontSize: 28, fontColor: '#003045', cornerRadius: 32 },
    ).setDepth(31);

    const quit = UIFactory.createButton(
      this, camW / 2, camH * 0.62, 280, 70, '☰  QUIT',
      () => {
        overlay.destroy(); title.destroy();
        resume.destroy(); quit.destroy();
        pausedScene.scene.stop();
        this.scene.stop();
        this.scene.start('MenuScene');
      },
      { fillColor: UIPalette.coral, fontSize: 24, fontColor: '#ffffff', cornerRadius: 28 },
    ).setDepth(31);
  }

  // ──────────────────────── Per-frame update ────────────────────────

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
    const unitStr = `\u{1F465} ${this.unitCount}`;
    if (unitStr !== this.lastUnitText) {
      this.unitText.setText(unitStr);
      this.lastUnitText = unitStr;
    }
    const goldStr = `${this.levelGold}g`;
    if (goldStr !== this.lastGoldText) {
      this.goldText.setText(goldStr);
      this.lastGoldText = goldStr;
    }

    if (this.killStreak > 1 && this.killStreak !== this.lastKillStreak) {
      this.lastKillStreak = this.killStreak;
      this.showStreakPopup(this.killStreak);
    }
    if (this.killStreak <= 1) this.lastKillStreak = 0;

    const showBoss = this.bossHpPercent >= 0;
    this.bossBar.setVisible(showBoss);
    this.topBar.setVisible(!showBoss);

    if (showBoss) {
      this.drawBossHp();
      this.progressBar.clear();
    } else if (this.bossTriggerDistanceCached > 0) {
      this.drawProgressBar();
    } else {
      this.progressBar.clear();
    }

    if (this.weaponType) {
      this.weaponPill.setVisible(true);
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

  // ──────────────────────── Helpers ────────────────────────

  private drawProgressBar(): void {
    const camW = this.cameras.main.width;
    const progress = Math.min(1, this.distance / this.bossTriggerDistanceCached);
    const barH = 16;
    const barY = 122;
    const barX = PAD;
    const barW = camW - PAD * 2;

    this.progressBar.clear();
    // Track
    this.progressBar.fillStyle(UIPalette.shadow, 0.35);
    this.progressBar.fillRoundedRect(barX, barY + 3, barW, barH, barH / 2);
    this.progressBar.fillStyle(0xffffff, 0.18);
    this.progressBar.fillRoundedRect(barX, barY, barW, barH, barH / 2);
    this.progressBar.lineStyle(2, UIPalette.white, 0.75);
    this.progressBar.strokeRoundedRect(barX, barY, barW, barH, barH / 2);
    // Fill
    if (progress > 0) {
      this.progressBar.fillStyle(UIPalette.coral, 0.95);
      this.progressBar.fillRoundedRect(barX, barY, Math.max(barW * progress, barH), barH, barH / 2);
      this.progressBar.fillStyle(0xffffff, 0.30);
      this.progressBar.fillRoundedRect(barX + 4, barY + 3, Math.max(barW * progress - 8, 4), 4, 2);
    }
    if (progress < 0.98) {
      this.progressBar.fillStyle(UIPalette.coral, 1);
      this.progressBar.fillCircle(barX + barW * progress, barY + barH / 2, 8);
      this.progressBar.lineStyle(2, UIPalette.white, 1);
      this.progressBar.strokeCircle(barX + barW * progress, barY + barH / 2, 8);
    }
  }

  private drawBossHp(): void {
    const geo = (this.bossBar as any)._geo as { barX: number; barY: number; barW: number; barH: number };
    const fillW = (geo.barW - 12) * Math.max(0, this.bossHpPercent);
    this.bossHpFill.clear();

    const hpColor = this.bossHpPercent > 0.5 ? UIPalette.coral
      : this.bossHpPercent > 0.2 ? UIPalette.gold
      : 0xff3b6b;

    // Filled portion
    this.bossHpFill.fillStyle(hpColor, 1);
    this.bossHpFill.fillRoundedRect(geo.barX + 6, geo.barY + 6, Math.max(fillW, 0), geo.barH - 12, (geo.barH - 12) / 2);
    // Glossy strip
    this.bossHpFill.fillStyle(UIPalette.white, 0.30);
    this.bossHpFill.fillRoundedRect(
      geo.barX + 10,
      geo.barY + 9,
      Math.max(fillW - 8, 0),
      6,
      3,
    );

    const bossHpStr = `${this.bossName || 'BOSS'}  ${Math.ceil(this.bossHpPercent * 100)}%`;
    if (bossHpStr !== this.lastBossHpText) {
      this.bossHpLabel.setText(bossHpStr);
      this.lastBossHpText = bossHpStr;
    }
  }

  private showStreakPopup(streak: number): void {
    const camW = this.cameras.main.width;
    const camH = this.cameras.main.height;
    const x = camW / 2 + (Math.random() - 0.5) * 120;
    const y = camH * 0.42;
    const size = Math.min(72, 36 + streak * 3);
    const color = streak >= 10 ? '#ffd866' : streak >= 5 ? '#ffaa66' : '#ff5e5e';
    const txt = this.add.text(x, y, `×${streak}`, {
      fontSize: `${size}px`,
      color,
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 5,
      shadow: { offsetX: 0, offsetY: 0, color, blur: 10, fill: false, stroke: true },
    }).setOrigin(0.5).setDepth(15);

    this.tweens.add({
      targets: txt,
      y: y - 100,
      alpha: 0,
      scale: 1.6,
      duration: 900,
      ease: 'Power2',
      onComplete: () => txt.destroy(),
    });
  }

  private formatNumber(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
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
