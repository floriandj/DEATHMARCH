// src/scenes/MenuScene.ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';
import { LevelManager } from '@/config/progression';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0a0a1a');
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // Restore saved level progress
    const mgr = LevelManager.instance;
    const savedLevel = parseInt(localStorage.getItem('deathmarch-level') || '0', 10);
    if (savedLevel >= 0 && savedLevel < mgr.totalLevels) {
      mgr.setLevel(savedLevel);
    }

    // Ambient floating particles in background
    for (let i = 0; i < 20; i++) {
      const dot = this.add.circle(
        Phaser.Math.Between(20, GAME_WIDTH - 20),
        Phaser.Math.Between(20, GAME_HEIGHT - 20),
        Phaser.Math.Between(1, 3),
        0xff4040,
        Phaser.Math.FloatBetween(0.05, 0.15),
      );
      this.tweens.add({
        targets: dot,
        y: dot.y - Phaser.Math.Between(40, 120),
        alpha: 0,
        duration: Phaser.Math.Between(3000, 6000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 3000),
      });
    }

    // Title
    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.18, 'DEATHMARCH', {
        fontSize: '56px',
        color: '#ff4040',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Subtle glow behind title
    const glow = this.add.circle(GAME_WIDTH / 2, GAME_HEIGHT * 0.18, 100, 0xff4040, 0.06);
    this.tweens.add({
      targets: glow,
      alpha: 0.12,
      scale: 1.3,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Separator
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT * 0.24, GAME_WIDTH * 0.5, 2, 0xff4040, 0.4);

    // Tagline
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.28, 'Drag to command your army', {
        fontSize: '16px',
        color: '#666666',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    // High score display
    const highScore = localStorage.getItem('deathmarch-highscore') || '0';
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.35, `HIGH SCORE`, {
        fontSize: '12px',
        color: '#888888',
        fontFamily: 'monospace',
        letterSpacing: 4,
      })
      .setOrigin(0.5);

    const scoreValue = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.39, highScore, {
        fontSize: '36px',
        color: '#ffd43b',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Gentle score shimmer
    this.tweens.add({
      targets: scoreValue,
      alpha: 0.7,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // ── Level selector ──
    const levelY = GAME_HEIGHT * 0.48;

    // Level label
    this.add
      .text(GAME_WIDTH / 2, levelY - 25, 'LEVEL', {
        fontSize: '12px',
        color: '#888888',
        fontFamily: 'monospace',
        letterSpacing: 4,
      })
      .setOrigin(0.5);

    const levelText = this.add
      .text(GAME_WIDTH / 2, levelY + 10, this.getLevelLabel(mgr), {
        fontSize: '22px',
        color: '#00d4ff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Left arrow
    const leftArrow = this.add
      .text(GAME_WIDTH / 2 - 160, levelY + 10, '<', {
        fontSize: '32px',
        color: mgr.currentLevelIndex > 0 ? '#00d4ff' : '#333333',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // Right arrow
    const maxUnlocked = savedLevel;
    const rightArrow = this.add
      .text(GAME_WIDTH / 2 + 160, levelY + 10, '>', {
        fontSize: '32px',
        color: mgr.currentLevelIndex < maxUnlocked ? '#00d4ff' : '#333333',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const updateArrows = () => {
      leftArrow.setColor(mgr.currentLevelIndex > 0 ? '#00d4ff' : '#333333');
      rightArrow.setColor(mgr.currentLevelIndex < maxUnlocked ? '#00d4ff' : '#333333');
      levelText.setText(this.getLevelLabel(mgr));
    };

    leftArrow.on('pointerdown', () => {
      if (mgr.currentLevelIndex > 0) {
        mgr.setLevel(mgr.currentLevelIndex - 1);
        updateArrows();
      }
    });

    rightArrow.on('pointerdown', () => {
      if (mgr.currentLevelIndex < maxUnlocked) {
        mgr.setLevel(mgr.currentLevelIndex + 1);
        updateArrows();
      }
    });

    // ── START button ──
    const startBtn = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.58, '[ START ]', {
        fontSize: '36px',
        color: '#51cf66',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    startBtn.on('pointerover', () => startBtn.setColor('#ffffff'));
    startBtn.on('pointerout', () => startBtn.setColor('#51cf66'));
    startBtn.on('pointerdown', () => {
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('GameScene');
      });
    });

    this.tweens.add({
      targets: startBtn,
      alpha: 0.5,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // ── SETTINGS button ──
    const settingsBtn = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.68, '[ SETTINGS ]', {
        fontSize: '22px',
        color: '#888888',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    settingsBtn.on('pointerover', () => settingsBtn.setColor('#ffffff'));
    settingsBtn.on('pointerout', () => settingsBtn.setColor('#888888'));
    settingsBtn.on('pointerdown', () => {
      this.scene.start('SettingsScene');
    });

    // Gear icon in top-right corner as alternative
    const gear = this.add
      .text(GAME_WIDTH - 40, 40, '\u2699', {
        fontSize: '28px',
        color: '#555555',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    gear.on('pointerover', () => gear.setColor('#ffffff'));
    gear.on('pointerout', () => gear.setColor('#555555'));
    gear.on('pointerdown', () => {
      this.scene.start('SettingsScene');
    });

    // Version tag bottom
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 40, 'v1.0.0', {
        fontSize: '11px',
        color: '#333333',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);
  }

  private getLevelLabel(mgr: LevelManager): string {
    return `${mgr.currentLevelIndex + 1}/${mgr.totalLevels} — ${mgr.current.name}`;
  }
}
