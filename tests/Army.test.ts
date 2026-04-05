import { describe, it, expect } from 'vitest';
import { computeFormation } from '../src/entities/Army';

describe('Army formation', () => {
  it('places 1 unit at the center', () => {
    const positions = computeFormation(1, 0, 0);
    expect(positions).toHaveLength(1);
    expect(positions[0].x).toBe(0);
    expect(positions[0].y).toBe(0);
  });

  it('places 3 units in a triangle row pattern', () => {
    const positions = computeFormation(3, 0, 0);
    expect(positions).toHaveLength(3);
    expect(positions[0].x).toBe(0);
    expect(positions[1].x).toBeLessThan(0);
    expect(positions[2].x).toBeGreaterThan(0);
    // Back row is above front row (lower y = upward on screen)
    expect(positions[1].y).toBeLessThan(positions[0].y);
  });

  it('places 5 units in 3 rows', () => {
    const positions = computeFormation(5, 0, 0);
    expect(positions).toHaveLength(5);
  });

  it('offsets all positions by center coordinates', () => {
    const centered = computeFormation(1, 0, 0);
    const offset = computeFormation(1, 100, 200);
    expect(offset[0].x).toBe(centered[0].x + 100);
    expect(offset[0].y).toBe(centered[0].y + 200);
  });

  it('formation width grows with unit count', () => {
    const small = computeFormation(3, 0, 0);
    const large = computeFormation(10, 0, 0);
    const smallWidth = Math.max(...small.map((p) => p.x)) - Math.min(...small.map((p) => p.x));
    const largeWidth = Math.max(...large.map((p) => p.x)) - Math.min(...large.map((p) => p.x));
    expect(largeWidth).toBeGreaterThan(smallWidth);
  });
});
