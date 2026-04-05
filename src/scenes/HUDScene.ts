// src/scenes/HUDScene.ts
import Phaser from 'phaser';
import { GAME_WIDTH } from '@/config/GameConfig';

export class HUDScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private distanceText!: Phaser.GameObjects.Text;
  private unitText!: Phaser.GameObjects.Text;
  private killStreakText!: Phaser.GameObjects.Text;
  private bossHpBar!: Phaser.GameObjects.Graphics;
  private bossHpBg!: Phaser.GameObjects.Rectangle;
  private bossHpLabel!: Phaser.GameObjects.Text;

  score: number = 0;
  distance: number = 0;
  unitCount: number = 0;
  killStreak: number = 0;
  bossHpPercent: number = -1; // -1 = hidden

  constructor() {
    super({ key: 'HUDScene' });
  }

  create(): void {
    const style = {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace',
    };

    this.scoreText = this.add.text(16, 16, 'Score: 0', style);
    this.distanceText = this.add.text(16, 38, 'Distance: 0m', style);
    this.unitText = this.add.text(GAME_WIDTH - 16, 16, 'Units: 0', style).setOrigin(1, 0);
    this.killStreakText = this.add.text(GAME_WIDTH - 16, 38, 'Streak: 0', style).setOrigin(1, 0);

    // Boss HP bar (hidden by default)
    const barWidth = 300;
    const barX = (GAME_WIDTH - barWidth) / 2;
    this.bossHpBg = this.add.rectangle(barX, 50, barWidth, 16, 0x333333).setOrigin(0, 0).setVisible(false);
    this.bossHpBar = this.add.graphics().setVisible(false);
    this.bossHpLabel = this.add
      .text(GAME_WIDTH / 2, 53, '', {
        fontSize: '11px',
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0)
      .setVisible(false);
  }

  update(): void {
    this.scoreText.setText(`Score: ${this.score}`);
    this.distanceText.setText(`Distance: ${Math.floor(this.distance)}m`);
    this.unitText.setText(`Units: ${this.unitCount}`);
    this.killStreakText.setText(`Streak: ${this.killStreak}`);

    const showBoss = this.bossHpPercent >= 0;
    this.bossHpBg.setVisible(showBoss);
    this.bossHpBar.setVisible(showBoss);
    this.bossHpLabel.setVisible(showBoss);

    if (showBoss) {
      const barWidth = 300;
      const barX = (GAME_WIDTH - barWidth) / 2;
      this.bossHpBar.clear();
      this.bossHpBar.fillStyle(0xff6b6b, 1);
      this.bossHpBar.fillRect(barX, 50, barWidth * this.bossHpPercent, 16);
      this.bossHpLabel.setText(`GORATH ${Math.ceil(this.bossHpPercent * 100)}%`);
    }
  }
}
