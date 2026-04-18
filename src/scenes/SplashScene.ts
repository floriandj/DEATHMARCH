// src/scenes/SplashScene.ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';

const F = 'Arial, Helvetica, sans-serif';
const GOLD = 0xebb654;
const GOLD_HEX = '#ebb654';
const MUTED = '#7a94ae';

export class SplashScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SplashScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0a1626');

    // ── Soft radial glow (centered, warm) ──
    const glow = this.add.graphics();
    for (let i = 6; i >= 1; i--) {
      glow.fillStyle(GOLD, 0.012 * i);
      glow.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT * 0.42, 60 + i * 60);
    }

    // ── Drifting dust particles ──
    for (let i = 0; i < 10; i++) {
      const x = Phaser.Math.Between(40, GAME_WIDTH - 40);
      const y = Phaser.Math.Between(GAME_HEIGHT * 0.15, GAME_HEIGHT * 0.95);
      const p = this.add.circle(x, y, Phaser.Math.FloatBetween(0.8, 1.6), GOLD, 0);
      this.tweens.add({
        targets: p,
        y: y - Phaser.Math.Between(40, 90),
        alpha: { from: 0, to: Phaser.Math.FloatBetween(0.25, 0.5) },
        duration: Phaser.Math.Between(5000, 8500),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2500),
        ease: 'Sine.easeInOut',
      });
    }

    // ── Title ──
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.42, 'DEATHMARCH', {
      fontSize: '56px', color: GOLD_HEX, fontFamily: F, fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
      shadow: { offsetX: 0, offsetY: 3, color: '#000000', blur: 12, fill: true },
    }).setOrigin(0.5).setAlpha(0).setLetterSpacing(10);
    title.y = GAME_HEIGHT * 0.42 + 14;
    this.tweens.add({
      targets: title,
      alpha: 1,
      y: GAME_HEIGHT * 0.42,
      duration: 1100,
      delay: 200,
      ease: 'Sine.easeOut',
    });

    // ── Hairline divider below title (draws in from center) ──
    const divider = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT * 0.48, 220, 1.5, GOLD);
    divider.setAlpha(0).setScale(0, 1);
    this.tweens.add({ targets: divider, alpha: 0.9, scaleX: 1, duration: 900, delay: 900, ease: 'Power2' });

    // ── Subtitle ──
    const subtitle = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.52, 'ENDLESS WAR', {
      fontSize: '16px', color: MUTED, fontFamily: F,
    }).setOrigin(0.5).setAlpha(0).setLetterSpacing(12);
    this.tweens.add({ targets: subtitle, alpha: 0.85, duration: 900, delay: 1300, ease: 'Sine.easeOut' });

    // ── Tap prompt ──
    const tapText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.82, 'TAP TO BEGIN', {
      fontSize: '14px', color: '#ffffff', fontFamily: F,
    }).setOrigin(0.5).setAlpha(0).setLetterSpacing(8);

    this.tweens.add({
      targets: tapText,
      alpha: 0.7,
      duration: 700,
      delay: 1900,
      onComplete: () => {
        this.tweens.add({ targets: tapText, alpha: 0.2, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      },
    });

    this.input.once('pointerdown', () => this.transitionToMenu());
  }

  private transitionToMenu(): void {
    if (this.scene.isActive('MenuScene')) return;

    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('MenuScene');
    });
  }
}
