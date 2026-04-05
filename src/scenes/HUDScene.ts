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
  private weaponIcon!: Phaser.GameObjects.Sprite;
  private weaponLabel!: Phaser.GameObjects.Text;

  score: number = 0;
  distance: number = 0;
  unitCount: number = 0;
  killStreak: number = 0;
  bossHpPercent: number = -1; // -1 = hidden
  weaponType: string = '';
  weaponName: string = '';

  constructor() {
    super({ key: 'HUDScene' });
  }

  create(): void {
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'monospace',
    };

    this.scoreText = this.add.text(20, 20, 'Score: 0', style);
    this.distanceText = this.add.text(20, 48, 'Distance: 0m', style);
    this.unitText = this.add.text(GAME_WIDTH - 20, 20, 'Units: 0', style).setOrigin(1, 0);
    this.killStreakText = this.add.text(GAME_WIDTH - 20, 48, 'Streak: 0', style).setOrigin(1, 0);

    // Boss HP bar (hidden by default)
    const barWidth = 360;
    const barX = (GAME_WIDTH - barWidth) / 2;
    this.bossHpBg = this.add.rectangle(barX, 55, barWidth, 20, 0x333333).setOrigin(0, 0).setVisible(false);
    this.bossHpBar = this.add.graphics().setVisible(false);
    this.bossHpLabel = this.add
      .text(GAME_WIDTH / 2, 58, '', {
        fontSize: '13px',
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0)
      .setVisible(false);

    // Weapon indicator (bottom-center)
    this.weaponIcon = this.add.sprite(GAME_WIDTH / 2 - 50, 80, 'weapon_icon_default')
      .setScale(2)
      .setAlpha(0.9)
      .setVisible(false);
    this.weaponLabel = this.add.text(GAME_WIDTH / 2 - 30, 74, '', {
      fontSize: '14px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
    }).setVisible(false);
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
      const barWidth = 360;
      const barX = (GAME_WIDTH - barWidth) / 2;
      this.bossHpBar.clear();
      this.bossHpBar.fillStyle(0xff6b6b, 1);
      this.bossHpBar.fillRect(barX, 55, barWidth * this.bossHpPercent, 20);
      this.bossHpLabel.setText(`GORATH ${Math.ceil(this.bossHpPercent * 100)}%`);
    }

    // Update weapon display
    if (this.weaponType) {
      this.weaponIcon.setVisible(true);
      this.weaponLabel.setVisible(true);
      this.weaponLabel.setText(this.weaponName);

      const iconKey = this.getWeaponIconKey(this.weaponType);
      if (this.weaponIcon.texture.key !== iconKey) {
        this.weaponIcon.setTexture(iconKey);
      }
    }
  }

  private getWeaponIconKey(weaponType: string): string {
    const iconMap: Record<string, string> = {
      pistol: 'weapon_icon_pistol',
      smg: 'weapon_icon_smg',
      ar: 'weapon_icon_ar',
      lmg: 'weapon_icon_lmg',
      minigun: 'weapon_icon_minigun',
      cryo_cannon: 'weapon_icon_cryo_cannon',
      railgun: 'weapon_icon_railgun',
      plasma_rifle: 'weapon_icon_plasma_rifle',
      void_beam: 'weapon_icon_void_beam',
      godslayer: 'weapon_icon_godslayer',
    };
    return iconMap[weaponType] || 'weapon_icon_default';
  }
}
