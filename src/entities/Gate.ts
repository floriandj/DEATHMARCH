import Phaser from 'phaser';
import { GateOption } from '@/systems/GateSpawner';
import { GATE_WIDTH, GATE_GAP } from '@/config/GameConfig';

export class Gate extends Phaser.GameObjects.Container {
  leftOption: GateOption | null = null;
  rightOption: GateOption | null = null;
  passed: boolean = false;

  private leftBg: Phaser.GameObjects.Sprite;
  private rightBg: Phaser.GameObjects.Sprite;
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
    this.leftLabel = scene.add.text(leftX, 0, '', {
      fontSize: '24px',
      color: '#000000',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.rightLabel = scene.add.text(rightX, 0, '', {
      fontSize: '24px',
      color: '#000000',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add([this.leftBg, this.rightBg, this.leftLabel, this.rightLabel]);
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

    this.leftBg.setTexture(this.textureForColor(left.color));
    this.rightBg.setTexture(this.textureForColor(right.color));

    this.setVisible(true);
    this.setActive(true);
  }

  checkPass(armyX: number, armyY: number): GateOption | null {
    if (this.passed || !this.active) return null;
    if (Math.abs(armyY - this.y) > 30) return null;

    this.passed = true;
    return armyX < 0 ? this.leftOption : this.rightOption;
  }

  despawn(): void {
    this.setVisible(false);
    this.setActive(false);
  }

  private textureForColor(color: number): string {
    if (color === 0x51cf66) return 'gate_multiply';
    if (color === 0xff6b6b) return 'gate_subtract';
    return 'gate_add';
  }
}
