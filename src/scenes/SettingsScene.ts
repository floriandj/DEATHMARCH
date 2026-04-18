// src/scenes/SettingsScene.ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';
import { SoundManager } from '@/systems/SoundManager';
import { WalletManager } from '@/systems/WalletManager';
import { PerkManager } from '@/systems/PerkManager';
import { LevelManager } from '@/config/progression';

const PAD = 34;
const CW = GAME_WIDTH - PAD * 2;
const F = 'Arial, Helvetica, sans-serif';
const C_PANEL = 0x2e92d4;
const C_BORDER = 0x4aa8e0;
export class SettingsScene extends Phaser.Scene {
  private statusText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'SettingsScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#2484c5');

    // Header
    const hdr = this.add.graphics();
    hdr.fillStyle(0x1c6da3, 1);
    hdr.fillRect(0, 0, GAME_WIDTH, 100);
    hdr.fillStyle(0xebb654, 0.9);
    hdr.fillRect(0, 0, GAME_WIDTH, 3);
    hdr.lineStyle(1, 0xebb654, 0.2);
    hdr.lineBetween(0, 100, GAME_WIDTH, 100);

    this.add.text(GAME_WIDTH / 2, 54, '\u2699  SETTINGS', {
      fontSize: '38px', color: '#ebb654', fontFamily: F, fontStyle: 'bold',
      stroke: '#e0b050', strokeThickness: 2,
      shadow: { offsetX: 1, offsetY: 2, color: '#000', blur: 4, fill: true },
    }).setOrigin(0.5);

    let y = 118;
    const vs = Math.min(1.3, Math.max(0.85, GAME_HEIGHT / 1280));

    // ── Sections ──
    y = this.section(y, 'BOSS TEST', 'Jump into a boss fight for the current level', 0xebb654, 'FIGHT', () => this.bossTest(), vs);

    // Scene debug header
    this.add.text(PAD + 6, y + Math.round(4 * vs), 'SCENE DEBUG', {
      fontSize: `${Math.round(14 * vs)}px`, color: '#a8c8d8', fontFamily: F, fontStyle: 'bold', letterSpacing: 2,
      stroke: '#1a3a4a', strokeThickness: 2,
    }).setOrigin(0, 0);
    y += Math.round(24 * vs);

    y = this.debugRow(y, 'SPLASH SCENE', () => this.scene.start('SplashScene'), vs);
    y = this.debugRow(y, 'MAIN MENU', () => this.scene.start('MenuScene'), vs);
    y = this.debugRow(y, 'GAMEPLAY', () => this.scene.start('GameScene'), vs);
    y = this.debugRow(y, 'PERK SELECT', () => this.perkSelectTest(), vs);
    y = this.debugRow(y, 'VICTORY SCREEN', () => this.gameOverTest(true), vs);
    y = this.debugRow(y, 'DEFEAT SCREEN', () => this.gameOverTest(false), vs);

    y += Math.round(6 * vs);
    y = this.section(y, 'RESET GAME', 'Wipe ALL progress, gold, and scores', 0xe85454, 'RESET', () => this.resetAll(), vs);

    // Status text
    this.statusText = this.add.text(GAME_WIDTH / 2, y + 10, '', {
      fontSize: `${Math.round(17 * vs)}px`, color: '#6be85a', fontFamily: F, align: 'center',
      stroke: '#1a3a4a', strokeThickness: 2,
    }).setOrigin(0.5).setWordWrapWidth(CW);

    // Version info
    const verBg = this.add.graphics();
    verBg.fillStyle(0x1c6da3, 0.8);
    verBg.fillRoundedRect(PAD, GAME_HEIGHT - 140, CW, 58, 17);
    verBg.lineStyle(1, 0xebb654, 0.15);
    verBg.strokeRoundedRect(PAD, GAME_HEIGHT - 140, CW, 58, 17);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 111, `DEATHMARCH v2.0  \u2022  ${new Date().toISOString().slice(0, 10)}`, {
      fontSize: '16px', color: '#e0b050', fontFamily: F,
      stroke: '#1a3a4a', strokeThickness: 2,
    }).setOrigin(0.5);

    // Back button
    this.gradientBtn(GAME_WIDTH / 2, GAME_HEIGHT - 56, '\u2190  BACK', CW, Math.round(62 * vs), 0x3090c8, 0x1c6da3, '#d4e8f4',
      () => this.scene.start('MenuScene'));
  }

  private section(y: number, title: string, desc: string, color: number, btnLabel: string, cb: () => void, vs: number): number {
    const h = Math.round(108 * vs);

    // Panel
    const g = this.add.graphics();
    g.fillStyle(C_PANEL, 1);
    g.fillRoundedRect(PAD, y, CW, h, 14);
    g.lineStyle(2, C_BORDER, 0.6);
    g.strokeRoundedRect(PAD, y, CW, h, 14);
    // Accent bar
    g.fillStyle(color, 0.9);
    g.fillRoundedRect(PAD + 2, y + 2, CW - 4, 5, { tl: 12, tr: 12, bl: 0, br: 0 });
    // Accent dot
    g.fillStyle(0xebb654, 0.5);
    g.fillCircle(PAD + 20, y + Math.round(38 * vs), 6);

    this.add.text(PAD + 34, y + Math.round(34 * vs), title, {
      fontSize: `${Math.round(20 * vs)}px`, color: '#d4e6f0', fontFamily: F, fontStyle: 'bold',
      stroke: '#1a3a4a', strokeThickness: 2,
    }).setOrigin(0, 0.5);

    this.add.text(PAD + 34, y + Math.round(62 * vs), desc, {
      fontSize: `${Math.round(16 * vs)}px`, color: '#a8c8d8', fontFamily: F,
      stroke: '#1a3a4a', strokeThickness: 2,
    }).setOrigin(0, 0.5);

    // Button
    const bw = Math.round(120 * vs), bh = Math.round(43 * vs);
    const bx = PAD + CW - Math.round(72 * vs);
    const c = this.add.container(bx, y + h / 2);
    const bg = this.add.graphics();
    bg.fillStyle(color, 0.85);
    bg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, bh / 2);
    bg.fillStyle(0xffffff, 0.12);
    bg.fillRoundedRect(-bw / 2 + 2, -bh / 2 + 2, bw - 4, bh * 0.4, { tl: bh / 2 - 1, tr: bh / 2 - 1, bl: 0, br: 0 });
    c.add(bg);
    c.add(this.add.text(0, 0, btnLabel, {
      fontSize: `${Math.round(18 * vs)}px`, color: '#fff', fontFamily: F, fontStyle: 'bold',
      stroke: '#1a3a4a', strokeThickness: 2,
    }).setOrigin(0.5));
    const hit = this.add.zone(0, 0, bw + 16, bh + 8).setInteractive({ useHandCursor: true });
    c.add(hit);
    hit.on('pointerdown', () => {
      SoundManager.play('button_click');
      this.tweens.add({ targets: c, scale: 0.92, duration: 50, yoyo: true, onComplete: () => { c.setScale(1); cb(); } });
    });

    return y + h + Math.round(12 * vs);
  }

  private debugRow(y: number, title: string, cb: () => void, vs: number): number {
    const h = Math.round(58 * vs);
    const color = 0xa864e8;

    const g = this.add.graphics();
    g.fillStyle(C_PANEL, 1);
    g.fillRoundedRect(PAD, y, CW, h, 12);
    g.lineStyle(2, C_BORDER, 0.6);
    g.strokeRoundedRect(PAD, y, CW, h, 12);
    g.fillStyle(color, 0.9);
    g.fillRoundedRect(PAD + 2, y + 2, 5, h - 4, { tl: 10, tr: 0, bl: 10, br: 0 });

    this.add.text(PAD + Math.round(22 * vs), y + h / 2, title, {
      fontSize: `${Math.round(17 * vs)}px`, color: '#d4e6f0', fontFamily: F, fontStyle: 'bold',
      stroke: '#1a3a4a', strokeThickness: 2,
    }).setOrigin(0, 0.5);

    const bw = Math.round(86 * vs), bh = Math.round(34 * vs);
    const bx = PAD + CW - Math.round(12 * vs) - bw / 2;
    const c = this.add.container(bx, y + h / 2);
    const bg = this.add.graphics();
    bg.fillStyle(color, 0.85);
    bg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, bh / 2);
    bg.fillStyle(0xffffff, 0.12);
    bg.fillRoundedRect(-bw / 2 + 2, -bh / 2 + 2, bw - 4, bh * 0.4, { tl: bh / 2 - 1, tr: bh / 2 - 1, bl: 0, br: 0 });
    c.add(bg);
    c.add(this.add.text(0, 0, 'GO', {
      fontSize: `${Math.round(16 * vs)}px`, color: '#fff', fontFamily: F, fontStyle: 'bold',
      stroke: '#1a3a4a', strokeThickness: 2,
    }).setOrigin(0.5));
    const hit = this.add.zone(0, 0, bw + 16, bh + 8).setInteractive({ useHandCursor: true });
    c.add(hit);
    hit.on('pointerdown', () => {
      SoundManager.play('button_click');
      this.tweens.add({ targets: c, scale: 0.92, duration: 50, yoyo: true, onComplete: () => { c.setScale(1); cb(); } });
    });

    return y + h + Math.round(8 * vs);
  }

  private gradientBtn(x: number, y: number, label: string, w: number, h: number, cTop: number, cBot: number, tColor: string, cb: () => void): void {
    const c = this.add.container(x, y);
    const r = h / 2;
    const sh = this.add.graphics();
    sh.fillStyle(0x000000, 0.3);
    sh.fillRoundedRect(-w / 2 + 2, -r + 3, w, h, r);
    c.add(sh);
    const bg = this.add.graphics();
    bg.fillStyle(cBot, 1);
    bg.fillRoundedRect(-w / 2, -r, w, h, r);
    bg.fillStyle(cTop, 1);
    bg.fillRoundedRect(-w / 2, -r, w, h * 0.5, { tl: r, tr: r, bl: 4, br: 4 });
    bg.fillStyle(0xffffff, 0.12);
    bg.fillRoundedRect(-w / 2 + 4, -r + 3, w - 8, h * 0.28, { tl: r - 3, tr: r - 3, bl: 0, br: 0 });
    c.add(bg);
    c.add(this.add.text(0, 0, label, {
      fontSize: '22px', color: tColor, fontFamily: F, fontStyle: 'bold',
      stroke: '#1a3a4a', strokeThickness: 2,
    }).setOrigin(0.5));
    const hit = this.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true });
    c.add(hit);
    hit.on('pointerdown', () => { SoundManager.play('button_click'); cb(); });
  }

  private showStatus(msg: string, color: string = '#6be85a'): void {
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
    // Clear perk checkpoint + live run state AND in-memory singleton
    PerkManager.instance.resetAll();
    // Reset level singleton so currentLevelIndex isn't stuck at an advanced level
    LevelManager.reset();
    this.showStatus('All progress wiped!', '#f87171');
    this.time.delayedCall(1000, () => this.scene.start('MenuScene'));
  }
}
