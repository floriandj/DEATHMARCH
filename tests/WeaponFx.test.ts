import { describe, it, expect } from 'vitest';
import { getWeaponFx, WEAPON_FX, DEFAULT_WEAPON_FX } from '../src/config/WeaponFx';

describe('WeaponFx', () => {
  it('has fx for every weapon the game uses', () => {
    const expected = [
      'pistol', 'smg', 'ar', 'lmg', 'minigun',
      'flamer', 'cryo', 'railgun', 'plasma', 'voidbeam', 'godslayer',
    ];
    for (const weapon of expected) {
      expect(WEAPON_FX[weapon]).toBeDefined();
    }
  });

  it('every fx entry references a bullet_<name> texture key', () => {
    for (const [, fx] of Object.entries(WEAPON_FX)) {
      expect(fx.bulletTex.startsWith('bullet_')).toBe(true);
    }
  });

  it('bullet and muzzle scales are positive', () => {
    for (const fx of Object.values(WEAPON_FX)) {
      expect(fx.bulletScale).toBeGreaterThan(0);
      expect(fx.muzzleScale).toBeGreaterThan(0);
    }
  });

  it('end-game weapons have trails, early weapons do not', () => {
    expect(WEAPON_FX.pistol.trail).toBe('none');
    expect(WEAPON_FX.smg.trail).toBe('none');
    expect(WEAPON_FX.ar.trail).toBe('none');
    expect(WEAPON_FX.railgun.trail).toBe('rail');
    expect(WEAPON_FX.plasma.trail).toBe('plasma');
    expect(WEAPON_FX.voidbeam.trail).toBe('void');
    expect(WEAPON_FX.godslayer.trail).toBe('holy');
  });

  it('getWeaponFx returns DEFAULT for unknown weapons', () => {
    expect(getWeaponFx('no_such_weapon')).toBe(DEFAULT_WEAPON_FX);
  });

  it('getWeaponFx returns the specific entry for known weapons', () => {
    expect(getWeaponFx('plasma')).toBe(WEAPON_FX.plasma);
    expect(getWeaponFx('godslayer')).toBe(WEAPON_FX.godslayer);
  });
});
