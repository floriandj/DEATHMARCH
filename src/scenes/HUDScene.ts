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
  bossName: string = '';

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

    // Weapon indicator (top-center area)
    this.weaponIcon = this.add.sprite(GAME_WIDTH / 2 - 60, 84, 'weapon_svg_pistol')
      .setDisplaySize(24, 24)
      .setAlpha(0.9)
      .setVisible(false);
    this.weaponLabel = this.add.text(GAME_WIDTH / 2 - 40, 80, '', {
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
      const name = this.bossName || 'BOSS';
      this.bossHpLabel.setText(`${name} ${Math.ceil(this.bossHpPercent * 100)}%`);
    }

    // Update weapon display
    if (this.weaponType) {
      this.weaponIcon.setVisible(true);
      this.weaponLabel.setVisible(true);
      this.weaponLabel.setText(this.weaponName);

      const svgKey = this.getWeaponSvgKey(this.weaponType);
      if (this.weaponIcon.texture.key !== svgKey) {
        this.weaponIcon.setTexture(svgKey);
        this.weaponIcon.setDisplaySize(24, 24);
      }
    }
  }

  private getWeaponSvgKey(weaponType: string): string {
    const map: Record<string, string> = {
      pistol: 'weapon_svg_pistol',
      smg: 'weapon_svg_smg',
      ar: 'weapon_svg_ar',
      lmg: 'weapon_svg_lmg',
      minigun: 'weapon_svg_minigun',
      cryo: 'weapon_svg_cryo',
      railgun: 'weapon_svg_railgun',
      plasma: 'weapon_svg_plasma',
      voidbeam: 'weapon_svg_voidbeam',
      godslayer: 'weapon_svg_godslayer',
      flamer: 'weapon_svg_flamer',
    };
    return map[weaponType] || 'weapon_svg_pistol';
  }
}
