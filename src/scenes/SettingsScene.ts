// src/scenes/SettingsScene.ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';
import { SoundManager } from '@/systems/SoundManager';
import { registerSW } from 'virtual:pwa-register';

export class SettingsScene extends Phaser.Scene {
  private statusText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'SettingsScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#050510');

    // Background glow
    const bgGlow = this.add.graphics();
    bgGlow.fillStyle(0xff2040, 0.03);
    bgGlow.fillCircle(GAME_WIDTH / 2, 80, 200);

    // Header with stroke
    this.add
      .text(GAME_WIDTH / 2, 75, 'SETTINGS', {
        fontSize: '36px',
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        stroke: '#ff2040',
        strokeThickness: 1,
        letterSpacing: 6,
      })
      .setOrigin(0.5);

    // Decorative lines
    this.add.rectangle(GAME_WIDTH / 2, 108, 140, 2, 0xff4040, 0.4);
    this.add.rectangle(GAME_WIDTH / 2, 113, 80, 1, 0xff4040, 0.2);

    let yPos = 170;

    // ── Hard Update Section ──
    yPos = this.addSection(yPos, 'APP UPDATE', 'Force-refresh to the latest version', 0x00d4ff);
    this.createPillButton(GAME_WIDTH / 2, yPos, 'UPDATE', 160, 44, 0x00d4ff, '#00d4ff',
      () => this.hardUpdate());
    yPos += 80;

    // ── Clear Cache Section ──
    yPos = this.addSection(yPos, 'CLEAR CACHE', 'Wipe service worker cache and reload', 0xffd43b);
    this.createPillButton(GAME_WIDTH / 2, yPos, 'CLEAR', 160, 44, 0xffd43b, '#ffd43b',
      () => this.clearCache());
    yPos += 80;

    // ── Sound Section ──
    yPos = this.addSection(yPos, 'SOUND', SoundManager.isMuted ? 'Sound is OFF' : 'Sound is ON', 0x51cf66);
    const muteLabel = SoundManager.isMuted ? 'UNMUTE' : 'MUTE';
    const muteBtn = this.createPillButton(GAME_WIDTH / 2, yPos, muteLabel, 160, 44, 0x51cf66, '#51cf66',
      () => {
        const nowMuted = SoundManager.toggleMute();
        const btnText = muteBtn.getAt(1) as Phaser.GameObjects.Text;
        btnText.setText(nowMuted ? 'UNMUTE' : 'MUTE');
        if (!nowMuted) SoundManager.play('button_click');
      });
    yPos += 80;

    // ── Reset High Score Section ──
    yPos = this.addSection(yPos, 'HIGH SCORE', 'Reset your saved high score to zero', 0xff6b6b);
    this.createPillButton(GAME_WIDTH / 2, yPos, 'RESET', 160, 44, 0xff6b6b, '#ff6b6b',
      () => this.resetHighScore());
    yPos += 80;

    // ── Status area ──
    this.statusText = this.add
      .text(GAME_WIDTH / 2, yPos + 10, '', {
        fontSize: '14px',
        color: '#51cf66',
        fontFamily: 'monospace',
        align: 'center',
      })
      .setOrigin(0.5)
      .setWordWrapWidth(GAME_WIDTH * 0.8);

    // ── Version info card at bottom ──
    const infoY = GAME_HEIGHT - 175;
    const infoBg = this.add.graphics();
    infoBg.fillStyle(0xffffff, 0.02);
    infoBg.fillRoundedRect(GAME_WIDTH / 2 - 130, infoY, 260, 52, 12);

    this.add
      .text(GAME_WIDTH / 2, infoY + 16, 'DEATHMARCH v1.0.0', {
        fontSize: '13px',
        color: '#555555',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, infoY + 36, `Build: ${new Date().toISOString().slice(0, 10)}`, {
        fontSize: '11px',
        color: '#383838',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    // ── Back button ──
    this.createPillButton(GAME_WIDTH / 2, GAME_HEIGHT - 85, '\u2190  BACK', 160, 48, 0x888888, '#888888',
      () => this.scene.start('MenuScene'));
  }

  private addSection(y: number, title: string, desc: string, accentColor: number): number {
    // Section card background
    const card = this.add.graphics();
    card.fillStyle(0xffffff, 0.02);
    card.fillRoundedRect(GAME_WIDTH / 2 - 220, y - 8, 440, 100, 16);
    card.lineStyle(1, accentColor, 0.1);
    card.strokeRoundedRect(GAME_WIDTH / 2 - 220, y - 8, 440, 100, 16);

    // Accent dot
    this.add.circle(GAME_WIDTH / 2 - 190, y + 18, 4, accentColor, 0.5);

    this.add
      .text(GAME_WIDTH / 2 - 175, y + 12, title, {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);

    this.add
      .text(GAME_WIDTH / 2 - 175, y + 36, desc, {
        fontSize: '11px',
        color: '#666666',
        fontFamily: 'monospace',
      })
      .setOrigin(0, 0.5);

    return y + 64;
  }

  private createPillButton(
    x: number, y: number,
    label: string, w: number, h: number,
    bgColor: number, textColor: string,
    callback: () => void,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(bgColor, 0.1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    bg.lineStyle(1.5, bgColor, 0.4);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    container.add(bg);

    const text = this.add
      .text(0, 0, label, {
        fontSize: `${Math.min(h * 0.4, 18)}px`,
        color: textColor,
        fontFamily: 'monospace',
        fontStyle: 'bold',
        letterSpacing: 2,
      })
      .setOrigin(0.5);
    container.add(text);

    const hitZone = this.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true });
    container.add(hitZone);

    hitZone.on('pointerover', () => {
      text.setColor('#ffffff');
      bg.clear();
      bg.fillStyle(bgColor, 0.2);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
      bg.lineStyle(1.5, bgColor, 0.7);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    });
    hitZone.on('pointerout', () => {
      text.setColor(textColor);
      bg.clear();
      bg.fillStyle(bgColor, 0.1);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
      bg.lineStyle(1.5, bgColor, 0.4);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    });
    hitZone.on('pointerdown', callback);

    return container;
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
          updateSW(true);
        },
        onOfflineReady: () => {
          this.showStatus('Already on the latest version.', '#ffd43b');
        },
      });
      this.time.delayedCall(3000, () => {
        this.showStatus('Forcing hard reload...', '#00d4ff');
        this.time.delayedCall(500, () => {
          window.location.reload();
        });
      });
    } catch {
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
