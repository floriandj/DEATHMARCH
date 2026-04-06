// src/scenes/SettingsScene.ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';
import { SoundManager } from '@/systems/SoundManager';
import { WalletManager } from '@/systems/WalletManager';
import { registerSW } from 'virtual:pwa-register';

const PAD = 28;
const CW = GAME_WIDTH - PAD * 2;
const F = 'Arial, Helvetica, sans-serif';
const C_PANEL = 0x1a2840;
const C_BORDER = 0x2a3f5f;
const C_YELLOW = 0xfbbf24;

export class SettingsScene extends Phaser.Scene {
  private statusText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'SettingsScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0f1923');

    // Header
    const hdr = this.add.graphics();
    hdr.fillStyle(C_PANEL, 1);
    hdr.fillRect(0, 0, GAME_WIDTH, 80);
    hdr.fillStyle(C_YELLOW, 0.9);
    hdr.fillRect(0, 0, GAME_WIDTH, 4);
    hdr.lineStyle(1, C_BORDER, 0.5);
    hdr.lineBetween(0, 80, GAME_WIDTH, 80);

    this.add.text(GAME_WIDTH / 2, 44, '\u2699  SETTINGS', {
      fontSize: '30px', color: '#ffffff', fontFamily: F, fontStyle: 'bold',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5);

    let y = 100;
    const vs = Math.min(1.3, Math.max(0.85, GAME_HEIGHT / 1280));

    // ── Sections ──
    y = this.section(y, 'APP UPDATE', 'Force-refresh to the latest version', 0x3b82f6, 'UPDATE', () => this.hardUpdate(), vs);
    y = this.section(y, 'CLEAR CACHE', 'Wipe service worker cache and reload', C_YELLOW, 'CLEAR', () => this.clearCache(), vs);
    y = this.section(y, 'SOUND', SoundManager.isMuted ? 'Sound is OFF' : 'Sound is ON', 0x22c55e, SoundManager.isMuted ? 'UNMUTE' : 'MUTE', () => {
      SoundManager.toggleMute();
      this.scene.restart();
    }, vs);
    y = this.section(y, 'RESET GAME', 'Wipe ALL progress, gold, and scores', 0xef4444, 'RESET', () => this.resetAll(), vs);

    // Status text
    this.statusText = this.add.text(GAME_WIDTH / 2, y + 10, '', {
      fontSize: `${Math.round(14 * vs)}px`, color: '#4ade80', fontFamily: F, align: 'center',
    }).setOrigin(0.5).setWordWrapWidth(CW);

    // Version info
    const verBg = this.add.graphics();
    verBg.fillStyle(C_PANEL, 0.8);
    verBg.fillRoundedRect(PAD, GAME_HEIGHT - 120, CW, 44, 12);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 98, `DEATHMARCH v2.0  \u2022  ${new Date().toISOString().slice(0, 10)}`, {
      fontSize: '12px', color: '#475569', fontFamily: F,
    }).setOrigin(0.5);

    // Back button
    this.gradientBtn(GAME_WIDTH / 2, GAME_HEIGHT - 50, '\u2190  BACK', CW, Math.round(52 * vs), 0x374151, 0x1f2937, '#9ca3af',
      () => this.scene.start('MenuScene'));
  }

  private section(y: number, title: string, desc: string, color: number, btnLabel: string, cb: () => void, vs: number): number {
    const h = Math.round(90 * vs);

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
    g.fillStyle(color, 0.6);
    g.fillCircle(PAD + 20, y + Math.round(32 * vs), 5);

    this.add.text(PAD + 34, y + Math.round(28 * vs), title, {
      fontSize: `${Math.round(17 * vs)}px`, color: '#e2e8f0', fontFamily: F, fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    this.add.text(PAD + 34, y + Math.round(52 * vs), desc, {
      fontSize: `${Math.round(12 * vs)}px`, color: '#64748b', fontFamily: F,
    }).setOrigin(0, 0.5);

    // Button
    const bw = Math.round(100 * vs), bh = Math.round(36 * vs);
    const bx = PAD + CW - Math.round(60 * vs);
    const c = this.add.container(bx, y + h / 2);
    const bg = this.add.graphics();
    bg.fillStyle(color, 0.85);
    bg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, bh / 2);
    bg.fillStyle(0xffffff, 0.12);
    bg.fillRoundedRect(-bw / 2 + 2, -bh / 2 + 2, bw - 4, bh * 0.4, { tl: bh / 2 - 1, tr: bh / 2 - 1, bl: 0, br: 0 });
    c.add(bg);
    c.add(this.add.text(0, 0, btnLabel, {
      fontSize: `${Math.round(14 * vs)}px`, color: '#fff', fontFamily: F, fontStyle: 'bold',
    }).setOrigin(0.5));
    const hit = this.add.zone(0, 0, bw + 16, bh + 8).setInteractive({ useHandCursor: true });
    c.add(hit);
    hit.on('pointerdown', () => {
      SoundManager.play('button_click');
      this.tweens.add({ targets: c, scale: 0.92, duration: 50, yoyo: true, onComplete: () => { c.setScale(1); cb(); } });
    });

    return y + h + Math.round(10 * vs);
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
      fontSize: '18px', color: tColor, fontFamily: F, fontStyle: 'bold',
    }).setOrigin(0.5));
    const hit = this.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true });
    c.add(hit);
    hit.on('pointerdown', () => { SoundManager.play('button_click'); cb(); });
  }

  private showStatus(msg: string, color: string = '#4ade80'): void {
    this.statusText.setColor(color).setText(msg);
    this.tweens.add({ targets: this.statusText, alpha: { from: 0, to: 1 }, duration: 300 });
  }

  private hardUpdate(): void {
    this.showStatus('Checking for updates...');
    try {
      const updateSW = registerSW({ immediate: true, onNeedRefresh() { updateSW(true); },
        onOfflineReady: () => { this.showStatus('Already up to date.', '#fbbf24'); } });
      this.time.delayedCall(3000, () => { this.showStatus('Reloading...', '#38bdf8'); this.time.delayedCall(500, () => window.location.reload()); });
    } catch { this.showStatus('Reloading...', '#38bdf8'); this.time.delayedCall(500, () => window.location.reload()); }
  }

  private async clearCache(): Promise<void> {
    this.showStatus('Clearing cache...');
    try {
      if ('caches' in window) await Promise.all((await caches.keys()).map(n => caches.delete(n)));
      if ('serviceWorker' in navigator) await Promise.all((await navigator.serviceWorker.getRegistrations()).map(r => r.unregister()));
      this.showStatus('Cache cleared! Reloading...'); this.time.delayedCall(1000, () => window.location.reload());
    } catch { this.showStatus('Failed to clear cache.', '#f87171'); }
  }

  private resetAll(): void {
    localStorage.removeItem('deathmarch-highscore');
    localStorage.removeItem('deathmarch-level');
    localStorage.removeItem('deathmarch-muted');
    localStorage.removeItem('deathmarch-tutorial-seen');
    WalletManager.reset();
    this.showStatus('All progress wiped!', '#f87171');
    this.time.delayedCall(1000, () => this.scene.start('MenuScene'));
  }
}
