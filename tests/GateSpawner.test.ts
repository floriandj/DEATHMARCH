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

  it('x2 gate doubles the unit count', () => {
    const templates = LevelManager.instance.current.gates.templates;
    const multiply = templates.find(
      (t) => (t.left.op === 'multiply' && t.left.value === 2) || (t.right.op === 'multiply' && t.right.value === 2),
    );
    expect(multiply).toBeDefined();
    const side = multiply!.left.op === 'multiply' && multiply!.left.value === 2 ? multiply!.left : multiply!.right;
    const apply = gateApplyFn(side);
    expect(apply(5)).toBe(10);
    expect(apply(1)).toBe(2);
  });

  it('+10 gate adds 10 units', () => {
    const templates = LevelManager.instance.current.gates.templates;
    const add = templates.find(
      (t) => (t.left.op === 'add' && t.left.value === 10) || (t.right.op === 'add' && t.right.value === 10),
    );
    expect(add).toBeDefined();
    const side = add!.left.op === 'add' && add!.left.value === 10 ? add!.left : add!.right;
    const apply = gateApplyFn(side);
    expect(apply(5)).toBe(15);
  });

  it('-5 gate subtracts but never goes below 1', () => {
    const templates = LevelManager.instance.current.gates.templates;
    const sub = templates.find(
      (t) => (t.left.op === 'subtract' && t.left.value === 5) || (t.right.op === 'subtract' && t.right.value === 5),
    );
    expect(sub).toBeDefined();
    const side = sub!.left.op === 'subtract' && sub!.left.value === 5 ? sub!.left : sub!.right;
    const apply = gateApplyFn(side);
    expect(apply(10)).toBe(5);
    expect(apply(3)).toBe(1);
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
