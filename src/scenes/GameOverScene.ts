// src/scenes/GameOverScene.ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';
import { LevelManager } from '@/config/progression';

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
    const prev = parseInt(localStorage.getItem('deathmarch-highscore') || '0', 10);
    const isNewHigh = data.score > prev;
    if (isNewHigh) {
      localStorage.setItem('deathmarch-highscore', String(data.score));
    }

    const mgr = LevelManager.instance;
    const levelName = mgr.current.name;
    const canAdvance = data.bossDefeated && mgr.hasNextLevel;

    const titleText = data.bossDefeated ? 'VICTORY!' : 'GAME OVER';
    const titleColor = data.bossDefeated ? '#51cf66' : '#ff6b6b';
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.15, titleText, {
        fontSize: '56px',
        color: titleColor,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Show level name
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.22, levelName, {
        fontSize: '18px',
        color: '#888888',
        fontFamily: 'monospace',
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
        .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.34 + i * 40, line, {
          fontSize: '24px',
          color,
          fontFamily: 'monospace',
        })
        .setOrigin(0.5);
    });

    let btnY = GAME_HEIGHT * 0.62;

    // ── NEXT LEVEL button (only if boss defeated and more levels exist) ──
    if (canAdvance) {
      const nextBtn = this.add
        .text(GAME_WIDTH / 2, btnY, '[ NEXT LEVEL ]', {
          fontSize: '32px',
          color: '#ffd43b',
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      // Pulsing glow
      this.tweens.add({
        targets: nextBtn,
        alpha: 0.6,
        duration: 600,
        yoyo: true,
        repeat: -1,
      });

      nextBtn.on('pointerover', () => nextBtn.setColor('#ffffff'));
      nextBtn.on('pointerout', () => nextBtn.setColor('#ffd43b'));
      nextBtn.on('pointerdown', () => {
        mgr.advanceLevel();
        // Save level progress
        localStorage.setItem('deathmarch-level', String(mgr.currentLevelIndex));
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.scene.start('GameScene');
        });
      });

      btnY += 60;
    }

    // All levels beaten message
    if (data.bossDefeated && !mgr.hasNextLevel) {
      this.add
        .text(GAME_WIDTH / 2, btnY, 'ALL LEVELS COMPLETE!', {
          fontSize: '24px',
          color: '#ffd43b',
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      btnY += 50;
    }

    // ── PLAY AGAIN button ──
    const retryLabel = data.bossDefeated ? '[ REPLAY LEVEL ]' : '[ TRY AGAIN ]';
    const retryBtn = this.add
      .text(GAME_WIDTH / 2, btnY, retryLabel, {
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

    btnY += 50;

    const menuBtn = this.add
      .text(GAME_WIDTH / 2, btnY, '[ MENU ]', {
        fontSize: '24px',
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
