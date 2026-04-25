// src/scenes/SettingsScene.ts
// Bright-casual settings: card list with squishy buttons via UIFactory.
import Phaser from 'phaser';
import { GAME_HEIGHT } from '@/config/GameConfig';
import { SoundManager } from '@/systems/SoundManager';
import { WalletManager } from '@/systems/WalletManager';
import { PerkManager } from '@/systems/PerkManager';
import { LevelManager } from '@/config/progression';
import { UIFactory, UIPalette } from '@/systems/UIFactory';

const PAD = 28;
const F = 'Arial, Helvetica, sans-serif';

export class SettingsScene extends Phaser.Scene {
  private statusText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'SettingsScene' });
  }

  create(): void {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    this.drawGradientBackdrop(W, H);

    // ── Header pill ──
    const headerW = Math.min(640, Math.round(W * 0.86));
    const headerY = 70;
    const header = UIFactory.createPanel(this, W / 2, headerY, headerW, 84, {
      fillColor: UIPalette.panelDark,
      borderColor: UIPalette.gold,
      borderWidth: 4,
      cornerRadius: 28,
      shadowOffset: 8,
      highlightAlpha: 0.12,
    });
    header.add(this.add.text(0, 0, '⚙  SETTINGS', {
      fontSize: '32px', color: '#ffd866', fontFamily: F, fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
      shadow: { offsetX: 0, offsetY: 3, color: '#000000', blur: 4, fill: true },
    }).setOrigin(0.5));

    const vs = Math.min(1.3, Math.max(0.85, H / 1280));
    let y = headerY + 70;

    // ── Sections ──
    y = this.section(W, y, 'BOSS TEST', 'Jump into a boss fight at this level',
      UIPalette.coral, 'FIGHT', () => this.bossTest(), vs);

    y = this.subheader(W, y, 'SCENE DEBUG', vs);
    y = this.debugRow(W, y, 'SPLASH SCENE', () => this.scene.start('SplashScene'), vs);
    y = this.debugRow(W, y, 'MAIN MENU', () => this.scene.start('MenuScene'), vs);
    y = this.debugRow(W, y, 'GAMEPLAY', () => this.scene.start('GameScene'), vs);
    y = this.debugRow(W, y, 'PERK SELECT', () => this.perkSelectTest(), vs);
    y = this.debugRow(W, y, 'VICTORY SCREEN', () => this.gameOverTest(true), vs);
    y = this.debugRow(W, y, 'DEFEAT SCREEN', () => this.gameOverTest(false), vs);

    y += Math.round(8 * vs);
    y = this.section(W, y, 'RESET GAME', 'Wipe ALL progress, gold, and scores',
      0xff3b6b, 'RESET', () => this.resetAll(), vs);

    // ── Status text ──
    this.statusText = this.add.text(W / 2, y + 14, '', {
      fontSize: `${Math.round(17 * vs)}px`,
      color: '#7dffb6', fontFamily: F, align: 'center',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setWordWrapWidth(W - PAD * 2);

    // ── Version pill ──
    const verW = Math.min(W - PAD * 2, 480);
    const verY = H - 130;
    UIFactory.createPill(this, W / 2, verY, verW, 50, {
      fillColor: UIPalette.panelDark,
      borderColor: UIPalette.gold,
      borderWidth: 3,
      highlightAlpha: 0.10,
    }).add(this.add.text(0, 0, `DEATHMARCH v2.0  •  ${new Date().toISOString().slice(0, 10)}`, {
      fontSize: '15px', color: '#ffd866', fontFamily: F, fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5));

    // ── Back button ──
    UIFactory.createButton(
      this, W / 2, H - 60, Math.min(W - PAD * 2, 460), 70, '←  BACK',
      () => this.scene.start('MenuScene'),
      {
        fillColor: UIPalette.sky,
        borderColor: UIPalette.white,
        borderWidth: 4,
        cornerRadius: 35,
        fontSize: 26,
        fontColor: '#003045',
      },
    );
  }

  // ──────────────────────── Drawing helpers ────────────────────────

  private drawGradientBackdrop(W: number, H: number): void {
    const top = 0x5de2ff;
    const bottom = 0x2484c5;
    const steps = 30;
    const g = this.add.graphics();
    for (let s = 0; s < steps; s++) {
      const t = s / (steps - 1);
      const r = Math.round(Phaser.Math.Linear((top >> 16) & 0xff, (bottom >> 16) & 0xff, t));
      const gr = Math.round(Phaser.Math.Linear((top >> 8) & 0xff, (bottom >> 8) & 0xff, t));
      const b = Math.round(Phaser.Math.Linear(top & 0xff, bottom & 0xff, t));
      g.fillStyle((r << 16) | (gr << 8) | b, 1);
      const sliceY = Math.floor((H * s) / steps);
      g.fillRect(0, sliceY, W, Math.ceil(H / steps) + 1);
    }
  }

  private subheader(W: number, y: number, label: string, vs: number): number {
    this.add.text(PAD + 6, y + Math.round(4 * vs), label, {
      fontSize: `${Math.round(14 * vs)}px`, color: '#ffd866', fontFamily: F,
      fontStyle: 'bold', letterSpacing: 3,
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0, 0);
    return y + Math.round(28 * vs);
  }

  private section(
    W: number,
    y: number,
    title: string,
    desc: string,
    accent: number,
    btnLabel: string,
    cb: () => void,
    vs: number,
  ): number {
    const w = W - PAD * 2;
    const h = Math.round(110 * vs);

    const card = UIFactory.createPanel(this, W / 2, y + h / 2, w, h, {
      fillColor: UIPalette.panelDark,
      borderColor: accent,
      borderWidth: 3,
      cornerRadius: 18,
      shadowOffset: 6,
      highlightAlpha: 0.08,
    });

    card.add(this.add.text(-w / 2 + 22, -h / 2 + 22, title, {
      fontSize: `${Math.round(20 * vs)}px`, color: '#ffffff',
      fontFamily: F, fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }));
    card.add(this.add.text(-w / 2 + 22, -h / 2 + 56, desc, {
      fontSize: `${Math.round(15 * vs)}px`, color: '#a8d4f0', fontFamily: F,
      stroke: '#000000', strokeThickness: 2,
    }));

    const bw = Math.round(130 * vs);
    const bh = Math.round(50 * vs);
    const btn = UIFactory.createButton(
      this, w / 2 - bw / 2 - 16, 0, bw, bh, btnLabel,
      () => cb(),
      {
        fillColor: accent,
        borderColor: UIPalette.white,
        borderWidth: 3,
        cornerRadius: bh / 2,
        fontSize: Math.round(18 * vs),
        fontColor: '#ffffff',
      },
    );
    card.add(btn);

    return y + h + Math.round(14 * vs);
  }

  private debugRow(W: number, y: number, title: string, cb: () => void, vs: number): number {
    const w = W - PAD * 2;
    const h = Math.round(60 * vs);

    const card = UIFactory.createPanel(this, W / 2, y + h / 2, w, h, {
      fillColor: UIPalette.panelDark,
      borderColor: 0xa864e8,
      borderWidth: 2,
      cornerRadius: 14,
      shadowOffset: 4,
      highlightAlpha: 0.06,
    });
    card.add(this.add.text(-w / 2 + 22, 0, title, {
      fontSize: `${Math.round(17 * vs)}px`, color: '#ffffff',
      fontFamily: F, fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0, 0.5));

    const bw = Math.round(96 * vs);
    const bh = Math.round(40 * vs);
    const btn = UIFactory.createButton(
      this, w / 2 - bw / 2 - 14, 0, bw, bh, 'GO',
      () => cb(),
      {
        fillColor: 0xa864e8,
        borderColor: UIPalette.white,
        borderWidth: 3,
        cornerRadius: bh / 2,
        fontSize: Math.round(16 * vs),
        fontColor: '#ffffff',
      },
    );
    card.add(btn);

    return y + h + Math.round(10 * vs);
  }

  // ──────────────────────── Actions ────────────────────────

  private showStatus(msg: string, color: string = '#7dffb6'): void {
    this.statusText.setColor(color).setText(msg);
    this.tweens.add({ targets: this.statusText, alpha: { from: 0, to: 1 }, duration: 300 });
  }

  private bossTest(): void {
    const mgr = LevelManager.instance;
    const weapon = mgr.current.startingWeapon;
    this.scene.start('BossScene', {
      score: 0,
      distance: 0,
      unitCount: 50,
      weapon,
      levelGold: 0,
      pouchGold: 0,
    });
  }

  private perkSelectTest(): void {
    this.scene.start('PerkSelectScene', {
      score: 1234,
      distance: 800,
      goldEarned: 50,
      levelIndex: LevelManager.instance.currentLevelIndex,
    });
  }

  private gameOverTest(victory: boolean): void {
    this.scene.start('GameOverScene', {
      score: 1234,
      distance: 800,
      bossDefeated: victory,
      goldEarned: 50,
    });
  }

  private resetAll(): void {
    localStorage.removeItem('deathmarch-highscore');
    localStorage.removeItem('deathmarch-level');
    localStorage.removeItem('deathmarch-muted');
    localStorage.removeItem('deathmarch-tutorial-seen');
    WalletManager.reset();
    PerkManager.instance.resetAll();
    LevelManager.reset();
    this.showStatus('All progress wiped!', '#ff5e5e');
    this.time.delayedCall(1000, () => this.scene.start('MenuScene'));
  }
}
