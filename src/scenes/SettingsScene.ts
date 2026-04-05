// src/scenes/SettingsScene.ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';
import { registerSW } from 'virtual:pwa-register';

export class SettingsScene extends Phaser.Scene {
  private statusText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'SettingsScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0a0a1a');

    // Header
    this.add
      .text(GAME_WIDTH / 2, 80, 'SETTINGS', {
        fontSize: '40px',
        color: '#ff4040',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Separator line
    this.add.rectangle(GAME_WIDTH / 2, 120, GAME_WIDTH * 0.6, 2, 0xff4040, 0.5);

    let yPos = 200;

    // ── Hard Update ──
    yPos = this.addSection(yPos, 'APP UPDATE', 'Force-refresh the app to the latest version');
    const updateBtn = this.createButton(GAME_WIDTH / 2, yPos, '[ HARD UPDATE ]', '#00d4ff');
    updateBtn.on('pointerdown', () => this.hardUpdate());
    yPos += 70;

    // ── Clear Cache ──
    yPos = this.addSection(yPos, 'CLEAR CACHE', 'Wipe service worker cache and reload');
    const cacheBtn = this.createButton(GAME_WIDTH / 2, yPos, '[ CLEAR CACHE ]', '#ffd43b');
    cacheBtn.on('pointerdown', () => this.clearCache());
    yPos += 70;

    // ── Reset High Score ──
    yPos = this.addSection(yPos, 'HIGH SCORE', 'Reset your saved high score to zero');
    const resetBtn = this.createButton(GAME_WIDTH / 2, yPos, '[ RESET SCORE ]', '#ff6b6b');
    resetBtn.on('pointerdown', () => this.resetHighScore());
    yPos += 70;

    // ── Status area ──
    this.statusText = this.add
      .text(GAME_WIDTH / 2, yPos + 20, '', {
        fontSize: '14px',
        color: '#51cf66',
        fontFamily: 'monospace',
        align: 'center',
      })
      .setOrigin(0.5)
      .setWordWrapWidth(GAME_WIDTH * 0.8);

    // ── Version info at bottom ──
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 160, 'DEATHMARCH v1.0.0', {
        fontSize: '14px',
        color: '#444444',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 136, `Build: ${new Date().toISOString().slice(0, 10)}`, {
        fontSize: '12px',
        color: '#333333',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    // ── Back button ──
    const backBtn = this.createButton(GAME_WIDTH / 2, GAME_HEIGHT - 80, '[ BACK ]', '#888888');
    backBtn.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });
  }

  private addSection(y: number, title: string, desc: string): number {
    this.add
      .text(GAME_WIDTH / 2, y, title, {
        fontSize: '18px',
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, y + 26, desc, {
        fontSize: '12px',
        color: '#666666',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    return y + 60;
  }

  private createButton(x: number, y: number, label: string, color: string): Phaser.GameObjects.Text {
    const btn = this.add
      .text(x, y, label, {
        fontSize: '22px',
        color,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setColor('#ffffff'));
    btn.on('pointerout', () => btn.setColor(color));

    return btn;
  }

  private showStatus(message: string, color: string = '#51cf66'): void {
    this.statusText.setColor(color).setText(message);
    this.tweens.add({
      targets: this.statusText,
      alpha: { from: 0, to: 1 },
      duration: 300,
    });
  }

  private hardUpdate(): void {
    this.showStatus('Checking for updates...');
    try {
      const updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          // New content available — reload
          updateSW(true);
        },
        onOfflineReady: () => {
          this.showStatus('Already on the latest version.', '#ffd43b');
        },
      });
      // Also force a hard reload as fallback after a brief delay
      this.time.delayedCall(3000, () => {
        this.showStatus('Forcing hard reload...', '#00d4ff');
        this.time.delayedCall(500, () => {
          window.location.reload();
        });
      });
    } catch {
      // Fallback: just reload
      this.showStatus('Reloading app...', '#00d4ff');
      this.time.delayedCall(500, () => {
        window.location.reload();
      });
    }
  }

  private async clearCache(): Promise<void> {
    this.showStatus('Clearing cache...');
    try {
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map((name) => caches.delete(name)));
      }
      // Unregister service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
      }
      this.showStatus('Cache cleared! Reloading...', '#51cf66');
      this.time.delayedCall(1000, () => {
        window.location.reload();
      });
    } catch {
      this.showStatus('Failed to clear cache.', '#ff6b6b');
    }
  }

  private resetHighScore(): void {
    const current = localStorage.getItem('deathmarch-highscore');
    if (!current || current === '0') {
      this.showStatus('High score is already 0.', '#ffd43b');
      return;
    }
    localStorage.setItem('deathmarch-highscore', '0');
    this.showStatus(`Score of ${current} reset to 0.`, '#51cf66');
  }
}
