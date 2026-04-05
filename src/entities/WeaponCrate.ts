import Phaser from 'phaser';
import { MARCH_SPEED } from '@/config/GameConfig';
import { WeaponType, WEAPON_STATS, getNextWeapon, CRATE_HP } from '@/config/WeaponConfig';

export class WeaponCrate extends Phaser.GameObjects.Container {
  active: boolean = false;
  private hp: number = 0;
  private maxHp: number = 0;
  private containsWeapon: WeaponType | null = null;

  private box: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private hpBar: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    scene.add.existing(this);

    this.box = scene.add.rectangle(0, 0, 50, 50, 0xffd43b);
    this.box.setStrokeStyle(3, 0xffffff);

    this.label = scene.add.text(0, 0, '?', {
      fontSize: '18px',
      color: '#000000',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.hpBar = scene.add.graphics();

    this.add([this.box, this.label, this.hpBar]);
    this.setVisible(false);
    this.setActive(false);
  }

  spawn(x: number, y: number, currentWeapon: WeaponType): boolean {
    const next = getNextWeapon(currentWeapon);
    if (!next) return false; // already max weapon

    this.containsWeapon = next;
    this.maxHp = CRATE_HP[currentWeapon];
    this.hp = this.maxHp;

    const stats = WEAPON_STATS[next];
    this.label.setText(stats.name);
    this.box.setFillStyle(stats.bulletColor);

    this.setPosition(x, y);
    this.setVisible(true);
    this.setActive(true);
    return true;
  }

  updateMovement(delta: number): void {
    if (!this.active) return;
    this.y += MARCH_SPEED * (delta / 1000);
  }

  takeDamage(amount: number): WeaponType | null {
    if (!this.active) return null;
    this.hp -= amount;

    // Flash white on hit
    this.box.setStrokeStyle(3, 0xffffff);
    this.scene.time.delayedCall(50, () => {
      if (this.active) this.box.setStrokeStyle(3, 0x888888);
    });

    // Update HP bar
    this.hpBar.clear();
    this.hpBar.fillStyle(0x51cf66, 1);
    const barWidth = 44 * (this.hp / this.maxHp);
    this.hpBar.fillRect(-22, 30, barWidth, 4);

    if (this.hp <= 0) {
      const weapon = this.containsWeapon;
      this.despawn();
      return weapon;
    }
    return null;
  }

  despawn(): void {
    this.setVisible(false);
    this.setActive(false);
    this.hpBar.clear();
  }
}
