import { describe, it, expect, beforeEach } from 'vitest';
import { WaveSpawner } from '../src/systems/WaveSpawner';
import { LevelManager } from '../src/config/progression';

describe('WaveSpawner', () => {
  beforeEach(() => {
    LevelManager.reset();
  });

  it('produces spawn commands based on distance', () => {
    const spawner = new WaveSpawner();
    const spawns = spawner.update(50);
    for (const s of spawns) {
      expect(s.type).toBe('goblin');
      expect(s.x).toBeDefined();
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
    const spawner = new WaveSpawner();
    const mgr = LevelManager.instance;
    const enemies = Object.values(mgr.enemies);
    const sorted = [...enemies].sort((a, b) => a.appearsAtDistance - b.appearsAtDistance);
    const secondAppears = sorted[1]?.appearsAtDistance ?? 500;

    for (let d = 10; d <= secondAppears; d += 10) {
      spawner.update(d);
    }
    const types = new Set<string>();
    for (let d = secondAppears + 10; d <= secondAppears + 600; d += 10) {
      for (const s of spawner.update(d)) {
        types.add(s.type);
      }
    }
    expect(types.has(sorted[1].type)).toBe(true);
  });

  it('increases spawn density with distance', () => {
    const spawnerEarly = new WaveSpawner();
    const spawnerLate = new WaveSpawner();

    let earlyCount = 0;
    for (let d = 10; d <= 200; d += 10) {
      earlyCount += spawnerEarly.update(d).length;
    }

    for (let d = 10; d <= 800; d += 10) {
      spawnerLate.update(d);
    }
    let lateCount = 0;
    for (let d = 810; d <= 1000; d += 10) {
      lateCount += spawnerLate.update(d).length;
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
