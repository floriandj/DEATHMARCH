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

  // Shadow visuals
  private unitShadows: Phaser.GameObjects.Image[] = [];
  private enemyShadows: Map<Enemy, Phaser.GameObjects.Image> = new Map();

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    const level = LevelManager.instance.current;

    this.armyX = 0;
    this.distance = 0;
    this.score = 0;
    // Consume single-use boosts from shop
    const boosts = WalletManager.consumeBoosts();
    this.unitCount = level.startingUnits + boosts.extraUnits;
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

    const hint = this.add.text(GAME_WIDTH / 2, this.armyWorldY - 180, 'DRAG TO MOVE\nYOUR ARMY!', {
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
    const marchSpeed = level.marchSpeed;

    // 1. Army marches upward in world space
    this.distance += marchSpeed * dt;
    this.score += marchSpeed * dt * level.scoring.perMeter;
    this.armyWorldY -= marchSpeed * dt;

    // 2. Camera follows army (army stays 200px from bottom)
    this.cameras.main.scrollY = this.armyWorldY - GAME_HEIGHT + 200;
    this.background.update(this.cameras.main.scrollY);

    // 3. Update army position from input (X: left/right, Y: forward/back)
    const normalized = this.input_handler.getNormalized(GAME_WIDTH / 2);
    this.armyX = normalized * (FIELD_WIDTH / 2);
    const normalizedY = this.input_handler.getNormalizedY(ARMY_INPUT_Y_RANGE);
    this.armyYOffset = normalizedY * ARMY_Y_OFFSET_MAX;
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
        });
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
      this.nextPouchDistance = this.distance + 250 + Math.random() * 200;
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
            fontSize: '20px', color: '#ffd700', fontFamily: 'Arial, Helvetica, sans-serif', fontStyle: 'bold',
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
          this.bullets.despawn(idx);
          this.showDamageNumber(b.x, b.y - 10, b.damage);
          const killed = enemy.takeDamage(b.damage);
          if (killed) {
            SoundManager.play('enemy_death');
            this.levelGold += 1;
            this.score += enemy.scoreValue;
            const now = this.time.now;
            if (now - this.lastKillTime < 2000) {
              this.killStreak++;
            } else {
              this.killStreak = 1;
            }
            this.lastKillTime = now;
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

      // Despawn only if very far behind AND out of aggro range
      if (enemy.y > this.armyWorldY + 500 && distToArmy > AGGRO_RANGE) {
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

        const reached = enemy.updateMovement(delta, nearestX, nearestY, this.armyWorldY);
        if (reached) {
          if (WalletManager.useShield()) {
            // Shield absorbed the hit
            SoundManager.play('shield_absorb');
            this.cameras.main.flash(200, 100, 200, 255, true);
          } else {
            this.unitCount = Math.max(0, this.unitCount - enemy.contactDamage);
            if (enemy.splashRadius > 0) {
              this.unitCount = Math.max(0, this.unitCount - enemy.splashDamage);
            }
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
    this.shootSoundTimer += delta;
    for (const unit of this.units) {
      if (!unit.active) continue;
      if (unit.updateFiring(delta, weaponStats.fireRate)) {
        if (this.bullets.fire(unit.x, unit.y, bulletColor, unit.poolIndex)) {
          if (this.shootSoundTimer > 150) {
            SoundManager.play(`shoot_${this.currentWeapon}`);
            this.shootSoundTimer = 0;
          }
        }
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
      if (shrinking) {
        const activeUnits = this.units.filter(u => u.active);
        let effectsPlayed = 0;
        const toKill = this.activeUnitCount - this.unitCount;
        for (const unit of activeUnits) {
          if (effectsPlayed >= toKill) break;
          unit.despawnWithEffect();
          effectsPlayed++;
        }
      }
      for (const unit of this.units) {
        unit.despawn();
      }
      // Scale spawn radius with unit count so large armies spread out
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
