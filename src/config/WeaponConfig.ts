export type WeaponType = 'pistol' | 'smg' | 'ar' | 'lmg';

export interface WeaponStats {
  type: WeaponType;
  name: string;
  fireRate: number; // ms between shots per unit
  bulletColor: number;
}

export const WEAPON_ORDER: WeaponType[] = ['pistol', 'smg', 'ar', 'lmg'];

export const WEAPON_STATS: Record<WeaponType, WeaponStats> = {
  pistol: {
    type: 'pistol',
    name: 'PISTOL',
    fireRate: 200,
    bulletColor: 0xffd43b,
  },
  smg: {
    type: 'smg',
    name: 'SMG',
    fireRate: 140,
    bulletColor: 0x00d4ff,
  },
  ar: {
    type: 'ar',
    name: 'ASSAULT RIFLE',
    fireRate: 90,
    bulletColor: 0x51cf66,
  },
  lmg: {
    type: 'lmg',
    name: 'LMG',
    fireRate: 50,
    bulletColor: 0xff6b6b,
  },
};

/** Get the next weapon upgrade, or null if already maxed */
export function getNextWeapon(current: WeaponType): WeaponType | null {
  const idx = WEAPON_ORDER.indexOf(current);
  if (idx < WEAPON_ORDER.length - 1) return WEAPON_ORDER[idx + 1];
  return null;
}

/** Crate HP scales with weapon tier */
export const CRATE_HP: Record<WeaponType, number> = {
  pistol: 15,  // crate containing SMG
  smg: 25,     // crate containing AR
  ar: 40,      // crate containing LMG
  lmg: 0,      // no crate (already max)
};

/** Distance between weapon crate spawns */
export const CRATE_INTERVAL = 250;
