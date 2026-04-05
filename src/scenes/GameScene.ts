// src/scenes/GameScene.ts
import Phaser from 'phaser';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  STARTING_UNITS,
  MARCH_SPEED,
  FIELD_WIDTH,
  BULLET_POOL_SIZE,
  ENEMY_POOL_SIZE,
  GATE_INTERVAL,
  BOSS_TRIGGER_DISTANCE,
  SCORE_PER_METER,
} from '@/config/GameConfig';
import { ENEMY_STATS } from '@/config/EnemyConfig';
import { WeaponType, WEAPON_STATS, WEAPON_ORDER, CRATE_INTERVAL } from '@/config/WeaponConfig';
import { InputHandler } from '@/systems/InputHandler';
import { WaveSpawner } from '@/systems/WaveSpawner';
import { pickGatePair } from '@/systems/GateSpawner';
import { PlayerUnit } from '@/entities/PlayerUnit';
import { Bullet } from '@/entities/Bullet';
import { Enemy } from '@/entities/Enemy';
import { Gate } from '@/entities/Gate';
import { WeaponCrate } from '@/entities/WeaponCrate';
import { HUDScene } from '@/scenes/HUDScene';

export class GameScene extends Phaser.Scene {
  private input_handler!: InputHandler;
  private waveSpawner!: WaveSpawner;
  private hud!: HUDScene;

  // Game state
  private armyX: number = 0; // game-world X of army center
  private armyWorldY: number = 0; // world Y position (decreases as army marches up)
  private distance: number = 0;
  private score: number = 0;
  private unitCount: number = STARTING_UNITS;
  private killStreak: number = 0;
  private lastKillTime: number = 0;

  // Entity arrays
  private units: PlayerUnit[] = [];
  private bullets: Bullet[] = [];
  private enemies: Enemy[] = [];
  private gates: Gate[] = [];
  private crates: WeaponCrate[] = [];

  // Gate tracking
  private nextGateDistance: number = GATE_INTERVAL;

  // Weapon system
  private currentWeapon: WeaponType = 'pistol';
  private nextCrateDistance: number = CRATE_INTERVAL;

  // Track active unit count to know when to respawn vs reposition
  private activeUnitCount: number = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.armyX = 0;
    this.distance = 0;
    this.score = 0;
    this.unitCount = STARTING_UNITS;
    this.activeUnitCount = 0;
    this.killStreak = 0;
    this.lastKillTime = 0;
    this.nextGateDistance = GATE_INTERVAL;
    this.currentWeapon = 'pistol';
    this.nextCrateDistance = CRATE_INTERVAL;

    this.input_handler = new InputHandler(this);
    this.waveSpawner = new WaveSpawner();

    // Create entity pools
    this.units = [];
    for (let i = 0; i < 200; i++) {
      this.units.push(new PlayerUnit(this, i));
    }

    this.bullets = [];
    for (let i = 0; i < BULLET_POOL_SIZE; i++) {
      this.bullets.push(new Bullet(this));
    }

    this.enemies = [];
    for (let i = 0; i < ENEMY_POOL_SIZE; i++) {
      this.enemies.push(new Enemy(this));
    }

    this.gates = [];
    for (let i = 0; i < 5; i++) {
      this.gates.push(new Gate(this));
    }

    this.crates = [];
    for (let i = 0; i < 3; i++) {
      this.crates.push(new WeaponCrate(this));
    }

    // World setup
    this.armyWorldY = 0;
    this.cameras.main.setBounds(-Infinity, -Infinity, Infinity, Infinity);

    // Start HUD
    this.scene.launch('HUDScene');
    this.hud = this.scene.get('HUDScene') as HUDScene;

    // Spawn initial army
    this.respawnArmy();
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000;
    const AGGRO_RANGE = 500; // enemies start moving when army is this close

    // 1. Army marches upward in world space
    this.distance += MARCH_SPEED * dt;
    this.score += MARCH_SPEED * dt * SCORE_PER_METER;
    this.armyWorldY -= MARCH_SPEED * dt;

    // 2. Camera follows army (army stays 200px from bottom)
    this.cameras.main.scrollY = this.armyWorldY - GAME_HEIGHT + 200;

    // 3. Update army X from input
    const normalized = this.input_handler.getNormalized(GAME_WIDTH / 2);
    this.armyX = normalized * (FIELD_WIDTH / 2);
    this.respawnArmy();

    // 3b. Unit physics
    for (const unit of this.units) {
      unit.updatePhysics(delta, this.units);
    }

    // 4. Spawn enemies ahead of army in world space (static until aggro)
    const spawnCommands = this.waveSpawner.update(this.distance);
    for (const cmd of spawnCommands) {
      const enemy = this.enemies.find((e) => !e.active);
      if (enemy) {
        const stats = ENEMY_STATS[cmd.type];
        const worldX = GAME_WIDTH / 2 + cmd.x;
        const worldY = this.armyWorldY - GAME_HEIGHT - 100; // ahead of camera
        enemy.spawn(worldX, worldY, stats);
      }
    }

    // 5. Spawn gates in world space (static — army walks through them)
    if (this.distance >= this.nextGateDistance && this.distance < BOSS_TRIGGER_DISTANCE) {
      const pair = pickGatePair(this.distance);
      const gate = this.gates.find((g) => !g.active);
      if (gate) {
        const gateWorldY = this.armyWorldY - GAME_HEIGHT - 50;
        gate.spawn(gateWorldY, pair.left, pair.right);
        gate.setPosition(GAME_WIDTH / 2, gateWorldY);
      }
      this.nextGateDistance += GATE_INTERVAL;
    }

    // 5b. Spawn weapon crates in world space (static)
    if (this.distance >= this.nextCrateDistance && this.distance < BOSS_TRIGGER_DISTANCE) {
      const crate = this.crates.find((c) => !c.active);
      if (crate) {
        const crateX = GAME_WIDTH / 2 + (Math.random() - 0.5) * FIELD_WIDTH * 0.6;
        const crateY = this.armyWorldY - GAME_HEIGHT - 50;
        crate.spawn(crateX, crateY, this.currentWeapon);
      }
      this.nextCrateDistance += CRATE_INTERVAL;
    }

    // 5c. Despawn crates army has passed
    for (const crate of this.crates) {
      if (!crate.active) continue;
      if (crate.y > this.armyWorldY + 200) {
        crate.despawn();
      }
    }

    // 6. Update bullets (world space)
    const camTop = this.cameras.main.scrollY;
    const camBottom = camTop + GAME_HEIGHT;
    for (const bullet of this.bullets) {
      if (!bullet.active) continue;
      bullet.updateMovement(delta);

      // Off-screen check (world space)
      if (bullet.y < camTop - 100 || bullet.y > camBottom + 100) {
        bullet.despawn();
        continue;
      }

      // Hit enemies
      for (const enemy of this.enemies) {
        if (!enemy.active) continue;
        const dx = bullet.x - enemy.x;
        const dy = bullet.y - enemy.y;
        if (Math.sqrt(dx * dx + dy * dy) < enemy.displayWidth / 2 + 5) {
          bullet.despawn();
          const killed = enemy.takeDamage(bullet.damage);
          if (killed) {
            this.score += enemy.scoreValue;
            const now = this.time.now;
            if (now - this.lastKillTime < 2000) {
              this.killStreak++;
            } else {
              this.killStreak = 1;
            }
            this.lastKillTime = now;
          }
          break;
        }
      }

      // Hit weapon crates
      if (bullet.active) {
        for (const crate of this.crates) {
          if (!crate.active) continue;
          const cx = bullet.x - crate.x;
          const cy = bullet.y - crate.y;
          if (Math.sqrt(cx * cx + cy * cy) < 30) {
            bullet.despawn();
            const newWeapon = crate.takeDamage(bullet.damage);
            if (newWeapon) {
              this.currentWeapon = newWeapon;
              this.showWeaponUpgrade(crate.x, crate.y, newWeapon);
            }
            break;
          }
        }
      }
    }

    // 7. Update enemies — idle until army is close, then aggro
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;

      const distToArmy = Math.abs(enemy.y - this.armyWorldY);

      // Despawn if army passed it
      if (enemy.y > this.armyWorldY + 200) {
        enemy.despawn();
        continue;
      }

      // Only move when army is within aggro range
      if (distToArmy < AGGRO_RANGE) {
        let nearestX = GAME_WIDTH / 2 + this.armyX;
        let nearestY = this.armyWorldY;
        let nearestDist = Infinity;
        for (const unit of this.units) {
          if (!unit.active) continue;
          const dx = unit.x - enemy.x;
          const dy = unit.y - enemy.y;
          const d = dx * dx + dy * dy;
          if (d < nearestDist) {
            nearestDist = d;
            nearestX = unit.x;
            nearestY = unit.y;
          }
        }

        const reached = enemy.updateMovement(delta, nearestX, nearestY);
        if (reached) {
          this.unitCount = Math.max(0, this.unitCount - enemy.contactDamage);
          if (enemy.splashRadius > 0) {
            this.unitCount = Math.max(0, this.unitCount - enemy.splashDamage);
          }
          enemy.despawn();
          if (this.unitCount <= 0) {
            this.gameOver();
            return;
          }
          this.respawnArmy();
        }
      }
    }

    // 8. Gates — static, check if unit walks into them
    for (const gate of this.gates) {
      if (!gate.active || gate.passed) continue;

      let hitUnit: PlayerUnit | null = null;
      for (const unit of this.units) {
        if (!unit.active) continue;
        if (Math.abs(unit.y - gate.y) < 20) {
          hitUnit = unit;
          break;
        }
      }

      if (hitUnit) {
        const unitRelativeX = hitUnit.x - gate.x;
        const result = gate.checkPassByX(unitRelativeX);
        if (result) {
          const oldCount = this.unitCount;
          this.unitCount = result.apply(this.unitCount);
          this.unitCount = Math.max(1, this.unitCount);
          this.showGateEffect(hitUnit.x, gate.y, result.label, this.unitCount > oldCount);
          gate.despawn();
          this.respawnArmy();
          continue;
        }
      }

      // Despawn gates army has passed
      if (gate.y > this.armyWorldY + 200) {
        gate.despawn();
      }
    }

    // 9. Fire bullets (weapon fire rate)
    const weaponStats = WEAPON_STATS[this.currentWeapon];
    for (const unit of this.units) {
      if (!unit.active) continue;
      if (unit.updateFiring(delta, weaponStats.fireRate)) {
        const bullet = this.bullets.find((b) => !b.active);
        if (bullet) {
          bullet.fire(unit.x, unit.y);
        }
      }
    }

    // 10. Check boss trigger
    if (this.distance >= BOSS_TRIGGER_DISTANCE) {
      const activeEnemies = this.enemies.filter((e) => e.active).length;
      if (activeEnemies === 0) {
        this.transitionToBoss();
        return;
      }
    }

    // 11. Update HUD
    this.hud.score = Math.floor(this.score);
    this.hud.distance = this.distance;
    this.hud.unitCount = this.unitCount;
    this.hud.killStreak = this.killStreak;
  }

  /** Reposition army in world space. */
  private respawnArmy(): void {
    const armyCenterX = GAME_WIDTH / 2 + this.armyX;
    const armyCenterY = this.armyWorldY;

    if (this.unitCount !== this.activeUnitCount) {
      for (const unit of this.units) {
        unit.despawn();
      }
      for (let i = 0; i < this.unitCount && i < this.units.length; i++) {
        const angle = (i / this.unitCount) * Math.PI * 2;
        const radius = 10 + Math.random() * 30;
        this.units[i].spawn(
          armyCenterX + Math.cos(angle) * radius,
          armyCenterY + Math.sin(angle) * radius,
        );
      }
      this.activeUnitCount = this.unitCount;
    }

    for (const unit of this.units) {
      if (!unit.active) continue;
      unit.moveTo(armyCenterX, armyCenterY);
    }
  }

  private showGateEffect(x: number, y: number, label: string, isPositive: boolean): void {
    const color = isPositive ? '#51cf66' : '#ff6b6b';
    const text = this.add.text(x, y, label + '!', {
      fontSize: '48px',
      color,
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: text,
      y: y - 150,
      alpha: 0,
      scale: 1.5,
      duration: 800,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });

    // Flash the screen briefly
    if (isPositive) {
      this.cameras.main.flash(200, 81, 207, 102, true); // green flash
    } else {
      this.cameras.main.flash(200, 255, 107, 107, true); // red flash
    }
  }

  private showWeaponUpgrade(x: number, y: number, weapon: WeaponType): void {
    const stats = WEAPON_STATS[weapon];
    const text = this.add.text(x, y, stats.name + '!', {
      fontSize: '40px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: text,
      y: y - 180,
      alpha: 0,
      scale: 1.8,
      duration: 1200,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });

    this.cameras.main.flash(300, 255, 255, 255, true);
    this.cameras.main.shake(200, 0.015);
  }

  private gameOver(): void {
    this.input_handler.destroy();
    this.scene.stop('HUDScene');
    this.scene.start('GameOverScene', {
      score: Math.floor(this.score),
      distance: Math.floor(this.distance),
      bossDefeated: false,
    });
  }

  private transitionToBoss(): void {
    // Screen shake for dramatic effect
    this.cameras.main.shake(500, 0.01);

    this.time.delayedCall(600, () => {
      this.scene.stop('HUDScene');
      this.scene.start('BossScene', {
        score: Math.floor(this.score),
        distance: Math.floor(this.distance),
        unitCount: this.unitCount,
        weapon: this.currentWeapon,
      });
    });
  }
}
