import { describe, it, expect } from 'vitest';
import { GatePair, pickGatePair, GATE_TEMPLATES } from '../src/systems/GateSpawner';

describe('GateSpawner', () => {
  it('has at least 5 gate templates', () => {
    expect(GATE_TEMPLATES.length).toBeGreaterThanOrEqual(5);
  });

  it('each template has a left and right gate with label and operation', () => {
    for (const tpl of GATE_TEMPLATES) {
      expect(tpl.left).toHaveProperty('label');
      expect(tpl.left).toHaveProperty('apply');
      expect(tpl.right).toHaveProperty('label');
      expect(tpl.right).toHaveProperty('apply');
    }
  });

  it('x2 gate doubles the unit count', () => {
    const multiply = GATE_TEMPLATES.find((t) => t.left.label === 'x2' || t.right.label === 'x2');
    expect(multiply).toBeDefined();
    const gate = multiply!.left.label === 'x2' ? multiply!.left : multiply!.right;
    expect(gate.apply(5)).toBe(10);
    expect(gate.apply(1)).toBe(2);
  });

  it('+10 gate adds 10 units', () => {
    const add = GATE_TEMPLATES.find((t) => t.left.label === '+10' || t.right.label === '+10');
    expect(add).toBeDefined();
    const gate = add!.left.label === '+10' ? add!.left : add!.right;
    expect(gate.apply(5)).toBe(15);
  });

  it('-5 gate subtracts but never goes below 1', () => {
    const sub = GATE_TEMPLATES.find((t) => t.left.label === '-5' || t.right.label === '-5');
    expect(sub).toBeDefined();
    const gate = sub!.left.label === '-5' ? sub!.left : sub!.right;
    expect(gate.apply(10)).toBe(5);
    expect(gate.apply(3)).toBe(1);
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
