// src/config/progression/types.ts
// All interfaces are JSON-serializable for easy config file authoring.

/** Enemy definition within a level */
export interface LevelEnemyConfig {
  type: string;
  hp: number;
  speed: number;
  size: number;
  contactDamage: number;
  splashRadius: number;
  splashDamage: number;
  color: string; // hex string e.g. "#ff6b6b"
  appearsAtDistance: number;
  scoreValue: number;
}

/** Wave spawn curve bracket — controls cluster size and interval at a distance range */
export interface WaveBracket {
  maxDistance: number; // upper bound (exclusive) for this bracket
  clusterMin: number;
  clusterMax: number;
  intervalMin: number;
  intervalMax: number;
}

export interface WaveConfig {
  gracePeriod: number; // distance before first enemies appear
  brackets: WaveBracket[];
}

/** Weapon definition */
export interface LevelWeaponConfig {
  type: string;
  name: string;
  fireRate: number; // ms between shots
  bulletColor: string; // hex string
}

/** Weapon crate that appears at a fixed distance */
export interface WeaponCrateConfig {
  currentWeapon: string; // weapon player must have to see this crate
  nextWeapon: string; // weapon granted on breaking the crate
  distance: number; // distance at which it spawns
  hp: number;
}

/** Gate operation template */
export interface GateOptionConfig {
  op: 'multiply' | 'divide' | 'add' | 'subtract';
  value: number;
}

export interface GateTemplateConfig {
  left: GateOptionConfig;
  right: GateOptionConfig;
  minDistance: number;
}

export interface GateConfig {
  interval: number; // distance between gate pairs
  templates: GateTemplateConfig[];
}

/** Boss phase definition */
export interface BossPhaseConfig {
  name: string; // 'vulnerable' | 'slam' | 'charge' | custom
  duration: number; // ms
  damageReduction: number; // 0 = full damage, 1 = immune
}

export interface BossConfig {
  name: string; // display name for HUD
  sprite: string; // texture key for boss spritesheet
  tint?: string; // hex color tint, e.g. "#ff6b6b" (omit for no tint)
  scale?: number; // sprite scale (default 1.5)
  hp: number;
  triggerDistance: number;
  phases: BossPhaseConfig[];
  enrageThreshold: number; // HP fraction (e.g. 0.2 = 20%)
  enrageDurationMultiplier: number; // phases are this fraction of normal (e.g. 0.5)
  slamWarning: number; // ms warning before slam hits
  enrageWarning: number; // ms warning when enraged
  chargeSpeed: number;
  enrageChargeSpeed: number;
}

/** Scoring rules */
export interface ScoringConfig {
  perMeter: number;
  perSurvivingUnit: number;
  bossKill: number;
  enemyKills: Record<string, number>; // enemy type -> score
}

/** Visual theme for a level's background and UI accents */
export interface LevelTheme {
  groundColor: number;       // base ground fill
  detailColors: number[];    // terrain detail variation
  glowColors: number[];      // ambient fog/glow patches
  accentColor: number;       // UI accent (HUD banner, etc.)
  accentHex: string;         // same as accentColor but as "#rrggbb"
  worldName: string;         // e.g. "Goblin Wastes"
}

/** Top-level level definition */
export interface LevelConfig {
  id: string;
  name: string;
  description: string;

  // Visual
  theme: LevelTheme;

  // Army
  startingUnits: number;
  marchSpeed: number;

  // Weapons
  startingWeapon: string;
  weapons: Record<string, LevelWeaponConfig>;
  weaponOrder: string[];
  weaponCrates: WeaponCrateConfig[];

  // Enemies
  enemies: Record<string, LevelEnemyConfig>;

  // Spawning
  waves: WaveConfig;

  // Gates
  gates: GateConfig;

  // Boss
  boss: BossConfig;

  // Scoring
  scoring: ScoringConfig;
}

/** Manifest listing all available levels in order */
export interface ProgressionManifest {
  levels: LevelConfig[];
}
