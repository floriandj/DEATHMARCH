// src/scenes/BossScene.ts
import Phaser from 'phaser';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  FIELD_WIDTH,
  BULLET_POOL_SIZE,
  ARMY_INPUT_Y_RANGE,
  ARMY_Y_OFFSET_MAX,
} from '@/config/GameConfig';
import { LevelManager } from '@/config/progression';
import { InputHandler } from '@/systems/InputHandler';
import { PlayerUnit } from '@/entities/PlayerUnit';
import { Bullet } from '@/entities/Bullet';
import { BossState, BossPhase } from '@/entities/Boss';
import { HUDScene } from '@/scenes/HUDScene';
import { SoundManager } from '@/systems/SoundManager';
import { WalletManager } from '@/systems/WalletManager';

interface BossSceneData {
  score: number;
  distance: number;
  unitCount: number;
  weapon: string;
  levelGold: number;
  pouchGold: number;
}

export class BossScene extends Phaser.Scene {
  private input_handler!: InputHandler;
  private bossState!: BossState;
  private hud!: HUDScene;

  private armyX: number = 0;
  private armyYOffset: number = 0;
  private score: number = 0;
  private distance: number = 0;
  private unitCount: number = 0;
  private activeUnitCount: number = 0;
  private currentWeapon: string = 'pistol';
  private levelGold: number = 0;
  private pouchGold: number = 0;

  private units: PlayerUnit[] = [];
  private bullets: Bullet[] = [];
  private bossSprite!: Phaser.GameObjects.Sprite;
  private scaledBossHp: number = 0;

  // Slam danger zones
  private dangerZones: Phaser.GameObjects.Rectangle[] = [];
  private slamActive: boolean = false;
  private slamZoneX: number[] = []; // X positions of danger zones
  private entranceComplete: boolean = false;
  private shootSoundTimer: number = 0;

  // Boss visual config
  private bossScale: number = 1.5;

  // Boss projectiles (rockets + barrage)
  private bossProjectiles: { sprite: Phaser.GameObjects.Sprite; vx: number; vy: number; type: 'rocket' | 'barrage'; radius: number }[] = [];
  private rocketTimer: number = 0;
  private rocketsFired: number = 0;
  private barrageTimer: number = 0;

  // VFX tracking
  private enrageTriggered: boolean = false;
  private chargeTrailTimer: number = 0;
  private bossAuraParticles: Phaser.GameObjects.Sprite[] = [];
  private auraTimer: number = 0;

  constructor() {
    super({ key: 'BossScene' });
  }

  create(data: BossSceneData): void {
    const bossCfg = LevelManager.instance.bossConfig;

    this.score = data.score;
    this.distance = data.distance;
    this.unitCount = data.unitCount;
    this.activeUnitCount = 0;
    this.currentWeapon = data.weapon || LevelManager.instance.current.startingWeapon;
    this.levelGold = data.levelGold || 0;
    this.pouchGold = data.pouchGold || 0;
    this.armyX = 0;
    this.armyYOffset = 0;
    this.entranceComplete = false;
    this.enrageTriggered = false;
    this.chargeTrailTimer = 0;
    this.bossAuraParticles = [];
    this.auraTimer = 0;
    this.bossProjectiles = [];
    this.rocketTimer = 0;
    this.rocketsFired = 0;
    this.barrageTimer = 0;

    this.input_handler = new InputHandler(this);

    // Scale boss HP with army size so large armies don't instantly melt the boss
    const baseUnits = 30;
    const hpScale = Math.max(1, this.unitCount / baseUnits);
    const scaledBossCfg = { ...bossCfg, hp: Math.ceil(bossCfg.hp * hpScale) };
    this.scaledBossHp = scaledBossCfg.hp;
    this.bossState = new BossState(scaledBossCfg);

    // Boss sprite - starts off-screen, will animate in
    const bossSpriteKey = bossCfg.sprite || 'boss';
    this.bossScale = bossCfg.scale ?? 1.5;
    this.bossSprite = this.add.sprite(GAME_WIDTH / 2, -150, bossSpriteKey);
    this.bossSprite.setScale(this.bossScale);
    this.bossSprite.setAlpha(0);
    const bossAnimKey = `${bossSpriteKey}_idle`;
    if (this.anims.exists(bossAnimKey)) {
      this.bossSprite.play(bossAnimKey);
    } else {
      this.bossSprite.play('boss_idle');
    }
    // Apply tint if specified
    if (bossCfg.tint) {
      const tintColor = parseInt(bossCfg.tint.replace('#', ''), 16);
      this.bossSprite.setTint(tintColor);
    }

    // Entity pools
    this.units = [];
    for (let i = 0; i < 200; i++) {
      this.units.push(new PlayerUnit(this, i));
    }
    this.bullets = [];
    for (let i = 0; i < BULLET_POOL_SIZE; i++) {
      this.bullets.push(new Bullet(this));
    }

    // Danger zone rectangles (for slam phase)
    this.dangerZones = [];
    for (let i = 0; i < 3; i++) {
      const zone = this.add.rectangle(0, GAME_HEIGHT - 300, 150, 300, 0xff0000, 0.3);
      zone.setVisible(false);
      zone.setOrigin(0.5, 0);
      this.dangerZones.push(zone);
    }

    // Start HUD
    this.scene.launch('HUDScene');
    this.hud = this.scene.get('HUDScene') as HUDScene;
    this.hud.bossHpPercent = 1;
    this.hud.bossName = bossCfg.name || 'BOSS';

    this.respawnArmy();

    // Boss entrance sequence: fade in from black, then boss drops into frame
    this.cameras.main.fadeIn(1000, 0, 0, 0);

    // Pause before boss enters
    this.time.delayedCall(1200, () => {
      // Boss fades in and drops down with impact
      this.bossSprite.setAlpha(1);
      this.tweens.add({
        targets: this.bossSprite,
        y: 200,
        duration: 900,
        ease: 'Bounce.easeOut',
        onComplete: () => {
          // Impact effects: shake + flash + ground impact particles
          this.cameras.main.shake(400, 0.04);
          this.cameras.main.flash(300, 255, 100, 100);
          this.spawnImpactParticles(this.bossSprite.x, this.bossSprite.y + 40, 12, 0xff4400);
          this.entranceComplete = true;
        },
      });
    });
  }

  update(_time: number, delta: number): void {
    if (!this.entranceComplete) return;
    if (this.bossState.isDead) return;

    const bossCfg = LevelManager.instance.bossConfig;

    // 1. Update army position (X + Y, same as GameScene)
    const normalized = this.input_handler.getNormalized(GAME_WIDTH / 2);
    this.armyX = normalized * (FIELD_WIDTH / 2);
    const normalizedY = this.input_handler.getNormalizedY(ARMY_INPUT_Y_RANGE);
    this.armyYOffset = normalizedY * ARMY_Y_OFFSET_MAX;
    this.respawnArmy();

    // 1b. Unit physics
    for (const unit of this.units) {
      unit.updatePhysics(delta, this.units);
    }

    // 2. Update boss phase
    const phaseChanged = this.bossState.update(delta);
    if (phaseChanged) {
      this.onPhaseChange();
    }

    // 2b. Enrage burst VFX (trigger once)
    if (this.bossState.enraged && !this.enrageTriggered) {
      this.enrageTriggered = true;
      this.playEnrageBurst();
    }

    // 2c. Enrage aura particles (continuous when enraged)
    if (this.bossState.enraged) {
      this.auraTimer += delta;
      if (this.auraTimer > 120) {
        this.auraTimer = 0;
        this.spawnAuraParticle();
      }
    }

    // 3. Handle charge phase
    if (this.bossState.phase === BossPhase.Charge) {
      this.updateCharge(delta);
    }

    // 3b. Handle rocket phase — fire rockets at timed intervals
    if (this.bossState.phase === BossPhase.Rocket) {
      this.rocketTimer += delta;
      const rocketInterval = this.bossState.enraged ? 600 : 900;
      const maxRockets = this.bossState.enraged ? 4 : 3;
      if (this.rocketTimer >= rocketInterval && this.rocketsFired < maxRockets) {
        this.rocketTimer = 0;
        this.rocketsFired++;
        this.fireRocket();
      }
    }

    // 3c. Handle barrage phase — rapid small shots
    if (this.bossState.phase === BossPhase.Barrage) {
      this.barrageTimer += delta;
      const barrageInterval = this.bossState.enraged ? 120 : 200;
      if (this.barrageTimer >= barrageInterval) {
        this.barrageTimer = 0;
        this.fireBarrageShot();
      }
    }

    // 3d. Update boss projectiles
    this.updateBossProjectiles(delta);

    // 5. Fire bullets at boss
    const weaponStats = LevelManager.instance.getWeaponStats(this.currentWeapon);
    this.shootSoundTimer += delta;
    for (const unit of this.units) {
      if (!unit.active) continue;
      if (unit.updateFiring(delta, weaponStats.fireRate)) {
        const bullet = this.bullets.find((b) => !b.active);
        if (bullet) {
          bullet.fire(unit.x, unit.y);
          if (this.shootSoundTimer > 150) {
            SoundManager.play(`shoot_${this.currentWeapon}`);
            this.shootSoundTimer = 0;
          }
        }
      }
    }

    // 6. Update bullets
    for (const bullet of this.bullets) {
      if (!bullet.active) continue;
      bullet.updateMovement(delta);

      // Off-screen
      if (bullet.y < -50) {
        bullet.despawn();
        continue;
      }

      // Hit boss
      const dx = bullet.x - this.bossSprite.x;
      const dy = bullet.y - this.bossSprite.y;
      if (Math.sqrt(dx * dx + dy * dy) < 50) {
        bullet.despawn();
        this.bossState.takeDamage(bullet.damage);
        SoundManager.play('boss_hit');

        // Hit spark VFX
        this.spawnHitSpark(bullet.x, bullet.y);

        // Flash boss on hit
        this.bossSprite.setTint(0xffffff);
        this.time.delayedCall(30, () => {
          if (!this.bossState.isDead) {
            this.bossSprite.clearTint();
            if (this.bossState.enraged) {
              this.bossSprite.setTint(0xff4040);
            }
          }
        });

        if (this.bossState.isDead) {
          this.bossDefeated();
          return;
        }
      }
    }

    // 7. Update HUD
    this.hud.score = Math.floor(this.score);
    this.hud.distance = this.distance;
    this.hud.unitCount = this.unitCount;
    this.hud.bossHpPercent = this.bossState.hp / this.scaledBossHp;
  }

  // ---------- VFX Methods ----------

  /** Small spark burst when a bullet hits the boss */
  private spawnHitSpark(x: number, y: number): void {
    const count = 3;
    for (let i = 0; i < count; i++) {
      const p = this.add.sprite(x, y, 'vfx_spark');
      p.setTint(this.bossState.enraged ? 0xff4400 : 0xffcc00);
      p.setAlpha(1);
      const angle = Math.random() * Math.PI * 2;
      const dist = 8 + Math.random() * 12;
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.3,
        duration: 150 + Math.random() * 100,
        onComplete: () => p.destroy(),
      });
    }
  }

  /** Ground impact particles (entrance + slam) */
  private spawnImpactParticles(x: number, y: number, count: number, color: number): void {
    for (let i = 0; i < count; i++) {
      const p = this.add.sprite(x, y, 'vfx_ring');
      p.setTint(color);
      p.setAlpha(0.9);
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const dist = 30 + Math.random() * 50;
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist * 0.4, // flatten vertically for ground effect
        alpha: 0,
        scale: 0.2,
        duration: 400 + Math.random() * 200,
        onComplete: () => p.destroy(),
      });
    }
  }

  /** Charge trail particles emitted behind the boss during charge */
  private spawnChargeTrail(): void {
    const x = this.bossSprite.x - this.chargeDirection * 20;
    const y = this.bossSprite.y + (Math.random() - 0.5) * 30;
    const p = this.add.sprite(x, y, 'vfx_trail');
    p.setTint(this.bossState.enraged ? 0xff0000 : 0xff6600);
    p.setAlpha(0.8);
    p.setScale(0.8 + Math.random() * 0.6);
    this.tweens.add({
      targets: p,
      x: x - this.chargeDirection * (15 + Math.random() * 15),
      alpha: 0,
      scale: 0.1,
      duration: 300 + Math.random() * 200,
      onComplete: () => p.destroy(),
    });
  }

  /** Explosive burst when boss enters enrage mode */
  private playEnrageBurst(): void {
    SoundManager.play('boss_enrage');
    this.cameras.main.shake(500, 0.05);
    this.cameras.main.flash(400, 255, 50, 50);

    const x = this.bossSprite.x;
    const y = this.bossSprite.y;
    const count = 20;
    for (let i = 0; i < count; i++) {
      const p = this.add.sprite(x, y, 'vfx_burst');
      p.setTint(i % 2 === 0 ? 0xff0000 : 0xff4400);
      p.setAlpha(1);
      p.setScale(1 + Math.random() * 0.5);
      const angle = (i / count) * Math.PI * 2;
      const dist = 40 + Math.random() * 60;
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.1,
        duration: 500 + Math.random() * 300,
        onComplete: () => p.destroy(),
      });
    }

    // Boss pulse scale effect
    this.tweens.add({
      targets: this.bossSprite,
      scale: this.bossScale * 1.33,
      duration: 200,
      yoyo: true,
      ease: 'Power2',
      onComplete: () => {
        this.bossSprite.setScale(this.bossScale);
        this.bossSprite.setTint(0xff4040);
      },
    });
  }

  /** Continuous floating aura particle around enraged boss */
  private spawnAuraParticle(): void {
    const angle = Math.random() * Math.PI * 2;
    const radius = 40 + Math.random() * 20;
    const x = this.bossSprite.x + Math.cos(angle) * radius;
    const y = this.bossSprite.y + Math.sin(angle) * radius;
    const p = this.add.sprite(x, y, 'vfx_burst');
    p.setTint(Math.random() > 0.5 ? 0xff0000 : 0xff4400);
    p.setAlpha(0.6);
    p.setScale(0.4 + Math.random() * 0.4);
    this.tweens.add({
      targets: p,
      y: y - 20 - Math.random() * 20,
      alpha: 0,
      scale: 0.1,
      duration: 400 + Math.random() * 300,
      onComplete: () => p.destroy(),
    });
  }

  // ---------- Phase handling ----------

  private onPhaseChange(): void {
    // Clean up previous phase visuals
    this.hideDangerZones();
    this.slamActive = false;

    if (this.bossState.phase === BossPhase.Slam) {
      this.prepareSlamZones();
    }

    if (this.bossState.phase === BossPhase.Charge) {
      this.startCharge();
    }

    if (this.bossState.phase === BossPhase.Rocket) {
      this.rocketTimer = 0;
      this.rocketsFired = 0;
      // Move boss to center for rocket attack
      this.tweens.add({
        targets: this.bossSprite,
        x: GAME_WIDTH / 2,
        y: 180,
        duration: 400,
        ease: 'Power2',
      });
    }

    if (this.bossState.phase === BossPhase.Barrage) {
      this.barrageTimer = 0;
      this.tweens.add({
        targets: this.bossSprite,
        x: GAME_WIDTH / 2,
        y: 200,
        duration: 300,
        ease: 'Power2',
      });
    }

    // Phase transition flash
    if (this.bossState.phase === BossPhase.Vulnerable) {
      this.cameras.main.flash(150, 100, 100, 255, true);
    }
  }

  private prepareSlamZones(): void {
    // Pick 2 random X positions for danger zones, leaving 1 safe lane
    const lanes = [-200, -60, 80, 220];
    const dangerIndices = Phaser.Utils.Array.Shuffle([0, 1, 2, 3]).slice(0, 2);

    this.slamZoneX = dangerIndices.map((i: number) => lanes[i]);

    for (let i = 0; i < this.slamZoneX.length && i < this.dangerZones.length; i++) {
      this.dangerZones[i].setPosition(GAME_WIDTH / 2 + this.slamZoneX[i], GAME_HEIGHT - 400);
      this.dangerZones[i].setVisible(true);
      this.dangerZones[i].setAlpha(0.3);

      // Flash warning
      this.tweens.add({
        targets: this.dangerZones[i],
        alpha: 0.6,
        duration: 200,
        yoyo: true,
        repeat: 3,
      });
    }

    // Schedule the actual slam hit
    this.time.delayedCall(this.bossState.slamWarningDuration, () => {
      if (this.bossState.phase === BossPhase.Slam) {
        this.executeSlamDamage();
      }
    });
  }

  private executeSlamDamage(): void {
    SoundManager.play('boss_slam');
    this.slamActive = true;

    // Flash zones red
    for (const zone of this.dangerZones) {
      if (zone.visible) {
        zone.setFillStyle(0xff0000, 0.6);
      }
    }

    // Slam impact VFX: shockwave particles along danger zones
    for (const zoneX of this.slamZoneX) {
      const impactX = GAME_WIDTH / 2 + zoneX;
      const impactY = GAME_HEIGHT - 250;
      this.spawnImpactParticles(impactX, impactY, 8, 0xff2200);
    }
    this.cameras.main.shake(250, 0.025);

    // Check if army is in a danger zone
    const armyScreenX = GAME_WIDTH / 2 + this.armyX;
    for (const zoneX of this.slamZoneX) {
      const zoneCenterX = GAME_WIDTH / 2 + zoneX;
      if (Math.abs(armyScreenX - zoneCenterX) < 100) {
        // Hit! Kill a few units (flat amount, not percentage)
        const unitsToKill = Math.max(1, Math.min(5, Math.ceil(this.unitCount * 0.05)));
        this.unitCount = Math.max(0, this.unitCount - unitsToKill);

        this.cameras.main.shake(200, 0.02);

        if (this.unitCount <= 0) {
          this.gameOver();
          return;
        }
        this.respawnArmy();
        break;
      }
    }
  }

  private hideDangerZones(): void {
    for (const zone of this.dangerZones) {
      zone.setVisible(false);
      zone.setFillStyle(0xff0000, 0.3);
    }
  }

  private chargeDirection: number = 1;
  private chargeStartX: number = 0;
  private chargeHit: boolean = false;
  private chargeWarning: boolean = false;

  private startCharge(): void {
    SoundManager.play('boss_charge');
    this.chargeHit = false;
    this.chargeWarning = true;
    this.chargeTrailTimer = 0;
    this.chargeDirection = Math.random() < 0.5 ? -1 : 1;
    this.chargeStartX = this.chargeDirection === 1 ? -100 : GAME_WIDTH + 100;
    this.bossSprite.x = this.chargeStartX;
    this.bossSprite.y = GAME_HEIGHT * 0.45;

    // Show warning line across the charge path for 600ms before boss moves
    const warningY = this.bossSprite.y;
    const warningLine = this.add.rectangle(GAME_WIDTH / 2, warningY, GAME_WIDTH, 60, 0xff0000, 0.15);
    const warningText = this.add.text(GAME_WIDTH / 2, warningY, '! CHARGE !', {
      fontSize: '20px', color: '#ff4444', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0.7);

    // Flash the warning
    this.tweens.add({
      targets: [warningLine, warningText],
      alpha: 0,
      duration: 150,
      yoyo: true,
      repeat: 2,
    });

    // After warning delay, start actual charge
    this.time.delayedCall(600, () => {
      warningLine.destroy();
      warningText.destroy();
      this.chargeWarning = false;
      this.cameras.main.flash(100, 255, 100, 0, true);
    });
  }

  private updateCharge(delta: number): void {
    // Don't move during warning phase — give player time to dodge
    if (this.chargeWarning) return;

    const speed = this.bossState.chargeSpeed;
    this.bossSprite.x += this.chargeDirection * speed * (delta / 1000);

    // Emit charge trail particles
    this.chargeTrailTimer += delta;
    if (this.chargeTrailTimer > 40) {
      this.chargeTrailTimer = 0;
      this.spawnChargeTrail();
    }

    // Charge damages units ONCE if boss passes over army's X position
    if (!this.chargeHit) {
      const armyScreenX = GAME_WIDTH / 2 + this.armyX;
      if (Math.abs(this.bossSprite.x - armyScreenX) < 60) {
        this.chargeHit = true;
        const unitsToKill = Math.max(1, Math.min(3, Math.ceil(this.unitCount * 0.05)));
        this.unitCount = Math.max(0, this.unitCount - unitsToKill);
        this.cameras.main.shake(150, 0.01);

        // Charge hit impact particles
        this.spawnImpactParticles(armyScreenX, GAME_HEIGHT - 200, 10, 0xff6600);

        if (this.unitCount <= 0) {
          this.gameOver();
          return;
        }
        this.respawnArmy();
      }
    }

    // Reset boss position when charge completes (off screen)
    if (
      (this.chargeDirection === 1 && this.bossSprite.x > GAME_WIDTH + 100) ||
      (this.chargeDirection === -1 && this.bossSprite.x < -100)
    ) {
      this.bossSprite.setPosition(GAME_WIDTH / 2, 200);
    }
  }

  // ---------- Boss projectile attacks ----------

  private fireRocket(): void {
    SoundManager.play('boss_rocket_launch');

    const armyScreenX = GAME_WIDTH / 2 + this.armyX;
    const armyScreenY = GAME_HEIGHT - 200 + this.armyYOffset;

    // Create rocket sprite
    const rocket = this.add.sprite(this.bossSprite.x, this.bossSprite.y + 30, 'vfx_ring');
    rocket.setTint(0xff4400);
    rocket.setScale(2.5);
    rocket.setAlpha(0.9);

    // Aim at army with some spread
    const spread = (Math.random() - 0.5) * 120;
    const targetX = armyScreenX + spread;
    const targetY = armyScreenY;
    const dx = targetX - rocket.x;
    const dy = targetY - rocket.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = 250;

    this.bossProjectiles.push({
      sprite: rocket,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      type: 'rocket',
      radius: 70,
    });

    // Trail effect on rocket
    const trailTimer = this.time.addEvent({
      delay: 40,
      repeat: -1,
      callback: () => {
        if (!rocket.active) { trailTimer.destroy(); return; }
        const t = this.add.sprite(rocket.x, rocket.y, 'vfx_trail');
        t.setTint(0xff6600);
        t.setAlpha(0.6);
        t.setScale(1.5);
        this.tweens.add({
          targets: t, alpha: 0, scale: 0.3,
          duration: 200, onComplete: () => t.destroy(),
        });
      },
    });
  }

  private fireBarrageShot(): void {
    SoundManager.play('boss_barrage');

    const armyScreenX = GAME_WIDTH / 2 + this.armyX;
    const armyScreenY = GAME_HEIGHT - 200 + this.armyYOffset;

    const shot = this.add.sprite(this.bossSprite.x, this.bossSprite.y + 20, 'vfx_spark');
    shot.setTint(0xff00ff);
    shot.setScale(2);
    shot.setAlpha(0.8);

    // Aim with wider spread
    const spread = (Math.random() - 0.5) * 200;
    const targetX = armyScreenX + spread;
    const targetY = armyScreenY + (Math.random() - 0.5) * 60;
    const dx = targetX - shot.x;
    const dy = targetY - shot.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = 350;

    this.bossProjectiles.push({
      sprite: shot,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      type: 'barrage',
      radius: 30,
    });
  }

  private updateBossProjectiles(delta: number): void {
    const dt = delta / 1000;
    const armyScreenX = GAME_WIDTH / 2 + this.armyX;
    const armyScreenY = GAME_HEIGHT - 200 + this.armyYOffset;

    for (let i = this.bossProjectiles.length - 1; i >= 0; i--) {
      const proj = this.bossProjectiles[i];
      if (!proj.sprite.active) {
        this.bossProjectiles.splice(i, 1);
        continue;
      }

      proj.sprite.x += proj.vx * dt;
      proj.sprite.y += proj.vy * dt;

      // Off-screen cleanup
      if (proj.sprite.y > GAME_HEIGHT + 50 || proj.sprite.y < -50 ||
          proj.sprite.x < -50 || proj.sprite.x > GAME_WIDTH + 50) {
        proj.sprite.destroy();
        this.bossProjectiles.splice(i, 1);
        continue;
      }

      // Check impact with army area
      const dx = proj.sprite.x - armyScreenX;
      const dy = proj.sprite.y - armyScreenY;
      const distToArmy = Math.sqrt(dx * dx + dy * dy);

      if (proj.type === 'rocket' && distToArmy < proj.radius) {
        // Rocket explodes — kill some units + stun nearby
        this.rocketExplode(proj.sprite.x, proj.sprite.y);
        proj.sprite.destroy();
        this.bossProjectiles.splice(i, 1);
      } else if (proj.type === 'barrage') {
        // Barrage shots check against individual units
        for (const unit of this.units) {
          if (!unit.active) continue;
          const ux = proj.sprite.x - unit.x;
          const uy = proj.sprite.y - unit.y;
          if (Math.sqrt(ux * ux + uy * uy) < 20) {
            // Hit a unit — stun it briefly
            unit.stun(800);
            SoundManager.play('stun_hit');
            // Small impact spark
            this.spawnHitSpark(proj.sprite.x, proj.sprite.y);
            proj.sprite.destroy();
            this.bossProjectiles.splice(i, 1);
            break;
          }
        }
      }
    }
  }

  private rocketExplode(x: number, y: number): void {
    SoundManager.play('boss_rocket_explode');
    this.cameras.main.shake(300, 0.025);

    // Explosion VFX
    this.spawnImpactParticles(x, y, 10, 0xff4400);
    this.spawnImpactParticles(x, y, 6, 0xffaa00);

    // Kill 1-2 units
    const unitsToKill = Math.max(1, Math.min(2, Math.ceil(this.unitCount * 0.04)));
    this.unitCount = Math.max(0, this.unitCount - unitsToKill);

    // Stun nearby surviving units for 1.2 seconds
    for (const unit of this.units) {
      if (!unit.active) continue;
      const dx = unit.x - x;
      const dy = unit.y - y;
      if (Math.sqrt(dx * dx + dy * dy) < 100) {
        unit.stun(1200);
      }
    }

    if (this.unitCount <= 0) {
      this.gameOver();
      return;
    }
    this.respawnArmy();
  }

  // ---------- Army management ----------

  private respawnArmy(): void {
    const armyScreenX = GAME_WIDTH / 2 + this.armyX;
    const armyScreenY = GAME_HEIGHT - 200 + this.armyYOffset;

    if (this.unitCount !== this.activeUnitCount) {
      const shrinking = this.unitCount < this.activeUnitCount;
      if (shrinking) {
        let effectsPlayed = 0;
        for (let i = this.units.length - 1; i >= 0 && effectsPlayed < this.activeUnitCount - this.unitCount; i--) {
          if (this.units[i].active) {
            this.units[i].despawnWithEffect();
            effectsPlayed++;
          }
        }
      }
      for (const unit of this.units) {
        unit.despawn();
      }
      const spawnRadius = Math.min(FIELD_WIDTH * 0.45, 20 + Math.sqrt(this.unitCount) * 8);
      for (let i = 0; i < this.unitCount && i < this.units.length; i++) {
        const angle = (i / this.unitCount) * Math.PI * 2;
        const radius = spawnRadius * 0.3 + Math.random() * spawnRadius * 0.7;
        this.units[i].spawn(
          armyScreenX + Math.cos(angle) * radius,
          armyScreenY + Math.sin(angle) * radius,
        );
      }
      this.activeUnitCount = this.unitCount;
    }

    const formationRadius = Math.min(FIELD_WIDTH * 0.45, 20 + Math.sqrt(this.unitCount) * 8);
    let activeIdx = 0;
    for (const unit of this.units) {
      if (!unit.active) continue;
      const angle = (activeIdx / this.activeUnitCount) * Math.PI * 2;
      const r = formationRadius * 0.4 + (activeIdx % 5) * formationRadius * 0.12;
      unit.moveTo(
        armyScreenX + Math.cos(angle) * r,
        armyScreenY + Math.sin(angle) * r,
      );
      activeIdx++;
    }
  }

  // ---------- End states ----------

  private bossDefeated(): void {
    SoundManager.play('boss_death');
    const level = LevelManager.instance.current;

    // Epic death explosion — multi-wave particle burst
    const x = this.bossSprite.x;
    const y = this.bossSprite.y;

    // Wave 1: Immediate burst
    this.cameras.main.shake(600, 0.04);
    this.cameras.main.flash(500, 255, 255, 255);
    this.spawnDeathExplosion(x, y, 16, 0xff4400);

    // Wave 2: Delayed secondary burst
    this.time.delayedCall(200, () => {
      this.spawnDeathExplosion(x, y, 12, 0xffcc00);
      this.cameras.main.shake(400, 0.03);
    });

    // Wave 3: Final white burst
    this.time.delayedCall(450, () => {
      this.spawnDeathExplosion(x, y, 20, 0xffffff);
      this.cameras.main.flash(300, 255, 200, 100);
    });

    this.tweens.add({
      targets: this.bossSprite,
      alpha: 0,
      scale: 3,
      duration: 800,
      onComplete: () => {
        this.score += level.scoring.bossKill;
        this.score += this.unitCount * level.scoring.perSurvivingUnit;

        this.scene.stop('HUDScene');
        const goldEarned = WalletManager.earnLevelGold(this.levelGold, this.pouchGold);
        this.scene.start('GameOverScene', {
          score: Math.floor(this.score),
          distance: Math.floor(this.distance),
          bossDefeated: true,
          goldEarned,
        });
      },
    });
  }

  /** Multi-particle explosion burst for boss death */
  private spawnDeathExplosion(x: number, y: number, count: number, color: number): void {
    for (let i = 0; i < count; i++) {
      const textures = ['vfx_spark', 'vfx_burst', 'vfx_ring', 'death_particle'];
      const tex = textures[Math.floor(Math.random() * textures.length)];
      const p = this.add.sprite(x, y, tex);
      p.setTint(color);
      p.setAlpha(1);
      p.setScale(1 + Math.random() * 1.5);
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const dist = 50 + Math.random() * 100;
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.1,
        duration: 500 + Math.random() * 400,
        ease: 'Power2',
        onComplete: () => p.destroy(),
      });
    }
  }

  private gameOver(): void {
    SoundManager.play('defeat');
    this.input_handler.destroy();
    this.scene.stop('HUDScene');
    const goldEarned = WalletManager.earnLevelGold(this.levelGold, Math.floor(this.pouchGold * 0.5));
    this.scene.start('GameOverScene', {
      score: Math.floor(this.score),
      distance: Math.floor(this.distance),
      bossDefeated: false,
      goldEarned,
    });
  }
}
