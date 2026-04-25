import { describe, it, expect } from 'vitest';
import { hpForOption } from '../src/entities/Barrel.helpers';
import type { GateOption } from '../src/systems/GateSpawner';

function opt(label: string, weaponUpgrade?: string): GateOption {
  return { label, color: 0x000000, apply: (c) => c, weaponUpgrade };
}

describe('Barrel hpForOption', () => {
  it('scales additive operations with value size', () => {
    const small = hpForOption(opt('+1'));
    const large = hpForOption(opt('+5'));
    expect(large).toBeGreaterThan(small);
  });

  it('subtract barrels are cheap (so accidental hits arent too punishing)', () => {
    const subHp = hpForOption(opt('-1'));
    const addHp = hpForOption(opt('+5'));
    expect(subHp).toBeLessThan(addHp);
  });

  it('divide barrels are tougher than subtract of same value', () => {
    expect(hpForOption(opt('÷2'))).toBeGreaterThan(hpForOption(opt('-2')));
  });

  it('weapon upgrade has fixed HP regardless of label', () => {
    const a = hpForOption(opt('SMG', 'smg'));
    const b = hpForOption(opt('VOID BEAM', 'voidbeam'));
    expect(a).toBe(b);
    expect(a).toBeGreaterThan(10);
  });

  it('returns positive HP for any known operation label', () => {
    for (const label of ['+1', '+3', '+5', '-1', '-2', '-3', '÷2', '÷3']) {
      expect(hpForOption(opt(label))).toBeGreaterThan(0);
    }
  });

  it('scales HP up with level index', () => {
    const baseHp = hpForOption(opt('+3'));
    const lateHp = hpForOption(opt('+3'), 10);
    expect(lateHp).toBeGreaterThan(baseHp);
  });
});
