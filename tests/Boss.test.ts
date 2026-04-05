// tests/Boss.test.ts
import { describe, it, expect } from 'vitest';
import { BossState, BossPhase } from '../src/entities/Boss';

describe('BossState', () => {
  it('starts in vulnerable phase', () => {
    const boss = new BossState();
    expect(boss.phase).toBe(BossPhase.Vulnerable);
    expect(boss.hp).toBe(500);
  });

  it('takes full damage during vulnerable phase', () => {
    const boss = new BossState();
    boss.takeDamage(10);
    expect(boss.hp).toBe(490);
  });

  it('transitions to slam after vulnerable duration', () => {
    const boss = new BossState();
    boss.update(5000);
    expect(boss.phase).toBe(BossPhase.Slam);
  });

  it('takes reduced damage during slam phase', () => {
    const boss = new BossState();
    boss.update(5000);
    boss.takeDamage(10);
    expect(boss.hp).toBe(500 - 5);
  });

  it('transitions slam -> charge -> vulnerable', () => {
    const boss = new BossState();
    boss.update(5000);
    expect(boss.phase).toBe(BossPhase.Slam);
    boss.update(3000);
    expect(boss.phase).toBe(BossPhase.Charge);
    boss.update(4000);
    expect(boss.phase).toBe(BossPhase.Vulnerable);
  });

  it('takes zero damage during charge (invulnerable)', () => {
    const boss = new BossState();
    boss.update(5000);
    boss.update(3000);
    boss.takeDamage(100);
    expect(boss.hp).toBe(500);
  });

  it('enters enrage when HP drops below 20%', () => {
    const boss = new BossState();
    boss.takeDamage(410);
    expect(boss.enraged).toBe(true);
  });

  it('enrage shortens slam warning duration', () => {
    const boss = new BossState();
    expect(boss.slamWarningDuration).toBe(1500);
    boss.takeDamage(410);
    expect(boss.slamWarningDuration).toBe(800);
  });

  it('is dead when HP reaches 0', () => {
    const boss = new BossState();
    boss.takeDamage(500);
    expect(boss.hp).toBe(0);
    expect(boss.isDead).toBe(true);
  });

  it('phase timer resets on transition', () => {
    const boss = new BossState();
    boss.update(3000);
    expect(boss.phase).toBe(BossPhase.Vulnerable);
    boss.update(2000);
    expect(boss.phase).toBe(BossPhase.Slam);
    boss.update(1000);
    expect(boss.phase).toBe(BossPhase.Slam);
  });
});
