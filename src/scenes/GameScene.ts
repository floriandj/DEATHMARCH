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

    // Start HUD
    this.scene.launch('HUDScene');
    this.hud = this.scene.get('HUDScene') as HUDScene;

    // Spawn initial army
    this.respawnArmy();
  }

  update(_time: number, delta: number): void {
    // 1. Advance distance
    const dt = delta / 1000;
    this.distance += MARCH_SPEED * dt;
    this.score += MARCH_SPEED * dt * SCORE_PER_METER;

    // 2. Update army position from input
    const normalized = this.input_handler.getNormalized(GAME_WIDTH / 2);
    this.armyX = normalized * (FIELD_WIDTH / 2);
    this.respawnArmy();

    // 2b. Unit physics — smooth movement + separation
    for (const unit of this.units) {
      unit.updatePhysics(delta, this.units);
    }

    // 3. Spawn enemies
    const spawnCommands = this.waveSpawner.update(this.distance);
    for (const cmd of spawnCommands) {
      const enemy = this.enemies.find((e) => !e.active);
      if (enemy) {
        const stats = ENEMY_STATS[cmd.type];
        // Spawn at top of screen, spread across field width
        const screenX = GAME_WIDTH / 2 + cmd.x;
        enemy.spawn(screenX, -20, stats);
      }
    }

    // 4. Spawn gates
    if (this.distance >= this.nextGateDistance && this.distance < BOSS_TRIGGER_DISTANCE) {
      const pair = pickGatePair(this.distance);
      const gate = this.gates.find((g) => !g.active);
      if (gate) {
        gate.spawn(-80, pair.left, pair.right); // spawn above viewport
        gate.setPosition(GAME_WIDTH / 2, -80);
      }
      this.nextGateDistance += GATE_INTERVAL;
    }

    // 4b. Spawn weapon crates
    if (this.distance >= this.nextCrateDistance && this.distance < BOSS_TRIGGER_DISTANCE) {
      const crate = this.crates.find((c) => !c.active);
      if (crate) {
        const crateX = GAME_WIDTH / 2 + (Math.random() - 0.5) * FIELD_WIDTH * 0.6;
        crate.spawn(crateX, -60, this.currentWeapon);
      }
      this.nextCrateDistance += CRATE_INTERVAL;
    }

    // 4c. Update weapon crates
    for (const crate of this.crates) {
      if (!crate.active) continue;
      crate.updateMovement(delta);
      if (crate.y > GAME_HEIGHT + 60) {
        crate.despawn(); // missed it
      }
    }

    // 5. Update bullets
    const armyScreenY = GAME_HEIGHT - 200;
    for (const bullet of this.bullets) {
      if (!bullet.active) continue;
      bullet.updateMovement(delta);

      // Off-screen check
      if (bullet.y < -50 || bullet.y > GAME_HEIGHT + 50 || bullet.x < -50 || bullet.x > GAME_WIDTH + 50) {
        bullet.despawn();
        continue;
      }

      // Hit check against enemies
      for (const enemy of this.enemies) {
        if (!enemy.active) continue;
        const dx = bullet.x - enemy.x;
        const dy = bullet.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < enemy.displayWidth / 2 + 5) {
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

      // Hit check against weapon crates
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

    // 6. Update enemies — move toward nearest unit
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;

      // Find nearest active unit
      let nearestX = GAME_WIDTH / 2 + this.armyX;
      let nearestY = armyScreenY;
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

      const reachedArmy = enemy.updateMovement(delta, nearestX, nearestY);

      if (reachedArmy) {
        // Enemy contacts army — kill units
        this.unitCount = Math.max(0, this.unitCount - enemy.contactDamage);

        // Splash damage
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

    // 7. Update gates — check if a front unit touches a gate
    for (const gate of this.gates) {
      if (!gate.active || gate.passed) continue;

      // Gates scroll down as army advances
      gate.y += MARCH_SPEED * dt;

      // Check if any active unit touches this gate
      let hitUnit: PlayerUnit | null = null;
      for (const unit of this.units) {
        if (!unit.active) continue;
        if (Math.abs(unit.y - gate.y) < 20) {
          hitUnit = unit;
          break;
        }
      }

      if (hitUnit) {
        // Determine left or right based on the unit's X relative to gate center
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

      // Remove gates that scroll off the bottom
      if (gate.y > GAME_HEIGHT + 100) {
        gate.despawn();
      }
    }

    // 8. Fire bullets from units (straight up, weapon fire rate)
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

    // 9. Check boss trigger
    if (this.distance >= BOSS_TRIGGER_DISTANCE) {
      // Check if all remaining enemies are dead
      const activeEnemies = this.enemies.filter((e) => e.active).length;
      if (activeEnemies === 0) {
        this.transitionToBoss();
        return;
      }
    }

    // 10. Update HUD
    this.hud.score = Math.floor(this.score);
    this.hud.distance = this.distance;
    this.hud.unitCount = this.unitCount;
    this.hud.killStreak = this.killStreak;

    // 11. Depth sort all visible sprites
    this.children.sort('y', (a: any, b: any) => (a.y || 0) - (b.y || 0));
  }

  /** Reposition army. Only despawn/spawn when unit count changes. */
  private respawnArmy(): void {
    const armyScreenX = GAME_WIDTH / 2 + this.armyX;
    const armyScreenY = GAME_HEIGHT - 200;

    if (this.unitCount !== this.activeUnitCount) {
      // Unit count changed — full respawn, scatter around center
      for (const unit of this.units) {
        unit.despawn();
      }
      for (let i = 0; i < this.unitCount && i < this.units.length; i++) {
        // Spawn scattered around center so physics has room to work
        const angle = (i / this.unitCount) * Math.PI * 2;
        const radius = 10 + Math.random() * 30;
        this.units[i].spawn(
          armyScreenX + Math.cos(angle) * radius,
          armyScreenY + Math.sin(angle) * radius,
        );
      }
      this.activeUnitCount = this.unitCount;
    }

    // Always update targets to army center — physics spreads them out
    for (const unit of this.units) {
      if (!unit.active) continue;
      unit.moveTo(armyScreenX, armyScreenY);
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
