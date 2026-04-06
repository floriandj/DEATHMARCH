// src/systems/WalletManager.ts
// Gold currency with single-use shop upgrades.
// Bought items apply to the NEXT level only, then reset.

const STORAGE_KEY = 'deathmarch-wallet';

interface WalletData {
  gold: number;
  // Single-use boosts (consumed when a level starts)
  pendingExtraUnits: number;
  pendingWeaponTier: number;  // 0=default, 1/2/3=skip tiers
  pendingShield: number;
  goldMagnet: boolean;        // permanent (only exception)
}

function defaultData(): WalletData {
  return { gold: 0, pendingExtraUnits: 0, pendingWeaponTier: 0, pendingShield: 0, goldMagnet: false };
}

function load(): WalletData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultData(), ...JSON.parse(raw) };
  } catch { /* corrupt data */ }
  return defaultData();
}

function save(data: WalletData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ---------------------------------------------------------------------------
// Shop item definitions
// ---------------------------------------------------------------------------

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: () => number;
  canBuy: () => boolean;
  buy: () => void;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const WalletManager = {
  get data(): WalletData {
    return load();
  },

  get gold(): number {
    return load().gold;
  },

  addGold(amount: number): void {
    const d = load();
    d.gold += amount;
    save(d);
  },

  earnLevelGold(enemyKillGold: number, pouchGold: number): number {
    const d = load();
    const total = enemyKillGold + pouchGold;
    const multiplied = d.goldMagnet ? Math.round(total * 1.5) : total;
    d.gold += multiplied;
    save(d);
    return multiplied;
  },

  // -- Pending boosts (consumed on level start) --

  get extraStartUnits(): number {
    return load().pendingExtraUnits;
  },

  get startWeaponTier(): number {
    return load().pendingWeaponTier;
  },

  get hasGoldMagnet(): boolean {
    return load().goldMagnet;
  },

  get shieldCharges(): number {
    return load().pendingShield;
  },

  useShield(): boolean {
    const d = load();
    if (d.pendingShield > 0) {
      d.pendingShield--;
      save(d);
      return true;
    }
    return false;
  },

  /** Call at the start of a level to consume pending boosts (except shield which is consumed on hit) */
  consumeBoosts(): { extraUnits: number; weaponTier: number } {
    const d = load();
    const result = { extraUnits: d.pendingExtraUnits, weaponTier: d.pendingWeaponTier };
    // Reset single-use boosts after consuming
    d.pendingExtraUnits = 0;
    d.pendingWeaponTier = 0;
    // Shield is consumed on hit, not here
    save(d);
    return result;
  },

  /** Consume remaining shield at level end (unused shields are lost) */
  consumeShield(): void {
    const d = load();
    d.pendingShield = 0;
    save(d);
  },

  getShopItems(): ShopItem[] {
    return [
      {
        id: 'extra_units',
        name: '+3 UNITS',
        description: 'Start next level with 3 extra units',
        cost: () => 50,
        canBuy: () => load().gold >= 50,
        buy: () => {
          const d = load();
          if (d.gold >= 50) {
            d.gold -= 50;
            d.pendingExtraUnits += 3;
            save(d);
          }
        },
      },
      {
        id: 'weapon_tier',
        name: 'GUN BOOST',
        description: 'Start next level with a better weapon',
        cost: () => {
          const tier = load().pendingWeaponTier;
          return tier < 1 ? 100 : tier < 2 ? 200 : 400;
        },
        canBuy: () => {
          const d = load();
          const cost = d.pendingWeaponTier < 1 ? 100 : d.pendingWeaponTier < 2 ? 200 : 400;
          return d.gold >= cost && d.pendingWeaponTier < 3;
        },
        buy: () => {
          const d = load();
          const cost = d.pendingWeaponTier < 1 ? 100 : d.pendingWeaponTier < 2 ? 200 : 400;
          if (d.gold >= cost && d.pendingWeaponTier < 3) {
            d.gold -= cost;
            d.pendingWeaponTier++;
            save(d);
          }
        },
      },
      {
        id: 'shield',
        name: 'SHIELD',
        description: 'Absorb 1 enemy hit next level',
        cost: () => 75,
        canBuy: () => load().gold >= 75,
        buy: () => {
          const d = load();
          if (d.gold >= 75) {
            d.gold -= 75;
            d.pendingShield++;
            save(d);
          }
        },
      },
      {
        id: 'gold_magnet',
        name: 'GOLD MAGNET',
        description: 'All gold earnings +50% (permanent)',
        cost: () => 300,
        canBuy: () => {
          const d = load();
          return d.gold >= 300 && !d.goldMagnet;
        },
        buy: () => {
          const d = load();
          if (d.gold >= 300 && !d.goldMagnet) {
            d.gold -= 300;
            d.goldMagnet = true;
            save(d);
          }
        },
      },
    ];
  },

  reset(): void {
    save(defaultData());
  },
};
