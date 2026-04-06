// src/systems/ProceduralEnemy.ts
// Generates unique enemy types from a seed with procedural visuals and behaviors.

import type { LevelEnemyConfig } from '@/config/progression';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BodyShape = 'circle' | 'triangle' | 'diamond' | 'hexagon' | 'square' | 'star';
const BODY_SHAPES: BodyShape[] = ['circle', 'triangle', 'diamond', 'hexagon', 'square', 'star'];

export type EnemyTrait = 'normal' | 'zigzag' | 'dasher' | 'splitter' | 'shielded' | 'bomber';
const TRAIT_POOL: EnemyTrait[] = ['normal', 'normal', 'zigzag', 'dasher', 'splitter', 'shielded', 'bomber'];

type Feature = 'horns' | 'spikes' | 'wings' | 'eye' | 'crest' | 'none';
const FEATURES: Feature[] = ['none', 'horns', 'spikes', 'wings', 'eye', 'crest'];

const WORLD_PALETTES: number[][] = [
  [0xff6b6b, 0xe64980, 0xbe4bdb, 0xff4444, 0xcc3366],
  [0xff4400, 0xff8c00, 0xff4444, 0xcc6600, 0xff6600],
  [0x74c0fc, 0x4dabf7, 0xd0bfff, 0x88ddff, 0xa0c4ff],
  [0x2ecc71, 0xf39c12, 0xa0522d, 0x8e44ad, 0x27ae60],
  [0xc0392b, 0xe74c3c, 0x9b59b6, 0x2c3e50, 0x8e44ad],
];

const PREFIXES = [
  'Shadow', 'Flame', 'Frost', 'Venom', 'Storm', 'Blood', 'Iron', 'Chaos',
  'Doom', 'Dark', 'Rot', 'Thorn', 'Bone', 'Ash', 'Void', 'Grim',
  'Fell', 'Dire', 'Hex', 'Blight', 'Warp', 'Dread', 'Rage', 'Fang',
];

const SUFFIXES = [
  'crawler', 'brute', 'fiend', 'lurker', 'stalker', 'imp', 'beast',
  'runner', 'hulk', 'drone', 'wraith', 'spawn', 'chomper', 'swarmer',
  'golem', 'wisp', 'charger', 'howler', 'creep', 'shade', 'maw',
  'slime', 'worm', 'spike', 'claw', 'fist', 'wing', 'eye',
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
  body: BodyShape;
  color: number;
  colorHex: string;
  secondaryColor: number;
  feature: Feature;
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
// Generator
// ---------------------------------------------------------------------------

export function generateEnemySet(seed: number, worldIndex: number): ProceduralEnemyDef[] {
  const rng = seededRng(seed);
  const palette = WORLD_PALETTES[worldIndex % WORLD_PALETTES.length];
  const enemies: ProceduralEnemyDef[] = [];
  const usedNames = new Set<string>();

  for (let tier = 0; tier < 4; tier++) {
    enemies.push(generateOneEnemy(rng, palette, tier, seed, usedNames));
  }
  return enemies;
}

function generateOneEnemy(
  rng: () => number, palette: number[], tier: number, seed: number, usedNames: Set<string>,
): ProceduralEnemyDef {
  const body = BODY_SHAPES[(Math.floor(rng() * BODY_SHAPES.length) + tier) % BODY_SHAPES.length];
  const colorIdx = Math.floor(rng() * palette.length);
  const color = palette[colorIdx];
  const secondaryColor = palette[(colorIdx + 1 + Math.floor(rng() * (palette.length - 1))) % palette.length];
  const feature = tier === 0 ? 'none' : FEATURES[Math.floor(rng() * FEATURES.length)];

  let trait: EnemyTrait = 'normal';
  if (tier >= 1) trait = TRAIT_POOL[Math.floor(rng() * TRAIT_POOL.length)];
  if (tier >= 3) {
    const special: EnemyTrait[] = ['zigzag', 'dasher', 'splitter', 'shielded', 'bomber'];
    trait = special[Math.floor(rng() * special.length)];
  }

  let name = '';
  for (let attempt = 0; attempt < 10; attempt++) {
    const prefix = PREFIXES[Math.floor(rng() * PREFIXES.length)];
    const suffix = SUFFIXES[Math.floor(rng() * SUFFIXES.length)];
    name = `${prefix} ${suffix.charAt(0).toUpperCase() + suffix.slice(1)}`;
    if (!usedNames.has(name)) break;
  }
  usedNames.add(name);

  const typeId = `proc_${name.toLowerCase().replace(/\s+/g, '_')}_${seed % 1000}`;
  const tierScale = [1, 2.5, 4, 7][tier];
  const sizeBase = [10, 14, 18, 24][tier];
  const speedBase = [90, 70, 50, 40][tier];

  let hpMod = 1, speedMod = 1, splashRadius = 0, splashDamage = 0;
  switch (trait) {
    case 'zigzag': speedMod = 1.3; break;
    case 'dasher': speedMod = 2.0; hpMod = 0.6; break;
    case 'splitter': hpMod = 0.8; break;
    case 'shielded': hpMod = 2.0; speedMod = 0.7; break;
    case 'bomber': splashRadius = 50 + tier * 10; splashDamage = 1 + tier; hpMod = 0.7; break;
  }

  return {
    type: typeId, name, body, color,
    colorHex: '#' + color.toString(16).padStart(6, '0'),
    secondaryColor, feature, trait,
    size: sizeBase + Math.floor(rng() * 6),
    baseHp: Math.max(1, Math.round(tierScale * hpMod)),
    baseSpeed: Math.max(30, Math.round((speedBase + rng() * 40 - 20) * speedMod)),
    contactDamage: Math.max(1, 1 + tier),
    splashRadius, splashDamage,
    scoreValue: Math.round(10 + tier * 20 + rng() * 10),
  };
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
// Lazy texture generation — call at level start
// ---------------------------------------------------------------------------

const generatedTextures = new Set<string>();

/** Generate textures for procedural enemies of a specific level */
export function ensureEnemyTexturesForLevel(scene: Phaser.Scene, levelIndex: number): void {
  const cycle = Math.floor(levelIndex / 5);
  if (cycle === 0) return; // cycle 0 uses hand-crafted SVGs

  const worldIdx = cycle % 5;
  const seed = levelIndex * 7919 + 42;
  const defs = generateEnemySet(seed, worldIdx);

  for (const def of defs) {
    const texKey = `enemy_${def.type}`;
    if (generatedTextures.has(texKey)) continue;
    if (scene.textures.exists(texKey)) { generatedTextures.add(texKey); continue; }
    generateEnemyTexture(scene, def);
    generatedTextures.add(texKey);
  }
}


// ---------------------------------------------------------------------------
// Texture drawing
// ---------------------------------------------------------------------------

export function generateEnemyTexture(scene: Phaser.Scene, def: ProceduralEnemyDef): void {
  const size = def.size * 2;
  const cx = size / 2;
  const cy = size / 2;
  const r = def.size * 0.8;
  const g = scene.add.graphics();

  // Body
  switch (def.body) {
    case 'circle':
      g.fillStyle(def.color, 1);
      g.fillCircle(cx, cy, r);
      g.fillStyle(def.secondaryColor, 0.3);
      g.fillCircle(cx - r * 0.2, cy - r * 0.2, r * 0.5);
      break;
    case 'triangle':
      g.fillStyle(def.color, 1);
      g.fillTriangle(cx, cy - r, cx - r, cy + r * 0.7, cx + r, cy + r * 0.7);
      break;
    case 'diamond':
      g.fillStyle(def.color, 1);
      g.fillTriangle(cx, cy - r, cx - r * 0.7, cy, cx + r * 0.7, cy);
      g.fillTriangle(cx, cy + r, cx - r * 0.7, cy, cx + r * 0.7, cy);
      break;
    case 'hexagon': {
      g.fillStyle(def.color, 1);
      g.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        if (i === 0) g.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        else g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
      g.closePath();
      g.fillPath();
      break;
    }
    case 'square':
      g.fillStyle(def.color, 1);
      g.fillRect(cx - r * 0.7, cy - r * 0.7, r * 1.4, r * 1.4);
      break;
    case 'star': {
      g.fillStyle(def.color, 1);
      g.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        const rad = i % 2 === 0 ? r : r * 0.5;
        if (i === 0) g.moveTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
        else g.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
      }
      g.closePath();
      g.fillPath();
      break;
    }
  }

  // Features
  switch (def.feature) {
    case 'horns':
      g.fillStyle(def.secondaryColor, 1);
      g.fillTriangle(cx - r * 0.5, cy - r * 0.3, cx - r * 0.7, cy - r * 1.1, cx - r * 0.2, cy - r * 0.6);
      g.fillTriangle(cx + r * 0.5, cy - r * 0.3, cx + r * 0.7, cy - r * 1.1, cx + r * 0.2, cy - r * 0.6);
      break;
    case 'spikes':
      g.fillStyle(def.secondaryColor, 0.8);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        g.fillTriangle(
          cx + Math.cos(a) * r * 0.7, cy + Math.sin(a) * r * 0.7,
          cx + Math.cos(a - 0.15) * r * 1.3, cy + Math.sin(a - 0.15) * r * 1.3,
          cx + Math.cos(a + 0.15) * r * 1.3, cy + Math.sin(a + 0.15) * r * 1.3,
        );
      }
      break;
    case 'wings':
      g.fillStyle(def.secondaryColor, 0.6);
      g.fillEllipse(cx - r, cy, r * 0.6, r * 0.4);
      g.fillEllipse(cx + r, cy, r * 0.6, r * 0.4);
      break;
    case 'eye':
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(cx, cy - r * 0.1, r * 0.35);
      g.fillStyle(0x000000, 1);
      g.fillCircle(cx, cy - r * 0.1, r * 0.18);
      break;
    case 'crest':
      g.fillStyle(def.secondaryColor, 0.8);
      g.fillTriangle(cx, cy - r * 1.3, cx - r * 0.3, cy - r * 0.4, cx + r * 0.3, cy - r * 0.4);
      break;
  }

  // Eyes (if no big eye feature)
  if (def.feature !== 'eye') {
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(cx - r * 0.25, cy - r * 0.15, r * 0.15);
    g.fillCircle(cx + r * 0.25, cy - r * 0.15, r * 0.15);
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx - r * 0.25, cy - r * 0.15, r * 0.08);
    g.fillCircle(cx + r * 0.25, cy - r * 0.15, r * 0.08);
  }

  // Trait visual indicators
  if (def.trait === 'shielded') {
    g.lineStyle(2, 0x4444ff, 0.6);
    g.strokeCircle(cx, cy, r + 2);
  }
  if (def.trait === 'bomber') {
    g.fillStyle(0xff0000, 0.5);
    g.fillCircle(cx, cy + r * 0.5, r * 0.2);
  }

  g.generateTexture(`enemy_${def.type}`, size, size);
  g.destroy();

  // Create single-frame walk animation
  if (!scene.anims.exists(`enemy_${def.type}_walk`)) {
    scene.anims.create({
      key: `enemy_${def.type}_walk`,
      frames: [{ key: `enemy_${def.type}`, frame: 0 }],
      frameRate: 1,
      repeat: -1,
    });
  }
}
