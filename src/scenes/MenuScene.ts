// src/scenes/MenuScene.ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.3, 'ISO-METRIC WAR', {
        fontSize: '48px',
        color: '#00d4ff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.38, 'Drag to command your army', {
        fontSize: '18px',
        color: '#888888',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    const highScore = localStorage.getItem('iso-metric-war-highscore') || '0';
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.5, `High Score: ${highScore}`, {
        fontSize: '20px',
        color: '#ffd43b',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    const startBtn = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.65, '[ START ]', {
        fontSize: '32px',
        color: '#51cf66',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    startBtn.on('pointerover', () => startBtn.setColor('#ffffff'));
    startBtn.on('pointerout', () => startBtn.setColor('#51cf66'));
    startBtn.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    this.tweens.add({
      targets: startBtn,
      alpha: 0.5,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
  }
}
