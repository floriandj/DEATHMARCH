// src/scenes/BossScene.ts
import Phaser from 'phaser';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  FIELD_WIDTH,
  BULLET_POOL_SIZE,
  BOSS_HP,
  SCORE_BOSS_KILL,
  SCORE_PER_SURVIVING_UNIT,
} from '@/config/GameConfig';
import { InputHandler } from '@/systems/InputHandler';
import { computeFormation } from '@/entities/Army';
import { PlayerUnit } from '@/entities/PlayerUnit';
import { Bullet } from '@/entities/Bullet';
import { BossState, BossPhase } from '@/entities/Boss';
import { HUDScene } from '@/scenes/HUDScene';

interface BossSceneData {
  score: number;
  distance: number;
  unitCount: number;
}

export class BossScene extends Phaser.Scene {
  private input_handler!: InputHandler;
  private bossState!: BossState;
  private hud!: HUDScene;

  private armyX: number = 0;
  private score: number = 0;
  private distance: number = 0;
  private unitCount: number = 0;

  private units: PlayerUnit[] = [];
  private bullets: Bullet[] = [];
  private bossSprite!: Phaser.GameObjects.Sprite;

  // Slam danger zones
  private dangerZones: Phaser.GameObjects.Rectangle[] = [];
  private slamActive: boolean = false;
  private slamZoneX: number[] = []; // X positions of danger zones

  constructor() {
    super({ key: 'BossScene' });
  }

  create(data: BossSceneData): void {
    this.score = data.score;
    this.distance = data.distance;
    this.unitCount = data.unitCount;
    this.armyX = 0;

    this.input_handler = new InputHandler(this);
    this.bossState = new BossState();

    // Boss sprite
    this.bossSprite = this.add.sprite(GAME_WIDTH / 2, 200, 'boss');
    this.bossSprite.setScale(1.5);

    // Entity pools
    this.units = [];
    for (let i = 0; i < 200; i++) {
      this.units.push(new PlayerUnit(this));
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

    // Entrance flash
    this.cameras.main.flash(300, 255, 100, 100);
  }

  update(_time: number, delta: number): void {
    if (this.bossState.isDead) return;

    // 1. Update army position
    const normalized = this.input_handler.getNormalized(GAME_WIDTH / 2);
    this.armyX = normalized * (FIELD_WIDTH / 2);
    this.respawnArmy();

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
    for (const unit of this.units) {
      if (!unit.active) continue;
      if (unit.updateFiring(delta)) {
        const bullet = this.bullets.find((b) => !b.active);
        if (bullet) {
          bullet.fire(unit.x, unit.y, this.bossSprite.x, this.bossSprite.y);
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
    this.hud.bossHpPercent = this.bossState.hp / BOSS_HP;
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
        // Hit! Kill some units
        const unitsToKill = Math.ceil(this.unitCount * 0.3);
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

  private startCharge(): void {
    // Boss charges from one side to the other
    this.chargeDirection = Math.random() < 0.5 ? -1 : 1;
    this.chargeStartX = this.chargeDirection === 1 ? 50 : GAME_WIDTH - 50;
    this.bossSprite.x = this.chargeStartX;
    this.bossSprite.y = GAME_HEIGHT - 250;
  }

  private updateCharge(delta: number): void {
    const speed = this.bossState.enraged ? 600 : 400;
    this.bossSprite.x += this.chargeDirection * speed * (delta / 1000);

    // Check collision with army
    const armyScreenX = GAME_WIDTH / 2 + this.armyX;
    const armyScreenY = GAME_HEIGHT - 200;

    if (
      Math.abs(this.bossSprite.x - armyScreenX) < 80 &&
      Math.abs(this.bossSprite.y - armyScreenY) < 100
    ) {
      const unitsToKill = Math.ceil(this.unitCount * 0.4);
      this.unitCount = Math.max(0, this.unitCount - unitsToKill);
      this.cameras.main.shake(300, 0.03);

      if (this.unitCount <= 0) {
        this.gameOver();
        return;
      }
      this.respawnArmy();
    }

    // Reset boss position when charge completes (off screen)
    if (this.bossSprite.x < -100 || this.bossSprite.x > GAME_WIDTH + 100) {
      this.bossSprite.setPosition(GAME_WIDTH / 2, 200);
    }
  }

  private respawnArmy(): void {
    for (const unit of this.units) {
      unit.despawn();
    }
    const armyScreenX = GAME_WIDTH / 2 + this.armyX;
    const armyScreenY = GAME_HEIGHT - 200;
    const positions = computeFormation(this.unitCount, armyScreenX, armyScreenY);
    for (let i = 0; i < positions.length && i < this.units.length; i++) {
      this.units[i].spawn(positions[i].x, positions[i].y);
    }
  }

  private bossDefeated(): void {
    // Death animation
    this.cameras.main.shake(500, 0.03);
    this.cameras.main.flash(500, 255, 255, 255);

    this.tweens.add({
      targets: this.bossSprite,
      alpha: 0,
      scale: 3,
      duration: 800,
      onComplete: () => {
        this.score += SCORE_BOSS_KILL;
        this.score += this.unitCount * SCORE_PER_SURVIVING_UNIT;

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
