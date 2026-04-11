import Phaser from 'phaser';
import { GateOption } from '@/systems/GateSpawner';
import { GATE_WIDTH, GATE_GAP } from '@/config/GameConfig';

export class Gate extends Phaser.GameObjects.Container {
  leftOption: GateOption | null = null;
  rightOption: GateOption | null = null;
  passed: boolean = false;

  private leftBg: Phaser.GameObjects.Sprite;
  private rightBg: Phaser.GameObjects.Sprite;
  private leftGlow: Phaser.GameObjects.Ellipse;
  private rightGlow: Phaser.GameObjects.Ellipse;
  private leftShadow: Phaser.GameObjects.Text;
  private rightShadow: Phaser.GameObjects.Text;
  private leftLabel: Phaser.GameObjects.Text;
  private rightLabel: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    scene.add.existing(this);

    const halfGap = GATE_GAP / 2;
    const leftX = -(halfGap + GATE_WIDTH / 2);
    const rightX = halfGap + GATE_WIDTH / 2;

    this.leftBg = scene.add.sprite(leftX, 0, 'gate_multiply');
    this.rightBg = scene.add.sprite(rightX, 0, 'gate_add');

    // Glow behind text
    this.leftGlow = scene.add.ellipse(leftX, -6, 70, 50, 0xffffff, 0.15);
    this.rightGlow = scene.add.ellipse(rightX, -6, 70, 50, 0xffffff, 0.15);

    // Shadow text (offset for depth)
    this.leftShadow = scene.add.text(leftX + 2, -4, '', {
      fontSize: '36px',
      color: '#000000',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0.4);
    this.rightShadow = scene.add.text(rightX + 2, -4, '', {
      fontSize: '36px',
      color: '#000000',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0.4);

    // Main label — big bold white with colored stroke
    this.leftLabel = scene.add.text(leftX, -6, '', {
      fontSize: '36px',
      color: '#ffffff',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);
    this.rightLabel = scene.add.text(rightX, -6, '', {
      fontSize: '36px',
      color: '#ffffff',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add([this.leftBg, this.rightBg, this.leftGlow, this.rightGlow,
              this.leftShadow, this.rightShadow, this.leftLabel, this.rightLabel]);
    this.setVisible(false);
    this.setActive(false);
  }

  spawn(y: number, left: GateOption, right: GateOption): void {
    this.setPosition(0, y);
    this.leftOption = left;
    this.rightOption = right;
    this.passed = false;

    this.leftLabel.setText(left.label);
    this.rightLabel.setText(right.label);
    this.leftShadow.setText(left.label);
    this.rightShadow.setText(right.label);

    const leftTex = this.textureForColor(left.color);
    const rightTex = this.textureForColor(right.color);
    this.leftBg.setTexture(leftTex);
    this.rightBg.setTexture(rightTex);

    // Color the stroke to match gate type
    const leftStroke = this.strokeForColor(left.color);
    const rightStroke = this.strokeForColor(right.color);
    this.leftLabel.setStroke(leftStroke, 4);
    this.rightLabel.setStroke(rightStroke, 4);

    // Glow color matches gate
    this.leftGlow.setFillStyle(left.color, 0.2);
    this.rightGlow.setFillStyle(right.color, 0.2);

    this.setVisible(true);
    this.setActive(true);

    // Pulsing glow animation
    this.scene.tweens.add({
      targets: [this.leftBg, this.rightBg],
      alpha: { from: 0.85, to: 1 },
      scaleX: { from: 0.97, to: 1.03 },
      scaleY: { from: 0.97, to: 1.03 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Glow pulse
    this.scene.tweens.add({
      targets: [this.leftGlow, this.rightGlow],
      alpha: { from: 0.1, to: 0.3 },
      scaleX: { from: 0.9, to: 1.1 },
      scaleY: { from: 0.9, to: 1.1 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Labels bob
    this.scene.tweens.add({
      targets: [this.leftLabel, this.rightLabel, this.leftShadow, this.rightShadow],
      y: { from: -8, to: 0 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  checkPass(armyX: number, armyY: number): GateOption | null {
    if (this.passed || !this.active) return null;
    if (Math.abs(armyY - this.y) > 30) return null;

    this.passed = true;
    return armyX < 0 ? this.leftOption : this.rightOption;
  }

  checkPassByX(relativeX: number): GateOption | null {
    if (this.passed || !this.active) return null;
    this.passed = true;
    return relativeX < 0 ? this.leftOption : this.rightOption;
  }

  despawn(): void {
    this.scene.tweens.killTweensOf(this.leftBg);
    this.scene.tweens.killTweensOf(this.rightBg);
    this.scene.tweens.killTweensOf(this.leftGlow);
    this.scene.tweens.killTweensOf(this.rightGlow);
    this.scene.tweens.killTweensOf(this.leftLabel);
    this.scene.tweens.killTweensOf(this.rightLabel);
    this.scene.tweens.killTweensOf(this.leftShadow);
    this.scene.tweens.killTweensOf(this.rightShadow);
    this.leftBg.setAlpha(1).setScale(1);
    this.rightBg.setAlpha(1).setScale(1);
    this.leftGlow.setAlpha(0.15).setScale(1);
    this.rightGlow.setAlpha(0.15).setScale(1);
    this.setVisible(false);
    this.setActive(false);
  }

  private textureForColor(color: number): string {
    if (color === 0x51cf66) return 'gate_multiply';
    if (color === 0xff6b6b) return 'gate_subtract';
    if (color === 0xffd43b) return 'gate_multiply'; // weapon gates use gold/multiply style
    return 'gate_add';
  }

  private strokeForColor(color: number): string {
    if (color === 0x51cf66) return '#1a5c2a';
    if (color === 0xff6b6b) return '#661010';
    if (color === 0xffd43b) return '#665510'; // weapon gate gold stroke
    return '#0a3355';
  }
}
