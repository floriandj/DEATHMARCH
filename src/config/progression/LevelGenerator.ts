// src/config/progression/LevelGenerator.ts
// Endless procedural level generator.
// Levels are grouped in cycles of 5 (easy → hard). Each cycle rotates through
// the 5 world themes. Overall difficulty creeps up with each cycle so later
// "easy" levels are still harder than earlier ones.

import type {
  LevelConfig,
  LevelTheme,
  LevelEnemyConfig,
  LevelWeaponConfig,
  WeaponCrateConfig,
  GateTemplateConfig,
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
    displayName: 'Goblin Wastes',
    theme: {
      groundColor: 0x0c0c18, detailColors: [0x12121e, 0x0e0e1a, 0x161624, 0x1a1a28],
      glowColors: [0x220033, 0x1a0028, 0x0d001a], accentColor: 0xff6b6b, accentHex: '#ff6b6b',
    },
    levelNames: ['The March Begins', 'Goblin Gauntlet', 'Orc Stronghold', 'Troll Bridge', 'Demon Gate'],
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
    bossNames: ['Gorath Spawn', 'Gorath the Fierce', 'Gorath the Destroyer', 'Gorath Reborn', 'Gorath the Undying'],
  },
  // ── World 2: Infernal Pits ──
  {
    tag: 'infernal',
    displayName: 'Infernal Pits',
    theme: {
      groundColor: 0x180808, detailColors: [0x1e0e0e, 0x201010, 0x2a1414, 0x140a0a],
      glowColors: [0x331100, 0x442200, 0x220000], accentColor: 0xff4400, accentHex: '#ff4400',
    },
    levelNames: ['Ember Fields', 'Crimson Gauntlet', 'Hellfire Trench', 'Molten Core', 'Inferno Heart'],
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
    bossNames: ['Flame Wraith', 'Inferno Beast', 'Molten Colossus', 'Magma Lord', 'Inferno Titan'],
  },
  // ── World 3: Frozen Abyss ──
  {
    tag: 'frost',
    displayName: 'Frozen Abyss',
    theme: {
      groundColor: 0x080c18, detailColors: [0x0e1220, 0x101828, 0x0c1424, 0x141e30],
      glowColors: [0x002244, 0x003355, 0x001133], accentColor: 0x74c0fc, accentHex: '#74c0fc',
    },
    levelNames: ['Frostbite Pass', 'Glacier Ruins', 'Banshee Hollow', 'Ice Citadel', 'The Frozen Throne'],
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
    bossNames: ['Ice Shade', 'Frost Troll King', 'Glacier Beast', 'Blizzard Wyrm', 'Frost Wyrm'],
  },
  // ── World 4: Plague Wastes ──
  {
    tag: 'plague',
    displayName: 'Plague Wastes',
    theme: {
      groundColor: 0x0a100a, detailColors: [0x101a0e, 0x0e160c, 0x142010, 0x0c1208],
      glowColors: [0x113300, 0x224400, 0x002211], accentColor: 0x2ecc71, accentHex: '#2ecc71',
    },
    levelNames: ['Rat Warren', 'Blighted Mire', 'Spore Caverns', 'Toxic Depths', 'Plague Heart'],
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
    bossNames: ['Plague Rat King', 'Toxic Hulk', 'Spore Lord', 'Blight Titan', 'Plague Hydra'],
  },
  // ── World 5: Throne of Ash ──
  {
    tag: 'ash',
    displayName: 'Throne of Ash',
    theme: {
      groundColor: 0x100808, detailColors: [0x1a0e0e, 0x140a0a, 0x201212, 0x0e0808],
      glowColors: [0x330011, 0x220022, 0x440011], accentColor: 0xc0392b, accentHex: '#c0392b',
    },
    levelNames: ['Shadow Vanguard', 'Ashwalker Trail', 'Void Rift', 'Dark Sanctum', 'Throne of Ash'],
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
  const globalCreep = 1 + cycle * 0.25;        // +25% per full cycle
  const localRamp = 1 + posInCycle * 0.15;     // +15% per step within cycle
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
  const triggerDistance = Math.round(2000 + cycle * 200 + posInCycle * 150);
  const gateInterval = Math.max(250, Math.round(500 - cycle * 10 - posInCycle * 10));
  const marchSpeed = Math.round(130 + cycle * 3 + posInCycle * 2);

  // ── Enemies ──
  const enemies: Record<string, LevelEnemyConfig> = {};
  const enemyKills: Record<string, number> = {};
  for (const tmpl of world.enemies) {
    enemies[tmpl.type] = {
      type: tmpl.type,
      hp: Math.max(1, Math.round(tmpl.baseHp * diff)),
      speed: Math.round(tmpl.speed * (1 + posInCycle * 0.04)),
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

  // ── Weapons ──
  const weaponOrder = world.weaponOrder;
  const weapons: Record<string, LevelWeaponConfig> = {};
  for (const key of Object.keys(world.weapons)) {
    weapons[key] = {
      ...world.weapons[key],
      fireRate: Math.max(12, Math.round(world.weapons[key].fireRate * (1 - posInCycle * 0.04))),
    };
  }

  // ── Weapon crates (offset from gate intervals) ──
  const weaponCrates: WeaponCrateConfig[] = [];
  for (let i = 0; i < weaponOrder.length - 1; i++) {
    const fraction = (i + 1) / weaponOrder.length;
    const rawDist = Math.round(triggerDistance * fraction * 0.85);
    const dist = Math.round(offsetFromGates(rawDist, gateInterval));
    weaponCrates.push({
      currentWeapon: weaponOrder[i],
      nextWeapon: weaponOrder[i + 1],
      distance: dist,
      hp: Math.round((15 + i * 12) * (1 + posInCycle * 0.15)),
    });
  }

  // ── Waves (easy levels = sparse, hard levels = dense) ──
  const baseInterval = Math.max(40, 140 - cycle * 4 - posInCycle * 6);
  const brackets: WaveBracket[] = [
    { maxDistance: Math.round(triggerDistance * 0.10), clusterMin: 1, clusterMax: 1, intervalMin: baseInterval, intervalMax: baseInterval + 80 },
    { maxDistance: Math.round(triggerDistance * 0.20), clusterMin: 1, clusterMax: 1 + Math.floor(posInCycle * 0.3), intervalMin: Math.round(baseInterval * 0.75), intervalMax: Math.round((baseInterval + 50) * 0.85) },
    { maxDistance: Math.round(triggerDistance * 0.35), clusterMin: 1, clusterMax: 2 + Math.floor(posInCycle * 0.5), intervalMin: Math.round(baseInterval * 0.55), intervalMax: Math.round(baseInterval * 0.75) },
    { maxDistance: Math.round(triggerDistance * 0.50), clusterMin: 1, clusterMax: 3 + Math.floor(posInCycle * 0.5), intervalMin: Math.round(baseInterval * 0.45), intervalMax: Math.round(baseInterval * 0.6) },
    { maxDistance: Math.round(triggerDistance * 0.70), clusterMin: 2, clusterMax: 4 + Math.floor(posInCycle * 0.5), intervalMin: Math.round(baseInterval * 0.35), intervalMax: Math.round(baseInterval * 0.48) },
    { maxDistance: Math.round(triggerDistance * 0.85), clusterMin: 2 + Math.floor(posInCycle * 0.5), clusterMax: 5 + Math.floor(posInCycle * 0.5), intervalMin: Math.round(baseInterval * 0.28), intervalMax: Math.round(baseInterval * 0.38) },
    { maxDistance: 99999, clusterMin: 3 + Math.floor(posInCycle * 0.5), clusterMax: 5 + posInCycle, intervalMin: Math.max(14, Math.round(baseInterval * 0.2)), intervalMax: Math.max(22, Math.round(baseInterval * 0.3)) },
  ];

  // ── Gates ──
  const gateTemplates = buildGateTemplates(triggerDistance);

  // ── Boss ──
  const bossHp = Math.round((250 + cycle * 80 + posInCycle * 70) * (1 + posInCycle * 0.1));
  const phases = buildBossPhases(posInCycle, cycle);
  const chargeSpeed = 300 + cycle * 15 + posInCycle * 12;

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
    },
    startingUnits: 1,
    marchSpeed,
    startingWeapon: weaponOrder[0],
    weapons,
    weaponOrder,
    weaponCrates,
    enemies,
    waves: {
      gracePeriod: Math.max(50, 120 - cycle * 4 - posInCycle * 6),
      brackets,
    },
    gates: { interval: gateInterval, templates: gateTemplates },
    boss: {
      name: world.bossNames[posInCycle],
      sprite: world.bossSprite,
      tint: world.bossTint,
      scale: 1.5 + posInCycle * 0.08,
      hp: bossHp,
      triggerDistance,
      phases,
      enrageThreshold: 0.2 + posInCycle * 0.03,
      enrageDurationMultiplier: Math.max(0.25, 0.55 - posInCycle * 0.05),
      slamWarning: Math.max(600, 1500 - cycle * 30 - posInCycle * 60),
      enrageWarning: Math.max(300, 800 - cycle * 20 - posInCycle * 40),
      chargeSpeed,
      enrageChargeSpeed: Math.round(chargeSpeed * 1.5),
    },
    scoring: { perMeter, perSurvivingUnit, bossKill, enemyKills },
  };
}

function buildGateTemplates(triggerDistance: number): GateTemplateConfig[] {
  return [
    { left: { op: 'add', value: 5 }, right: { op: 'add', value: 3 }, minDistance: 0 },
    { left: { op: 'add', value: 8 }, right: { op: 'add', value: 3 }, minDistance: 0 },
    { left: { op: 'multiply', value: 2 }, right: { op: 'add', value: 5 }, minDistance: Math.round(triggerDistance * 0.1) },
    { left: { op: 'add', value: 5 }, right: { op: 'subtract', value: 2 }, minDistance: Math.round(triggerDistance * 0.15) },
    { left: { op: 'add', value: 10 }, right: { op: 'add', value: 5 }, minDistance: Math.round(triggerDistance * 0.2) },
    { left: { op: 'multiply', value: 3 }, right: { op: 'subtract', value: 3 }, minDistance: Math.round(triggerDistance * 0.35) },
    { left: { op: 'divide', value: 2 }, right: { op: 'multiply', value: 2 }, minDistance: Math.round(triggerDistance * 0.4) },
    { left: { op: 'multiply', value: 2 }, right: { op: 'add', value: 8 }, minDistance: Math.round(triggerDistance * 0.55) },
    { left: { op: 'add', value: 12 }, right: { op: 'subtract', value: 3 }, minDistance: Math.round(triggerDistance * 0.65) },
  ];
}

function buildBossPhases(posInCycle: number, _cycle: number): BossPhaseConfig[] {
  const vulnDuration = Math.max(1800, 5000 - posInCycle * 500);
  const slamDuration = Math.max(2000, 3000 + posInCycle * 200);
  const chargeDuration = Math.max(2500, 4000 - posInCycle * 200);

  const phases: BossPhaseConfig[] = [
    { name: 'vulnerable', duration: vulnDuration, damageReduction: 0 },
    { name: 'slam', duration: slamDuration, damageReduction: 0.5 },
    { name: 'charge', duration: chargeDuration, damageReduction: 1 },
  ];

  if (posInCycle >= 2) {
    phases.push(
      { name: 'vulnerable', duration: Math.round(vulnDuration * 0.7), damageReduction: 0 },
      { name: 'slam', duration: Math.round(slamDuration * 0.8), damageReduction: 0.6 },
    );
  }
  if (posInCycle >= 4) {
    phases.push(
      { name: 'charge', duration: Math.round(chargeDuration * 0.8), damageReduction: 1 },
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
