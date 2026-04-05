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
// IsoHelper available for future isometric rendering enhancements
import { InputHandler } from '@/systems/InputHandler';
import { WaveSpawner } from '@/systems/WaveSpawner';
import { pickGatePair } from '@/systems/GateSpawner';
import { computeFormation } from '@/entities/Army';
import { PlayerUnit } from '@/entities/PlayerUnit';
import { Bullet } from '@/entities/Bullet';
import { Enemy } from '@/entities/Enemy';
import { Gate } from '@/entities/Gate';
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

  // Gate tracking
  private nextGateDistance: number = GATE_INTERVAL;

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
    this.killStreak = 0;
    this.lastKillTime = 0;
    this.nextGateDistance = GATE_INTERVAL;

    this.input_handler = new InputHandler(this);
    this.waveSpawner = new WaveSpawner();

    // Create entity pools
    this.units = [];
    for (let i = 0; i < 200; i++) {
      this.units.push(new PlayerUnit(this));
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
        gate.spawn(200, pair.left, pair.right); // spawn at top area
        gate.setPosition(GAME_WIDTH / 2, 200);
      }
      this.nextGateDistance += GATE_INTERVAL;
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
    }

    // 6. Update enemies — move toward army
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;

      // Move toward player army Y position
      const reachedArmy = enemy.updateMovement(delta, armyScreenY);

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

    // 7. Update gates — check if army passes through
    for (const gate of this.gates) {
      if (!gate.active || gate.passed) continue;

      // Gates scroll down as army advances
      gate.y += MARCH_SPEED * dt;

      const result = gate.checkPass(this.armyX, armyScreenY);
      if (result) {
        this.unitCount = result.apply(this.unitCount);
        this.unitCount = Math.max(1, this.unitCount); // never go to 0 from gate
        gate.despawn();
        this.respawnArmy();
        continue;
      }

      // Remove gates that scroll off the bottom
      if (gate.y > GAME_HEIGHT + 100) {
        gate.despawn();
      }
    }

    // 8. Fire bullets from units (straight up)
    for (const unit of this.units) {
      if (!unit.active) continue;
      if (unit.updateFiring(delta)) {
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
    const positions = computeFormation(this.unitCount, armyScreenX, armyScreenY);

    if (this.unitCount !== this.activeUnitCount) {
      // Unit count changed — full respawn
      for (const unit of this.units) {
        unit.despawn();
      }
      for (let i = 0; i < positions.length && i < this.units.length; i++) {
        this.units[i].spawn(positions[i].x, positions[i].y);
      }
      this.activeUnitCount = this.unitCount;
    } else {
      // Just reposition without resetting fire timers
      for (let i = 0; i < positions.length && i < this.units.length; i++) {
        this.units[i].moveTo(positions[i].x, positions[i].y);
      }
    }
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
      });
    });
  }
}
