// src/systems/WalletManager.ts
// Persists gold currency and shop upgrade state to localStorage.

const STORAGE_KEY = 'deathmarch-wallet';

interface WalletData {
  gold: number;
  extraStartUnits: number;   // +N starting units per level
  startWeaponTier: number;   // 0=default, 1=skip to 2nd weapon, etc.
  goldMagnet: boolean;       // gold pouches worth 2x
  shield: number;            // absorb N hits before taking damage (consumed per level)
}

function defaultData(): WalletData {
  return { gold: 0, extraStartUnits: 0, startWeaponTier: 0, goldMagnet: false, shield: 0 };
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
  cost: () => number;     // dynamic cost based on current upgrade level
  canBuy: () => boolean;  // false if maxed
  buy: () => void;
}

function unitUpgradeCost(data: WalletData): number {
  return 50 * Math.pow(2, data.extraStartUnits); // 50, 100, 200, 400, 800...
}

function weaponUpgradeCost(data: WalletData): number {
  const costs = [150, 400, 800];
  return data.startWeaponTier < costs.length ? costs[data.startWeaponTier] : Infinity;
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

  /** Earn gold for a completed/failed level. Returns amount added. */
  earnLevelGold(enemyKillGold: number, pouchGold: number): number {
    const d = load();
    const total = enemyKillGold + pouchGold;
    const multiplied = d.goldMagnet ? Math.round(total * 1.5) : total;
    d.gold += multiplied;
    save(d);
    return multiplied;
  },

  get extraStartUnits(): number {
    return load().extraStartUnits;
  },

  get startWeaponTier(): number {
    return load().startWeaponTier;
  },

  get hasGoldMagnet(): boolean {
    return load().goldMagnet;
  },

  get shieldCharges(): number {
    return load().shield;
  },

  useShield(): boolean {
    const d = load();
    if (d.shield > 0) {
      d.shield--;
      save(d);
      return true;
    }
    return false;
  },

  getShopItems(): ShopItem[] {
    return [
      {
        id: 'extra_units',
        name: '+1 START UNIT',
        description: `Begin each level with more units`,
        cost: () => unitUpgradeCost(load()),
        canBuy: () => {
          const d = load();
          return d.gold >= unitUpgradeCost(d) && d.extraStartUnits < 8;
        },
        buy: () => {
          const d = load();
          const cost = unitUpgradeCost(d);
          if (d.gold >= cost && d.extraStartUnits < 8) {
            d.gold -= cost;
            d.extraStartUnits++;
            save(d);
          }
        },
      },
      {
        id: 'weapon_tier',
        name: 'BETTER START GUN',
        description: `Start with a higher weapon tier`,
        cost: () => weaponUpgradeCost(load()),
        canBuy: () => {
          const d = load();
          return d.gold >= weaponUpgradeCost(d) && d.startWeaponTier < 3;
        },
        buy: () => {
          const d = load();
          const cost = weaponUpgradeCost(d);
          if (d.gold >= cost && d.startWeaponTier < 3) {
            d.gold -= cost;
            d.startWeaponTier++;
            save(d);
          }
        },
      },
      {
        id: 'shield',
        name: 'SHIELD +1',
        description: `Absorb 1 enemy hit without losing units`,
        cost: () => 100,
        canBuy: () => load().gold >= 100,
        buy: () => {
          const d = load();
          if (d.gold >= 100) {
            d.gold -= 100;
            d.shield++;
            save(d);
          }
        },
      },
      {
        id: 'gold_magnet',
        name: 'GOLD MAGNET',
        description: `All gold earnings increased by 50%`,
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

  /** Reset wallet (for settings) */
  reset(): void {
    save(defaultData());
  },
};
