// src/systems/ProceduralEnemy.ts
// Simple, robust procedural mob generator.
// Generates base body-part textures at boot (fast, only ~30 textures).
// Each procedural enemy type is a combination of: body shape + color tint.
// No per-enemy texture generation — just tint a base shape at spawn time.

import type { LevelEnemyConfig } from '@/config/progression';

// ---------------------------------------------------------------------------
// Body part templates (generated once at boot as base textures)
// ---------------------------------------------------------------------------

const BASE_BODIES = ['mob_round', 'mob_tall', 'mob_wide', 'mob_spiky', 'mob_diamond', 'mob_hulk'] as const;
type BaseBody = typeof BASE_BODIES[number];

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
// Boot-time: generate base body textures (called once, fast)
// ---------------------------------------------------------------------------

export function generateBaseBodyTextures(scene: Phaser.Scene): void {
  const s = 32; // texture size
  const c = s / 2;

  // mob_round: round ogre body with stubby legs
  drawAndSave(scene, 'mob_round', s, (g) => {
    g.fillStyle(0xffffff, 1);
    g.fillCircle(c, c - 2, 12); // body
    g.fillCircle(c - 5, c - 12, 5); // left ear/horn
    g.fillCircle(c + 5, c - 12, 5);
    g.fillRect(c - 8, c + 8, 5, 7); // left leg
    g.fillRect(c + 3, c + 8, 5, 7); // right leg
    g.fillRect(c - 13, c - 2, 5, 6); // left arm
    g.fillRect(c + 8, c - 2, 5, 6); // right arm
    // Face
    g.fillStyle(0x000000, 0.7);
    g.fillCircle(c - 4, c - 4, 2); // left eye
    g.fillCircle(c + 4, c - 4, 2); // right eye
    g.fillRect(c - 3, c + 1, 6, 2); // mouth
  });

  // mob_tall: tall skinny humanoid
  drawAndSave(scene, 'mob_tall', s, (g) => {
    g.fillStyle(0xffffff, 1);
    g.fillCircle(c, c - 8, 6); // head
    g.fillRect(c - 4, c - 3, 8, 12); // torso
    g.fillRect(c - 7, c + 8, 4, 8); // left leg
    g.fillRect(c + 3, c + 8, 4, 8); // right leg
    g.fillRect(c - 10, c - 2, 4, 8); // left arm
    g.fillRect(c + 6, c - 2, 4, 8); // right arm
    g.fillStyle(0x000000, 0.7);
    g.fillCircle(c - 2, c - 9, 1.5);
    g.fillCircle(c + 2, c - 9, 1.5);
  });

  // mob_wide: fat ogre
  drawAndSave(scene, 'mob_wide', s, (g) => {
    g.fillStyle(0xffffff, 1);
    g.fillEllipse(c, c, 26, 18); // wide body
    g.fillCircle(c, c - 10, 7); // head
    g.fillRect(c - 9, c + 7, 6, 7); // left leg
    g.fillRect(c + 3, c + 7, 6, 7); // right leg
    g.fillStyle(0x000000, 0.7);
    g.fillCircle(c - 3, c - 11, 2);
    g.fillCircle(c + 3, c - 11, 2);
    g.fillRect(c - 2, c - 7, 4, 2);
  });

  // mob_spiky: spiky monster
  drawAndSave(scene, 'mob_spiky', s, (g) => {
    g.fillStyle(0xffffff, 1);
    g.fillCircle(c, c, 10);
    // Spikes
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const x1 = c + Math.cos(a) * 8;
      const y1 = c + Math.sin(a) * 8;
      const x2 = c + Math.cos(a) * 15;
      const y2 = c + Math.sin(a) * 15;
      g.fillTriangle(
        x1 + Math.cos(a + 0.4) * 3, y1 + Math.sin(a + 0.4) * 3,
        x1 + Math.cos(a - 0.4) * 3, y1 + Math.sin(a - 0.4) * 3,
        x2, y2,
      );
    }
    g.fillStyle(0x000000, 0.8);
    g.fillCircle(c - 3, c - 2, 2.5);
    g.fillCircle(c + 3, c - 2, 2.5);
    g.fillStyle(0xff0000, 0.5);
    g.fillCircle(c - 3, c - 2, 1);
    g.fillCircle(c + 3, c - 2, 1);
  });

  // mob_diamond: floating diamond creature
  drawAndSave(scene, 'mob_diamond', s, (g) => {
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(c, c - 13, c - 10, c, c + 10, c);
    g.fillTriangle(c, c + 13, c - 10, c, c + 10, c);
    g.fillStyle(0x000000, 0.6);
    g.fillCircle(c - 3, c - 2, 2);
    g.fillCircle(c + 3, c - 2, 2);
  });

  // mob_hulk: large bulky humanoid with big arms
  drawAndSave(scene, 'mob_hulk', s, (g) => {
    g.fillStyle(0xffffff, 1);
    g.fillCircle(c, c - 6, 7); // head
    g.fillRect(c - 7, c - 1, 14, 10); // torso
    g.fillRect(c - 6, c + 8, 5, 7); // left leg
    g.fillRect(c + 1, c + 8, 5, 7); // right leg
    // Big arms
    g.fillEllipse(c - 12, c + 2, 8, 12);
    g.fillEllipse(c + 12, c + 2, 8, 12);
    // Fists
    g.fillCircle(c - 12, c + 8, 4);
    g.fillCircle(c + 12, c + 8, 4);
    g.fillStyle(0x000000, 0.7);
    g.fillCircle(c - 3, c - 7, 2);
    g.fillCircle(c + 3, c - 7, 2);
    g.fillRect(c - 3, c - 3, 6, 2);
  });

  // Create simple walk animations for each base body
  for (const body of BASE_BODIES) {
    if (!scene.anims.exists(`${body}_walk`)) {
      scene.anims.create({
        key: `${body}_walk`,
        frames: [{ key: body, frame: 0 }],
        frameRate: 1,
        repeat: -1,
      });
    }
  }
}

function drawAndSave(scene: Phaser.Scene, key: string, size: number, draw: (g: Phaser.GameObjects.Graphics) => void): void {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, size, size);
  g.destroy();
}

// ---------------------------------------------------------------------------
// Procedural enemy definition
// ---------------------------------------------------------------------------

export interface ProceduralEnemyDef {
  type: string;
  name: string;
  baseBody: BaseBody;
  color: number;
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
// Generate a set of 4 enemies for a level
// ---------------------------------------------------------------------------

export function generateEnemySet(seed: number, worldIndex: number): ProceduralEnemyDef[] {
  const rng = seededRng(seed);
  const palette = WORLD_PALETTES[worldIndex % WORLD_PALETTES.length];
  const enemies: ProceduralEnemyDef[] = [];
  const usedNames = new Set<string>();

  for (let tier = 0; tier < 4; tier++) {
    const body = BASE_BODIES[(Math.floor(rng() * BASE_BODIES.length) + tier) % BASE_BODIES.length];
    const color = palette[Math.floor(rng() * palette.length)];

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
    const sizeBase = [10, 14, 18, 24][tier];
    const speedBase = [90, 70, 50, 40][tier];

    let hpMod = 1, speedMod = 1, splashR = 0, splashD = 0;
    if (trait === 'zigzag') speedMod = 1.3;
    if (trait === 'dasher') { speedMod = 2.0; hpMod = 0.6; }
    if (trait === 'splitter') hpMod = 0.8;
    if (trait === 'shielded') { hpMod = 2.0; speedMod = 0.7; }
    if (trait === 'bomber') { splashR = 50 + tier * 10; splashD = 1 + tier; hpMod = 0.7; }

    enemies.push({
      type: typeId, name, baseBody: body, color,
      colorHex: '#' + color.toString(16).padStart(6, '0'),
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
// Get the base body texture key for a procedural enemy type in a level
// ---------------------------------------------------------------------------

const bodyCache = new Map<string, BaseBody>();

/** Look up which base body a procedural enemy type uses */
export function getBaseBodyForType(type: string, levelIndex: number): BaseBody {
  if (bodyCache.has(type)) return bodyCache.get(type)!;

  const cycle = Math.floor(levelIndex / 5);
  const worldIdx = cycle % 5;
  const seed = levelIndex * 7919 + 42;
  const defs = generateEnemySet(seed, worldIdx);
  for (const def of defs) {
    bodyCache.set(def.type, def.baseBody);
  }
  return bodyCache.get(type) ?? 'mob_round';
}
