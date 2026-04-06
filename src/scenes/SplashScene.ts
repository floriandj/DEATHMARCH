// src/scenes/SplashScene.ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';

export class SplashScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SplashScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0f1923');

    // Layered radial gradient background
    const bgGlow = this.add.graphics();
    bgGlow.fillStyle(0xff2040, 0.06);
    bgGlow.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT * 0.38, 400);
    bgGlow.fillStyle(0xff2040, 0.03);
    bgGlow.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT * 0.38, 600);

    // Animated ember particles rising from bottom
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(GAME_HEIGHT + 20, GAME_HEIGHT + 500);
      const size = Phaser.Math.Between(1, 4);
      const ember = this.add.circle(x, y, size, 0xff4040, 0);

      this.tweens.add({
        targets: ember,
        y: Phaser.Math.Between(-100, GAME_HEIGHT * 0.2),
        x: ember.x + Phaser.Math.Between(-60, 60),
        alpha: { from: 0, to: Phaser.Math.FloatBetween(0.2, 0.7) },
        scale: { from: 1, to: 0.3 },
        duration: Phaser.Math.Between(2000, 4000),
        delay: Phaser.Math.Between(0, 1000),
        ease: 'Sine.easeOut',
      });
    }

    // Dramatic horizontal slash line
    const slashLine = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT * 0.45, 0, 3, 0xff4040, 0.9);
    this.tweens.add({
      targets: slashLine,
      width: GAME_WIDTH * 0.7,
      duration: 350,
      delay: 500,
      ease: 'Power3',
    });

    // Secondary thinner lines flanking the main slash
    const topLine = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT * 0.45 - 12, 0, 1, 0xff4040, 0.3);
    const botLine = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT * 0.45 + 12, 0, 1, 0xff4040, 0.3);
    this.tweens.add({
      targets: [topLine, botLine],
      width: GAME_WIDTH * 0.5,
      duration: 400,
      delay: 650,
      ease: 'Power2',
    });

    // Pulsing glow behind title
    const titleGlow = this.add.circle(GAME_WIDTH / 2, GAME_HEIGHT * 0.38, 120, 0xff2040, 0);
    this.tweens.add({
      targets: titleGlow,
      alpha: 0.15,
      scale: 2,
      duration: 1500,
      delay: 200,
      ease: 'Sine.easeOut',
    });

    // Main title with scale-in
    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.38, 'DEATHMARCH', {
        fontSize: '64px',
        color: '#ffffff',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontStyle: 'bold',
        stroke: '#ff2040',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setScale(1.6);

    this.tweens.add({
      targets: title,
      alpha: 1,
      scale: 1,
      duration: 700,
      delay: 250,
      ease: 'Back.easeOut',
    });

    // Subtitle with letter-spacing slide-up
    const subtitle = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.50, 'ENDLESS WAR AWAITS', {
        fontSize: '15px',
        color: '#ff6b6b',
        fontFamily: 'Arial, Helvetica, sans-serif',
        letterSpacing: 10,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: subtitle,
      alpha: 0.8,
      y: GAME_HEIGHT * 0.47,
      duration: 600,
      delay: 800,
      ease: 'Sine.easeOut',
    });

    // Version badge
    const versionBg = this.add
      .graphics()
      .fillStyle(0xffffff, 0.05)
      .fillRoundedRect(GAME_WIDTH / 2 - 40, GAME_HEIGHT * 0.53, 80, 24, 12)
      .setAlpha(0);

    const versionText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.53 + 12, 'v1.0.0', {
        fontSize: '11px',
        color: '#666666',
        fontFamily: 'Arial, Helvetica, sans-serif',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: [versionBg, versionText],
      alpha: 1,
      duration: 400,
      delay: 1100,
    });

    // Modern "Tap to continue" with animated underline
    const tapText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.75, 'TAP TO CONTINUE', {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'Arial, Helvetica, sans-serif',
        letterSpacing: 4,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    const tapLine = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT * 0.75 + 16, 0, 2, 0xff4040, 0.6);

    this.tweens.add({
      targets: tapText,
      alpha: 0.7,
      duration: 500,
      delay: 1800,
      onComplete: () => {
        this.tweens.add({
          targets: tapLine,
          width: 160,
          duration: 400,
          ease: 'Power2',
        });

        this.tweens.add({
          targets: tapText,
          alpha: 0.3,
          duration: 1000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });

        this.input.once('pointerdown', () => this.transitionToMenu());
      },
    });

    // Auto-advance after 6 seconds
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
