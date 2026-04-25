// src/config/progression/LevelGenerator.ts
// Endless procedural level generator.
// Levels are grouped in cycles of 5 (easy → hard). Each cycle rotates through
// the 5 world themes. Overall difficulty creeps up with each cycle so later
// "easy" levels are still harder than earlier ones.

import { generateEnemySet, toEnemyConfigs } from '@/systems/ProceduralEnemy';
import type {
  LevelConfig,
  LevelTheme,
  LevelEnemyConfig,
  LevelWeaponConfig,
  WeaponCrateConfig,
  BossPhaseConfig,
  WaveBracket,
} from './types';

// ---------------------------------------------------------------------------
// World definitions (5 themes that cycle forever)
// ---------------------------------------------------------------------------

interface WorldThemeDef {
  groundColor: number;
  detailColors: number[];
  glowColors: number[];
  accentColor: number;
  accentHex: string;
  decorKeys?: string[];
  pathColor?: number;
  useStonePath?: boolean;
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
  introFraction: number;
  scoreValue: number;
}

interface WorldDef {
  tag: string;
  displayName: string;
  theme: WorldThemeDef;
  levelNames: string[];
  enemies: EnemyTemplate[];
  weaponOrder: string[];
  weapons: Record<string, LevelWeaponConfig>;
  bossSprite: string;
  bossNames: string[];
  bossTint?: string;
}

const WORLDS: WorldDef[] = [
  // ── World 1: Goblin Wastes ──
  {
    tag: 'goblin',
    displayName: 'Green Meadows',
    theme: {
      groundColor: 0x6fbf5e, detailColors: [0x7fcc6e, 0x5aad4a, 0x8fd980, 0x4e9e3e],
      glowColors: [0xa8e89a, 0xb8f0ab, 0x90dd80], accentColor: 0x4cde39, accentHex: '#4cde39',
      decorKeys: ['decor_tree', 'decor_pine', 'decor_bush', 'decor_rock', 'decor_mushroom', 'decor_flowers', 'decor_log', 'decor_stump'],
      pathColor: 0x8b6914, useStonePath: true,
    },
    levelNames: ['The March Begins', 'Goblin Gauntlet', 'Orc Stronghold', 'Troll Bridge', 'Demon Gate'],
    enemies: [
      { type: 'goblin', baseHp: 2, speed: 70, size: 12, contactDamage: 1, splashRadius: 0, splashDamage: 0, color: '#ff6b6b', introFraction: 0, scoreValue: 10 },
      { type: 'orc', baseHp: 5, speed: 80, size: 16, contactDamage: 2, splashRadius: 0, splashDamage: 0, color: '#e64980', introFraction: 0.25, scoreValue: 30 },
      { type: 'troll', baseHp: 12, speed: 50, size: 22, contactDamage: 3, splashRadius: 0, splashDamage: 0, color: '#be4bdb', introFraction: 0.5, scoreValue: 50 },
      { type: 'demon', baseHp: 8, speed: 160, size: 16, contactDamage: 2, splashRadius: 50, splashDamage: 1, color: '#ffd43b', introFraction: 0.7, scoreValue: 40 },
    ],
    weaponOrder: ['pistol', 'smg', 'ar', 'lmg'],
    weapons: {
      pistol: { type: 'pistol', name: 'PISTOL', fireRate: 800, bulletColor: '#ffd43b' },
      smg: { type: 'smg', name: 'SMG', fireRate: 450, bulletColor: '#00d4ff' },
      ar: { type: 'ar', name: 'ASSAULT RIFLE', fireRate: 250, bulletColor: '#51cf66' },
      lmg: { type: 'lmg', name: 'LMG', fireRate: 120, bulletColor: '#ff6b6b' },
    },
    bossSprite: 'char_ogre',
    bossNames: ['Gorath Spawn', 'Gorath the Fierce', 'Gorath the Destroyer', 'Gorath Reborn', 'Gorath the Undying'],
  },
  // ── World 2: Infernal Pits ──
  {
    tag: 'infernal',
    displayName: 'Lava Fields',
    theme: {
      groundColor: 0xc48a5a, detailColors: [0xb07848, 0xd49e6e, 0xc08050, 0xa06838],
      glowColors: [0xffaa66, 0xff9955, 0xffbb77], accentColor: 0xff6644, accentHex: '#ff6644',
      decorKeys: ['decor_crack', 'decor_skull', 'decor_bones', 'decor_rock', 'decor_tree', 'decor_column'],
      pathColor: 0x3a1a0a, useStonePath: true,
    },
    levelNames: ['Ember Fields', 'Crimson Gauntlet', 'Hellfire Trench', 'Molten Core', 'Inferno Heart'],
    enemies: [
      { type: 'orc', baseHp: 6, speed: 90, size: 16, contactDamage: 2, splashRadius: 0, splashDamage: 0, color: '#e64980', introFraction: 0, scoreValue: 25 },
      { type: 'berserker', baseHp: 4, speed: 150, size: 14, contactDamage: 3, splashRadius: 0, splashDamage: 0, color: '#ff4444', introFraction: 0.2, scoreValue: 40 },
      { type: 'hellhound', baseHp: 5, speed: 180, size: 13, contactDamage: 2, splashRadius: 40, splashDamage: 1, color: '#ff8c00', introFraction: 0.45, scoreValue: 45 },
      { type: 'warlock', baseHp: 9, speed: 65, size: 15, contactDamage: 4, splashRadius: 70, splashDamage: 2, color: '#9b59b6', introFraction: 0.65, scoreValue: 65 },
    ],
    weaponOrder: ['smg', 'ar', 'lmg', 'minigun'],
    weapons: {
      smg: { type: 'smg', name: 'SMG', fireRate: 430, bulletColor: '#00d4ff' },
      ar: { type: 'ar', name: 'ASSAULT RIFLE', fireRate: 240, bulletColor: '#51cf66' },
      lmg: { type: 'lmg', name: 'LMG', fireRate: 110, bulletColor: '#ff6b6b' },
      minigun: { type: 'minigun', name: 'MINIGUN', fireRate: 55, bulletColor: '#ff00ff' },
    },
    bossSprite: 'char_big_demon',
    bossNames: ['Flame Wraith', 'Inferno Beast', 'Molten Colossus', 'Magma Lord', 'Inferno Titan'],
  },
  // ── World 3: Frozen Abyss ──
  {
    tag: 'frost',
    displayName: 'Snow Fields',
    theme: {
      groundColor: 0xd0e8f4, detailColors: [0xc0dcea, 0xdcf0fa, 0xb4d4e6, 0xe4f4fc],
      glowColors: [0xe8f4ff, 0xddeeff, 0xf0f8ff], accentColor: 0x5cb8ff, accentHex: '#5cb8ff',
      decorKeys: ['decor_tree', 'decor_icicle', 'decor_crystal', 'decor_rock', 'decor_pine', 'decor_gravestone'],
      pathColor: 0x7590a8, useStonePath: true,
    },
    levelNames: ['Frostbite Pass', 'Glacier Ruins', 'Banshee Hollow', 'Ice Citadel', 'The Frozen Throne'],
    enemies: [
      { type: 'frostbite', baseHp: 3, speed: 100, size: 11, contactDamage: 1, splashRadius: 0, splashDamage: 0, color: '#74c0fc', introFraction: 0, scoreValue: 15 },
      { type: 'ice_golem', baseHp: 20, speed: 35, size: 26, contactDamage: 5, splashRadius: 0, splashDamage: 0, color: '#4dabf7', introFraction: 0.25, scoreValue: 70 },
      { type: 'banshee', baseHp: 5, speed: 190, size: 13, contactDamage: 2, splashRadius: 55, splashDamage: 2, color: '#d0bfff', introFraction: 0.45, scoreValue: 55 },
      { type: 'yeti', baseHp: 14, speed: 110, size: 24, contactDamage: 4, splashRadius: 35, splashDamage: 1, color: '#e8e8e8', introFraction: 0.65, scoreValue: 80 },
    ],
    weaponOrder: ['ar', 'lmg', 'cryo', 'railgun'],
    weapons: {
      ar: { type: 'ar', name: 'ASSAULT RIFLE', fireRate: 240, bulletColor: '#51cf66' },
      lmg: { type: 'lmg', name: 'LMG', fireRate: 110, bulletColor: '#ff6b6b' },
      cryo: { type: 'cryo', name: 'CRYO CANNON', fireRate: 150, bulletColor: '#7fdbff' },
      railgun: { type: 'railgun', name: 'RAILGUN', fireRate: 45, bulletColor: '#00ffcc' },
    },
    bossSprite: 'char_big_zombie',
    bossNames: ['Ice Shade', 'Frost Troll King', 'Glacier Beast', 'Blizzard Wyrm', 'Frost Wyrm'],
  },
  // ── World 4: Plague Wastes ──
  {
    tag: 'plague',
    displayName: 'Swamp Lands',
    theme: {
      groundColor: 0x7b8a5e, detailColors: [0x6c7a56, 0x8b9b6f, 0x7b8b66, 0x5f6c4d],
      glowColors: [0xc0b68a, 0xb1a577, 0xc9c19d], accentColor: 0x8b6f38, accentHex: '#8b6f38',
      decorKeys: ['decor_mushroom', 'decor_tree', 'decor_slime', 'decor_bones', 'decor_gravestone', 'decor_log', 'decor_stump'],
      pathColor: 0x4a5230, useStonePath: false,
    },
    levelNames: ['Rat Warren', 'Blighted Mire', 'Spore Caverns', 'Toxic Depths', 'Plague Heart'],
    enemies: [
      { type: 'rat_swarm', baseHp: 2, speed: 130, size: 10, contactDamage: 1, splashRadius: 0, splashDamage: 0, color: '#a0522d', introFraction: 0, scoreValue: 8 },
      { type: 'blighted', baseHp: 9, speed: 70, size: 18, contactDamage: 3, splashRadius: 45, splashDamage: 1, color: '#2ecc71', introFraction: 0.2, scoreValue: 45 },
      { type: 'spore_carrier', baseHp: 6, speed: 55, size: 20, contactDamage: 2, splashRadius: 80, splashDamage: 3, color: '#f39c12', introFraction: 0.45, scoreValue: 60 },
      { type: 'abomination', baseHp: 24, speed: 40, size: 28, contactDamage: 6, splashRadius: 60, splashDamage: 2, color: '#8e44ad', introFraction: 0.65, scoreValue: 100 },
    ],
    weaponOrder: ['ar', 'lmg', 'flamer', 'plasma'],
    weapons: {
      ar: { type: 'ar', name: 'ASSAULT RIFLE', fireRate: 230, bulletColor: '#51cf66' },
      lmg: { type: 'lmg', name: 'LMG', fireRate: 100, bulletColor: '#ff6b6b' },
      flamer: { type: 'flamer', name: 'FLAMETHROWER', fireRate: 75, bulletColor: '#ff6348' },
      plasma: { type: 'plasma', name: 'PLASMA RIFLE', fireRate: 40, bulletColor: '#7bed9f' },
    },
    bossSprite: 'char_big_zombie',
    bossNames: ['Plague Rat King', 'Toxic Hulk', 'Spore Lord', 'Blight Titan', 'Plague Hydra'],
  },
  // ── World 5: Throne of Ash ──
  {
    tag: 'ash',
    displayName: 'Desert Sands',
    theme: {
      groundColor: 0xdcc078, detailColors: [0xd0b468, 0xe6cc88, 0xc8a858, 0xf0d898],
      glowColors: [0xf4e8aa, 0xeede90, 0xfaf0bb], accentColor: 0xd4b55a, accentHex: '#d4b55a',
      decorKeys: ['decor_cactus', 'decor_sand_dune', 'decor_skull', 'decor_bones', 'decor_column', 'decor_rock'],
      pathColor: 0xa88450, useStonePath: true,
    },
    levelNames: ['Shadow Vanguard', 'Ashwalker Trail', 'Void Rift', 'Dark Sanctum', 'Throne of Ash'],
    enemies: [
      { type: 'shadow_knight', baseHp: 12, speed: 100, size: 18, contactDamage: 3, splashRadius: 0, splashDamage: 0, color: '#2c3e50', introFraction: 0, scoreValue: 50 },
      { type: 'ashwalker', baseHp: 8, speed: 160, size: 14, contactDamage: 3, splashRadius: 50, splashDamage: 2, color: '#e74c3c', introFraction: 0.2, scoreValue: 65 },
      { type: 'void_weaver', baseHp: 6, speed: 200, size: 12, contactDamage: 4, splashRadius: 65, splashDamage: 3, color: '#9b59b6', introFraction: 0.4, scoreValue: 85 },
      { type: 'archfiend', baseHp: 28, speed: 80, size: 28, contactDamage: 7, splashRadius: 75, splashDamage: 3, color: '#c0392b', introFraction: 0.6, scoreValue: 120 },
    ],
    weaponOrder: ['lmg', 'plasma', 'voidbeam', 'godslayer'],
    weapons: {
      lmg: { type: 'lmg', name: 'LMG', fireRate: 100, bulletColor: '#ff6b6b' },
      plasma: { type: 'plasma', name: 'PLASMA RIFLE', fireRate: 45, bulletColor: '#7bed9f' },
      voidbeam: { type: 'voidbeam', name: 'VOID BEAM', fireRate: 30, bulletColor: '#a855f7' },
      godslayer: { type: 'godslayer', name: 'GODSLAYER', fireRate: 20, bulletColor: '#fbbf24' },
    },
    bossSprite: 'char_necromancer',
    bossNames: ['Shadow Lord', 'Ash Demon', 'Void Prince', 'Dark Sovereign', 'Lich King'],
  },
];

// ---------------------------------------------------------------------------
// Scaling helpers
// ---------------------------------------------------------------------------

/**
 * Each cycle of 5 levels goes easy→hard (posInCycle 0–4).
 * The cycle number itself adds a global creep so later "easy" is still tougher.
 */
function difficultyScale(cycle: number, posInCycle: number): number {
  const globalCreep = 1 + cycle * 0.2;         // +20% per full cycle
  const localRamp = 1 + posInCycle * 0.12;     // +12% per step within cycle
  return globalCreep * localRamp;
}

/** Offset a distance so it doesn't land on a gate-interval multiple */
function offsetFromGates(distance: number, gateInterval: number): number {
  const remainder = distance % gateInterval;
  const minGap = gateInterval * 0.2;
  if (remainder < minGap) return distance + (minGap - remainder);
  if (remainder > gateInterval - minGap) return distance - (remainder - (gateInterval - minGap));
  return distance;
}

// ---------------------------------------------------------------------------
// Public: generate a single level by index (0-based, unbounded)
// ---------------------------------------------------------------------------

export function generateLevel(levelIndex: number): LevelConfig {
  const cycle = Math.floor(levelIndex / 5);      // which 5-level group
  const posInCycle = levelIndex % 5;              // 0=easy … 4=hard
  const worldIdx = cycle % WORLDS.length;         // rotate through worlds
  const world = WORLDS[worldIdx];
  const diff = difficultyScale(cycle, posInCycle);

  // Core tuning knobs
  const gateInterval = Math.max(400, Math.round(600 - cycle * 10 - posInCycle * 10));
  // Boss gate lands one interval after the last regular gate
  const rawTrigger = 6000 + cycle * 400 + posInCycle * 300;
  const triggerDistance = Math.ceil(rawTrigger / gateInterval) * gateInterval;
  const marchSpeed = Math.round(130 + cycle * 3 + posInCycle * 2);

  // ── Enemies — always procedural for maximum variety ──
  const enemies: Record<string, LevelEnemyConfig> = {};
  const enemyKills: Record<string, number> = {};

  const enemySeed = levelIndex * 7919 + 42;
  const procDefs = generateEnemySet(enemySeed, worldIdx);
  const procConfigs = toEnemyConfigs(procDefs, diff, triggerDistance);
  for (const [type, cfg] of Object.entries(procConfigs)) {
    enemies[type] = cfg;
    enemyKills[type] = cfg.scoreValue;
  }

  // ── Weapons ──
  const weaponOrder = world.weaponOrder;
  const weapons: Record<string, LevelWeaponConfig> = {};
  for (const key of Object.keys(world.weapons)) {
    weapons[key] = {
      ...world.weapons[key],
      fireRate: Math.max(12, Math.round(world.weapons[key].fireRate * (1 - posInCycle * 0.04))),
    };
  }

  // ── Weapon crates (offset from gate intervals) — appear early, break fast ──
  const weaponCrates: WeaponCrateConfig[] = [];
  for (let i = 0; i < weaponOrder.length - 1; i++) {
    const fraction = (i + 1) / weaponOrder.length;
    const rawDist = Math.round(triggerDistance * fraction * 0.65);
    const dist = Math.round(offsetFromGates(rawDist, gateInterval));
    weaponCrates.push({
      currentWeapon: weaponOrder[i],
      nextWeapon: weaponOrder[i + 1],
      distance: dist,
      hp: Math.round((8 + i * 6) * (1 + posInCycle * 0.1)),
    });
  }

  // ── Waves (easy levels = sparse, hard levels = dense) ──
  const baseInterval = Math.max(30, 100 - cycle * 4 - posInCycle * 5);
  // Level 1 (index 0) gets a much gentler opening so the solo starting
  // unit has time to reach the first gate before enemies pile on.
  const isFirstLevel = levelIndex === 0;
  const brackets: WaveBracket[] = [
    { maxDistance: Math.round(triggerDistance * 0.10), clusterMin: 1, clusterMax: isFirstLevel ? 1 : 2, intervalMin: isFirstLevel ? 800 : Math.round(baseInterval * 0.8), intervalMax: isFirstLevel ? 1200 : baseInterval + 40 },
    { maxDistance: Math.round(triggerDistance * 0.20), clusterMin: 1, clusterMax: isFirstLevel ? 1 : 2 + Math.floor(posInCycle * 0.5), intervalMin: isFirstLevel ? 450 : Math.round(baseInterval * 0.6), intervalMax: isFirstLevel ? 650 : Math.round(baseInterval * 0.8) },
    { maxDistance: Math.round(triggerDistance * 0.35), clusterMin: 2, clusterMax: 3 + posInCycle, intervalMin: Math.round(baseInterval * 0.45), intervalMax: Math.round(baseInterval * 0.6) },
    { maxDistance: Math.round(triggerDistance * 0.50), clusterMin: 2, clusterMax: 4 + posInCycle, intervalMin: Math.round(baseInterval * 0.35), intervalMax: Math.round(baseInterval * 0.5) },
    { maxDistance: Math.round(triggerDistance * 0.70), clusterMin: 3, clusterMax: 5 + posInCycle, intervalMin: Math.round(baseInterval * 0.25), intervalMax: Math.round(baseInterval * 0.38) },
    { maxDistance: Math.round(triggerDistance * 0.85), clusterMin: 3 + posInCycle, clusterMax: 6 + posInCycle, intervalMin: Math.round(baseInterval * 0.2), intervalMax: Math.round(baseInterval * 0.3) },
    { maxDistance: 99999, clusterMin: 4 + posInCycle, clusterMax: 7 + posInCycle + cycle, intervalMin: Math.max(10, Math.round(baseInterval * 0.14)), intervalMax: Math.max(18, Math.round(baseInterval * 0.22)) },
  ];

  // ── Boss ──
  const bossHp = Math.round((400 + cycle * 130 + posInCycle * 110) * (1 + posInCycle * 0.15));
  const phases = buildBossPhases(posInCycle, cycle);
  const chargeSpeed = 240 + cycle * 12 + posInCycle * 10;

  // ── Scoring ──
  const perMeter = 1 + cycle;
  const perSurvivingUnit = 100 + cycle * 20 + posInCycle * 10;
  const bossKill = 3000 + cycle * 1500 + posInCycle * 500;

  return {
    id: `level_${levelIndex + 1}`,
    name: world.levelNames[posInCycle],
    description: `Cycle ${cycle + 1} — ${world.displayName}`,
    theme: {
      groundColor: world.theme.groundColor,
      detailColors: world.theme.detailColors,
      glowColors: world.theme.glowColors,
      accentColor: world.theme.accentColor,
      accentHex: world.theme.accentHex,
      worldName: world.displayName,
      decorKeys: world.theme.decorKeys,
      pathColor: world.theme.pathColor,
      useStonePath: world.theme.useStonePath,
    },
    startingUnits: 1,
    marchSpeed,
    startingWeapon: weaponOrder[0],
    weapons,
    weaponOrder,
    weaponCrates,
    enemies,
    waves: {
      gracePeriod: isFirstLevel ? 700 : Math.max(50, 120 - cycle * 4 - posInCycle * 6),
      brackets,
    },
    gates: { interval: gateInterval, templates: [] },
    boss: {
      name: generateBossName(levelIndex),
      sprite: world.bossSprite,
      tint: generateBossTint(levelIndex, worldIdx),
      scale: 1.5 + posInCycle * 0.08,
      hp: bossHp,
      triggerDistance,
      phases,
      enrageThreshold: 0.2 + posInCycle * 0.03,
      enrageDurationMultiplier: Math.max(0.25, 0.55 - posInCycle * 0.05),
      slamWarning: Math.max(600, 1500 - cycle * 30 - posInCycle * 60),
      enrageWarning: Math.max(300, 800 - cycle * 20 - posInCycle * 40),
      chargeSpeed,
      enrageChargeSpeed: Math.round(chargeSpeed * 1.3),
    },
    scoring: { perMeter, perSurvivingUnit, bossKill, enemyKills },
  };
}

// ---------------------------------------------------------------------------
// Procedural boss name + tint for variety
// ---------------------------------------------------------------------------

const BOSS_PREFIXES = [
  'Lord', 'King', 'Queen', 'Duke', 'Baron', 'Warlord', 'Emperor', 'Tyrant',
  'Ancient', 'Cursed', 'Fallen', 'Undead', 'Elder', 'Primal', 'Abyssal',
  'Infernal', 'Frost', 'Shadow', 'Blood', 'Iron', 'Storm', 'Doom', 'Dread',
];
const BOSS_NAMES = [
  'Gorath', 'Malachar', 'Vexor', 'Thundrak', 'Zephyros', 'Nox', 'Pyraxis',
  'Glacius', 'Venomor', 'Skulrak', 'Drakon', 'Mortis', 'Azrael', 'Typhon',
  'Kronos', 'Balor', 'Fenris', 'Moloch', 'Orcus', 'Surtur', 'Ravana',
  'Behemoth', 'Leviathan', 'Chimera', 'Hydra', 'Basilisk', 'Cerberus',
];
const BOSS_TINT_PALETTES: number[][] = [
  [0xff4444, 0xcc2222, 0xff6666], // red
  [0x4488ff, 0x2266dd, 0x66aaff], // blue
  [0x44ff44, 0x22cc22, 0x66ff66], // green
  [0xffaa00, 0xdd8800, 0xffcc44], // orange
  [0xaa44ff, 0x8822dd, 0xcc66ff], // purple
  [0xff44aa, 0xdd2288, 0xff66cc], // pink
  [0x44ffff, 0x22dddd, 0x66ffff], // cyan
];

function generateBossName(levelIndex: number): string {
  // Seeded selection so same level always gets same name
  const s1 = (levelIndex * 3571 + 17) % BOSS_PREFIXES.length;
  const s2 = (levelIndex * 7243 + 31) % BOSS_NAMES.length;
  return `${BOSS_PREFIXES[s1]} ${BOSS_NAMES[s2]}`;
}

function generateBossTint(levelIndex: number, worldIdx: number): string | undefined {
  // Cycle 0 world bosses keep original colors (no tint)
  if (levelIndex < 5) return undefined;
  const palette = BOSS_TINT_PALETTES[(levelIndex * 1327 + worldIdx) % BOSS_TINT_PALETTES.length];
  const color = palette[(levelIndex * 991) % palette.length];
  return '#' + color.toString(16).padStart(6, '0');
}

function buildBossPhases(posInCycle: number, cycle: number): BossPhaseConfig[] {
  const vulnDuration = Math.max(1800, 5000 - posInCycle * 500);
  const slamDuration = Math.max(2000, 3000 + posInCycle * 200);
  const chargeDuration = Math.max(2500, 4000 - posInCycle * 200);
  const rocketDuration = Math.max(2000, 3000 + posInCycle * 300);
  const barrageDuration = Math.max(1500, 2500 + posInCycle * 200);

  // Base pattern: vulnerable → slam → rocket → vulnerable → charge
  const phases: BossPhaseConfig[] = [
    { name: 'vulnerable', duration: vulnDuration, damageReduction: 0 },
    { name: 'slam', duration: slamDuration, damageReduction: 0.5 },
  ];

  // Rocket phase unlocks from level 2 onward (posInCycle >= 1)
  if (posInCycle >= 1 || cycle >= 1) {
    phases.push(
      { name: 'rocket', duration: rocketDuration, damageReduction: 0.7 },
    );
  }

  phases.push(
    { name: 'vulnerable', duration: Math.round(vulnDuration * 0.8), damageReduction: 0 },
    { name: 'charge', duration: chargeDuration, damageReduction: 1 },
  );

  // Barrage phase unlocks from level 3 onward (posInCycle >= 2)
  if (posInCycle >= 2 || cycle >= 1) {
    phases.push(
      { name: 'barrage', duration: barrageDuration, damageReduction: 0.5 },
      { name: 'vulnerable', duration: Math.round(vulnDuration * 0.6), damageReduction: 0 },
    );
  }

  // Hard levels get an extra slam+rocket combo
  if (posInCycle >= 4) {
    phases.push(
      { name: 'slam', duration: Math.round(slamDuration * 0.7), damageReduction: 0.6 },
      { name: 'rocket', duration: Math.round(rocketDuration * 0.8), damageReduction: 0.8 },
    );
  }

  return phases;
}

// ---------------------------------------------------------------------------
// World info helper (for menu display)
// ---------------------------------------------------------------------------

export interface WorldInfo {
  name: string;
  startLevel: number;
  levelCount: number;
}

/** Get world info for a given range of levels */
export function getWorldInfoForLevels(maxLevel: number): WorldInfo[] {
  const infos: WorldInfo[] = [];
  const totalLevels = maxLevel + 1;
  const totalCycles = Math.ceil(totalLevels / 5);

  for (let c = 0; c < totalCycles; c++) {
    const worldIdx = c % WORLDS.length;
    const world = WORLDS[worldIdx];
    const start = c * 5;
    const count = Math.min(5, totalLevels - start);
    const cycleLabel = totalCycles > WORLDS.length ? ` ${toRoman(c + 1)}` : '';
    infos.push({
      name: `${world.displayName}${cycleLabel}`,
      startLevel: start,
      levelCount: count,
    });
  }

  return infos;
}

function toRoman(n: number): string {
  if (n <= 5) {
    const map = ['', 'I', 'II', 'III', 'IV', 'V'];
    return map[n];
  }
  return String(n);
}

/** All base enemy sprites across all worlds (for asset loading). */
export function getAllBaseEnemySprites(): { type: string; size: number }[] {
  const result: { type: string; size: number }[] = [];
  const seen = new Set<string>();
  for (const world of WORLDS) {
    for (const enemy of world.enemies) {
      if (!seen.has(enemy.type)) {
        seen.add(enemy.type);
        result.push({ type: enemy.type, size: enemy.size });
      }
    }
  }
  return result;
}

/** All unique boss sprite keys across all worlds (for asset loading). */
export function getAllBossSprites(): string[] {
  const seen = new Set<string>();
  for (const world of WORLDS) {
    seen.add(world.bossSprite);
  }
  return [...seen];
}
