// src/scenes/SettingsScene.ts
// Supercell-style settings with beveled section cards and 3D action buttons
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';
import { SoundManager } from '@/systems/SoundManager';
import { WalletManager } from '@/systems/WalletManager';
import { registerSW } from 'virtual:pwa-register';
import {
  BG, BG_HEX, BORDER, GOLD, ACCENT, NEUTRAL, FONT, ANIM, Z,
  darken, lighten,
} from '@/ui/RoyaleTheme';
import {
  drawPanel, drawHeaderBar, drawSection, createButton,
} from '@/ui/RoyaleUI';

const PAD = 28;
const CW = GAME_WIDTH - PAD * 2;

export class SettingsScene extends Phaser.Scene {
  private statusText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'SettingsScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(BG_HEX.primary);

    // Header with gold accent
    drawHeaderBar(this, 80, GOLD.mid);

    this.add.text(GAME_WIDTH / 2, 44, '\u2699  SETTINGS', {
      fontSize: '30px', color: NEUTRAL.whiteHex, fontFamily: FONT.display, fontStyle: 'bold',
      stroke: '#1a0a30', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(Z.fixedText);

    let y = 100;
    const vs = Math.min(1.3, Math.max(0.85, GAME_HEIGHT / 1280));

    // ── Sections — beveled cards with accent colors ──
    y = this.section(y, 'APP UPDATE', 'Force-refresh to the latest version', ACCENT.blue, 'UPDATE', () => this.hardUpdate(), vs);
    y = this.section(y, 'CLEAR CACHE', 'Wipe service worker cache and reload', GOLD.bright, 'CLEAR', () => this.clearCache(), vs);
    y = this.section(y, 'SOUND', SoundManager.isMuted ? 'Sound is OFF' : 'Sound is ON', ACCENT.green, SoundManager.isMuted ? 'UNMUTE' : 'MUTE', () => {
      SoundManager.toggleMute();
      this.scene.restart();
    }, vs);
    y = this.section(y, 'RESET GAME', 'Wipe ALL progress, gold, and scores', ACCENT.red, 'RESET', () => this.resetAll(), vs);

    // Status text
    this.statusText = this.add.text(GAME_WIDTH / 2, y + 10, '', {
      fontSize: `${Math.round(14 * vs)}px`, color: ACCENT.greenHex, fontFamily: FONT.body, align: 'center',
    }).setOrigin(0.5).setWordWrapWidth(CW);

    // Version info — beveled pill
    const verBg = this.add.graphics();
    verBg.fillStyle(ACCENT.shadowPurple, 0.3);
    verBg.fillRoundedRect(PAD + 1, GAME_HEIGHT - 118, CW, 44, 12);
    verBg.fillStyle(BG.panel, 0.85);
    verBg.fillRoundedRect(PAD, GAME_HEIGHT - 120, CW, 44, 12);
    verBg.lineStyle(1, BORDER.subtle, 0.4);
    verBg.strokeRoundedRect(PAD, GAME_HEIGHT - 120, CW, 44, 12);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 98, `DEATHMARCH v2.0  \u2022  ${new Date().toISOString().slice(0, 10)}`, {
      fontSize: '12px', color: NEUTRAL.dimHex, fontFamily: FONT.body,
    }).setOrigin(0.5);

    // Back button — Royale 3D style
    createButton(this, {
      x: GAME_WIDTH / 2, y: GAME_HEIGHT - 50,
      w: CW, h: Math.round(52 * vs),
      label: '\u2190  BACK',
      colorTop: NEUTRAL.dark, colorBot: darken(NEUTRAL.dark, 0.3),
      textColor: NEUTRAL.midHex,
      fontSize: '18px',
      onPress: () => this.scene.start('MenuScene'),
    });
  }

  private section(y: number, title: string, desc: string, color: number, btnLabel: string, cb: () => void, vs: number): number {
    const h = Math.round(90 * vs);

    drawSection(this, {
      x: PAD, y, w: CW, h,
      title, desc, color,
      btnLabel, onPress: () => { SoundManager.play('button_click'); cb(); },
      vs,
    });

    return y + h + Math.round(10 * vs);
  }

  private showStatus(msg: string, color: string = ACCENT.greenHex): void {
    this.statusText.setColor(color).setText(msg);
    this.tweens.add({ targets: this.statusText, alpha: { from: 0, to: 1 }, duration: 300 });
  }

  private hardUpdate(): void {
    this.showStatus('Checking for updates...');
    try {
      const updateSW = registerSW({ immediate: true, onNeedRefresh() { updateSW(true); },
        onOfflineReady: () => { this.showStatus('Already up to date.', GOLD.hex.bright); } });
      this.time.delayedCall(3000, () => { this.showStatus('Reloading...', ACCENT.tealHex); this.time.delayedCall(500, () => window.location.reload()); });
    } catch { this.showStatus('Reloading...', ACCENT.tealHex); this.time.delayedCall(500, () => window.location.reload()); }
  }

  private async clearCache(): Promise<void> {
    this.showStatus('Clearing cache...');
    try {
      if ('caches' in window) await Promise.all((await caches.keys()).map(n => caches.delete(n)));
      if ('serviceWorker' in navigator) await Promise.all((await navigator.serviceWorker.getRegistrations()).map(r => r.unregister()));
      this.showStatus('Cache cleared! Reloading...'); this.time.delayedCall(1000, () => window.location.reload());
    } catch { this.showStatus('Failed to clear cache.', ACCENT.redHex); }
  }

  private resetAll(): void {
    localStorage.removeItem('deathmarch-highscore');
    localStorage.removeItem('deathmarch-level');
    localStorage.removeItem('deathmarch-muted');
    localStorage.removeItem('deathmarch-tutorial-seen');
    WalletManager.reset();
    this.showStatus('All progress wiped!', ACCENT.redHex);
    this.time.delayedCall(1000, () => this.scene.start('MenuScene'));
  }
}
