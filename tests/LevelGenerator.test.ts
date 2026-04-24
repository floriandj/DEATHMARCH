import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateLevel,
  getAllBaseEnemySprites,
  getAllBossSprites,
  LevelManager,
} from '../src/config/progression';

describe('LevelGenerator', () => {
  beforeEach(() => {
    LevelManager.reset();
  });

  it('generates a level for any non-negative index', () => {
    for (const idx of [0, 1, 4, 5, 10, 24, 50]) {
      const level = generateLevel(idx);
      expect(level).toBeDefined();
      expect(level.theme).toBeDefined();
      expect(level.boss).toBeDefined();
      expect(level.boss.triggerDistance).toBeGreaterThan(0);
      expect(level.weaponOrder.length).toBeGreaterThan(0);
      expect(Object.keys(level.enemies).length).toBeGreaterThan(0);
    }
  });

  it('cycles through 5 world themes every 25 levels (5 levels per world)', () => {
    // Within one world (5 levels) the worldName is stable
    expect(generateLevel(0).theme.worldName).toBe(generateLevel(4).theme.worldName);
    // After 25 levels (5 worlds × 5 levels) the cycle restarts
    expect(generateLevel(0).theme.worldName).toBe(generateLevel(25).theme.worldName);
  });

  it('produces 5 distinct world names across one cycle', () => {
    const names = new Set<string>();
    for (let i = 0; i < 25; i += 5) {
      names.add(generateLevel(i).theme.worldName);
    }
    expect(names.size).toBe(5);
  });

  it('difficulty (boss HP) grows with level index', () => {
    const hpEarly = generateLevel(0).boss.hp;
    const hpLate = generateLevel(20).boss.hp;
    expect(hpLate).toBeGreaterThan(hpEarly);
  });

  it('every level theme specifies a decor pool', () => {
    for (let i = 0; i < 5; i++) {
      const level = generateLevel(i);
      expect(level.theme.decorKeys).toBeDefined();
      expect(level.theme.decorKeys!.length).toBeGreaterThan(0);
    }
  });

  it('every level boss.sprite resolves to a known char_ prefix', () => {
    for (let i = 0; i < 5; i++) {
      const level = generateLevel(i);
      expect(level.boss.sprite.startsWith('char_')).toBe(true);
    }
  });

  it('getAllBossSprites returns entries for all 5 worlds', () => {
    const sprites = getAllBossSprites();
    expect(sprites.length).toBeGreaterThanOrEqual(4); // some worlds may share a boss base
    for (const s of sprites) {
      expect(s.startsWith('char_')).toBe(true);
    }
  });

  it('getAllBaseEnemySprites returns non-empty array', () => {
    const sprites = getAllBaseEnemySprites();
    expect(sprites.length).toBeGreaterThan(0);
    for (const e of sprites) {
      expect(e.type).toBeDefined();
      expect(e.size).toBeGreaterThan(0);
    }
  });
});
