// src/scenes/SplashScene.ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';

export class SplashScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SplashScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#14283d');

    const bg = this.add.graphics();
    bg.fillStyle(0x14283d, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const horizon = this.add.graphics();
    horizon.fillStyle(0x1c4d84, 1);
    horizon.fillRect(0, GAME_HEIGHT * 0.20, GAME_WIDTH, GAME_HEIGHT * 0.80);
    horizon.fillStyle(0x0f2b48, 0.18);
    horizon.fillRect(0, GAME_HEIGHT * 0.30, GAME_WIDTH, GAME_HEIGHT * 0.40);

    const mist = this.add.graphics();
    mist.fillStyle(0xffffff, 0.04);
    mist.fillEllipse(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.45, GAME_WIDTH * 0.85, GAME_HEIGHT * 0.40);

    const haze = this.add.graphics();
    haze.fillStyle(0xebb654, 0.08);
    haze.fillCircle(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.42, 260);
    haze.fillStyle(0xffc765, 0.06);
    haze.fillCircle(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.45, 180);

    for (let i = 0; i < 24; i++) {
      const x = Phaser.Math.Between(40, GAME_WIDTH - 40);
      const y = Phaser.Math.Between(GAME_HEIGHT * 0.25, GAME_HEIGHT * 0.8);
      const size = Phaser.Math.Between(1, 3);
      const star = this.add.circle(x, y, size, 0xffffff, 0);
      this.tweens.add({
        targets: star,
        alpha: { from: 0.05, to: Phaser.Math.FloatBetween(0.15, 0.45) },
        duration: Phaser.Math.Between(2200, 5200),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 1200),
      });
    }

    const ring = this.add.graphics();
    ring.lineStyle(3, 0xebb654, 0.2);
    ring.strokeCircle(GAME_WIDTH / 2, GAME_HEIGHT * 0.38, 180);
    ring.strokeCircle(GAME_WIDTH / 2, GAME_HEIGHT * 0.38, 120);
    this.tweens.add({ targets: ring, alpha: 0.05, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const shield = this.add.graphics();
    shield.fillStyle(0x305a8b, 1);
    shield.lineStyle(4, 0xebb654, 0.95);
    shield.beginPath();
    shield.moveTo(GAME_WIDTH / 2 - 72, GAME_HEIGHT * 0.32);
    shield.lineTo(GAME_WIDTH / 2 + 72, GAME_HEIGHT * 0.32);
    shield.lineTo(GAME_WIDTH / 2 + 48, GAME_HEIGHT * 0.54);
    shield.arc(GAME_WIDTH / 2, GAME_HEIGHT * 0.54, 48, 0, Math.PI, true);
    shield.lineTo(GAME_WIDTH / 2 - 48, GAME_HEIGHT * 0.54);
    shield.closePath();
    shield.fillPath();
    shield.strokePath();
    shield.fillStyle(0xffffff, 0.03);
    shield.fillRect(GAME_WIDTH / 2 - 60, GAME_HEIGHT * 0.33, 120, 88);

    const blade = this.add.graphics();
    blade.fillStyle(0xe0c06f, 1);
    blade.fillRoundedRect(GAME_WIDTH / 2 - 10, GAME_HEIGHT * 0.18, 20, 140, 10);
    blade.fillStyle(0x3e4d6a, 1);
    blade.fillRoundedRect(GAME_WIDTH / 2 - 28, GAME_HEIGHT * 0.16, 56, 18, 8);
    blade.fillStyle(0xebb654, 1);
    blade.fillRect(GAME_WIDTH / 2 - 16, GAME_HEIGHT * 0.16, 32, 8);
    this.tweens.add({ targets: blade, y: '-=4', duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.40, 'DEATHMARCH', {
      fontSize: '72px', color: '#f4e49e', fontFamily: 'Arial, Helvetica, sans-serif', fontStyle: 'bold',
      stroke: '#2a4368', strokeThickness: 5,
      shadow: { offsetX: 2, offsetY: 3, color: '#000000', blur: 8, fill: true },
    }).setOrigin(0.5).setAlpha(0).setScale(1.6);

    this.tweens.add({ targets: title, alpha: 1, scale: 1, duration: 900, delay: 250, ease: 'Back.easeOut' });

    const subtitle = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.52, 'ENDLESS WAR AWAITS', {
      fontSize: '20px', color: '#d6c575', fontFamily: 'Arial, Helvetica, sans-serif', letterSpacing: 8,
      stroke: '#11213b', strokeThickness: 2,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: subtitle, alpha: 0.85, y: GAME_HEIGHT * 0.49, duration: 700, delay: 700, ease: 'Sine.easeOut' });

    const tapText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.72, 'TAP ANYWHERE TO START', {
      fontSize: '18px', color: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif', letterSpacing: 8,
      stroke: '#0f1b34', strokeThickness: 2,
    }).setOrigin(0.5).setAlpha(0);

    const arrow = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.78, '\u2193', {
      fontSize: '28px', color: '#ebb654', fontFamily: 'Arial, Helvetica, sans-serif', fontStyle: 'bold',
      stroke: '#0f1b34', strokeThickness: 2,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: [tapText, arrow], alpha: 0.85, duration: 600, delay: 1300,
      onComplete: () => {
        this.tweens.add({ targets: tapText, alpha: 0.3, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: arrow, y: '+=8', duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
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
