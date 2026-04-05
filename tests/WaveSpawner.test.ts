import { describe, it, expect } from 'vitest';
import { WaveSpawner } from '../src/systems/WaveSpawner';

describe('WaveSpawner', () => {
  it('produces spawn commands based on distance', () => {
    const spawner = new WaveSpawner();
    const spawns = spawner.update(50);
    for (const s of spawns) {
      expect(s.type).toBe('goblin');
      expect(s.x).toBeDefined();
    }
  });

  it('only spawns goblins before 300m', () => {
    const spawner = new WaveSpawner();
    const allSpawns = [];
    for (let d = 10; d <= 250; d += 10) {
      allSpawns.push(...spawner.update(d));
    }
    for (const s of allSpawns) {
      expect(s.type).toBe('goblin');
    }
  });

  it('can spawn orcs after 300m', () => {
    const spawner = new WaveSpawner();
    for (let d = 10; d <= 300; d += 10) {
      spawner.update(d);
    }
    const types = new Set<string>();
    for (let d = 310; d <= 600; d += 10) {
      for (const s of spawner.update(d)) {
        types.add(s.type);
      }
    }
    expect(types.has('orc')).toBe(true);
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
    for (let d = 10; d <= 1200; d += 10) {
      spawner.update(d);
    }
    const postBoss = spawner.update(1210);
    expect(postBoss).toHaveLength(0);
  });
});
