// src/scenes/GameOverScene.ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';

interface GameOverData {
  score: number;
  distance: number;
  bossDefeated: boolean;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: GameOverData): void {
    const prev = parseInt(localStorage.getItem('iso-metric-war-highscore') || '0', 10);
    const isNewHigh = data.score > prev;
    if (isNewHigh) {
      localStorage.setItem('iso-metric-war-highscore', String(data.score));
    }

    const titleText = data.bossDefeated ? 'VICTORY!' : 'GAME OVER';
    const titleColor = data.bossDefeated ? '#51cf66' : '#ff6b6b';
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.2, titleText, {
        fontSize: '48px',
        color: titleColor,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const stats = [
      `Score: ${data.score}`,
      `Distance: ${data.distance}m`,
      data.bossDefeated ? 'Boss Defeated!' : '',
      isNewHigh ? 'NEW HIGH SCORE!' : `Best: ${Math.max(prev, data.score)}`,
    ].filter(Boolean);

    stats.forEach((line, i) => {
      const color = line.includes('NEW HIGH') ? '#ffd43b' : '#cccccc';
      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.4 + i * 36, line, {
          fontSize: '20px',
          color,
          fontFamily: 'monospace',
        })
        .setOrigin(0.5);
    });

    const retryBtn = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.7, '[ PLAY AGAIN ]', {
        fontSize: '28px',
        color: '#00d4ff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    retryBtn.on('pointerover', () => retryBtn.setColor('#ffffff'));
    retryBtn.on('pointerout', () => retryBtn.setColor('#00d4ff'));
    retryBtn.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    const menuBtn = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.8, '[ MENU ]', {
        fontSize: '22px',
        color: '#888888',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    menuBtn.on('pointerover', () => menuBtn.setColor('#ffffff'));
    menuBtn.on('pointerout', () => menuBtn.setColor('#888888'));
    menuBtn.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });
  }
}
