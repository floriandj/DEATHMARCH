// src/entities/Boss.ts
import type { BossConfig, BossPhaseConfig } from '@/config/progression';

export enum BossPhase {
  Vulnerable = 'vulnerable',
  Slam = 'slam',
  Charge = 'charge',
  Rocket = 'rocket',
  Barrage = 'barrage',
}

export class BossState {
  hp: number;
  phase: BossPhase;
  phaseTimer: number = 0;
  enraged: boolean = false;

  private config: BossConfig;
  private phaseIndex: number = 0;

  constructor(config: BossConfig) {
    this.config = config;
    this.hp = config.hp;
    this.phase = config.phases[0].name as BossPhase;
  }

  get isDead(): boolean {
    return this.hp <= 0;
  }

  get slamWarningDuration(): number {
    return this.enraged ? this.config.enrageWarning : this.config.slamWarning;
  }

  get chargeSpeed(): number {
    return this.enraged ? this.config.enrageChargeSpeed : this.config.chargeSpeed;
  }

  private get currentPhaseConfig(): BossPhaseConfig {
    return this.config.phases[this.phaseIndex];
  }

  private get phaseDuration(): number {
    const base = this.currentPhaseConfig.duration;
    return this.enraged ? base * this.config.enrageDurationMultiplier : base;
  }

  update(deltaMs: number): boolean {
    if (this.isDead) return false;
    this.phaseTimer += deltaMs;
    if (this.phaseTimer >= this.phaseDuration) {
      this.phaseTimer = 0;
      this.phaseIndex = (this.phaseIndex + 1) % this.config.phases.length;
      this.phase = this.config.phases[this.phaseIndex].name as BossPhase;
      return true;
    }
    return false;
  }

  takeDamage(amount: number): void {
    const reduction = this.currentPhaseConfig.damageReduction;
    const effective = amount * (1 - reduction);
    this.hp = Math.max(0, this.hp - effective);
    if (this.hp / this.config.hp <= this.config.enrageThreshold) {
      this.enraged = true;
    }
  }
}
