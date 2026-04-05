// src/scenes/BossScene.ts
import Phaser from 'phaser';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  FIELD_WIDTH,
  BULLET_POOL_SIZE,
} from '@/config/GameConfig';
import { LevelManager } from '@/config/progression';
import { InputHandler } from '@/systems/InputHandler';
import { PlayerUnit } from '@/entities/PlayerUnit';
import { Bullet } from '@/entities/Bullet';
import { BossState, BossPhase } from '@/entities/Boss';
import { HUDScene } from '@/scenes/HUDScene';

interface BossSceneData {
  score: number;
  distance: number;
  unitCount: number;
  weapon: string;
}

export class BossScene extends Phaser.Scene {
  private input_handler!: InputHandler;
  private bossState!: BossState;
  private hud!: HUDScene;

  private armyX: number = 0;
  private score: number = 0;
  private distance: number = 0;
  private unitCount: number = 0;
  private activeUnitCount: number = 0;
  private currentWeapon: string = 'pistol';

  private units: PlayerUnit[] = [];
  private bullets: Bullet[] = [];
  private bossSprite!: Phaser.GameObjects.Sprite;

  // Slam danger zones
  private dangerZones: Phaser.GameObjects.Rectangle[] = [];
  private slamActive: boolean = false;
  private slamZoneX: number[] = []; // X positions of danger zones
  private entranceComplete: boolean = false;

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
    this.armyX = 0;
    this.entranceComplete = false;

    this.input_handler = new InputHandler(this);
    this.bossState = new BossState(bossCfg);

    // Boss sprite - starts off-screen, will animate in
    this.bossSprite = this.add.sprite(GAME_WIDTH / 2, -150, 'boss');
    this.bossSprite.setScale(1.5);
    this.bossSprite.setAlpha(0);
    this.bossSprite.play('boss_idle');

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
          // Impact effects: shake + flash
          this.cameras.main.shake(400, 0.04);
          this.cameras.main.flash(300, 255, 100, 100);
          this.entranceComplete = true;
        },
      });
    });
  }

  update(_time: number, delta: number): void {
    if (!this.entranceComplete) return;
    if (this.bossState.isDead) return;

    const bossCfg = LevelManager.instance.bossConfig;

    // 1. Update army position
    const normalized = this.input_handler.getNormalized(GAME_WIDTH / 2);
    this.armyX = normalized * (FIELD_WIDTH / 2);
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

    // 3. Handle charge phase
    if (this.bossState.phase === BossPhase.Charge) {
      this.updateCharge(delta);
    }

    // 5. Fire bullets at boss
    const weaponStats = LevelManager.instance.getWeaponStats(this.currentWeapon);
    for (const unit of this.units) {
      if (!unit.active) continue;
      if (unit.updateFiring(delta, weaponStats.fireRate)) {
        const bullet = this.bullets.find((b) => !b.active);
        if (bullet) {
          bullet.fire(unit.x, unit.y);
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
    this.hud.bossHpPercent = this.bossState.hp / bossCfg.hp;
  }

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
  }

  private prepareSlamZones(): void {
    // Pick 2 random X positions for danger zones, leaving 1 safe lane
    const lanes = [-200, -60, 80, 220];
    const dangerIndices = Phaser.Utils.Array.Shuffle([0, 1, 2, 3]).slice(0, 2);

    this.slamZoneX = dangerIndices.map((i) => lanes[i]);

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
    this.slamActive = true;

    // Flash zones red
    for (const zone of this.dangerZones) {
      if (zone.visible) {
        zone.setFillStyle(0xff0000, 0.6);
      }
    }

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

  private startCharge(): void {
    this.chargeHit = false;
    this.chargeDirection = Math.random() < 0.5 ? -1 : 1;
    this.chargeStartX = this.chargeDirection === 1 ? -100 : GAME_WIDTH + 100;
    this.bossSprite.x = this.chargeStartX;
    this.bossSprite.y = GAME_HEIGHT * 0.45; // mid-screen, above the army
  }

  private updateCharge(delta: number): void {
    const speed = this.bossState.chargeSpeed;
    this.bossSprite.x += this.chargeDirection * speed * (delta / 1000);

    // Charge damages units ONCE if boss passes over army's X position
    if (!this.chargeHit) {
      const armyScreenX = GAME_WIDTH / 2 + this.armyX;
      if (Math.abs(this.bossSprite.x - armyScreenX) < 60) {
        this.chargeHit = true;
        const unitsToKill = Math.max(1, Math.min(3, Math.ceil(this.unitCount * 0.05)));
        this.unitCount = Math.max(0, this.unitCount - unitsToKill);
        this.cameras.main.shake(150, 0.01);

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

  private respawnArmy(): void {
    const armyScreenX = GAME_WIDTH / 2 + this.armyX;
    const armyScreenY = GAME_HEIGHT - 200;

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
      for (let i = 0; i < this.unitCount && i < this.units.length; i++) {
        const angle = (i / this.unitCount) * Math.PI * 2;
        const radius = 10 + Math.random() * 30;
        this.units[i].spawn(
          armyScreenX + Math.cos(angle) * radius,
          armyScreenY + Math.sin(angle) * radius,
        );
      }
      this.activeUnitCount = this.unitCount;
    }

    for (const unit of this.units) {
      if (!unit.active) continue;
      unit.moveTo(armyScreenX, armyScreenY);
    }
  }

  private bossDefeated(): void {
    const level = LevelManager.instance.current;

    // Death animation
    this.cameras.main.shake(500, 0.03);
    this.cameras.main.flash(500, 255, 255, 255);

    this.tweens.add({
      targets: this.bossSprite,
      alpha: 0,
      scale: 3,
      duration: 800,
      onComplete: () => {
        this.score += level.scoring.bossKill;
        this.score += this.unitCount * level.scoring.perSurvivingUnit;

        this.scene.stop('HUDScene');
        this.scene.start('GameOverScene', {
          score: Math.floor(this.score),
          distance: Math.floor(this.distance),
          bossDefeated: true,
        });
      },
    });
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
}
