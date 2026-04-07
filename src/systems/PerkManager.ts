// src/systems/PerkManager.ts
// Roguelike perk system — perks stack across levels, reset on death.

export interface PerkDef {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji
  rarity: 'common' | 'rare' | 'legendary';
}

export const ALL_PERKS: PerkDef[] = [
  // ── Offensive ──
  { id: 'rapid_fire',    name: 'Rapid Fire',       description: 'Fire rate +25%',                         icon: '\u{1F525}', rarity: 'common' },
  { id: 'heavy_rounds',  name: 'Heavy Rounds',     description: 'Bullet damage +1',                      icon: '\u{1F4A5}', rarity: 'common' },
  { id: 'sniper',        name: 'Sniper',           description: 'Bullet speed +40%',                     icon: '\u{1F3AF}', rarity: 'common' },
  { id: 'berserker',     name: 'Berserker',        description: '+50% fire rate when below 5 units',     icon: '\u{1F608}', rarity: 'rare' },
  { id: 'explosive',     name: 'Explosive Rounds', description: 'Bullets deal splash damage on kill',     icon: '\u{1F4A3}', rarity: 'legendary' },
  // ── Defensive ──
  { id: 'thick_skin',    name: 'Thick Skin',       description: 'Enemy contact damage -1 (min 1)',       icon: '\u{1F6E1}\uFE0F', rarity: 'common' },
  { id: 'iron_will',     name: 'Iron Will',        description: 'Survive lethal hit once per level (keep 1 unit)', icon: '\u{2764}\uFE0F', rarity: 'rare' },
  { id: 'regeneration',  name: 'Regeneration',     description: 'Gain +1 unit every 250m marched',       icon: '\u{1F49A}', rarity: 'rare' },
  // ── Economy / Utility ──
  { id: 'bounty_hunter', name: 'Bounty Hunter',    description: '+75% gold from enemy kills',            icon: '\u{1FA99}', rarity: 'common' },
  { id: 'lucky_gates',   name: 'Lucky Gates',      description: 'Gate add values +1',                    icon: '\u{1F340}', rarity: 'common' },
  { id: 'second_wind',   name: 'Second Wind',      description: 'Start each level with +3 extra units',  icon: '\u{1F4A8}', rarity: 'common' },
  { id: 'rally_cry',     name: 'Rally Cry',        description: 'Positive gates give +2 bonus units',    icon: '\u{1F4E3}', rarity: 'rare' },
  // ── Vampiric / On-kill ──
  { id: 'vampiric',      name: 'Vampiric Rounds',  description: '8% chance per kill to gain +1 unit',    icon: '\u{1F9DB}', rarity: 'rare' },
  { id: 'chain_kill',    name: 'Chain Kill',       description: 'Kills deal 2 damage to nearest enemy',  icon: '\u26A1', rarity: 'legendary' },
  // ── Curse (powerful but risky) ──
  { id: 'glass_cannon',  name: 'Glass Cannon',     description: '2x bullet damage, but contact damage +2', icon: '\u{1F52E}', rarity: 'legendary' },
];

const PERK_MAP = new Map(ALL_PERKS.map((p) => [p.id, p]));

export class PerkManager {
  private static _instance: PerkManager | null = null;
  private activePerks: string[] = [];
  /** Iron Will consumed flag — resets each level */
  ironWillUsed: boolean = false;
  /** Run streak — consecutive boss victories */
  runStreak: number = 0;

  static get instance(): PerkManager {
    if (!PerkManager._instance) PerkManager._instance = new PerkManager();
    return PerkManager._instance;
  }

  // ── Perk management ──

  addPerk(id: string): void {
    this.activePerks.push(id);
  }

  has(id: string): boolean {
    return this.activePerks.includes(id);
  }

  count(id: string): number {
    return this.activePerks.filter((p) => p === id).length;
  }

  getAll(): PerkDef[] {
    return this.activePerks.map((id) => PERK_MAP.get(id)!).filter(Boolean);
  }

  get perkCount(): number {
    return this.activePerks.length;
  }

  /** Reset all perks and streak on death */
  resetRun(): void {
    this.activePerks = [];
    this.ironWillUsed = false;
    this.runStreak = 0;
  }

  /** Called at start of each level to reset per-level flags */
  resetLevel(): void {
    this.ironWillUsed = false;
  }

  /** Called on boss victory */
  onBossVictory(): void {
    this.runStreak++;
  }

  // ── Random perk selection ──

  getRandomChoices(count: number): PerkDef[] {
    // Weight by rarity: common 5, rare 3, legendary 1
    const weights: Record<string, number> = { common: 5, rare: 3, legendary: 1 };
    const pool = ALL_PERKS.map((p) => ({ perk: p, weight: weights[p.rarity] }));

    const chosen: PerkDef[] = [];
    const remaining = [...pool];

    for (let i = 0; i < count && remaining.length > 0; i++) {
      const totalWeight = remaining.reduce((sum, e) => sum + e.weight, 0);
      let roll = Math.random() * totalWeight;
      let idx = 0;
      for (idx = 0; idx < remaining.length; idx++) {
        roll -= remaining[idx].weight;
        if (roll <= 0) break;
      }
      idx = Math.min(idx, remaining.length - 1);
      chosen.push(remaining[idx].perk);
      remaining.splice(idx, 1);
    }
    return chosen;
  }

  // ── Computed effects (queried by GameScene / BossScene) ──

  get fireRateMultiplier(): number {
    let mult = 1;
    mult *= Math.pow(0.75, this.count('rapid_fire')); // 25% faster per stack (lower = faster)
    if (this.has('glass_cannon')) mult *= 0.5; // much faster
    return mult;
  }

  get bonusBulletDamage(): number {
    let dmg = 0;
    dmg += this.count('heavy_rounds');
    if (this.has('glass_cannon')) dmg += 3;
    return dmg;
  }

  get bulletSpeedMultiplier(): number {
    return 1 + this.count('sniper') * 0.4;
  }

  get contactDamageReduction(): number {
    return this.count('thick_skin');
  }

  get contactDamagePenalty(): number {
    return this.has('glass_cannon') ? 2 : 0;
  }

  get extraStartingUnits(): number {
    return this.count('second_wind') * 3;
  }

  get gateBonusAdd(): number {
    return this.count('lucky_gates');
  }

  get gateBonusUnitsOnPositive(): number {
    return this.count('rally_cry') * 2;
  }

  get goldKillMultiplier(): number {
    return 1 + this.count('bounty_hunter') * 0.75;
  }

  get regenDistanceInterval(): number | null {
    return this.has('regeneration') ? 250 : null;
  }

  get vampiricChance(): number {
    return this.count('vampiric') * 0.08;
  }

  get hasChainKill(): boolean {
    return this.has('chain_kill');
  }

  get hasExplosiveRounds(): boolean {
    return this.has('explosive');
  }

  get hasIronWill(): boolean {
    return this.has('iron_will') && !this.ironWillUsed;
  }

  /** Berserker: bonus fire rate when units are low */
  berserkerMultiplier(unitCount: number): number {
    if (!this.has('berserker') || unitCount > 5) return 1;
    return 0.5; // 50% faster (lower = faster fire rate)
  }

  /** Gold multiplier from run streak */
  get streakGoldMultiplier(): number {
    return 1 + this.runStreak * 0.25; // +25% per consecutive win
  }
}
