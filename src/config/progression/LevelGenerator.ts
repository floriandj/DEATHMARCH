// src/config/progression/LevelGenerator.ts
// Procedurally generates 20 levels across 5 themed worlds (4 levels each).
// Every level starts the player with 1 unit and a base weapon — upgrades are
// found in the field. Weapon crate distances are offset from gate intervals so
// they never overlap.

import type {
  LevelConfig,
  LevelEnemyConfig,
  LevelWeaponConfig,
  WeaponCrateConfig,
  GateTemplateConfig,
  BossPhaseConfig,
  WaveBracket,
} from './types';

// ---------------------------------------------------------------------------
// World definitions
// ---------------------------------------------------------------------------

interface WorldDef {
  tag: string; // short world identifier
  names: string[]; // 4 level names
  descriptions: string[]; // 4 level descriptions
  enemies: EnemyTemplate[];
  weaponOrder: string[];
  weapons: Record<string, LevelWeaponConfig>;
  bossSprite: string;
  bossNames: string[];
  bossTint?: string;
}

interface EnemyTemplate {
  type: string;
  baseHp: number;
  speed: number;
  size: number;
  contactDamage: number;
  splashRadius: number;
  splashDamage: number;
  color: string;
  /** Appears at this fraction through the level distance (0-1) */
  introFraction: number;
  scoreValue: number;
}

const WORLDS: WorldDef[] = [
  // ── World 1: Goblin Wastes ─────────────────────────────────────────────
  {
    tag: 'goblin',
    names: ['The March Begins', 'Goblin Gauntlet', 'Orc Stronghold', 'Demon Gate'],
    descriptions: [
      'Your first steps into the wasteland.',
      'Goblins swarm from every direction.',
      'Orcs have fortified the mountain pass.',
      'A demonic rift tears open the sky.',
    ],
    enemies: [
      { type: 'goblin', baseHp: 1, speed: 70, size: 12, contactDamage: 1, splashRadius: 0, splashDamage: 0, color: '#ff6b6b', introFraction: 0, scoreValue: 10 },
      { type: 'orc', baseHp: 3, speed: 80, size: 16, contactDamage: 2, splashRadius: 0, splashDamage: 0, color: '#e64980', introFraction: 0.25, scoreValue: 30 },
      { type: 'troll', baseHp: 8, speed: 50, size: 22, contactDamage: 3, splashRadius: 0, splashDamage: 0, color: '#be4bdb', introFraction: 0.5, scoreValue: 50 },
      { type: 'demon', baseHp: 5, speed: 160, size: 16, contactDamage: 2, splashRadius: 50, splashDamage: 1, color: '#ffd43b', introFraction: 0.7, scoreValue: 40 },
    ],
    weaponOrder: ['pistol', 'smg', 'ar', 'lmg'],
    weapons: {
      pistol: { type: 'pistol', name: 'PISTOL', fireRate: 800, bulletColor: '#ffd43b' },
      smg: { type: 'smg', name: 'SMG', fireRate: 450, bulletColor: '#00d4ff' },
      ar: { type: 'ar', name: 'ASSAULT RIFLE', fireRate: 250, bulletColor: '#51cf66' },
      lmg: { type: 'lmg', name: 'LMG', fireRate: 120, bulletColor: '#ff6b6b' },
    },
    bossSprite: 'boss_gorath',
    bossNames: ['Gorath Spawn', 'Gorath the Fierce', 'Gorath the Destroyer', 'Gorath the Undying'],
  },
  // ── World 2: Infernal Pits ─────────────────────────────────────────────
  {
    tag: 'infernal',
    names: ['Ember Fields', 'Crimson Gauntlet', 'Hellfire Trench', 'Inferno Core'],
    descriptions: [
      'Heat rises from cracks in the earth.',
      'Blood-soaked warriors charge from the flames.',
      'The ground itself is on fire.',
      'The Inferno Titan awaits in the molten heart.',
    ],
    enemies: [
      { type: 'orc', baseHp: 4, speed: 90, size: 16, contactDamage: 2, splashRadius: 0, splashDamage: 0, color: '#e64980', introFraction: 0, scoreValue: 25 },
      { type: 'berserker', baseHp: 2, speed: 150, size: 14, contactDamage: 3, splashRadius: 0, splashDamage: 0, color: '#ff4444', introFraction: 0.2, scoreValue: 40 },
      { type: 'hellhound', baseHp: 3, speed: 180, size: 13, contactDamage: 2, splashRadius: 40, splashDamage: 1, color: '#ff8c00', introFraction: 0.45, scoreValue: 45 },
      { type: 'warlock', baseHp: 6, speed: 65, size: 15, contactDamage: 4, splashRadius: 70, splashDamage: 2, color: '#9b59b6', introFraction: 0.65, scoreValue: 65 },
    ],
    weaponOrder: ['smg', 'ar', 'lmg', 'minigun'],
    weapons: {
      smg: { type: 'smg', name: 'SMG', fireRate: 430, bulletColor: '#00d4ff' },
      ar: { type: 'ar', name: 'ASSAULT RIFLE', fireRate: 240, bulletColor: '#51cf66' },
      lmg: { type: 'lmg', name: 'LMG', fireRate: 110, bulletColor: '#ff6b6b' },
      minigun: { type: 'minigun', name: 'MINIGUN', fireRate: 55, bulletColor: '#ff00ff' },
    },
    bossSprite: 'boss_inferno',
    bossNames: ['Flame Wraith', 'Inferno Beast', 'Molten Colossus', 'Inferno Titan'],
  },
  // ── World 3: Frozen Abyss ─────────────────────────────────────────────
  {
    tag: 'frost',
    names: ['Frostbite Pass', 'Glacier Ruins', 'Banshee Hollow', 'The Frozen Throne'],
    descriptions: [
      'Ice and silence stretch to the horizon.',
      'Ancient ruins crackle with frost magic.',
      'Ghostly wails echo through the canyon.',
      'The Frost Wyrm stirs beneath the glacier.',
    ],
    enemies: [
      { type: 'frostbite', baseHp: 2, speed: 100, size: 11, contactDamage: 1, splashRadius: 0, splashDamage: 0, color: '#74c0fc', introFraction: 0, scoreValue: 15 },
      { type: 'ice_golem', baseHp: 15, speed: 35, size: 26, contactDamage: 5, splashRadius: 0, splashDamage: 0, color: '#4dabf7', introFraction: 0.25, scoreValue: 70 },
      { type: 'banshee', baseHp: 3, speed: 190, size: 13, contactDamage: 2, splashRadius: 55, splashDamage: 2, color: '#d0bfff', introFraction: 0.45, scoreValue: 55 },
      { type: 'yeti', baseHp: 10, speed: 110, size: 24, contactDamage: 4, splashRadius: 35, splashDamage: 1, color: '#e8e8e8', introFraction: 0.65, scoreValue: 80 },
    ],
    weaponOrder: ['ar', 'lmg', 'cryo', 'railgun'],
    weapons: {
      ar: { type: 'ar', name: 'ASSAULT RIFLE', fireRate: 240, bulletColor: '#51cf66' },
      lmg: { type: 'lmg', name: 'LMG', fireRate: 110, bulletColor: '#ff6b6b' },
      cryo: { type: 'cryo', name: 'CRYO CANNON', fireRate: 150, bulletColor: '#7fdbff' },
      railgun: { type: 'railgun', name: 'RAILGUN', fireRate: 45, bulletColor: '#00ffcc' },
    },
    bossSprite: 'boss_frost',
    bossNames: ['Ice Shade', 'Frost Troll King', 'Glacier Beast', 'Frost Wyrm'],
  },
  // ── World 4: Plague Wastes ─────────────────────────────────────────────
  {
    tag: 'plague',
    names: ['Rat Warren', 'Blighted Mire', 'Spore Caverns', 'Plague Heart'],
    descriptions: [
      'Vermin pour from the sewers below.',
      'Toxic swamps breed monstrosities.',
      'Spore clouds choke the air thick.',
      'The Plague Hydra regenerates endlessly.',
    ],
    enemies: [
      { type: 'rat_swarm', baseHp: 1, speed: 130, size: 10, contactDamage: 1, splashRadius: 0, splashDamage: 0, color: '#a0522d', introFraction: 0, scoreValue: 8 },
      { type: 'blighted', baseHp: 6, speed: 70, size: 18, contactDamage: 3, splashRadius: 45, splashDamage: 1, color: '#2ecc71', introFraction: 0.2, scoreValue: 45 },
      { type: 'spore_carrier', baseHp: 4, speed: 55, size: 20, contactDamage: 2, splashRadius: 80, splashDamage: 3, color: '#f39c12', introFraction: 0.45, scoreValue: 60 },
      { type: 'abomination', baseHp: 18, speed: 40, size: 28, contactDamage: 6, splashRadius: 60, splashDamage: 2, color: '#8e44ad', introFraction: 0.65, scoreValue: 100 },
    ],
    weaponOrder: ['ar', 'lmg', 'flamer', 'plasma'],
    weapons: {
      ar: { type: 'ar', name: 'ASSAULT RIFLE', fireRate: 230, bulletColor: '#51cf66' },
      lmg: { type: 'lmg', name: 'LMG', fireRate: 100, bulletColor: '#ff6b6b' },
      flamer: { type: 'flamer', name: 'FLAMETHROWER', fireRate: 75, bulletColor: '#ff6348' },
      plasma: { type: 'plasma', name: 'PLASMA RIFLE', fireRate: 40, bulletColor: '#7bed9f' },
    },
    bossSprite: 'boss_plague',
    bossNames: ['Plague Rat King', 'Toxic Hulk', 'Spore Lord', 'Plague Hydra'],
  },
  // ── World 5: Throne of Ash ─────────────────────────────────────────────
  {
    tag: 'ash',
    names: ['Shadow Vanguard', 'Ashwalker Trail', 'Void Rift', 'Throne of Ash'],
    descriptions: [
      'Shadow knights march in lockstep.',
      'Ash falls like snow on a dying world.',
      'Reality tears as void creatures emerge.',
      'The Lich King commands an army of shadow and flame.',
    ],
    enemies: [
      { type: 'shadow_knight', baseHp: 8, speed: 100, size: 18, contactDamage: 3, splashRadius: 0, splashDamage: 0, color: '#2c3e50', introFraction: 0, scoreValue: 50 },
      { type: 'ashwalker', baseHp: 5, speed: 160, size: 14, contactDamage: 3, splashRadius: 50, splashDamage: 2, color: '#e74c3c', introFraction: 0.2, scoreValue: 65 },
      { type: 'void_weaver', baseHp: 4, speed: 200, size: 12, contactDamage: 4, splashRadius: 65, splashDamage: 3, color: '#9b59b6', introFraction: 0.4, scoreValue: 85 },
      { type: 'archfiend', baseHp: 20, speed: 80, size: 28, contactDamage: 7, splashRadius: 75, splashDamage: 3, color: '#c0392b', introFraction: 0.6, scoreValue: 120 },
    ],
    weaponOrder: ['lmg', 'plasma', 'voidbeam', 'godslayer'],
    weapons: {
      lmg: { type: 'lmg', name: 'LMG', fireRate: 100, bulletColor: '#ff6b6b' },
      plasma: { type: 'plasma', name: 'PLASMA RIFLE', fireRate: 45, bulletColor: '#7bed9f' },
      voidbeam: { type: 'voidbeam', name: 'VOID BEAM', fireRate: 30, bulletColor: '#a855f7' },
      godslayer: { type: 'godslayer', name: 'GODSLAYER', fireRate: 20, bulletColor: '#fbbf24' },
    },
    bossSprite: 'boss_lich',
    bossNames: ['Shadow Lord', 'Ash Demon', 'Void Prince', 'Lich King'],
    bossTint: undefined,
  },
];

// ---------------------------------------------------------------------------
// Scaling helpers
// ---------------------------------------------------------------------------

/** levelIndex 0-19 → difficulty multiplier 1.0 – 3.0 */
function difficultyScale(levelIndex: number): number {
  return 1 + (levelIndex / 19) * 2;
}

/** Position within world (0-3) → intra-world ramp 1.0 – 1.6 */
function worldRamp(posInWorld: number): number {
  return 1 + posInWorld * 0.2;
}

/** Offset a distance so it doesn't land on a gate-interval multiple */
function offsetFromGates(distance: number, gateInterval: number): number {
  const remainder = distance % gateInterval;
  const minGap = gateInterval * 0.2; // stay at least 20% of interval away
  if (remainder < minGap) {
    return distance + (minGap - remainder);
  }
  if (remainder > gateInterval - minGap) {
    return distance - (remainder - (gateInterval - minGap));
  }
  return distance;
}

// ---------------------------------------------------------------------------
// Level generation
// ---------------------------------------------------------------------------

function generateLevel(levelIndex: number): LevelConfig {
  const worldIdx = Math.floor(levelIndex / 4);
  const posInWorld = levelIndex % 4;
  const world = WORLDS[worldIdx];
  const diff = difficultyScale(levelIndex);
  const ramp = worldRamp(posInWorld);

  // Distance to boss scales with difficulty
  const triggerDistance = Math.round(2000 + levelIndex * 150);
  const gateInterval = Math.round(500 - levelIndex * 5); // slightly closer gates later
  const marchSpeed = Math.round(130 + levelIndex * 2);

  // ── Enemies ──
  const enemies: Record<string, LevelEnemyConfig> = {};
  const enemyKills: Record<string, number> = {};
  for (const tmpl of world.enemies) {
    const hpScale = diff * ramp;
    enemies[tmpl.type] = {
      type: tmpl.type,
      hp: Math.max(1, Math.round(tmpl.baseHp * hpScale)),
      speed: Math.round(tmpl.speed * (1 + posInWorld * 0.05)),
      size: tmpl.size,
      contactDamage: tmpl.contactDamage,
      splashRadius: tmpl.splashRadius,
      splashDamage: tmpl.splashDamage,
      color: tmpl.color,
      appearsAtDistance: Math.round(tmpl.introFraction * triggerDistance),
      scoreValue: Math.round(tmpl.scoreValue * diff),
    };
    enemyKills[tmpl.type] = Math.round(tmpl.scoreValue * diff);
  }

  // ── Weapons (in-field crates) ──
  const weaponOrder = world.weaponOrder;
  const weapons: Record<string, LevelWeaponConfig> = { ...world.weapons };
  // Slightly faster fire rates for later levels in a world
  for (const key of Object.keys(weapons)) {
    weapons[key] = {
      ...weapons[key],
      fireRate: Math.max(15, Math.round(weapons[key].fireRate * (1 - posInWorld * 0.05))),
    };
  }

  const weaponCrates: WeaponCrateConfig[] = [];
  for (let i = 0; i < weaponOrder.length - 1; i++) {
    const fraction = (i + 1) / weaponOrder.length;
    const rawDist = Math.round(triggerDistance * fraction * 0.85);
    const dist = Math.round(offsetFromGates(rawDist, gateInterval));
    weaponCrates.push({
      currentWeapon: weaponOrder[i],
      nextWeapon: weaponOrder[i + 1],
      distance: dist,
      hp: Math.round((15 + i * 12) * ramp),
    });
  }

  // ── Waves ──
  const baseInterval = Math.max(40, 120 - levelIndex * 4);
  const brackets: WaveBracket[] = [
    { maxDistance: Math.round(triggerDistance * 0.1), clusterMin: 1, clusterMax: 1 + Math.floor(posInWorld * 0.5), intervalMin: baseInterval, intervalMax: baseInterval + 60 },
    { maxDistance: Math.round(triggerDistance * 0.2), clusterMin: 1, clusterMax: 2 + Math.floor(posInWorld * 0.5), intervalMin: Math.round(baseInterval * 0.7), intervalMax: Math.round((baseInterval + 40) * 0.8) },
    { maxDistance: Math.round(triggerDistance * 0.35), clusterMin: 1 + Math.floor(posInWorld * 0.5), clusterMax: 3 + posInWorld, intervalMin: Math.round(baseInterval * 0.5), intervalMax: Math.round(baseInterval * 0.7) },
    { maxDistance: Math.round(triggerDistance * 0.5), clusterMin: 2, clusterMax: 4 + posInWorld, intervalMin: Math.round(baseInterval * 0.4), intervalMax: Math.round(baseInterval * 0.55) },
    { maxDistance: Math.round(triggerDistance * 0.7), clusterMin: 2 + Math.floor(posInWorld * 0.5), clusterMax: 5 + posInWorld, intervalMin: Math.round(baseInterval * 0.3), intervalMax: Math.round(baseInterval * 0.4) },
    { maxDistance: Math.round(triggerDistance * 0.85), clusterMin: 3 + posInWorld, clusterMax: 6 + posInWorld, intervalMin: Math.round(baseInterval * 0.22), intervalMax: Math.round(baseInterval * 0.32) },
    { maxDistance: 99999, clusterMin: 4 + posInWorld, clusterMax: 7 + posInWorld + Math.floor(levelIndex / 5), intervalMin: Math.max(10, Math.round(baseInterval * 0.15)), intervalMax: Math.max(16, Math.round(baseInterval * 0.25)) },
  ];

  // ── Gates ──
  const gateTemplates: GateTemplateConfig[] = buildGateTemplates(levelIndex, triggerDistance);

  // ── Boss ──
  const bossHp = Math.round((300 + levelIndex * 80) * ramp);
  const phases = buildBossPhases(posInWorld, levelIndex);
  const enrageThreshold = 0.2 + posInWorld * 0.04;
  const chargeSpeed = 300 + levelIndex * 10;

  // ── Scoring ──
  const perMeter = 1 + Math.floor(levelIndex / 4);
  const perSurvivingUnit = 100 + levelIndex * 15;
  const bossKill = 3000 + levelIndex * 1000;

  return {
    id: `level_${levelIndex + 1}`,
    name: world.names[posInWorld],
    description: world.descriptions[posInWorld],
    startingUnits: 1,
    marchSpeed,
    startingWeapon: weaponOrder[0],
    weapons,
    weaponOrder,
    weaponCrates,
    enemies,
    waves: {
      gracePeriod: Math.max(60, 120 - levelIndex * 3),
      brackets,
    },
    gates: {
      interval: gateInterval,
      templates: gateTemplates,
    },
    boss: {
      name: world.bossNames[posInWorld],
      sprite: world.bossSprite,
      tint: world.bossTint,
      scale: 1.5 + posInWorld * 0.1,
      hp: bossHp,
      triggerDistance,
      phases,
      enrageThreshold,
      enrageDurationMultiplier: Math.max(0.3, 0.55 - posInWorld * 0.05),
      slamWarning: Math.max(700, 1500 - levelIndex * 30),
      enrageWarning: Math.max(350, 800 - levelIndex * 20),
      chargeSpeed,
      enrageChargeSpeed: Math.round(chargeSpeed * 1.5),
    },
    scoring: {
      perMeter,
      perSurvivingUnit,
      bossKill,
      enemyKills,
    },
  };
}

function buildGateTemplates(levelIndex: number, triggerDistance: number): GateTemplateConfig[] {
  // Max multiply scales down as levels progress to keep armies small
  const maxMult = levelIndex < 8 ? 3 : 2;
  const templates: GateTemplateConfig[] = [
    // Early gates: small additions
    { left: { op: 'add', value: 3 }, right: { op: 'add', value: 2 }, minDistance: 0 },
    { left: { op: 'add', value: 5 }, right: { op: 'add', value: 2 }, minDistance: 0 },
    // Mid gates: multiply with risk
    { left: { op: 'multiply', value: 2 }, right: { op: 'add', value: 5 }, minDistance: Math.round(triggerDistance * 0.1) },
    { left: { op: 'add', value: 3 }, right: { op: 'subtract', value: 2 }, minDistance: Math.round(triggerDistance * 0.15) },
    { left: { op: 'add', value: 8 }, right: { op: 'add', value: 3 }, minDistance: Math.round(triggerDistance * 0.2) },
    // Late gates: bigger risk/reward
    { left: { op: 'multiply', value: maxMult }, right: { op: 'subtract', value: 3 }, minDistance: Math.round(triggerDistance * 0.35) },
    { left: { op: 'divide', value: 2 }, right: { op: 'multiply', value: 2 }, minDistance: Math.round(triggerDistance * 0.4) },
    { left: { op: 'multiply', value: 2 }, right: { op: 'divide', value: 2 }, minDistance: Math.round(triggerDistance * 0.55) },
    { left: { op: 'add', value: 10 }, right: { op: 'subtract', value: 3 }, minDistance: Math.round(triggerDistance * 0.65) },
  ];
  return templates;
}

function buildBossPhases(posInWorld: number, levelIndex: number): BossPhaseConfig[] {
  const vulnDuration = Math.max(2000, 5000 - levelIndex * 100);
  const slamDuration = Math.max(2000, 3000 + posInWorld * 200);
  const chargeDuration = Math.max(2500, 4000 - posInWorld * 200);

  const phases: BossPhaseConfig[] = [
    { name: 'vulnerable', duration: vulnDuration, damageReduction: 0 },
    { name: 'slam', duration: slamDuration, damageReduction: 0.5 },
    { name: 'charge', duration: chargeDuration, damageReduction: 1 },
  ];

  // Later levels in a world get extra phases
  if (posInWorld >= 2) {
    phases.push(
      { name: 'vulnerable', duration: Math.round(vulnDuration * 0.7), damageReduction: 0 },
      { name: 'slam', duration: Math.round(slamDuration * 0.8), damageReduction: 0.6 },
    );
  }
  if (posInWorld === 3) {
    phases.push(
      { name: 'charge', duration: Math.round(chargeDuration * 0.8), damageReduction: 1 },
    );
  }

  return phases;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** World metadata for the menu map */
export interface WorldInfo {
  name: string;
  startLevel: number; // 0-based index into the level array
  levelCount: number;
}

export const WORLD_INFO: WorldInfo[] = WORLDS.map((w, i) => ({
  name: w.tag.charAt(0).toUpperCase() + w.tag.slice(1) + ' Realm',
  startLevel: i * 4,
  levelCount: 4,
}));

// Give worlds nicer display names
WORLD_INFO[0].name = 'Goblin Wastes';
WORLD_INFO[1].name = 'Infernal Pits';
WORLD_INFO[2].name = 'Frozen Abyss';
WORLD_INFO[3].name = 'Plague Wastes';
WORLD_INFO[4].name = 'Throne of Ash';

/** Generate all 20 levels */
export function generateAllLevels(): LevelConfig[] {
  const levels: LevelConfig[] = [];
  for (let i = 0; i < 20; i++) {
    levels.push(generateLevel(i));
  }
  return levels;
}
