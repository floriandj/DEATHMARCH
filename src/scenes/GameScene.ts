// src/scenes/GameScene.ts
import Phaser from 'phaser';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  FIELD_WIDTH,
  BULLET_POOL_SIZE,
  ENEMY_POOL_SIZE,
  ARMY_INPUT_Y_RANGE,
  ARMY_Y_OFFSET_MAX,
  ARMY_LATERAL_SPEED,
  ARMY_VERTICAL_SPEED,
  SVG_RENDER_SCALE,
} from '@/config/GameConfig';
import { LevelManager, hexToNum } from '@/config/progression';
import { Background } from '@/systems/Background';
import { InputHandler } from '@/systems/InputHandler';
import { WaveSpawner } from '@/systems/WaveSpawner';
import { pickGatePair } from '@/systems/GateSpawner';
import { PlayerUnit } from '@/entities/PlayerUnit';
import { BulletPool } from '@/systems/BulletPool';
import { Enemy } from '@/entities/Enemy';
import { Gate } from '@/entities/Gate';
import { WeaponCrate } from '@/entities/WeaponCrate';
import { HUDScene } from '@/scenes/HUDScene';
import { SoundManager } from '@/systems/SoundManager';
import { WalletManager } from '@/systems/WalletManager';
import { PerkManager } from '@/systems/PerkManager';

export class GameScene extends Phaser.Scene {
  private input_handler!: InputHandler;
  private waveSpawner!: WaveSpawner;
  private background!: Background;
  private hud!: HUDScene;

  // Game state
  private armyX: number = 0; // game-world X of army center
  private armyWorldY: number = 0; // world Y position (decreases as army marches up)
  private armyYOffset: number = 0; // player-controlled forward/back nudge
  private distance: number = 0;
  private score: number = 0;
  private unitCount: number = 1;
  private killStreak: number = 0;
  private lastKillTime: number = 0;

  // Entity arrays
  private units: PlayerUnit[] = [];
  private bullets!: BulletPool;
  private enemies: Enemy[] = [];
  private gates: Gate[] = [];
  private crates: WeaponCrate[] = [];

  // Gate tracking
  private nextGateDistance: number = 500;

  // Weapon system
  private currentWeapon: string = 'pistol';
  private crateSpawned: boolean = false; // one crate per weapon tier

  // Track active unit count to know when to respawn vs reposition
  private activeUnitCount: number = 0;
  private shootSoundTimer: number = 0;
  private dmgNumberTimer: number = 0;
  private dmgNumberAccum: number = 0;

  // Boss trigger — fires when all enemies dead after spawning is complete
  private spawningComplete: boolean = false;

  // Gold
  private levelGold: number = 0;
  private pouchGold: number = 0;
  private nextPouchDistance: number = 300;
  private goldPouches: Phaser.GameObjects.Sprite[] = [];

  // Perk / orb state
  private nextRegenDistance: number = 0;
  private furyTimer: number = 0; // temporary 2x fire rate from elite orb
  private curseSlowTimer: number = 0; // temporary 0.5x fire rate from curse orb
  private curseBlindOverlay: Phaser.GameObjects.Graphics | null = null;
  private curseBlindTimer: number = 0;
  private powerOrbs: Phaser.GameObjects.Container[] = [];

  // Shadow visuals
  private unitShadows: Phaser.GameObjects.Image[] = [];
  private enemyShadows: Map<Enemy, Phaser.GameObjects.Image> = new Map();

  // Enemy health bars
  private enemyHpBars!: Phaser.GameObjects.Graphics;

  // Quirky perk effect timers
  private berserkerCryTimer: number = 0;
  private glassCannonPulseTimer: number = 0;
  private lastStandGrown: boolean = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    const level = LevelManager.instance.current;

    this.armyX = 0;
    this.distance = 0;
    this.score = 0;
    // Consume single-use boosts from shop + perk bonuses
    const boosts = WalletManager.consumeBoosts();
    const perks = PerkManager.instance;
    perks.resetLevel();
    this.unitCount = level.startingUnits + boosts.extraUnits + perks.extraStartingUnits;
    this.activeUnitCount = 0;
    this.killStreak = 0;
    this.lastKillTime = 0;
    this.nextGateDistance = level.gates.interval;

    // Apply weapon tier boost
    const weaponTier = Math.min(boosts.weaponTier, level.weaponOrder.length - 1);
    this.currentWeapon = level.weaponOrder[weaponTier];
    this.crateSpawned = false;
    this.shootSoundTimer = 0;

    this.spawningComplete = false;

    // Gold tracking
    this.levelGold = 0;
    this.pouchGold = 0;
    this.nextPouchDistance = 200 + Math.random() * 200;
    this.goldPouches = [];

    // Perk / orb state
    this.nextRegenDistance = perks.regenDistanceInterval ?? Infinity;
    this.furyTimer = 0;
    this.curseSlowTimer = 0;
    this.curseBlindOverlay = null;
    this.curseBlindTimer = 0;
    this.powerOrbs = [];

    // Quirky perk effect timers
    this.berserkerCryTimer = 2000;
    this.glassCannonPulseTimer = 1000;
    this.lastStandGrown = false;

    SoundManager.init();
    SoundManager.play('level_start');

    this.input_handler = new InputHandler(this);
    this.waveSpawner = new WaveSpawner();
    this.background = new Background(this);

    // Create entity pools
    this.units = [];
    for (let i = 0; i < 200; i++) {
      this.units.push(new PlayerUnit(this, i));
    }

    this.bullets = new BulletPool(this, BULLET_POOL_SIZE);

    this.enemies = [];
    const currentLevelIdx = LevelManager.instance.currentLevelIndex;
    for (let i = 0; i < ENEMY_POOL_SIZE; i++) {
      const e = new Enemy(this);
      e.levelIndex = currentLevelIdx;
      this.enemies.push(e);
    }

    this.gates = [];
    for (let i = 0; i < 5; i++) {
      this.gates.push(new Gate(this));
    }

    this.crates = [];
    for (let i = 0; i < 3; i++) {
      this.crates.push(new WeaponCrate(this));
    }

    // Enemy health bar overlay
    this.enemyHpBars = this.add.graphics().setDepth(12);

    // World setup
    this.armyWorldY = 0;
    this.cameras.main.setBounds(-Infinity, -Infinity, Infinity, Infinity);

    // Start HUD
    this.scene.launch('HUDScene');
    this.hud = this.scene.get('HUDScene') as HUDScene;

    // Spawn initial army
    this.respawnArmy();

    // First-play tutorial hint
    if (!localStorage.getItem('deathmarch-tutorial-seen')) {
      localStorage.setItem('deathmarch-tutorial-seen', '1');
      this.showTutorial();
    }
  }

  private showTutorial(): void {
    const overlay = this.add.graphics().setDepth(100);
    overlay.fillStyle(0x000000, 0.5);
    overlay.fillRect(0, this.armyWorldY - GAME_HEIGHT, GAME_WIDTH, GAME_HEIGHT * 2);

    const hand = this.add.text(GAME_WIDTH / 2, this.armyWorldY - 100, '\u{1F449}', {
      fontSize: '48px',
    }).setOrigin(0.5).setDepth(101);

    // Animate hand left-right
    this.tweens.add({
      targets: hand,
      x: { from: GAME_WIDTH / 2 - 80, to: GAME_WIDTH / 2 + 80 },
      duration: 800, yoyo: true, repeat: 2, ease: 'Sine.easeInOut',
    });

    const hint = this.add.text(GAME_WIDTH / 2, this.armyWorldY - 180, 'USE THE JOYSTICK\nTO GUIDE YOUR ARMY', {
      fontSize: '28px', color: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif', fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5).setDepth(101);

    const tap = this.add.text(GAME_WIDTH / 2, this.armyWorldY - 40, 'Tap anywhere to start', {
      fontSize: '16px', color: '#888888', fontFamily: 'Arial, Helvetica, sans-serif',
    }).setOrigin(0.5).setDepth(101);

    // Dismiss on tap
    this.input.once('pointerdown', () => {
      this.tweens.add({
        targets: [overlay, hand, hint, tap], alpha: 0, duration: 300,
        onComplete: () => { overlay.destroy(); hand.destroy(); hint.destroy(); tap.destroy(); },
      });
    });
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000;
    if (this.dmgNumberTimer > 0) this.dmgNumberTimer -= delta;
    const AGGRO_RANGE = 500; // enemies start moving when army is this close
    const level = LevelManager.instance.current;
    const perks = PerkManager.instance;
    const marchSpeed = level.marchSpeed * perks.marchSpeedMultiplier;

    // 1. Army marches upward in world space
    this.distance += marchSpeed * dt;
    this.score += marchSpeed * dt * level.scoring.perMeter;
    this.armyWorldY -= marchSpeed * dt;

    // 2. Camera follows army (army stays 200px from bottom)
    this.cameras.main.scrollY = this.armyWorldY - GAME_HEIGHT + 200;
    this.background.update(this.cameras.main.scrollY);

    // 3. Update army position from input (X: left/right, Y: forward/back)
    this.input_handler.update(dt);
    const normalized = this.input_handler.getNormalized(GAME_WIDTH / 2);
    this.armyX += normalized * ARMY_LATERAL_SPEED * dt;
    this.armyX = Phaser.Math.Clamp(this.armyX, -FIELD_WIDTH / 2, FIELD_WIDTH / 2);
    const normalizedY = this.input_handler.getNormalizedY(ARMY_INPUT_Y_RANGE);
    this.armyYOffset += normalizedY * ARMY_VERTICAL_SPEED * dt;
    this.armyYOffset = Phaser.Math.Clamp(this.armyYOffset, -ARMY_Y_OFFSET_MAX, ARMY_Y_OFFSET_MAX);
    this.respawnArmy();

    // 3b. Unit physics
    for (const unit of this.units) {
      unit.updatePhysics(delta, this.units);
    }

    // Update unit shadows
    for (let i = 0; i < this.units.length; i++) {
      const u = this.units[i];
      if (u.active && this.unitShadows[i]) {
        this.unitShadows[i].setPosition(u.x, u.y + 10).setVisible(true);
      } else if (this.unitShadows[i]) {
        this.unitShadows[i].setVisible(false);
      }
    }

    // 4. Spawn enemies ahead of army in world space (static until aggro)
    const spawnCommands = this.waveSpawner.update(this.distance);
    for (const cmd of spawnCommands) {
      const enemy = this.enemies.find((e) => !e.active);
      if (enemy) {
        const enemyCfg = LevelManager.instance.getEnemyStats(cmd.type);
        const worldX = GAME_WIDTH / 2 + cmd.x;
        const worldY = this.armyWorldY - GAME_HEIGHT - 100; // ahead of camera
        const isElite = Math.random() < 0.015; // 1.5% elite chance — very rare
        enemy.spawn(worldX, worldY, {
          type: enemyCfg.type as any,
          hp: enemyCfg.hp,
          speed: enemyCfg.speed,
          size: enemyCfg.size,
          contactDamage: enemyCfg.contactDamage,
          splashRadius: enemyCfg.splashRadius,
          splashDamage: enemyCfg.splashDamage,
          color: hexToNum(enemyCfg.color),
          appearsAtDistance: enemyCfg.appearsAtDistance,
          scoreValue: enemyCfg.scoreValue,
        }, isElite);
      }
    }

    // 5. Spawn gates in world space (static — army walks through them)
    if (this.distance >= this.nextGateDistance && this.distance < level.boss.triggerDistance) {
      const pair = pickGatePair(this.distance);
      const gate = this.gates.find((g) => !g.active);
      if (gate) {
        const gateWorldY = this.armyWorldY - GAME_HEIGHT - 50;
        gate.spawn(gateWorldY, pair.left, pair.right);
        gate.setPosition(GAME_WIDTH / 2, gateWorldY);
      }
      this.nextGateDistance += level.gates.interval;
    }

    // 5b. Spawn weapon crate (one per tier, at fixed distance)
    // Crates are delayed if a gate is too close to prevent visual overlap
    const crateCfg = LevelManager.instance.getCrateForWeapon(this.currentWeapon);
    if (!this.crateSpawned && crateCfg && this.distance >= crateCfg.distance) {
      const gateProximity = this.distance % level.gates.interval;
      const tooCloseToGate = gateProximity < 80 || gateProximity > level.gates.interval - 80;
      if (!tooCloseToGate) {
        const crate = this.crates.find((c) => !c.active);
        if (crate) {
          const crateX = GAME_WIDTH / 2 + (Math.random() - 0.5) * FIELD_WIDTH * 0.4;
          const crateY = this.armyWorldY - GAME_HEIGHT - 50;
          crate.spawn(crateX, crateY, this.currentWeapon as any);
          this.crateSpawned = true;
        }
      }
    }

    // 5c. Despawn crates army has passed
    for (const crate of this.crates) {
      if (!crate.active) continue;
      if (crate.y > this.armyWorldY + 200) {
        crate.despawn();
      }
    }

    // 5d. Spawn gold pouches at intervals
    if (this.distance >= this.nextPouchDistance && this.distance < level.boss.triggerDistance) {
      const pouchX = GAME_WIDTH / 2 + (Math.random() - 0.5) * FIELD_WIDTH * 0.6;
      const pouchY = this.armyWorldY - GAME_HEIGHT - 80;
      const pouch = this.add.sprite(pouchX, pouchY, 'gold_pouch');
      pouch.setScale(2 / SVG_RENDER_SCALE);
      pouch.setAlpha(1);
      (pouch as any).goldValue = Math.round(10 + Math.random() * 15);
      this.goldPouches.push(pouch);
      this.nextPouchDistance = this.distance + (250 + Math.random() * 200) * perks.pouchFrequencyMultiplier;
    }

    // 5e. Check gold pouch collection
    for (let i = this.goldPouches.length - 1; i >= 0; i--) {
      const pouch = this.goldPouches[i];
      if (!pouch.active) { this.goldPouches.splice(i, 1); continue; }
      // Despawn if past army
      if (pouch.y > this.armyWorldY + 200) {
        pouch.destroy();
        this.goldPouches.splice(i, 1);
        continue;
      }
      // Check if any unit is close enough to collect
      for (const unit of this.units) {
        if (!unit.active) continue;
        const dx = unit.x - pouch.x;
        const dy = unit.y - pouch.y;
        if (Math.sqrt(dx * dx + dy * dy) < 35) {
          const value = (pouch as any).goldValue || 15;
          this.pouchGold += value;
          SoundManager.play('gold_pouch');
          // Float-up text
          const txt = this.add.text(pouch.x, pouch.y, `+${value}g`, {
            fontSize: '20px', color: '#ebb654', fontFamily: 'Arial, Helvetica, sans-serif', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3,
          }).setOrigin(0.5);
          this.tweens.add({
            targets: txt, y: pouch.y - 80, alpha: 0,
            duration: 600, onComplete: () => txt.destroy(),
          });
          pouch.destroy();
          this.goldPouches.splice(i, 1);
          break;
        }
      }
    }

    // 6. Update bullets (world space)
    const camTop = this.cameras.main.scrollY;
    const camBottom = camTop + GAME_HEIGHT;
    this.bullets.update(delta);
    this.bullets.forEachActive((b, idx) => {
      // Off-screen cull
      if (b.y < camTop - 100 || b.y > camBottom + 100) {
        this.bullets.despawn(idx);
        return;
      }

      // Hit enemies
      for (const enemy of this.enemies) {
        if (!enemy.active) continue;
        const dx = b.x - enemy.x;
        const dy = b.y - enemy.y;
        if (dx * dx + dy * dy < (enemy.displayWidth / 2 + 5) ** 2) {
          if (b.pierceCount > 0) {
            b.pierceCount--;
          } else {
            this.bullets.despawn(idx);
          }
          const totalDmg = b.damage + perks.bonusBulletDamage;
          this.showDamageNumber(b.x, b.y - 10, totalDmg);
          const killed = enemy.takeDamage(totalDmg);
          if (killed) {
            SoundManager.play('enemy_death');
            this.score += enemy.scoreValue;
            const now = this.time.now;
            if (now - this.lastKillTime < 2000) {
              this.killStreak++;
            } else {
              this.killStreak = 1;
            }
            this.lastKillTime = now;
            // Perk: Vampiric — chance to gain a unit
            if (perks.vampiricChance > 0 && Math.random() < perks.vampiricChance) {
              this.unitCount++;
              this.respawnArmy();
              this.quirkVampiric(enemy.x, enemy.y);
            }
            // Perk: Chain Kill — deal 2 damage to nearest enemy
            if (perks.hasChainKill) {
              this.applyChainKill(enemy.x, enemy.y);
            }
            // Perk: Explosive Rounds — splash on kill
            if (perks.hasExplosiveRounds) {
              this.applyExplosiveSplash(enemy.x, enemy.y);
            }
            // Elite: drop power orb
            if (enemy.isElite) {
              this.spawnPowerOrb(enemy.x, enemy.y);
            }
          }
          return;
        }
      }

      // Hit weapon crates
      for (const crate of this.crates) {
        if (!crate.active) continue;
        const cx = b.x - crate.x;
        const cy = b.y - crate.y;
        if (cx * cx + cy * cy < 900) { // 30^2
          this.bullets.despawn(idx);
          const newWeapon = crate.takeDamage(b.damage);
          if (newWeapon) {
            SoundManager.play('weapon_upgrade');
            this.currentWeapon = newWeapon;
            this.crateSpawned = false;
            this.showWeaponUpgrade(crate.x, crate.y, newWeapon);
          }
          return;
        }
      }
    });

    // 7. Update enemies — idle until army is close, then aggro
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;

      const distToArmy = Math.abs(enemy.y - this.armyWorldY);

      // Despawn if enemy fell very far behind the army
      if (enemy.y > this.armyWorldY + 600) {
        enemy.despawn();
        continue;
      }

      // Move when army is within aggro range (includes enemies behind)
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

        const reached = enemy.updateMovement(delta, nearestX, nearestY, this.armyWorldY, marchSpeed);
        if (reached) {
          if (WalletManager.useShield()) {
            // Shield absorbed the hit
            SoundManager.play('shield_absorb');
            this.cameras.main.flash(200, 100, 200, 255, true);
          } else {
            // Perk: Thorns — deal damage back to enemy on contact
            if (perks.thornsDamage > 0) {
              enemy.takeDamage(perks.thornsDamage);
              this.quirkThorns(enemy.x, enemy.y);
            }
            // Apply perk modifiers to contact damage
            let contactDmg = Math.max(1, enemy.contactDamage - perks.contactDamageReduction + perks.contactDamagePenalty);
            this.unitCount = Math.max(0, this.unitCount - contactDmg);
            if (enemy.splashRadius > 0) {
              this.unitCount = Math.max(0, this.unitCount - enemy.splashDamage);
            }
          }
          enemy.despawn();
          if (this.unitCount <= 0) {
            // Perk: Iron Will — survive with 1 unit once per level
            if (perks.hasIronWill) {
              perks.ironWillUsed = true;
              this.unitCount = 1;
              this.cameras.main.flash(300, 255, 50, 50, true);
              this.quirkIronWill();
            } else {
              this.gameOver();
              return;
            }
          }
          this.respawnArmy();
        }
      }
    }

    // Update enemy shadows
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.active) {
        if (!this.enemyShadows.has(e)) {
          const es = this.add.image(e.x, e.y + e.displayHeight * 0.4, 'vfx_shadow').setAlpha(0.25).setDepth(-1);
          this.enemyShadows.set(e, es);
        }
        const es = this.enemyShadows.get(e)!;
        es.setPosition(e.x, e.y + e.displayHeight * 0.4).setVisible(true);
        es.setScale(e.displayWidth / 32);
      } else {
        const es = this.enemyShadows.get(e);
        if (es) es.setVisible(false);
      }
    }

    // 7b. Draw enemy health bars
    this.enemyHpBars.clear();
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      if (enemy.hp >= enemy.maxHp) continue; // don't show full-hp bars
      const barW = Math.max(20, enemy.displayWidth * 1.2);
      const barH = 3;
      const barX = enemy.x - barW / 2;
      const barY = enemy.y - enemy.displayHeight / 2 - 8;
      const hpFrac = Math.max(0, enemy.hp / enemy.maxHp);
      // Background
      this.enemyHpBars.fillStyle(0x000000, 0.6);
      this.enemyHpBars.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
      // HP fill
      const hpColor = hpFrac > 0.5 ? 0xff4444 : hpFrac > 0.25 ? 0xff8800 : 0xff2222;
      this.enemyHpBars.fillStyle(hpColor, 0.9);
      this.enemyHpBars.fillRect(barX, barY, barW * hpFrac, barH);
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
          // Perk: Lucky Gates — add ops give +1 extra per stack
          if (this.unitCount > oldCount && perks.gateBonusAdd > 0) {
            this.unitCount += perks.gateBonusAdd;
          }
          // Perk: Rally Cry — positive gates give +2 bonus per stack
          if (this.unitCount > oldCount && perks.gateBonusUnitsOnPositive > 0) {
            this.unitCount += perks.gateBonusUnitsOnPositive;
          }
          this.unitCount = Math.max(1, this.unitCount);
          // Perk: Gold Rush — earn gold per gate
          if (perks.goldPerGate > 0) {
            this.pouchGold += perks.goldPerGate;
          }
          SoundManager.play(this.unitCount > oldCount ? 'gate_positive' : 'gate_negative');
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

    // 9. Fire bullets (weapon fire rate, per-unit level scaling)
    const weaponStats = LevelManager.instance.getWeaponStats(this.currentWeapon);
    const bulletColor = hexToNum(weaponStats.bulletColor);
    let effectiveFireRate = weaponStats.fireRate * perks.fireRateMultiplier * perks.berserkerMultiplier(this.unitCount);
    if (this.furyTimer > 0) { effectiveFireRate *= 0.5; this.furyTimer -= delta; }
    if (this.curseSlowTimer > 0) { effectiveFireRate *= 2; this.curseSlowTimer -= delta; }

    // Curse blind overlay tick
    if (this.curseBlindTimer > 0) {
      this.curseBlindTimer -= delta;
      if (this.curseBlindOverlay) {
        this.curseBlindOverlay.setAlpha(0.25 + Math.sin(Date.now() / 200) * 0.15);
      }
      if (this.curseBlindTimer <= 0 && this.curseBlindOverlay) {
        this.curseBlindOverlay.destroy();
        this.curseBlindOverlay = null;
      }
    }
    this.shootSoundTimer += delta;
    for (const unit of this.units) {
      if (!unit.active) continue;
      if (unit.updateFiring(delta, effectiveFireRate)) {
        const pierce = perks.hasPiercing ? 1 : 0;
        if (this.bullets.fire(unit.x, unit.y, bulletColor, unit.poolIndex, 1, pierce)) {
          // Perk: Double Tap — chance to fire a second bullet
          if (perks.doubleTapChance > 0 && Math.random() < perks.doubleTapChance) {
            this.bullets.fire(unit.x + (Math.random() - 0.5) * 8, unit.y, bulletColor, unit.poolIndex, 1, pierce);
            this.quirkDoubleTap(unit.x, unit.y);
          }
          if (this.shootSoundTimer > 150) {
            SoundManager.play(`shoot_${this.currentWeapon}`);
            this.shootSoundTimer = 0;
          }
        }
      }
    }

    // 9b. Perk: Regeneration — gain units at distance intervals
    if (perks.regenDistanceInterval && this.distance >= this.nextRegenDistance) {
      this.unitCount++;
      this.nextRegenDistance = this.distance + perks.regenDistanceInterval;
      this.respawnArmy();
      this.quirkRegeneration();
    }

    // 9q. Quirky periodic perk effects
    // Berserker battle cries when active
    if ((perks.has('berserker') && this.unitCount <= 5) || (perks.has('last_stand') && this.unitCount <= 1)) {
      this.berserkerCryTimer -= delta;
      if (this.berserkerCryTimer <= 0) {
        this.quirkBattleCry();
        this.berserkerCryTimer = 1500 + Math.random() * 2000; // every 1.5-3.5s
      }
    }
    // Last Stand: grow the lone survivor to heroic size
    if (perks.has('last_stand') && this.unitCount === 1) {
      this.quirkLastStandGrow();
    } else {
      this.quirkLastStandReset();
    }
    // Glass Cannon: unstable energy pulse
    if (perks.has('glass_cannon')) {
      this.glassCannonPulseTimer -= delta;
      if (this.glassCannonPulseTimer <= 0) {
        this.quirkGlassCannonPulse();
        this.glassCannonPulseTimer = 800 + Math.random() * 400; // every 0.8-1.2s
      }
    }

    // 9c. Power orb collection (magnetic pull + pickup)
    for (let i = this.powerOrbs.length - 1; i >= 0; i--) {
      const orb = this.powerOrbs[i];
      if (!orb.active) { this.powerOrbs.splice(i, 1); continue; }
      if (orb.y > this.armyWorldY + 300) { orb.destroy(); this.powerOrbs.splice(i, 1); continue; }
      // Magnetic pull toward nearest unit when close
      let minDist = Infinity;
      let closestUnit: PlayerUnit | null = null;
      for (const unit of this.units) {
        if (!unit.active) continue;
        const odx = unit.x - orb.x;
        const ody = unit.y - orb.y;
        const d = odx * odx + ody * ody;
        if (d < minDist) { minDist = d; closestUnit = unit; }
      }
      if (closestUnit && minDist < 80 * 80) {
        // Gently pull orb toward unit
        const pullStrength = 3 * dt;
        orb.x += (closestUnit.x - orb.x) * pullStrength;
        orb.y += (closestUnit.y - orb.y) * pullStrength;
      }
      if (closestUnit && minDist < 30 * 30) {
        this.collectPowerOrb(orb);
        this.powerOrbs.splice(i, 1);
      }
    }

    // 10. Boss trigger — once spawning stops and all enemies are dead
    if (!this.spawningComplete && this.distance >= level.boss.triggerDistance) {
      this.spawningComplete = true;
    }
    if (this.spawningComplete && !this.enemies.some(e => e.active)) {
      this.transitionToBoss();
      return;
    }

    // 11. Update HUD
    this.hud.score = Math.floor(this.score);
    this.hud.distance = this.distance;
    this.hud.unitCount = this.unitCount;
    this.hud.killStreak = this.killStreak;
    this.hud.levelGold = this.levelGold + this.pouchGold;
    this.hud.weaponType = this.currentWeapon;
    this.hud.weaponName = weaponStats.name;
  }

  /** Reposition army in world space. */
  private respawnArmy(): void {
    const armyCenterX = GAME_WIDTH / 2 + this.armyX;
    const armyCenterY = this.armyWorldY + this.armyYOffset;

    if (this.unitCount !== this.activeUnitCount) {
      const shrinking = this.unitCount < this.activeUnitCount;
      const growing = this.unitCount > this.activeUnitCount;

      if (shrinking) {
        const activeUnits = this.units.filter(u => u.active);
        let effectsPlayed = 0;
        const toKill = this.activeUnitCount - this.unitCount;
        for (const unit of activeUnits) {
          if (effectsPlayed >= toKill) break;
          unit.despawnWithEffect();
          effectsPlayed++;
        }
        // Despawn all and re-place at formation positions
        for (const unit of this.units) {
          unit.despawn();
        }
        const spawnRadius = Math.min(FIELD_WIDTH * 0.45, 20 + Math.sqrt(this.unitCount) * 8);
        for (let i = 0; i < this.unitCount && i < this.units.length; i++) {
          const angle = (i / this.unitCount) * Math.PI * 2;
          const radius = spawnRadius * 0.3 + Math.random() * spawnRadius * 0.7;
          const sx = armyCenterX + Math.cos(angle) * radius;
          const sy = armyCenterY + Math.sin(angle) * radius;
          this.units[i].spawn(sx, sy);
          if (!this.unitShadows[i]) {
            this.unitShadows[i] = this.add.image(sx, sy + 10, 'vfx_shadow').setAlpha(0.3).setDepth(-1);
          }
          this.unitShadows[i].setPosition(sx, sy + 10).setVisible(true).setScale(0.6);
        }
      } else if (growing) {
        // New units enter from left/right screen edges and walk in
        const prevCount = this.activeUnitCount;
        const spawnRadius = Math.min(FIELD_WIDTH * 0.45, 20 + Math.sqrt(this.unitCount) * 8);
        for (let i = 0; i < this.unitCount && i < this.units.length; i++) {
          if (i < prevCount && this.units[i].active) continue; // already active
          // Spawn from alternating left/right edges
          const fromLeft = i % 2 === 0;
          const edgeX = fromLeft ? -20 : GAME_WIDTH + 20;
          const edgeY = armyCenterY + (Math.random() - 0.5) * 60;
          this.units[i].spawn(edgeX, edgeY);
          // Target is their formation slot — physics will pull them in
          const angle = (i / this.unitCount) * Math.PI * 2;
          const radius = spawnRadius * 0.3 + Math.random() * spawnRadius * 0.7;
          this.units[i].moveTo(
            armyCenterX + Math.cos(angle) * radius,
            armyCenterY + Math.sin(angle) * radius,
          );
          if (!this.unitShadows[i]) {
            this.unitShadows[i] = this.add.image(edgeX, edgeY + 10, 'vfx_shadow').setAlpha(0.3).setDepth(-1);
          }
          this.unitShadows[i].setPosition(edgeX, edgeY + 10).setVisible(true).setScale(0.6);
        }
      }
      this.activeUnitCount = this.unitCount;
    }

    // Give each unit a formation offset so they don't all converge on one point
    const formationRadius = Math.min(FIELD_WIDTH * 0.45, 20 + Math.sqrt(this.unitCount) * 8);
    let activeIdx = 0;
    for (const unit of this.units) {
      if (!unit.active) continue;
      const angle = (activeIdx / this.activeUnitCount) * Math.PI * 2;
      const r = formationRadius * 0.4 + (activeIdx % 5) * formationRadius * 0.12;
      unit.moveTo(
        armyCenterX + Math.cos(angle) * r,
        armyCenterY + Math.sin(angle) * r,
      );
      activeIdx++;
    }
  }

  /** Throttled floating damage numbers — batches rapid hits */
  private showDamageNumber(x: number, y: number, damage: number): void {
    this.dmgNumberAccum += damage;
    if (this.dmgNumberTimer > 0) return; // throttled
    this.dmgNumberTimer = 100; // 100ms throttle

    const txt = this.add.text(x + (Math.random() - 0.5) * 20, y, String(this.dmgNumberAccum), {
      fontSize: '16px', color: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(10);

    this.tweens.add({
      targets: txt, y: y - 40, alpha: 0, scale: 0.6,
      duration: 400, ease: 'Power2', onComplete: () => txt.destroy(),
    });
    this.dmgNumberAccum = 0;
  }

  private showGateEffect(x: number, y: number, label: string, isPositive: boolean): void {
    const color = isPositive ? '#51cf66' : '#ff6b6b';
    const text = this.add.text(x, y, label + '!', {
      fontSize: '56px',
      color,
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 5,
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

  private showWeaponUpgrade(x: number, y: number, weapon: string): void {
    const stats = LevelManager.instance.getWeaponStats(weapon);
    const svgKey = this.getWeaponSvgKey(weapon);

    // Icon from SVG
    const icon = this.add.image(x, y, svgKey).setDisplaySize(48, 48).setOrigin(0.5);
    const label = this.add.text(x, y + 40, stats.name, {
      fontSize: '22px',
      color: '#ffffff',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Animate both up and out
    this.tweens.add({
      targets: [icon, label],
      y: `-=180`,
      alpha: 0,
      duration: 1400,
      ease: 'Power2',
      onComplete: () => {
        icon.destroy();
        label.destroy();
      },
    });

    // Icon scale pop
    this.tweens.add({
      targets: icon,
      displayWidth: 72,
      displayHeight: 72,
      duration: 1400,
      ease: 'Power2',
    });

    this.cameras.main.flash(300, 255, 255, 255, true);
    this.cameras.main.shake(200, 0.015);
  }

  /** Chain Kill perk: deal 2 damage to the nearest enemy */
  private applyChainKill(x: number, y: number): void {
    let nearest: Enemy | null = null;
    let nearestDist = Infinity;
    for (const e of this.enemies) {
      if (!e.active) continue;
      const dx = e.x - x;
      const dy = e.y - y;
      const d = dx * dx + dy * dy;
      if (d < nearestDist && d < 150 * 150) {
        nearestDist = d;
        nearest = e;
      }
    }
    if (nearest) {
      nearest.takeDamage(2);
      // Visual: lightning bolt effect
      const bolt = this.add.text(nearest.x, nearest.y - 15, '\u26A1', { fontSize: '20px' }).setOrigin(0.5);
      this.tweens.add({ targets: bolt, alpha: 0, y: nearest.y - 40, duration: 300, onComplete: () => bolt.destroy() });
      // Quirky: draw jagged lightning line between source and target
      this.quirkChainLightning(x, y, nearest.x, nearest.y);
    }
  }

  /** Explosive Rounds perk: splash damage on kill */
  private applyExplosiveSplash(x: number, y: number): void {
    const splashRadius = 60;
    for (const e of this.enemies) {
      if (!e.active) continue;
      const dx = e.x - x;
      const dy = e.y - y;
      if (dx * dx + dy * dy < splashRadius * splashRadius) {
        e.takeDamage(1);
      }
    }
    // Visual: small explosion
    const boom = this.add.circle(x, y, 5, 0xff6600, 0.5);
    this.tweens.add({ targets: boom, radius: splashRadius, alpha: 0, duration: 250, onUpdate: () => boom.setRadius(boom.radius), onComplete: () => boom.destroy() });
  }

  /** Spawn a power orb when an elite enemy dies */
  private spawnPowerOrb(x: number, y: number): void {
    // Weighted pool: no gold orbs — gold only comes from pouches
    const pool = [
      { type: 'fury',  weight: 3 },
      { type: 'heal',  weight: 3 },
      { type: 'curse_slow',  weight: 2 }, // halves fire rate for 8s
      { type: 'curse_drain', weight: 1 }, // lose 2 units
      { type: 'curse_blind', weight: 1 }, // screen distortion for 6s
      { type: 'chaos',       weight: 1 }, // wild card: random strong effect
    ];
    const totalWeight = pool.reduce((s, e) => s + e.weight, 0);
    let roll = Math.random() * totalWeight;
    let orbType = pool[0].type;
    for (const entry of pool) {
      roll -= entry.weight;
      if (roll <= 0) { orbType = entry.type; break; }
    }

    // Color scheme per type
    const colors: Record<string, { core: number; glow: number; ring: number; icon: string }> = {
      fury:        { core: 0xff4400, glow: 0xff6600, ring: 0xff8800, icon: '\u{1F525}' },
      heal:        { core: 0x4cde39, glow: 0x6be85a, ring: 0x86efac, icon: '\u{1F49A}' },
      curse_slow:  { core: 0x7c3aed, glow: 0x9333ea, ring: 0xa855f7, icon: '\u{1F9CA}' },
      curse_drain: { core: 0xdc2626, glow: 0xef4444, ring: 0xf87171, icon: '\u{1F480}' },
      curse_blind: { core: 0x6b21a8, glow: 0x7e22ce, ring: 0x9333ea, icon: '\u{1F441}\uFE0F' },
      chaos:       { core: 0xf0abfc, glow: 0xe879f9, ring: 0xd946ef, icon: '\u{1F3B2}' },
    };
    const c = colors[orbType];

    const container = this.add.container(x, y);

    // Layer 1: Outer glow ring (soft, large)
    const outerGlow = this.add.circle(0, 0, 28, c.glow, 0.15);
    container.add(outerGlow);
    this.tweens.add({
      targets: outerGlow, scale: { from: 0.8, to: 1.4 }, alpha: { from: 0.2, to: 0.05 },
      duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // Layer 2: Spinning ring
    const ring = this.add.circle(0, 0, 18, c.ring, 0).setStrokeStyle(2, c.ring, 0.6);
    container.add(ring);
    this.tweens.add({
      targets: ring, scale: { from: 0.9, to: 1.2 }, alpha: { from: 0.4, to: 0.8 },
      duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // Layer 3: Core orb (bright center)
    const core = this.add.circle(0, 0, 10, c.core, 0.9);
    container.add(core);
    this.tweens.add({
      targets: core, scale: { from: 0.85, to: 1.15 },
      duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // Layer 4: Icon on top
    const icon = this.add.text(0, -1, c.icon, { fontSize: '16px' }).setOrigin(0.5);
    container.add(icon);

    // Layer 5: Orbiting sparkles (smooth for positive, erratic for curse)
    const isCurse = orbType.startsWith('curse_') || orbType === 'chaos';
    const sparkCount = isCurse ? 5 : 3;
    const sparkColor = isCurse ? c.core : 0xffffff;
    for (let i = 0; i < sparkCount; i++) {
      const spark = this.add.circle(0, 0, isCurse ? 3 : 2, sparkColor, 0.8);
      container.add(spark);
      const angle = (i / sparkCount) * Math.PI * 2;
      const radius = isCurse ? 24 : 20;
      if (isCurse) {
        // Erratic jitter for cursed orbs
        this.tweens.add({
          targets: spark,
          x: { from: Math.cos(angle) * radius, to: Math.cos(angle + Math.PI) * radius * 0.6 },
          y: { from: Math.sin(angle) * radius, to: Math.sin(angle + Math.PI) * radius * 0.6 },
          duration: 400 + Math.random() * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
      } else {
        this.tweens.add({
          targets: spark,
          x: { from: Math.cos(angle) * radius, to: Math.cos(angle + Math.PI * 2) * radius },
          y: { from: Math.sin(angle) * radius, to: Math.sin(angle + Math.PI * 2) * radius },
          duration: 2000, repeat: -1, ease: 'Linear',
        });
      }
    }

    // Entrance: burst in from nothing
    container.setScale(0).setAlpha(0);
    this.tweens.add({
      targets: container, scale: 1, alpha: 1,
      duration: 400, ease: 'Back.easeOut',
    });

    // Gentle float up and down
    this.tweens.add({
      targets: container, y: { from: y - 5, to: y + 5 },
      duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 400,
    });

    (container as any).orbType = orbType;
    this.powerOrbs.push(container);
  }

  /** Collect a power orb — dramatic pickup effect */
  private collectPowerOrb(orb: Phaser.GameObjects.Container): void {
    const orbType = (orb as any).orbType as string;

    const colors: Record<string, { flash: [number, number, number]; text: string }> = {
      fury:        { flash: [255, 80, 0],    text: '#ff6600' },
      heal:        { flash: [50, 220, 100],   text: '#6be85a' },
      curse_slow:  { flash: [120, 50, 220],   text: '#a855f7' },
      curse_drain: { flash: [220, 40, 40],    text: '#f87171' },
      curse_blind: { flash: [100, 30, 170],   text: '#9333ea' },
      chaos:       { flash: [230, 120, 240],  text: '#e879f9' },
    };
    const c = colors[orbType] || colors.gold;
    const isCurse = orbType.startsWith('curse_');

    let label = '';
    let subtitle = '';
    if (orbType === 'fury') {
      this.furyTimer = 8000;
      label = '\u{1F525} FURY!';
      subtitle = '2x FIRE RATE';
    } else if (orbType === 'heal') {
      this.unitCount += 2;
      this.respawnArmy();
      label = '\u{1F49A} HEAL!';
      subtitle = '+2 UNITS';
    } else if (orbType === 'curse_slow') {
      this.curseSlowTimer = 8000;
      label = '\u{1F9CA} CURSED!';
      subtitle = 'FIRE RATE HALVED';
    } else if (orbType === 'curse_drain') {
      const lost = Math.min(2, this.unitCount - 1);
      this.unitCount = Math.max(1, this.unitCount - lost);
      this.respawnArmy();
      label = '\u{1F480} DRAINED!';
      subtitle = `-${lost} UNITS`;
    } else if (orbType === 'curse_blind') {
      this.curseBlindTimer = 6000;
      if (this.curseBlindOverlay) this.curseBlindOverlay.destroy();
      this.curseBlindOverlay = this.add.graphics().setDepth(50);
      this.curseBlindOverlay.fillStyle(0x2d0050, 0.3);
      this.curseBlindOverlay.fillRect(
        this.cameras.main.scrollX, this.cameras.main.scrollY,
        GAME_WIDTH, GAME_HEIGHT,
      );
      this.curseBlindOverlay.setScrollFactor(0);
      label = '\u{1F441}\uFE0F BLINDED!';
      subtitle = 'VISION OBSCURED';
    } else if (orbType === 'chaos') {
      // Wild card — roll a random strong effect (positive or negative)
      const chaosRoll = Math.random();
      if (chaosRoll < 0.25) {
        this.furyTimer = 12000;
        label = '\u{1F3B2} MEGA FURY!';
        subtitle = '2x FIRE RATE 12s';
      } else if (chaosRoll < 0.5) {
        this.unitCount += 3;
        this.respawnArmy();
        label = '\u{1F3B2} REINFORCEMENTS!';
        subtitle = '+3 UNITS';
      } else if (chaosRoll < 0.75) {
        const lost = Math.min(3, this.unitCount - 1);
        this.unitCount = Math.max(1, this.unitCount - lost);
        this.respawnArmy();
        label = '\u{1F3B2} CATASTROPHE!';
        subtitle = `-${lost} UNITS`;
      } else {
        this.curseSlowTimer = 10000;
        label = '\u{1F3B2} SLUGGISH!';
        subtitle = 'FIRE RATE HALVED 10s';
      }
    }

    SoundManager.play(isCurse ? 'gate_negative' : 'weapon_upgrade');
    const ox = orb.x;
    const oy = orb.y;

    // Kill all tweens on the orb children then destroy
    this.tweens.killTweensOf(orb);
    for (const child of orb.getAll()) {
      this.tweens.killTweensOf(child);
    }

    const colorNum = parseInt(c.text.replace('#', ''), 16);

    if (isCurse) {
      // Curse: implosion — particles rush INWARD, then dark burst
      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2;
        const startDist = 60 + Math.random() * 20;
        const p = this.add.circle(ox + Math.cos(angle) * startDist, oy + Math.sin(angle) * startDist, 3, colorNum, 0.9);
        this.tweens.add({
          targets: p, x: ox, y: oy,
          alpha: 0, scale: 2, duration: 300 + Math.random() * 100,
          onComplete: () => p.destroy(),
        });
      }
      // Dark shockwave after implosion
      this.time.delayedCall(250, () => {
        const darkRing = this.add.circle(ox, oy, 5, colorNum, 0.6);
        this.tweens.add({
          targets: darkRing, radius: 50, alpha: 0, duration: 350,
          onUpdate: () => darkRing.setRadius(darkRing.radius),
          onComplete: () => darkRing.destroy(),
        });
      });
    } else {
      // Positive: expanding burst ring
      const burstRing = this.add.circle(ox, oy, 5, colorNum, 0.5);
      this.tweens.add({
        targets: burstRing, radius: 60, alpha: 0, duration: 400,
        onUpdate: () => burstRing.setRadius(burstRing.radius),
        onComplete: () => burstRing.destroy(),
      });

      // Scatter particles outward
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const p = this.add.circle(ox, oy, 3, 0xffffff, 0.9);
        this.tweens.add({
          targets: p,
          x: ox + Math.cos(angle) * 50,
          y: oy + Math.sin(angle) * 50,
          alpha: 0, scale: 0.2, duration: 350 + Math.random() * 150,
          onComplete: () => p.destroy(),
        });
      }
    }

    // Big label
    const mainTxt = this.add.text(ox, oy - 10, label, {
      fontSize: '28px', color: c.text, fontFamily: 'Arial, Helvetica, sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(15);

    // Subtitle
    const subTxt = this.add.text(ox, oy + 20, subtitle, {
      fontSize: '16px', color: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(15);

    // Animate text up and out
    this.tweens.add({
      targets: mainTxt, y: oy - 90, alpha: 0, scale: 1.3,
      duration: 1000, ease: 'Power2', onComplete: () => mainTxt.destroy(),
    });
    this.tweens.add({
      targets: subTxt, y: oy - 60, alpha: 0,
      duration: 800, delay: 100, ease: 'Power2', onComplete: () => subTxt.destroy(),
    });

    // Screen flash matching orb color
    this.cameras.main.flash(250, c.flash[0], c.flash[1], c.flash[2], true);
    this.cameras.main.shake(150, 0.01);

    orb.destroy();
  }

  // ── Quirky perk effects ──

  private readonly BATTLE_CRIES = [
    'RAAA!', 'BLOOD!', 'FOR GLORY!', 'NO MERCY!', 'CHAAARGE!',
    'SMASH!', 'WAAAGH!', 'BONK!', 'yolo', 'gg ez',
  ];

  /** Vampiric proc: "SLURP!" + blood drip particles */
  private quirkVampiric(x: number, y: number): void {
    const txt = this.add.text(x, y - 20, '🧛 SLURP!', {
      fontSize: '18px', color: '#ff2222', fontFamily: 'Arial, Helvetica, sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(15);
    this.tweens.add({
      targets: txt, y: y - 70, alpha: 0, scale: 1.4,
      duration: 800, ease: 'Power2', onComplete: () => txt.destroy(),
    });
    // Blood drip particles falling down
    for (let i = 0; i < 5; i++) {
      const drop = this.add.circle(x + (Math.random() - 0.5) * 30, y, 3, 0xaa0000, 0.9);
      this.tweens.add({
        targets: drop,
        y: y + 30 + Math.random() * 40,
        alpha: 0, scale: 0.3,
        duration: 500 + Math.random() * 300,
        delay: i * 60,
        onComplete: () => drop.destroy(),
      });
    }
  }

  /** Iron Will proc: "NOT TODAY!" + expanding shockwave */
  private quirkIronWill(): void {
    const cx = GAME_WIDTH / 2 + this.armyX;
    const cy = this.armyWorldY;
    // Big dramatic text
    const txt = this.add.text(cx, cy - 30, '💀 NOT TODAY!', {
      fontSize: '32px', color: '#ff4444', fontFamily: 'Arial, Helvetica, sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({
      targets: txt, y: cy - 120, alpha: 0, scale: 1.6,
      duration: 1200, ease: 'Power2', onComplete: () => txt.destroy(),
    });
    // Expanding shockwave rings
    for (let i = 0; i < 3; i++) {
      const ring = this.add.circle(cx, cy, 5, 0xff4444, 0.4 - i * 0.1).setDepth(19);
      this.tweens.add({
        targets: ring, radius: 80 + i * 30, alpha: 0, duration: 600 + i * 200,
        delay: i * 150,
        onUpdate: () => ring.setRadius(ring.radius),
        onComplete: () => ring.destroy(),
      });
    }
    this.cameras.main.shake(500, 0.03);
  }

  /** Berserker/Last Stand: random battle cry floats up from army */
  private quirkBattleCry(): void {
    const cry = this.BATTLE_CRIES[Math.floor(Math.random() * this.BATTLE_CRIES.length)];
    const cx = GAME_WIDTH / 2 + this.armyX + (Math.random() - 0.5) * 60;
    const cy = this.armyWorldY - 20 + (Math.random() - 0.5) * 30;
    const txt = this.add.text(cx, cy, cry, {
      fontSize: '14px', color: '#ff6644', fontFamily: 'Arial, Helvetica, sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(15).setRotation((Math.random() - 0.5) * 0.3);
    this.tweens.add({
      targets: txt, y: cy - 50, alpha: 0, scale: 1.2,
      duration: 1000, ease: 'Power2', onComplete: () => txt.destroy(),
    });
  }

  /** Thorns: "OUCH!" bounces off the enemy */
  private quirkThorns(x: number, y: number): void {
    const txt = this.add.text(x, y, '🌵 OUCH!', {
      fontSize: '14px', color: '#22cc44', fontFamily: 'Arial, Helvetica, sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(15);
    // Bounce upward then fall
    this.tweens.add({
      targets: txt, y: y - 40, duration: 200, ease: 'Power2',
      yoyo: true,
      onComplete: () => {
        this.tweens.add({
          targets: txt, alpha: 0, duration: 200, onComplete: () => txt.destroy(),
        });
      },
    });
  }

  /** Regeneration: sparkle confetti + "FRESH RECRUIT!" */
  private quirkRegeneration(): void {
    const cx = GAME_WIDTH / 2 + this.armyX;
    const cy = this.armyWorldY;
    const txt = this.add.text(cx, cy - 30, '✨ FRESH RECRUIT!', {
      fontSize: '14px', color: '#44ffaa', fontFamily: 'Arial, Helvetica, sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(15);
    this.tweens.add({
      targets: txt, y: cy - 70, alpha: 0, duration: 900, ease: 'Power2',
      onComplete: () => txt.destroy(),
    });
    // Sparkle confetti
    const sparkleColors = [0xffdd00, 0x44ff88, 0x44ddff, 0xff44aa, 0xffffff];
    for (let i = 0; i < 8; i++) {
      const color = sparkleColors[Math.floor(Math.random() * sparkleColors.length)];
      const spark = this.add.circle(
        cx + (Math.random() - 0.5) * 40, cy + (Math.random() - 0.5) * 20,
        2 + Math.random() * 2, color, 0.9,
      ).setDepth(15);
      const angle = Math.random() * Math.PI * 2;
      const dist = 20 + Math.random() * 30;
      this.tweens.add({
        targets: spark,
        x: spark.x + Math.cos(angle) * dist,
        y: spark.y + Math.sin(angle) * dist - 20,
        alpha: 0, scale: 0.2,
        duration: 400 + Math.random() * 300,
        onComplete: () => spark.destroy(),
      });
    }
  }

  /** Enhanced Chain Kill: draw a visible lightning line between enemies */
  private quirkChainLightning(fromX: number, fromY: number, toX: number, toY: number): void {
    const gfx = this.add.graphics().setDepth(14);
    gfx.lineStyle(2, 0x44ccff, 0.9);
    gfx.beginPath();
    gfx.moveTo(fromX, fromY);
    // Jagged lightning segments
    const segments = 5;
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const mx = fromX + (toX - fromX) * t + (Math.random() - 0.5) * 20;
      const my = fromY + (toY - fromY) * t + (Math.random() - 0.5) * 20;
      gfx.lineTo(mx, my);
    }
    gfx.lineTo(toX, toY);
    gfx.strokePath();
    this.tweens.add({
      targets: gfx, alpha: 0, duration: 250,
      onComplete: () => gfx.destroy(),
    });
  }

  /** Double Tap: "DOUBLE!" quick popup */
  private quirkDoubleTap(x: number, y: number): void {
    const txt = this.add.text(x, y - 15, 'DOUBLE!', {
      fontSize: '12px', color: '#ffcc00', fontFamily: 'Arial, Helvetica, sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(15);
    this.tweens.add({
      targets: txt, y: y - 40, alpha: 0, scale: 1.3,
      duration: 500, ease: 'Power2', onComplete: () => txt.destroy(),
    });
  }

  /** Glass Cannon: pulse all active units between normal and red tint */
  private quirkGlassCannonPulse(): void {
    for (const unit of this.units) {
      if (!unit.active) continue;
      unit.setTint(0xff4444);
    }
    this.time.delayedCall(150, () => {
      for (const unit of this.units) {
        if (!unit.active || unit.isStunned) continue;
        unit.clearTint();
      }
    });
  }

  /** Last Stand: grow the surviving unit to heroic size */
  private quirkLastStandGrow(): void {
    if (this.lastStandGrown) return;
    this.lastStandGrown = true;
    const unit = this.units.find(u => u.active);
    if (!unit) return;
    this.tweens.add({
      targets: unit, displayWidth: unit.displayWidth * 2, displayHeight: unit.displayHeight * 2,
      duration: 300, ease: 'Back.easeOut',
    });
    const cx = unit.x;
    const cy = unit.y;
    const txt = this.add.text(cx, cy - 30, '⚔️ LAST ONE STANDING!', {
      fontSize: '16px', color: '#ff4444', fontFamily: 'Arial, Helvetica, sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(15);
    this.tweens.add({
      targets: txt, y: cy - 80, alpha: 0, scale: 1.3,
      duration: 1200, ease: 'Power2', onComplete: () => txt.destroy(),
    });
  }

  /** Reset last stand growth when unit count goes above 1 */
  private quirkLastStandReset(): void {
    if (!this.lastStandGrown) return;
    this.lastStandGrown = false;
  }

  private gameOver(): void {
    SoundManager.play('defeat');
    WalletManager.consumeShield();
    this.input_handler.destroy();
    this.scene.stop('HUDScene');
    // Earn gold (partial on death)
    WalletManager.earnLevelGold(this.levelGold, Math.floor(this.pouchGold * 0.5));
    this.scene.start('GameOverScene', {
      score: Math.floor(this.score),
      distance: Math.floor(this.distance),
      bossDefeated: false,
      goldEarned: this.levelGold + Math.floor(this.pouchGold * 0.5),
    });
  }

  private transitionToBoss(): void {
    // Escalating screen shake sequence for dramatic buildup
    this.cameras.main.shake(400, 0.005);
    this.time.delayedCall(500, () => {
      this.cameras.main.shake(500, 0.015);
    });
    this.time.delayedCall(1100, () => {
      this.cameras.main.shake(600, 0.03);
    });
    this.time.delayedCall(1800, () => {
      this.cameras.main.shake(700, 0.05);
      this.cameras.main.flash(500, 255, 50, 50);
    });

    // Fade to black before scene switch
    this.time.delayedCall(2400, () => {
      this.cameras.main.fade(800, 0, 0, 0);
    });

    this.time.delayedCall(3200, () => {
      this.scene.stop('HUDScene');
      this.scene.start('BossScene', {
        score: Math.floor(this.score),
        distance: Math.floor(this.distance),
        unitCount: this.unitCount,
        weapon: this.currentWeapon,
        levelGold: this.levelGold,
        pouchGold: this.pouchGold,
      });
    });
  }
}
