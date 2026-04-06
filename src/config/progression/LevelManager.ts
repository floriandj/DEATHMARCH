// src/config/progression/LevelManager.ts
import type {
  LevelConfig,
  LevelEnemyConfig,
  LevelWeaponConfig,
  WeaponCrateConfig,
  WaveBracket,
  GateOptionConfig,
  GateTemplateConfig,
  BossConfig,
} from './types';
import { generateAllLevels } from './LevelGenerator';

// ---------------------------------------------------------------------------
// Registry — generated procedurally from LevelGenerator
// ---------------------------------------------------------------------------
const LEVEL_REGISTRY: LevelConfig[] = generateAllLevels();

// ---------------------------------------------------------------------------
// Helpers: convert JSON-friendly values to runtime values
// ---------------------------------------------------------------------------

/** Convert "#rrggbb" hex string to numeric 0xRRGGBB */
export function hexToNum(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

/** Build a gate apply function from a config operation */
export function gateApplyFn(opt: GateOptionConfig): (count: number) => number {
  switch (opt.op) {
    case 'multiply':  return (c) => c * opt.value;
    case 'divide':    return (c) => Math.max(1, Math.floor(c / opt.value));
    case 'add':       return (c) => c + opt.value;
    case 'subtract':  return (c) => Math.max(1, c - opt.value);
  }
}

/** Build gate label string from config */
export function gateLabel(opt: GateOptionConfig): string {
  const symbols = { multiply: '\u00d7', divide: '\u00f7', add: '+', subtract: '-' };
  return `${symbols[opt.op]}${opt.value}`;
}

/** Gate option color by operation type */
export function gateColor(opt: GateOptionConfig): number {
  switch (opt.op) {
    case 'multiply':  return 0x51cf66;
    case 'add':       return 0x00d4ff;
    case 'divide':
    case 'subtract':  return 0xff6b6b;
  }
}

// ---------------------------------------------------------------------------
// LevelManager — singleton that manages level progression
// ---------------------------------------------------------------------------

export class LevelManager {
  private static _instance: LevelManager | null = null;

  private levels: LevelConfig[];
  private currentIndex: number = 0;

  private constructor() {
    this.levels = [...LEVEL_REGISTRY];
  }

  static get instance(): LevelManager {
    if (!LevelManager._instance) {
      LevelManager._instance = new LevelManager();
    }
    return LevelManager._instance;
  }

  /** Reset for testing or new game */
  static reset(): void {
    LevelManager._instance = null;
  }

  // -- Level navigation -----------------------------------------------------

  get current(): LevelConfig {
    return this.levels[this.currentIndex];
  }

  get currentLevelIndex(): number {
    return this.currentIndex;
  }

  get totalLevels(): number {
    return this.levels.length;
  }

  get hasNextLevel(): boolean {
    return this.currentIndex < this.levels.length - 1;
  }

  setLevel(index: number): void {
    if (index < 0 || index >= this.levels.length) {
      throw new Error(`Invalid level index: ${index}`);
    }
    this.currentIndex = index;
  }

  advanceLevel(): boolean {
    if (!this.hasNextLevel) return false;
    this.currentIndex++;
    return true;
  }

  // -- Convenience accessors for current level ------------------------------

  get enemies(): Record<string, LevelEnemyConfig> {
    return this.current.enemies;
  }

  get weapons(): Record<string, LevelWeaponConfig> {
    return this.current.weapons;
  }

  get weaponCrates(): WeaponCrateConfig[] {
    return this.current.weaponCrates;
  }

  get bossConfig(): BossConfig {
    return this.current.boss;
  }

  // -- Enemy helpers --------------------------------------------------------

  getAvailableEnemyTypes(distance: number): string[] {
    return Object.values(this.current.enemies)
      .filter((e) => distance >= e.appearsAtDistance)
      .map((e) => e.type);
  }

  pickEnemyType(distance: number): string {
    const available = this.getAvailableEnemyTypes(distance);
    if (available.length === 0) return Object.keys(this.current.enemies)[0];
    if (available.length === 1) return available[0];

    const weights = available.map((type) => {
      const stats = this.current.enemies[type];
      const distancePastIntro = distance - stats.appearsAtDistance;
      return Math.max(1, Math.floor(distancePastIntro / 100));
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * totalWeight;
    for (let i = 0; i < available.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return available[i];
    }
    return available[available.length - 1];
  }

  getEnemyStats(type: string): LevelEnemyConfig {
    const stats = this.current.enemies[type];
    if (!stats) throw new Error(`Unknown enemy type: ${type}`);
    return stats;
  }

  // -- Wave helpers ---------------------------------------------------------

  getWaveBracket(distance: number): WaveBracket {
    const brackets = this.current.waves.brackets;
    for (const b of brackets) {
      if (distance < b.maxDistance) return b;
    }
    return brackets[brackets.length - 1];
  }

  // -- Weapon helpers -------------------------------------------------------

  getWeaponStats(type: string): LevelWeaponConfig {
    const stats = this.current.weapons[type];
    if (!stats) throw new Error(`Unknown weapon type: ${type}`);
    return stats;
  }

  getNextWeapon(current: string): string | null {
    const order = this.current.weaponOrder;
    const idx = order.indexOf(current);
    if (idx < order.length - 1) return order[idx + 1];
    return null;
  }

  getCrateForWeapon(currentWeapon: string): WeaponCrateConfig | null {
    return this.current.weaponCrates.find((c) => c.currentWeapon === currentWeapon) ?? null;
  }

  // -- Gate helpers ---------------------------------------------------------

  getAvailableGateTemplates(distance: number): GateTemplateConfig[] {
    return this.current.gates.templates.filter((t) => distance >= t.minDistance);
  }

  // -- Score helpers --------------------------------------------------------

  getEnemyScore(type: string): number {
    return this.current.scoring.enemyKills[type] ?? 0;
  }
}
