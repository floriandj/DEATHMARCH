// src/systems/ProceduralEnemy.ts
// Procedural mob generator that reuses existing SVG enemy sprites with color tinting.
// No runtime texture generation — just picks a base sprite + applies a color tint at spawn.

import type { LevelEnemyConfig } from '@/config/progression';

// ---------------------------------------------------------------------------
// Available SVG enemy sprites (loaded in BootScene from all 5 worlds)
// ---------------------------------------------------------------------------

const SPRITE_POOL = [
  'goblin', 'orc', 'troll', 'demon',
  'berserker', 'hellhound', 'warlock',
  'frostbite', 'ice_golem', 'banshee', 'yeti',
  'rat_swarm', 'blighted', 'spore_carrier', 'abomination',
  'shadow_knight', 'ashwalker', 'void_weaver', 'archfiend',
];

// Grouped by visual archetype for better tier matching
const TIER_SPRITES = [
  // Tier 0 (weak, small): small fast creatures
  ['goblin', 'rat_swarm', 'frostbite', 'hellhound', 'ashwalker'],
  // Tier 1 (medium): mid-size fighters
  ['orc', 'berserker', 'banshee', 'blighted', 'void_weaver'],
  // Tier 2 (tough): large slow tanks
  ['troll', 'warlock', 'yeti', 'spore_carrier', 'shadow_knight'],
  // Tier 3 (elite): boss-like mobs
  ['demon', 'ice_golem', 'abomination', 'archfiend'],
];

// ---------------------------------------------------------------------------
// Behavior traits
// ---------------------------------------------------------------------------

export type EnemyTrait = 'normal' | 'zigzag' | 'dasher' | 'splitter' | 'shielded' | 'bomber';

// ---------------------------------------------------------------------------
// Color palettes per world
// ---------------------------------------------------------------------------

const WORLD_PALETTES: number[][] = [
  [0xff6b6b, 0xe64980, 0xbe4bdb, 0xff4444, 0xcc3366],
  [0xff4400, 0xff8c00, 0xff4444, 0xcc6600, 0xff6600],
  [0x74c0fc, 0x4dabf7, 0xd0bfff, 0x88ddff, 0xa0c4ff],
  [0x2ecc71, 0xf39c12, 0xa0522d, 0x8e44ad, 0x27ae60],
  [0xc0392b, 0xe74c3c, 0x9b59b6, 0x2c3e50, 0x8e44ad],
];

// ---------------------------------------------------------------------------
// Name generation
// ---------------------------------------------------------------------------

const PREFIXES = [
  'Shadow', 'Flame', 'Frost', 'Venom', 'Storm', 'Blood', 'Iron', 'Chaos',
  'Doom', 'Dark', 'Rot', 'Thorn', 'Bone', 'Ash', 'Void', 'Grim',
];
const SUFFIXES = [
  'Crawler', 'Brute', 'Fiend', 'Lurker', 'Stalker', 'Imp', 'Beast',
  'Runner', 'Hulk', 'Drone', 'Wraith', 'Spawn', 'Chomper', 'Swarmer',
  'Golem', 'Charger', 'Howler', 'Shade', 'Ogre', 'Troll', 'Grunt',
];

// ---------------------------------------------------------------------------
// Seeded RNG
// ---------------------------------------------------------------------------

function seededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ---------------------------------------------------------------------------
// Procedural enemy definition
// ---------------------------------------------------------------------------

export interface ProceduralEnemyDef {
  type: string;
  name: string;
  spriteBase: string;   // e.g. 'orc' → uses texture 'enemy_orc' + anim 'enemy_orc_walk'
  tintColor: number;
  colorHex: string;
  trait: EnemyTrait;
  size: number;
  baseHp: number;
  baseSpeed: number;
  contactDamage: number;
  splashRadius: number;
  splashDamage: number;
  scoreValue: number;
}

// ---------------------------------------------------------------------------
// Generate 4 enemies for a level
// ---------------------------------------------------------------------------

export function generateEnemySet(seed: number, worldIndex: number): ProceduralEnemyDef[] {
  const rng = seededRng(seed);
  const palette = WORLD_PALETTES[worldIndex % WORLD_PALETTES.length];
  const enemies: ProceduralEnemyDef[] = [];
  const usedNames = new Set<string>();

  for (let tier = 0; tier < 4; tier++) {
    const tierPool = TIER_SPRITES[tier];
    const spriteBase = tierPool[Math.floor(rng() * tierPool.length)];
    const tintColor = palette[Math.floor(rng() * palette.length)];

    let trait: EnemyTrait = 'normal';
    if (tier >= 1 && rng() > 0.4) {
      const traits: EnemyTrait[] = ['zigzag', 'dasher', 'splitter', 'shielded', 'bomber'];
      trait = traits[Math.floor(rng() * traits.length)];
    }

    let name = '';
    for (let a = 0; a < 10; a++) {
      name = PREFIXES[Math.floor(rng() * PREFIXES.length)] + ' ' + SUFFIXES[Math.floor(rng() * SUFFIXES.length)];
      if (!usedNames.has(name)) break;
    }
    usedNames.add(name);

    const typeId = `proc_${name.toLowerCase().replace(/\s+/g, '_')}_${seed % 1000}`;
    const tierScale = [1, 2.5, 4, 7][tier];
    const sizeBase = [12, 15, 20, 26][tier];
    const speedBase = [90, 70, 50, 40][tier];

    let hpMod = 1, speedMod = 1, splashR = 0, splashD = 0;
    if (trait === 'zigzag') speedMod = 1.3;
    if (trait === 'dasher') { speedMod = 2.0; hpMod = 0.6; }
    if (trait === 'splitter') hpMod = 0.8;
    if (trait === 'shielded') { hpMod = 2.0; speedMod = 0.7; }
    if (trait === 'bomber') { splashR = 50 + tier * 10; splashD = 1 + tier; hpMod = 0.7; }

    enemies.push({
      type: typeId, name, spriteBase, tintColor,
      colorHex: '#' + tintColor.toString(16).padStart(6, '0'),
      trait,
      size: sizeBase + Math.floor(rng() * 6),
      baseHp: Math.max(1, Math.round(tierScale * hpMod)),
      baseSpeed: Math.max(30, Math.round((speedBase + rng() * 40 - 20) * speedMod)),
      contactDamage: Math.max(1, 1 + tier),
      splashRadius: splashR, splashDamage: splashD,
      scoreValue: Math.round(10 + tier * 20 + rng() * 10),
    });
  }
  return enemies;
}

// ---------------------------------------------------------------------------
// Convert to LevelEnemyConfig
// ---------------------------------------------------------------------------

export function toEnemyConfigs(
  defs: ProceduralEnemyDef[], difficulty: number, triggerDistance: number,
): Record<string, LevelEnemyConfig> {
  const result: Record<string, LevelEnemyConfig> = {};
  for (let i = 0; i < defs.length; i++) {
    const def = defs[i];
    result[def.type] = {
      type: def.type,
      hp: Math.max(1, Math.round(def.baseHp * difficulty)),
      speed: Math.round(def.baseSpeed * (1 + (difficulty - 1) * 0.1)),
      size: def.size,
      contactDamage: def.contactDamage,
      splashRadius: def.splashRadius,
      splashDamage: def.splashDamage,
      color: def.colorHex,
      appearsAtDistance: Math.round((i / defs.length) * triggerDistance * 0.7),
      scoreValue: Math.round(def.scoreValue * difficulty),
    };
  }
  return result;
}

// ---------------------------------------------------------------------------
// Sprite lookup: get the base SVG sprite name for a procedural enemy
// ---------------------------------------------------------------------------

const spriteCache = new Map<string, string>();

/** Returns the SVG sprite base name (e.g. 'orc') for a procedural enemy type */
export function getSpriteForType(type: string, levelIndex: number): string {
  if (spriteCache.has(type)) return spriteCache.get(type)!;

  const cycle = Math.floor(levelIndex / 5);
  const worldIdx = cycle % 5;
  const seed = levelIndex * 7919 + 42;
  const defs = generateEnemySet(seed, worldIdx);
  for (const def of defs) {
    spriteCache.set(def.type, def.spriteBase);
  }
  return spriteCache.get(type) ?? 'goblin';
}

/** Returns the tint color for a procedural enemy type */
export function getTintForType(type: string, levelIndex: number): number {
  const cycle = Math.floor(levelIndex / 5);
  const worldIdx = cycle % 5;
  const seed = levelIndex * 7919 + 42;
  const defs = generateEnemySet(seed, worldIdx);
  const def = defs.find(d => d.type === type);
  return def?.tintColor ?? 0xffffff;
}
