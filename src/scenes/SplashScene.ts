// src/scenes/SplashScene.ts
// Bright-casual splash: gradient backdrop, animated title chip, squishy CTA.
import Phaser from 'phaser';
import { UIFactory, UIPalette } from '@/systems/UIFactory';

const F = 'Arial, Helvetica, sans-serif';

export class SplashScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SplashScene' });
  }

  create(): void {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    this.drawGradientBackdrop(W, H);
    this.spawnFloatingDust(W, H);

    // ── Title chip (slides in + pops with Back.easeOut) ──
    const chipW = Math.min(640, Math.round(W * 0.84));
    const chipH = 168;
    const chipY = Math.round(H * 0.42);
    const chip = UIFactory.createPanel(this, W / 2, chipY, chipW, chipH, {
      fillColor: UIPalette.panelDark,
      borderColor: UIPalette.white,
      borderWidth: 5,
      cornerRadius: 32,
      shadowOffset: 12,
      shadowAlpha: 0.5,
      highlightAlpha: 0.14,
    });
    chip.add(this.add.text(0, -34, 'DEATHMARCH', {
      fontSize: '54px',
      color: '#ffd866',
      fontFamily: F,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 5,
      shadow: { offsetX: 0, offsetY: 4, color: '#000000', blur: 8, fill: true },
    }).setOrigin(0.5));
    chip.add(this.add.text(0, 22, 'ENDLESS WAR', {
      fontSize: '20px',
      color: '#5de2ff',
      fontFamily: F,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setLetterSpacing(8));

    chip.setAlpha(0);
    chip.y = chipY - 60;
    this.tweens.add({
      targets: chip,
      alpha: 1,
      y: chipY,
      duration: 700,
      ease: 'Back.easeOut',
    });

    // Subtle bob so the title feels alive.
    this.time.delayedCall(800, () => {
      this.tweens.add({
        targets: chip,
        y: chipY + 6,
        duration: 1700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    // ── Squishy CTA ──
    const ctaY = Math.round(H * 0.74);
    const ctaW = Math.min(420, Math.round(W * 0.7));
    const cta = UIFactory.createButton(
      this, W / 2, ctaY, ctaW, 92, 'TAP TO PLAY  ▶',
      () => this.transitionToMenu(),
      {
        fillColor: UIPalette.gold,
        borderColor: UIPalette.white,
        borderWidth: 5,
        cornerRadius: 46,
        shadowOffset: 8,
        fontSize: 30,
        fontColor: '#3a2400',
        fontFamily: F,
      },
    );
    cta.setAlpha(0);
    this.tweens.add({ targets: cta, alpha: 1, duration: 500, delay: 400, ease: 'Sine.easeOut' });

    // Heartbeat pulse to draw the eye.
    this.time.delayedCall(900, () => {
      this.tweens.add({
        targets: cta,
        scale: 1.04,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    // Tap anywhere also works.
    this.input.once('pointerdown', () => this.transitionToMenu());
  }

  private drawGradientBackdrop(W: number, H: number): void {
    // Procedural diagonal gradient: sky -> coral
    const top = 0x5de2ff;
    const bottom = 0xff5e5e;
    const steps = 40;
    const g = this.add.graphics();
    for (let s = 0; s < steps; s++) {
      const t = s / (steps - 1);
      const r = Math.round(Phaser.Math.Linear((top >> 16) & 0xff, (bottom >> 16) & 0xff, t));
      const gr = Math.round(Phaser.Math.Linear((top >> 8) & 0xff, (bottom >> 8) & 0xff, t));
      const b = Math.round(Phaser.Math.Linear(top & 0xff, bottom & 0xff, t));
      g.fillStyle((r << 16) | (gr << 8) | b, 1);
      const sliceY = Math.floor((H * s) / steps);
      const sliceH = Math.ceil(H / steps) + 1;
      g.fillRect(0, sliceY, W, sliceH);
    }
    // Soft white spotlight behind the title
    const spot = this.add.graphics();
    for (let i = 6; i >= 1; i--) {
      spot.fillStyle(0xffffff, 0.04 * i);
      spot.fillCircle(W / 2, H * 0.42, 90 + i * 50);
    }
  }

  private spawnFloatingDust(W: number, H: number): void {
    for (let i = 0; i < 14; i++) {
      const x = Phaser.Math.Between(40, W - 40);
      const y = Phaser.Math.Between(60, H - 60);
      const p = this.add.circle(x, y, Phaser.Math.FloatBetween(1.4, 3), 0xffffff, 0);
      this.tweens.add({
        targets: p,
        y: y - Phaser.Math.Between(60, 140),
        alpha: { from: 0, to: Phaser.Math.FloatBetween(0.35, 0.6) },
        duration: Phaser.Math.Between(4500, 7500),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2500),
        ease: 'Sine.easeInOut',
      });
    }
  }

  private transitionToMenu(): void {
    if (this.scene.isActive('MenuScene')) return;
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('MenuScene');
    });
  }
}
