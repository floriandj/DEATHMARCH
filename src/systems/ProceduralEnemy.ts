// src/systems/ProceduralEnemy.ts
// Generates unique enemy types from a seed. Each enemy has a procedural
// body shape, color, features, behavior trait, and scaled stats.

import type { LevelEnemyConfig } from '@/config/progression';

// ---------------------------------------------------------------------------
// Body shapes
// ---------------------------------------------------------------------------

type BodyShape = 'circle' | 'triangle' | 'diamond' | 'hexagon' | 'square' | 'star';
const BODY_SHAPES: BodyShape[] = ['circle', 'triangle', 'diamond', 'hexagon', 'square', 'star'];

// ---------------------------------------------------------------------------
// Behavior traits (applied at runtime by Enemy entity)
// ---------------------------------------------------------------------------

export type EnemyTrait = 'normal' | 'zigzag' | 'dasher' | 'splitter' | 'shielded' | 'bomber';

const TRAIT_POOL: EnemyTrait[] = ['normal', 'normal', 'zigzag', 'dasher', 'splitter', 'shielded', 'bomber'];

// ---------------------------------------------------------------------------
// Feature decorations
// ---------------------------------------------------------------------------

type Feature = 'horns' | 'spikes' | 'wings' | 'eye' | 'crest' | 'none';
const FEATURES: Feature[] = ['none', 'horns', 'spikes', 'wings', 'eye', 'crest'];

// ---------------------------------------------------------------------------
// Color palettes per world theme
// ---------------------------------------------------------------------------

const WORLD_PALETTES: number[][] = [
  [0xff6b6b, 0xe64980, 0xbe4bdb, 0xff4444, 0xcc3366], // goblin
  [0xff4400, 0xff8c00, 0xff4444, 0xcc6600, 0xff6600], // infernal
  [0x74c0fc, 0x4dabf7, 0xd0bfff, 0x88ddff, 0xa0c4ff], // frost
  [0x2ecc71, 0xf39c12, 0xa0522d, 0x8e44ad, 0x27ae60], // plague
  [0xc0392b, 0xe74c3c, 0x9b59b6, 0x2c3e50, 0x8e44ad], // ash
];

// ---------------------------------------------------------------------------
// Name generation
// ---------------------------------------------------------------------------

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
// Procedural enemy definition (output)
// ---------------------------------------------------------------------------

export interface ProceduralEnemyDef {
  type: string;          // unique type id e.g. "proc_shadow_brute_42"
  name: string;          // display name e.g. "Shadow Brute"
  body: BodyShape;
  color: number;         // primary color
  colorHex: string;
  secondaryColor: number;
  feature: Feature;
  trait: EnemyTrait;
  size: number;          // sprite radius
  // Stats (pre-scaling, will be multiplied by difficulty)
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

/**
 * Generate a set of 4 unique enemies for a given seed + world index.
 * The seed ensures the same level always gets the same enemies.
 * Different seeds = totally different enemies.
 */
export function generateEnemySet(seed: number, worldIndex: number): ProceduralEnemyDef[] {
  const rng = seededRng(seed);
  const palette = WORLD_PALETTES[worldIndex % WORLD_PALETTES.length];
  const enemies: ProceduralEnemyDef[] = [];
  const usedNames = new Set<string>();

  // Generate 4 enemies with increasing power
  for (let tier = 0; tier < 4; tier++) {
    const def = generateOneEnemy(rng, palette, tier, seed, usedNames);
    enemies.push(def);
  }

  return enemies;
}

function generateOneEnemy(
  rng: () => number, palette: number[], tier: number, seed: number, usedNames: Set<string>,
): ProceduralEnemyDef {
  // Pick shape — later tiers get "scarier" shapes more often
  const shapeIdx = Math.floor(rng() * BODY_SHAPES.length);
  const body = BODY_SHAPES[(shapeIdx + tier) % BODY_SHAPES.length];

  // Color from palette
  const colorIdx = Math.floor(rng() * palette.length);
  const color = palette[colorIdx];
  const secondaryIdx = (colorIdx + 1 + Math.floor(rng() * (palette.length - 1))) % palette.length;
  const secondaryColor = palette[secondaryIdx];

  // Feature — more features at higher tiers
  const featureRoll = rng();
  const feature = tier === 0 ? 'none' : FEATURES[Math.floor(featureRoll * FEATURES.length)];

  // Trait — tier 0 always normal, higher tiers get special behaviors
  let trait: EnemyTrait = 'normal';
  if (tier >= 1) {
    trait = TRAIT_POOL[Math.floor(rng() * TRAIT_POOL.length)];
  }
  if (tier >= 3) {
    // High tier enemies always have a special trait
    const specialTraits: EnemyTrait[] = ['zigzag', 'dasher', 'splitter', 'shielded', 'bomber'];
    trait = specialTraits[Math.floor(rng() * specialTraits.length)];
  }

  // Name
  let name = '';
  for (let attempt = 0; attempt < 10; attempt++) {
    const prefix = PREFIXES[Math.floor(rng() * PREFIXES.length)];
    const suffix = SUFFIXES[Math.floor(rng() * SUFFIXES.length)];
    name = `${prefix} ${suffix.charAt(0).toUpperCase() + suffix.slice(1)}`;
    if (!usedNames.has(name)) break;
  }
  usedNames.add(name);

  const typeId = `proc_${name.toLowerCase().replace(/\s+/g, '_')}_${seed % 1000}`;

  // Stats scaled by tier (0=weak, 3=elite)
  const tierScale = [1, 2.5, 4, 7][tier];
  const sizeBase = [10, 14, 18, 24][tier];
  const speedBase = [90, 70, 50, 40][tier];
  const speedVar = rng() * 40 - 20;

  // Trait modifiers
  let hpMod = 1;
  let speedMod = 1;
  let splashRadius = 0;
  let splashDamage = 0;

  switch (trait) {
    case 'zigzag': speedMod = 1.3; break;
    case 'dasher': speedMod = 2.0; hpMod = 0.6; break;
    case 'splitter': hpMod = 0.8; break;
    case 'shielded': hpMod = 2.0; speedMod = 0.7; break;
    case 'bomber': splashRadius = 50 + tier * 10; splashDamage = 1 + tier; hpMod = 0.7; break;
  }

  return {
    type: typeId,
    name,
    body,
    color,
    colorHex: '#' + color.toString(16).padStart(6, '0'),
    secondaryColor,
    feature,
    trait,
    size: sizeBase + Math.floor(rng() * 6),
    baseHp: Math.max(1, Math.round(tierScale * hpMod)),
    baseSpeed: Math.max(30, Math.round((speedBase + speedVar) * speedMod)),
    contactDamage: Math.max(1, 1 + tier),
    splashRadius,
    splashDamage,
    scoreValue: Math.round(10 + tier * 20 + rng() * 10),
  };
}

// ---------------------------------------------------------------------------
// Convert to LevelEnemyConfig array for use in LevelGenerator
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
// Procedural texture generation (call in BootScene or on-demand)
// ---------------------------------------------------------------------------

export function generateEnemyTexture(
  scene: Phaser.Scene, def: ProceduralEnemyDef,
): void {
  const size = def.size * 2;
  const cx = size / 2;
  const cy = size / 2;
  const r = def.size * 0.8;
  const g = scene.add.graphics();

  // Body shape
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
      const pts: number[] = [];
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        pts.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
      g.beginPath();
      g.moveTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
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

  // Feature decorations
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
      g.fillEllipse(cx - r * 1.0, cy, r * 0.6, r * 0.4);
      g.fillEllipse(cx + r * 1.0, cy, r * 0.6, r * 0.4);
      break;
    case 'eye':
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(cx, cy - r * 0.1, r * 0.35);
      g.fillStyle(0x000000, 1);
      g.fillCircle(cx, cy - r * 0.1, r * 0.18);
      g.fillStyle(0xff0000, 0.8);
      g.fillCircle(cx + r * 0.05, cy - r * 0.15, r * 0.08);
      break;
    case 'crest':
      g.fillStyle(def.secondaryColor, 0.8);
      g.fillTriangle(cx, cy - r * 1.3, cx - r * 0.3, cy - r * 0.4, cx + r * 0.3, cy - r * 0.4);
      break;
  }

  // Eyes (small, if no big eye feature)
  if (def.feature !== 'eye') {
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(cx - r * 0.25, cy - r * 0.15, r * 0.15);
    g.fillCircle(cx + r * 0.25, cy - r * 0.15, r * 0.15);
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx - r * 0.25, cy - r * 0.15, r * 0.08);
    g.fillCircle(cx + r * 0.25, cy - r * 0.15, r * 0.08);
  }

  // Trait indicator
  if (def.trait === 'shielded') {
    g.lineStyle(2, 0x4444ff, 0.6);
    g.strokeCircle(cx, cy, r + 2);
  }
  if (def.trait === 'bomber') {
    g.fillStyle(0xff0000, 0.5);
    g.fillCircle(cx, cy + r * 0.5, r * 0.2);
  }

  // Generate spritesheet texture (2 frames side by side for walk animation)
  const fullW = size * 2;
  const canvas = document.createElement('canvas');
  canvas.width = fullW;
  canvas.height = size;
  const ctx2d = canvas.getContext('2d')!;

  // Render frame 1 (slightly shifted up)
  g.setPosition(0, -1);
  // We can't easily render Phaser graphics to canvas, so generate texture directly
  g.generateTexture(`enemy_${def.type}`, fullW, size);

  // Draw second frame offset (simple approach: same frame shifted)
  // This works because the walk anim just alternates frames
  g.setPosition(size, 1);

  g.destroy();

  // Create walk animation
  if (!scene.anims.exists(`enemy_${def.type}_walk`)) {
    scene.anims.create({
      key: `enemy_${def.type}_walk`,
      frames: scene.anims.generateFrameNumbers(`enemy_${def.type}`, { start: 0, end: 0 }),
      frameRate: 4,
      repeat: -1,
    });
  }

  canvas.remove();
}
