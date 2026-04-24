import { describe, it, expect, beforeEach } from 'vitest';
import { WaveSpawner } from '../src/systems/WaveSpawner';
import { LevelManager } from '../src/config/progression';

describe('WaveSpawner', () => {
  beforeEach(() => {
    LevelManager.reset();
  });

  it('produces spawn commands based on distance', () => {
    const spawner = new WaveSpawner();
    const mgr = LevelManager.instance;
    const trigger = mgr.bossConfig.triggerDistance;
    // Sweep through the whole level; expect at least one spawn with a defined type + x.
    const allSpawns = [];
    for (let d = 0; d < trigger; d += 50) {
      allSpawns.push(...spawner.update(d));
    }
    expect(allSpawns.length).toBeGreaterThan(0);
    for (const s of allSpawns) {
      expect(typeof s.type).toBe('string');
      expect(s.type.length).toBeGreaterThan(0);
      expect(typeof s.x).toBe('number');
    }
  });

  it('only spawns first enemy type before second enemy appears', () => {
    const spawner = new WaveSpawner();
    const mgr = LevelManager.instance;
    const enemies = Object.values(mgr.enemies);
    // Find the distance at which the second enemy type appears
    const sorted = [...enemies].sort((a, b) => a.appearsAtDistance - b.appearsAtDistance);
    const secondAppears = sorted[1]?.appearsAtDistance ?? 500;
    const safeDistance = Math.max(50, secondAppears - 50);

    const allSpawns = [];
    for (let d = 10; d <= safeDistance; d += 10) {
      allSpawns.push(...spawner.update(d));
    }
    for (const s of allSpawns) {
      expect(s.type).toBe(sorted[0].type);
    }
  });

  it('can spawn second enemy type after its intro distance', () => {
    const mgr = LevelManager.instance;
    const trigger = mgr.bossConfig.triggerDistance;
    const enemies = Object.values(mgr.enemies);
    const sorted = [...enemies].sort((a, b) => a.appearsAtDistance - b.appearsAtDistance);
    const secondType = sorted[1]?.type;
    expect(secondType).toBeDefined();

    // Run the whole level to exercise the random pick. Spawn density + weight
    // ramp guarantees the second-tier enemy appears at some point before the boss.
    const spawner = new WaveSpawner();
    const types = new Set<string>();
    for (let d = 0; d <= trigger - 10; d += 5) {
      for (const s of spawner.update(d)) {
        types.add(s.type);
      }
    }
    expect(types.has(secondType!)).toBe(true);
  });

  it('increases spawn density with distance', () => {
    // Compare an early bracket window vs a late bracket window, sized relative
    // to this level's actual trigger distance so the test is config-agnostic.
    const trigger = LevelManager.instance.bossConfig.triggerDistance;
    const windowSize = Math.round(trigger * 0.15);

    const earlySpawner = new WaveSpawner();
    let earlyCount = 0;
    const earlyWindowEnd = Math.round(trigger * 0.25);
    for (let d = 0; d <= earlyWindowEnd; d += 5) {
      earlyCount += earlySpawner.update(d).length;
    }

    const lateSpawner = new WaveSpawner();
    // Advance the late spawner up to the start of the late window first
    const lateWindowStart = Math.round(trigger * 0.75);
    for (let d = 0; d <= lateWindowStart; d += 5) {
      lateSpawner.update(d);
    }
    let lateCount = 0;
    for (let d = lateWindowStart + 5; d <= lateWindowStart + windowSize; d += 5) {
      lateCount += lateSpawner.update(d).length;
    }

    expect(lateCount).toBeGreaterThan(earlyCount);
  });

  it('stops spawning after boss trigger distance', () => {
    const spawner = new WaveSpawner();
    const mgr = LevelManager.instance;
    const triggerDist = mgr.bossConfig.triggerDistance;
    for (let d = 10; d <= triggerDist + 10; d += 10) {
      spawner.update(d);
    }
    const postBoss = spawner.update(triggerDist + 20);
    expect(postBoss).toHaveLength(0);
  });
});
