// src/scenes/SplashScene.ts
// Supercell-style animated splash with overshoot pop-in and "gummy" glow effects
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';
import { BG, BG_HEX, ACCENT, GOLD, NEUTRAL, FONT, ANIM, BEVEL } from '@/ui/RoyaleTheme';
import { popIn } from '@/ui/RoyaleUI';

export class SplashScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SplashScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(BG_HEX.primary);

    // Layered radial glow — deep purple/magenta, never pure black
    const bgGlow = this.add.graphics();
    bgGlow.fillStyle(ACCENT.red, 0.05);
    bgGlow.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT * 0.38, 500);
    bgGlow.fillStyle(GOLD.mid, 0.03);
    bgGlow.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT * 0.38, 350);
    bgGlow.fillStyle(ACCENT.red, 0.02);
    bgGlow.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT * 0.38, 700);

    // Animated ember particles rising — warm orange/gold tones
    for (let i = 0; i < 55; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(GAME_HEIGHT + 20, GAME_HEIGHT + 500);
      const size = Phaser.Math.Between(1, 4);
      const emberColor = Phaser.Math.Between(0, 1) > 0.5 ? GOLD.bright : ACCENT.red;
      const ember = this.add.circle(x, y, size, emberColor, 0);

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

    // Dramatic horizontal slash line — gold accent
    const slashLine = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT * 0.45, 0, 4, GOLD.bright, 0.9);
    this.tweens.add({
      targets: slashLine,
      width: GAME_WIDTH * 0.7,
      duration: 350,
      delay: 500,
      ease: 'Power3',
    });

    // Secondary thinner flanking lines
    const topLine = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT * 0.45 - 14, 0, 1, GOLD.mid, 0.35);
    const botLine = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT * 0.45 + 14, 0, 1, GOLD.mid, 0.35);
    this.tweens.add({
      targets: [topLine, botLine],
      width: GAME_WIDTH * 0.5,
      duration: 400,
      delay: 650,
      ease: 'Power2',
    });

    // Pulsing glow behind title
    const titleGlow = this.add.circle(GAME_WIDTH / 2, GAME_HEIGHT * 0.38, 120, GOLD.dark, 0);
    this.tweens.add({
      targets: titleGlow,
      alpha: 0.18,
      scale: 2.2,
      duration: 1500,
      delay: 200,
      ease: 'Sine.easeOut',
    });

    // Main title with overshoot scale-in (the "Supercell pop")
    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.38, 'DEATHMARCH', {
        fontSize: '64px',
        color: NEUTRAL.whiteHex,
        fontFamily: FONT.display,
        fontStyle: 'bold',
        stroke: GOLD.hex.dark,
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setScale(1.6);

    this.tweens.add({
      targets: title,
      alpha: 1,
      scale: 1,
      duration: ANIM.overshoot.duration,
      delay: 250,
      ease: ANIM.overshoot.ease,  // Back.easeOut — overshoots to ~110% then settles
    });

    // Subtitle — golden accent
    const subtitle = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.50, 'ENDLESS WAR AWAITS', {
        fontSize: '15px',
        color: GOLD.hex.bright,
        fontFamily: FONT.body,
        letterSpacing: 10,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: subtitle,
      alpha: 0.85,
      y: GAME_HEIGHT * 0.47,
      duration: 600,
      delay: 800,
      ease: 'Sine.easeOut',
    });

    // Version badge — beveled pill
    const vBadge = this.add.graphics().setAlpha(0);
    vBadge.fillStyle(GOLD.mid, 0.08);
    vBadge.fillRoundedRect(GAME_WIDTH / 2 - 44, GAME_HEIGHT * 0.53, 88, 26, 13);
    vBadge.lineStyle(1, GOLD.mid, 0.15);
    vBadge.strokeRoundedRect(GAME_WIDTH / 2 - 44, GAME_HEIGHT * 0.53, 88, 26, 13);

    const versionText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.53 + 13, 'v1.0.0', {
        fontSize: '11px',
        color: NEUTRAL.dimHex,
        fontFamily: FONT.body,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: [vBadge, versionText],
      alpha: 1,
      duration: 400,
      delay: 1100,
    });

    // "TAP TO CONTINUE" with golden animated underline
    const tapText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.75, 'TAP TO CONTINUE', {
        fontSize: '16px',
        color: NEUTRAL.whiteHex,
        fontFamily: FONT.body,
        fontStyle: 'bold',
        letterSpacing: 4,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    const tapLine = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT * 0.75 + 16, 0, 2, GOLD.bright, 0.7);

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

    this.cameras.main.fadeOut(ANIM.sceneFade.duration, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('MenuScene');
    });
  }
}
