// src/scenes/SplashScene.ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';

export class SplashScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SplashScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0a0f1a');

    // Deep background
    const vignetteOuter = this.add.graphics();
    vignetteOuter.fillStyle(0x0a0f1a, 1);
    vignetteOuter.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    // Center glow
    const glow1 = this.add.graphics();
    glow1.fillStyle(0xff2040, 0.04);
    glow1.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT * 0.36, 500);
    glow1.fillStyle(0xff4400, 0.06);
    glow1.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT * 0.38, 350);
    glow1.fillStyle(0xff6600, 0.08);
    glow1.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT * 0.38, 180);

    // Floating dust particles
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const size = Phaser.Math.FloatBetween(0.5, 2);
      const dust = this.add.circle(x, y, size, 0xffffff, 0);
      this.tweens.add({
        targets: dust,
        alpha: { from: 0, to: Phaser.Math.FloatBetween(0.1, 0.3) },
        y: y - Phaser.Math.Between(50, 200),
        x: x + Phaser.Math.Between(-30, 30),
        duration: Phaser.Math.Between(4000, 8000),
        delay: Phaser.Math.Between(0, 3000),
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut',
      });
    }

    // Rising embers
    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(GAME_HEIGHT + 20, GAME_HEIGHT + 400);
      const size = Phaser.Math.Between(1, 3);
      const color = [0xff4040, 0xff6600, 0xffaa00][Phaser.Math.Between(0, 2)];
      const ember = this.add.circle(x, y, size, color, 0);
      this.tweens.add({
        targets: ember,
        y: Phaser.Math.Between(-100, GAME_HEIGHT * 0.2),
        x: ember.x + Phaser.Math.Between(-80, 80),
        alpha: { from: 0, to: Phaser.Math.FloatBetween(0.3, 0.8) },
        scale: { from: 1, to: 0.2 },
        duration: Phaser.Math.Between(2500, 5000),
        delay: Phaser.Math.Between(0, 1500),
        ease: 'Sine.easeOut',
      });
    }

    // Ornate separator lines
    const mainSlash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT * 0.45, 0, 3, 0xff4040, 0.9);
    this.tweens.add({ targets: mainSlash, width: GAME_WIDTH * 0.75, duration: 400, delay: 500, ease: 'Power3' });

    const topLine = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT * 0.45 - 14, 0, 1, 0xffd700, 0.4);
    const botLine = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT * 0.45 + 14, 0, 1, 0xffd700, 0.4);
    this.tweens.add({ targets: [topLine, botLine], width: GAME_WIDTH * 0.55, duration: 450, delay: 700, ease: 'Power2' });

    // Gold ornament dots
    const dotL = this.add.circle(GAME_WIDTH * 0.15, GAME_HEIGHT * 0.45, 3, 0xffd700, 0).setDepth(2);
    const dotR = this.add.circle(GAME_WIDTH * 0.85, GAME_HEIGHT * 0.45, 3, 0xffd700, 0).setDepth(2);
    this.tweens.add({ targets: [dotL, dotR], alpha: 0.8, duration: 300, delay: 900 });

    // Title glow
    const titleGlow = this.add.circle(GAME_WIDTH / 2, GAME_HEIGHT * 0.38, 120, 0xff2040, 0);
    this.tweens.add({ targets: titleGlow, alpha: 0.12, scale: 2.5, duration: 1800, delay: 200, ease: 'Sine.easeOut' });

    // Main title — metallic gold
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.38, 'DEATHMARCH', {
      fontSize: '68px',
      color: '#ffd700',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontStyle: 'bold',
      stroke: '#b8860b',
      strokeThickness: 4,
      shadow: { offsetX: 2, offsetY: 3, color: '#000000', blur: 6, fill: true },
    }).setOrigin(0.5).setAlpha(0).setScale(1.8);

    this.tweens.add({ targets: title, alpha: 1, scale: 1, duration: 800, delay: 300, ease: 'Back.easeOut' });

    // Subtitle
    const subtitle = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.50, 'ENDLESS WAR AWAITS', {
      fontSize: '16px',
      color: '#ff6b6b',
      fontFamily: 'Arial, Helvetica, sans-serif',
      letterSpacing: 12,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: subtitle, alpha: 0.8, y: GAME_HEIGHT * 0.47, duration: 600, delay: 900, ease: 'Sine.easeOut' });

    // Version badge
    const vBadgeW = 90, vBadgeH = 26;
    const vBg = this.add.graphics()
      .fillStyle(0xffd700, 0.08)
      .fillRoundedRect(GAME_WIDTH / 2 - vBadgeW / 2, GAME_HEIGHT * 0.53, vBadgeW, vBadgeH, vBadgeH / 2)
      .lineStyle(1, 0xffd700, 0.2)
      .strokeRoundedRect(GAME_WIDTH / 2 - vBadgeW / 2, GAME_HEIGHT * 0.53, vBadgeW, vBadgeH, vBadgeH / 2)
      .setAlpha(0);

    const versionText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.53 + vBadgeH / 2, 'v2.0', {
      fontSize: '12px', color: '#b8860b', fontFamily: 'Arial, Helvetica, sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: [vBg, versionText], alpha: 1, duration: 400, delay: 1200 });

    // Tap to continue with gold underline
    const tapText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.75, 'TAP TO CONTINUE', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif', letterSpacing: 5,
    }).setOrigin(0.5).setAlpha(0);

    const tapLine = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT * 0.75 + 18, 0, 2, 0xffd700, 0.6);

    this.tweens.add({
      targets: tapText, alpha: 0.7, duration: 500, delay: 2000,
      onComplete: () => {
        this.tweens.add({ targets: tapLine, width: 180, duration: 400, ease: 'Power2' });
        this.tweens.add({ targets: tapText, alpha: 0.3, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.input.once('pointerdown', () => this.transitionToMenu());
      },
    });

    this.time.delayedCall(6000, () => this.transitionToMenu());
  }

  private transitionToMenu(): void {
    if (this.scene.isActive('MenuScene')) return;

    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('MenuScene');
    });
  }
}
