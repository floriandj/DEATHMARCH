// src/scenes/SplashScene.ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';

export class SplashScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SplashScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#000000');

    // Blood-red particles rising from the bottom
    const particles: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(40, GAME_WIDTH - 40);
      const y = Phaser.Math.Between(GAME_HEIGHT + 20, GAME_HEIGHT + 400);
      const dot = this.add.circle(x, y, Phaser.Math.Between(2, 5), 0xff4040, 0);
      particles.push(dot);

      this.tweens.add({
        targets: dot,
        y: Phaser.Math.Between(-50, GAME_HEIGHT * 0.3),
        alpha: { from: 0, to: Phaser.Math.FloatBetween(0.15, 0.5) },
        duration: Phaser.Math.Between(1500, 3000),
        delay: Phaser.Math.Between(0, 800),
        ease: 'Sine.easeOut',
      });
    }

    // Horizontal slash line across the center
    const slashLine = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT * 0.45, 0, 2, 0xff4040, 0.8);
    this.tweens.add({
      targets: slashLine,
      width: GAME_WIDTH * 0.6,
      duration: 400,
      delay: 600,
      ease: 'Power2',
    });

    // Main title — fades and scales in
    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.38, 'DEATHMARCH', {
        fontSize: '64px',
        color: '#ff4040',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setScale(1.4);

    this.tweens.add({
      targets: title,
      alpha: 1,
      scale: 1,
      duration: 800,
      delay: 300,
      ease: 'Back.easeOut',
    });

    // Subtitle slides up
    const subtitle = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.50, 'ENDLESS WAR AWAITS', {
        fontSize: '16px',
        color: '#888888',
        fontFamily: 'monospace',
        letterSpacing: 8,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      y: GAME_HEIGHT * 0.47,
      duration: 600,
      delay: 900,
      ease: 'Sine.easeOut',
    });

    // Skull / icon glow pulse behind the title
    const glow = this.add.circle(GAME_WIDTH / 2, GAME_HEIGHT * 0.38, 80, 0xff4040, 0);
    this.tweens.add({
      targets: glow,
      alpha: 0.12,
      scale: 1.5,
      duration: 1200,
      delay: 300,
      ease: 'Sine.easeOut',
      yoyo: true,
    });

    // Version tag
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.55, 'v1.0.0', {
        fontSize: '12px',
        color: '#444444',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: this.children.list[this.children.list.length - 1],
      alpha: 1,
      duration: 400,
      delay: 1200,
    });

    // "Tap to continue" prompt — appears last, pulses
    const tapText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.75, 'TAP TO CONTINUE', {
        fontSize: '18px',
        color: '#555555',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: tapText,
      alpha: 1,
      duration: 500,
      delay: 2000,
      onComplete: () => {
        // Pulse loop
        this.tweens.add({
          targets: tapText,
          alpha: 0.3,
          duration: 900,
          yoyo: true,
          repeat: -1,
        });

        // Allow tap/click to proceed
        this.input.once('pointerdown', () => this.transitionToMenu());
      },
    });

    // Auto-advance after 6 seconds regardless
    this.time.delayedCall(6000, () => this.transitionToMenu());
  }

  private transitionToMenu(): void {
    // Prevent double-transition
    if (this.scene.isActive('MenuScene')) return;

    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('MenuScene');
    });
  }
}
