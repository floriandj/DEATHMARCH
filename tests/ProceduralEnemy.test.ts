import { describe, it, expect, beforeEach } from 'vitest';
import { generateEnemySet, getSpriteForType, getTintForType } from '../src/systems/ProceduralEnemy';
import { LevelManager } from '../src/config/progression';

// The list of 0x72 character spritesheet strips that BootScene loads. Every
// procedurally-picked `spriteBase` must resolve to one of these keys so
// Enemy.setTexture finds a match at runtime.
const KNOWN_SPRITE_BASES = new Set([
  'knight_m', 'goblin', 'tiny_zombie', 'imp', 'swampy', 'skelet',
  'orc_warrior', 'masked_orc', 'wogol', 'slug', 'necromancer',
  'muddy', 'ice_zombie', 'pumpkin_dude', 'lizard_f', 'chort',
  'big_demon', 'big_zombie', 'ogre',
]);

describe('ProceduralEnemy', () => {
  beforeEach(() => {
    LevelManager.reset();
  });

  it('generateEnemySet returns 4 enemies, one per tier', () => {
    const set = generateEnemySet(42, 0);
    expect(set).toHaveLength(4);
  });

  it('every generated spriteBase is one the atlas actually loads', () => {
    for (let worldIdx = 0; worldIdx < 5; worldIdx++) {
      for (let seed = 1; seed < 20; seed++) {
        const set = generateEnemySet(seed * 7919 + 42, worldIdx);
        for (const def of set) {
          expect(KNOWN_SPRITE_BASES.has(def.spriteBase)).toBe(true);
        }
      }
    }
  });

  it('same seed + world produces deterministic enemies', () => {
    const a = generateEnemySet(1234, 2);
    const b = generateEnemySet(1234, 2);
    expect(a.map((d) => d.spriteBase)).toEqual(b.map((d) => d.spriteBase));
    expect(a.map((d) => d.tintColor)).toEqual(b.map((d) => d.tintColor));
  });

  it('getSpriteForType resolves every procedural type in the current level', () => {
    const enemies = LevelManager.instance.enemies;
    for (const type of Object.keys(enemies)) {
      const sprite = getSpriteForType(type, 0);
      expect(KNOWN_SPRITE_BASES.has(sprite)).toBe(true);
    }
  });

  it('getTintForType returns a valid 24-bit color', () => {
    const enemies = LevelManager.instance.enemies;
    for (const type of Object.keys(enemies)) {
      const tint = getTintForType(type, 0);
      expect(tint).toBeGreaterThanOrEqual(0);
      expect(tint).toBeLessThanOrEqual(0xffffff);
    }
  });

  it('tier 0 enemies use smaller sprites than tier 3', () => {
    const set = generateEnemySet(9999, 0);
    expect(set[0].baseHp).toBeLessThan(set[3].baseHp);
    expect(set[3].size).toBeGreaterThanOrEqual(set[0].size);
  });
});
