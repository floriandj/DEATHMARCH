import { describe, it, expect, beforeEach } from 'vitest';
import { pickGatePair } from '../src/systems/GateSpawner';
import { LevelManager, gateApplyFn, gateLabel } from '../src/config/progression';

describe('GateSpawner', () => {
  beforeEach(() => {
    LevelManager.reset();
  });

  it('has at least 5 gate templates', () => {
    const templates = LevelManager.instance.current.gates.templates;
    expect(templates.length).toBeGreaterThanOrEqual(5);
  });

  it('each template has a left and right gate with op and value', () => {
    const templates = LevelManager.instance.current.gates.templates;
    for (const tpl of templates) {
      expect(tpl.left).toHaveProperty('op');
      expect(tpl.left).toHaveProperty('value');
      expect(tpl.right).toHaveProperty('op');
      expect(tpl.right).toHaveProperty('value');
    }
  });

  it('-3 gate subtracts 3 units but never below 1', () => {
    const templates = LevelManager.instance.current.gates.templates;
    const sub3 = templates.find(
      (t) => (t.left.op === 'subtract' && t.left.value === 3) || (t.right.op === 'subtract' && t.right.value === 3),
    );
    expect(sub3).toBeDefined();
    const side = sub3!.left.op === 'subtract' && sub3!.left.value === 3 ? sub3!.left : sub3!.right;
    const apply = gateApplyFn(side);
    expect(apply(5)).toBe(2);
    expect(apply(1)).toBe(1);
  });

  it('+2 gate adds 2 units', () => {
    const templates = LevelManager.instance.current.gates.templates;
    const add = templates.find(
      (t) => (t.left.op === 'add' && t.left.value === 2) || (t.right.op === 'add' && t.right.value === 2),
    );
    expect(add).toBeDefined();
    const side = add!.left.op === 'add' && add!.left.value === 2 ? add!.left : add!.right;
    const apply = gateApplyFn(side);
    expect(apply(5)).toBe(7);
  });

  it('-1 gate subtracts but never goes below 1', () => {
    const templates = LevelManager.instance.current.gates.templates;
    const sub = templates.find(
      (t) => (t.left.op === 'subtract' && t.left.value === 1) || (t.right.op === 'subtract' && t.right.value === 1),
    );
    expect(sub).toBeDefined();
    const side = sub!.left.op === 'subtract' && sub!.left.value === 1 ? sub!.left : sub!.right;
    const apply = gateApplyFn(side);
    expect(apply(10)).toBe(9);
    expect(apply(1)).toBe(1);
  });

  it('pickGatePair returns a valid pair', () => {
    const pair = pickGatePair(0);
    expect(pair.left).toHaveProperty('label');
    expect(pair.right).toHaveProperty('label');
  });

  it('pickGatePair at high distance can return late-game templates', () => {
    const labels = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const pair = pickGatePair(1000);
      labels.add(pair.left.label);
      labels.add(pair.right.label);
    }
    expect(labels.size).toBeGreaterThan(2);
  });
});
