import { describe, it, expect, beforeEach } from 'vitest';
import { pickGatePair, pickWeaponGatePair } from '../src/systems/GateSpawner';
import { LevelManager, gateApplyFn } from '../src/config/progression';

describe('GateSpawner', () => {
  beforeEach(() => {
    LevelManager.reset();
  });

  describe('pickGatePair', () => {
    it('returns a valid pair with labels, colors, and apply fns', () => {
      const pair = pickGatePair(0);
      for (const side of [pair.left, pair.right]) {
        expect(side).toHaveProperty('label');
        expect(side).toHaveProperty('color');
        expect(typeof side.apply).toBe('function');
        expect(side.label.length).toBeGreaterThan(0);
      }
    });

    it('produces label variety across many high-distance rolls', () => {
      const labels = new Set<string>();
      for (let i = 0; i < 200; i++) {
        const pair = pickGatePair(3000);
        labels.add(pair.left.label);
        labels.add(pair.right.label);
      }
      // Across 400 rolls we expect at least several distinct operations
      expect(labels.size).toBeGreaterThan(3);
    });

    it('always returns apply functions that never drop unit count below 1', () => {
      for (let i = 0; i < 100; i++) {
        const pair = pickGatePair(Math.random() * 5000);
        expect(pair.left.apply(1)).toBeGreaterThanOrEqual(1);
        expect(pair.right.apply(1)).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('pickWeaponGatePair', () => {
    it('always produces one weapon-upgrade side and one unit-bonus side', () => {
      for (let i = 0; i < 20; i++) {
        const pair = pickWeaponGatePair('SMG', 'smg', 5);
        const sides = [pair.left, pair.right];
        const upgrades = sides.filter((s) => s.weaponUpgrade === 'smg');
        expect(upgrades).toHaveLength(1);
        const bonuses = sides.filter((s) => s.weaponUpgrade == null);
        expect(bonuses).toHaveLength(1);
        expect(bonuses[0].apply(10)).toBe(15);
      }
    });

    it('weapon side has the weapon name as label', () => {
      const pair = pickWeaponGatePair('PLASMA RIFLE', 'plasma', 3);
      const upgradeSide = [pair.left, pair.right].find((s) => s.weaponUpgrade === 'plasma');
      expect(upgradeSide?.label).toBe('PLASMA RIFLE');
    });
  });

  describe('gateApplyFn math', () => {
    it('add adds the value', () => {
      expect(gateApplyFn({ op: 'add', value: 3 })(10)).toBe(13);
    });
    it('subtract never drops below 1', () => {
      expect(gateApplyFn({ op: 'subtract', value: 5 })(10)).toBe(5);
      expect(gateApplyFn({ op: 'subtract', value: 5 })(3)).toBe(1);
      expect(gateApplyFn({ op: 'subtract', value: 99 })(1)).toBe(1);
    });
    it('divide rounds down and never drops below 1', () => {
      expect(gateApplyFn({ op: 'divide', value: 2 })(9)).toBe(4);
      expect(gateApplyFn({ op: 'divide', value: 2 })(1)).toBe(1);
      expect(gateApplyFn({ op: 'divide', value: 10 })(3)).toBe(1);
    });
  });
});
