// Per-weapon visual effects: bullet texture, muzzle flash sizing, trail kind.
// Keeps BulletPool and GameScene free of per-weapon switch statements.

export type TrailKind = 'none' | 'plasma' | 'void' | 'holy' | 'rail';

export interface WeaponFx {
  /** Texture key created in BootScene for this weapon's bullet sprite */
  bulletTex: string;
  /** Display scale applied to the bullet sprite */
  bulletScale: number;
  /** Display scale applied to the muzzle flash sprite */
  muzzleScale: number;
  /** Muzzle flash tint (hex). When not set, uses weaponStats.bulletColor. */
  muzzleTint?: number;
  /** Trail effect kind (only 'none' for cheap weapons) */
  trail: TrailKind;
}

export const WEAPON_FX: Record<string, WeaponFx> = {
  pistol:    { bulletTex: 'bullet_pistol',    bulletScale: 2.0, muzzleScale: 1.0, trail: 'none' },
  smg:       { bulletTex: 'bullet_smg',       bulletScale: 2.0, muzzleScale: 0.8, trail: 'none' },
  ar:        { bulletTex: 'bullet_ar',        bulletScale: 2.2, muzzleScale: 1.1, trail: 'none' },
  lmg:       { bulletTex: 'bullet_lmg',       bulletScale: 2.4, muzzleScale: 1.3, trail: 'none' },
  minigun:   { bulletTex: 'bullet_minigun',   bulletScale: 2.0, muzzleScale: 1.6, trail: 'none' },
  flamer:    { bulletTex: 'bullet_flamer',    bulletScale: 2.4, muzzleScale: 1.8, muzzleTint: 0xff6600, trail: 'none' },
  cryo:      { bulletTex: 'bullet_cryo',      bulletScale: 2.2, muzzleScale: 1.2, muzzleTint: 0xaae8ff, trail: 'none' },
  railgun:   { bulletTex: 'bullet_railgun',   bulletScale: 2.6, muzzleScale: 1.4, trail: 'rail' },
  plasma:    { bulletTex: 'bullet_plasma',    bulletScale: 2.4, muzzleScale: 1.4, trail: 'plasma' },
  voidbeam:  { bulletTex: 'bullet_voidbeam',  bulletScale: 2.4, muzzleScale: 1.5, muzzleTint: 0xaa66ff, trail: 'void' },
  godslayer: { bulletTex: 'bullet_godslayer', bulletScale: 2.8, muzzleScale: 2.0, muzzleTint: 0xffd633, trail: 'holy' },
};

export const DEFAULT_WEAPON_FX: WeaponFx = WEAPON_FX.pistol;

export function getWeaponFx(weaponType: string): WeaponFx {
  return WEAPON_FX[weaponType] ?? DEFAULT_WEAPON_FX;
}
