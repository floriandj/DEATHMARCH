import Phaser from 'phaser';
import { EnemyStats } from '@/config/EnemyConfig';
import { ENTITY_SCALE, SVG_RENDER_SCALE } from '@/config/GameConfig';
import { getSpriteForType, getTintForType } from '@/systems/ProceduralEnemy';

export class Enemy extends Phaser.GameObjects.Sprite {
  levelIndex: number = 0;
  active: boolean = false;
  hp: number = 0;
  maxHp: number = 0;
  speed: number = 0;
  contactDamage: number = 0;
  splashRadius: number = 0;
  splashDamage: number = 0;
  scoreValue: number = 0;
  enemyType: string = '';
  isElite: boolean = false;
  private enemyColor: number = 0xff6b6b;

  // Behavior trait state
  private zigzagTimer: number = 0;
  private zigzagDir: number = 1;
  private dashTimer: number = 0;
  private isDashing: boolean = false;
  private shieldHp: number = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'enemy_goblin');
    scene.add.existing(this);
    this.setVisible(false);
    this.setActive(false);
  }

  spawn(x: number, y: number, stats: EnemyStats, elite: boolean = false): void {
    this.setPosition(x, y);
    this.setVisible(true);
    this.setActive(true);
    this.isElite = elite;
    const baseHp = elite ? Math.ceil(stats.hp * 2.5) : stats.hp;
    this.hp = baseHp;
    this.maxHp = baseHp;
    this.speed = stats.speed;
    this.contactDamage = stats.contactDamage;
    this.splashRadius = stats.splashRadius;
    this.splashDamage = stats.splashDamage;
    this.scoreValue = elite ? stats.scoreValue * 3 : stats.scoreValue;
    this.enemyType = stats.type;
    this.enemyColor = stats.color;
    this.setAlpha(1);
    const baseScale = ENTITY_SCALE / SVG_RENDER_SCALE;
    this.setScale(elite ? baseScale * 1.3 : baseScale);

    // Reset trait state
    this.zigzagTimer = Math.random() * 1000;
    this.zigzagDir = Math.random() > 0.5 ? 1 : -1;
    this.dashTimer = 1500 + Math.random() * 1000;
    this.isDashing = false;
    this.shieldHp = this.isShielded() ? Math.ceil(stats.hp * 0.3) : 0;

    // Set texture: procedural enemies reuse SVG sprites with color tint
    if (stats.type.startsWith('proc_')) {
      const spriteBase = getSpriteForType(stats.type, this.levelIndex);
      const texKey = `enemy_${spriteBase}`;
      const tint = getTintForType(stats.type, this.levelIndex);
      if (this.scene.textures.exists(texKey)) {
        this.setTexture(texKey);
        this.setTint(tint);
        const animKey = `enemy_${spriteBase}_walk`;
        if (this.scene.anims.exists(animKey)) this.play(animKey);
      }
    } else {
      const texKey = `enemy_${stats.type}`;
      if (this.scene.textures.exists(texKey)) {
        this.setTexture(texKey);
        this.clearTint();
        const animKey = `enemy_${stats.type}_walk`;
        if (this.scene.anims.exists(animKey)) this.play(animKey);
      }
    }

    // Elite visual: gold tint override
    if (elite) {
      this.setTint(0xffd700);
    }
  }

  updateMovement(delta: number, targetX: number, targetY: number, armyWorldY: number): boolean {
    if (!this.active) return false;
    const dt = delta / 1000;
    let dx = targetX - this.x;
    let dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 10 * ENTITY_SCALE) return true;

    const behindLine = this.y > armyWorldY;
    let currentSpeed = behindLine ? this.speed * 2.5 : this.speed;

    // Zigzag trait — oscillate perpendicular to movement direction
    if (this.isZigzag()) {
      this.zigzagTimer += delta;
      if (this.zigzagTimer > 400) {
        this.zigzagTimer = 0;
        this.zigzagDir *= -1;
      }
      // Perpendicular offset
      const perpX = -dy / dist;
      dx += perpX * this.zigzagDir * 60;
      const newDist = Math.sqrt(dx * dx + dy * dy);
      dx = dx / newDist * dist;
      dy = dy / newDist * dist;
    }

    // Dasher trait — periodic burst of speed
    if (this.isDasherType()) {
      this.dashTimer -= delta;
      if (this.dashTimer <= 0) {
        this.isDashing = true;
        this.dashTimer = 2000 + Math.random() * 1000;
      }
      if (this.isDashing) {
        currentSpeed *= 3;
        this.dashTimer += delta * 3; // dash lasts ~300ms
        if (this.dashTimer > 300) {
          this.isDashing = false;
        }
      }
    }

    this.x += (dx / dist) * currentSpeed * dt;
    this.y += (dy / dist) * currentSpeed * dt;
    return false;
  }

  takeDamage(amount: number): boolean {
    // Shielded enemies absorb initial damage
    if (this.shieldHp > 0) {
      this.shieldHp -= amount;
      this.setTint(0x4444ff);
      this.scene.time.delayedCall(50, () => {
        if (this.active) this.clearTint();
      });
      if (this.shieldHp > 0) return false;
      // Shield broken — remaining damage applies
      amount = -this.shieldHp;
      this.shieldHp = 0;
    }

    this.hp -= amount;
    if (this.hp <= 0) {
      this.playDeathEffect();

      // Splitter trait — spawn 2 smaller enemies (simulated via particles)
      if (this.isSplitter()) {
        this.spawnSplitlings();
      }

      this.despawn();
      return true;
    }
    this.setTint(0xffffff);
    this.scene.time.delayedCall(50, () => {
      if (this.active) this.clearTint();
    });
    return false;
  }

  // ── Trait checks (based on enemy type name) ──
  private isZigzag(): boolean { return this.enemyType.includes('zigzag') || this.enemyType.includes('stalker') || this.enemyType.includes('wisp'); }
  private isDasherType(): boolean { return this.enemyType.includes('dash') || this.enemyType.includes('charger') || this.enemyType.includes('runner'); }
  private isShielded(): boolean { return this.enemyType.includes('shield') || this.enemyType.includes('golem') || this.enemyType.includes('iron'); }
  private isSplitter(): boolean { return this.enemyType.includes('split') || this.enemyType.includes('swarm') || this.enemyType.includes('slime'); }

  private spawnSplitlings(): void {
    for (let i = 0; i < 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const p = this.scene.add.sprite(this.x, this.y, 'death_particle');
      p.setTint(this.enemyColor);
      p.setScale(1.5);
      this.scene.tweens.add({
        targets: p,
        x: this.x + Math.cos(angle) * 30,
        y: this.y + Math.sin(angle) * 30,
        alpha: 0,
        duration: 400,
        onComplete: () => p.destroy(),
      });
    }
  }

  private playDeathEffect(): void {
    const x = this.x;
    const y = this.y;
    const color = this.enemyColor;
    const count = 6;

    for (let i = 0; i < count; i++) {
      const p = this.scene.add.sprite(x, y, 'death_particle');
      p.setTint(color);
      p.setAlpha(1);
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 20 + Math.random() * 25;
      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: 250 + Math.random() * 150,
        onComplete: () => p.destroy(),
      });
    }
  }

  despawn(): void {
    this.stop();
    this.setVisible(false);
    this.setActive(false);
  }
}
