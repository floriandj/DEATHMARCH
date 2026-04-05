import { describe, it, expect } from 'vitest';
import { toIso, fromIso, isoDepth } from '../src/systems/IsoHelper';

describe('IsoHelper', () => {
  describe('toIso', () => {
    it('converts origin to origin', () => {
      const result = toIso(0, 0);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('converts a positive game position', () => {
      const result = toIso(100, 50);
      expect(result.x).toBe(1600);
      expect(result.y).toBe(2400);
    });

    it('converts equal x and y to pure vertical', () => {
      const result = toIso(100, 100);
      expect(result.x).toBe(0);
      expect(result.y).toBe(3200);
    });
  });

  describe('fromIso', () => {
    it('roundtrips through toIso and fromIso', () => {
      const original = { x: 75, y: 30 };
      const iso = toIso(original.x, original.y);
      const back = fromIso(iso.x, iso.y);
      expect(back.x).toBeCloseTo(original.x, 5);
      expect(back.y).toBeCloseTo(original.y, 5);
    });

    it('converts origin back to origin', () => {
      const result = fromIso(0, 0);
      expect(result.x).toBeCloseTo(0);
      expect(result.y).toBeCloseTo(0);
    });
  });

  describe('isoDepth', () => {
    it('returns gameY as depth value', () => {
      expect(isoDepth(50)).toBe(50);
      expect(isoDepth(200)).toBe(200);
    });

    it('higher gameY means higher depth', () => {
      expect(isoDepth(100)).toBeGreaterThan(isoDepth(50));
    });
  });
});
