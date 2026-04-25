import Phaser from 'phaser';
import type { GateOption } from '@/systems/GateSpawner';
import { hpForOption, strokeForColor } from '@/entities/Barrel.helpers';
import { LevelManager } from '@/config/progression';

/**
 * Shootable destructible barrel. Replaces the old drive-through gates.
 * HP scales with the operation's magnitude so strong bonuses cost more bullets.
 * On destruction applies its GateOption effect (unit count, weapon upgrade, etc).
 */
export class Barrel extends Phaser.GameObjects.Container {
  active: boolean = false;
  destroyed: boolean = false;
  option: GateOption | null = null;
  private hp: number = 0;
  private maxHp: number = 0;

  private sprite: Phaser.GameObjects.Sprite;
  private label: Phaser.GameObjects.Text;
  private labelShadow: Phaser.GameObjects.Text;
  private hpBar: Phaser.GameObjects.Graphics;
  private glow: Phaser.GameObjects.Ellipse;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    scene.add.existing(this);

    this.glow = scene.add.ellipse(0, -4, 52, 32, 0xffffff, 0.18);
    this.sprite = scene.add.sprite(0, 0, 'barrel_body');
    this.sprite.setScale(2);

    this.labelShadow = scene.add.text(1, -3, '', {
      fontSize: '22px',
      color: '#000000',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0.5);

    this.label = scene.add.text(0, -4, '', {
      fontSize: '22px',
      color: '#ffffff',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.hpBar = scene.add.graphics();

    this.add([this.glow, this.sprite, this.labelShadow, this.label, this.hpBar]);
    this.setVisible(false);
    this.setActive(false);
  }

  spawn(x: number, y: number, option: GateOption): void {
    this.option = option;
    this.destroyed = false;
    this.maxHp = hpForOption(option, LevelManager.instance.currentLevelIndex);
    this.hp = this.maxHp;

    this.label.setText(option.label);
    this.labelShadow.setText(option.label);
    this.label.setStroke(strokeForColor(option.color), 3);

    this.sprite.setTint(option.color);
    this.glow.setFillStyle(option.color, 0.28);

    this.setPosition(x, y);
    this.setVisible(true);
    this.setActive(true);
    this.active = true;

    this.drawHpBar();

    // Gentle bob
    this.scene.tweens.killTweensOf(this.sprite);
    this.scene.tweens.add({
      targets: this.sprite,
      y: { from: -2, to: 2 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    // Glow pulse
    this.scene.tweens.killTweensOf(this.glow);
    this.scene.tweens.add({
      targets: this.glow,
      alpha: { from: 0.18, to: 0.38 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /** Returns true if the barrel was destroyed by this hit. */
  takeDamage(amount: number): boolean {
    if (!this.active || this.destroyed) return false;
    this.hp -= amount;

    // Flash on hit
    this.sprite.setTint(0xffffff);
    this.scene.time.delayedCall(40, () => {
      if (this.active && !this.destroyed && this.option) this.sprite.setTint(this.option.color);
    });

    if (this.hp <= 0) {
      this.destroyed = true;
      this.emitShatter();
      this.despawn();
      return true;
    }
    this.drawHpBar();
    return false;
  }

  despawn(): void {
    this.scene.tweens.killTweensOf(this.sprite);
    this.scene.tweens.killTweensOf(this.glow);
    this.sprite.y = 0;
    this.setVisible(false);
    this.setActive(false);
    this.active = false;
    this.hpBar.clear();
  }

  private drawHpBar(): void {
    this.hpBar.clear();
    if (this.hp >= this.maxHp) return;
    const w = 40;
    const frac = Math.max(0, this.hp / this.maxHp);
    this.hpBar.fillStyle(0x000000, 0.6);
    this.hpBar.fillRect(-w / 2 - 1, -30, w + 2, 5);
    this.hpBar.fillStyle(frac > 0.5 ? 0x66ff66 : frac > 0.25 ? 0xffaa33 : 0xff4444, 1);
    this.hpBar.fillRect(-w / 2, -29, w * frac, 3);
  }

  private emitShatter(): void {
    const color = this.option?.color ?? 0xbfb4a0;
    for (let i = 0; i < 10; i++) {
      const p = this.scene.add.sprite(this.x, this.y, 'barrel_chunk');
      p.setTint(color);
      p.setScale(1.5 + Math.random());
      p.setRotation(Math.random() * Math.PI * 2);
      p.setDepth(5);
      const angle = Math.random() * Math.PI * 2;
      const dist = 20 + Math.random() * 40;
      this.scene.tweens.add({
        targets: p,
        x: this.x + Math.cos(angle) * dist,
        y: this.y + Math.sin(angle) * dist,
        alpha: 0,
        rotation: p.rotation + (Math.random() - 0.5) * 4,
        duration: 350 + Math.random() * 200,
        ease: 'Quad.easeOut',
        onComplete: () => p.destroy(),
      });
    }
  }
}

