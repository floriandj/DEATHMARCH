// src/entities/Boss.ts
import {
  BOSS_HP,
  BOSS_VULNERABLE_DURATION,
  BOSS_SLAM_DURATION,
  BOSS_SLAM_WARNING,
  BOSS_CHARGE_DURATION,
  BOSS_ENRAGE_THRESHOLD,
  BOSS_ENRAGE_WARNING,
  BOSS_DAMAGE_REDUCTION_SLAM,
} from '@/config/GameConfig';

export enum BossPhase {
  Vulnerable = 'vulnerable',
  Slam = 'slam',
  Charge = 'charge',
}

const PHASE_ORDER: BossPhase[] = [
  BossPhase.Vulnerable,
  BossPhase.Slam,
  BossPhase.Charge,
];

export class BossState {
  hp: number = BOSS_HP;
  phase: BossPhase = BossPhase.Vulnerable;
  phaseTimer: number = 0;
  enraged: boolean = false;

  get isDead(): boolean {
    return this.hp <= 0;
  }

  get slamWarningDuration(): number {
    return this.enraged ? BOSS_ENRAGE_WARNING : BOSS_SLAM_WARNING;
  }

  private get phaseDuration(): number {
    const base = {
      [BossPhase.Vulnerable]: BOSS_VULNERABLE_DURATION,
      [BossPhase.Slam]: BOSS_SLAM_DURATION,
      [BossPhase.Charge]: BOSS_CHARGE_DURATION,
    }[this.phase];

    return this.enraged ? base / 2 : base;
  }

  update(deltaMs: number): boolean {
    if (this.isDead) return false;
    this.phaseTimer += deltaMs;
    if (this.phaseTimer >= this.phaseDuration) {
      this.phaseTimer = 0;
      const currentIndex = PHASE_ORDER.indexOf(this.phase);
      this.phase = PHASE_ORDER[(currentIndex + 1) % PHASE_ORDER.length];
      return true;
    }
    return false;
  }

  takeDamage(amount: number): void {
    let effective = amount;
    if (this.phase === BossPhase.Charge) {
      effective = 0;
    } else if (this.phase === BossPhase.Slam) {
      effective = amount * BOSS_DAMAGE_REDUCTION_SLAM;
    }
    this.hp = Math.max(0, this.hp - effective);
    if (this.hp / BOSS_HP <= BOSS_ENRAGE_THRESHOLD) {
      this.enraged = true;
    }
  }
}
