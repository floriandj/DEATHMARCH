import type { GateOption } from '@/systems/GateSpawner';

/**
 * HP each barrel should take to destroy, scaled by the magnitude of its
 * operation. Positive ops cost more HP (bigger reward ⇒ more bullets),
 * negative ops are cheap so accidental hits are not devastating.
 *
 * Pure logic — kept out of Barrel.ts so unit tests can import it without
 * pulling in Phaser (which needs a browser environment).
 */
export function hpForOption(opt: GateOption): number {
  if (opt.weaponUpgrade) return 22;
  const label = opt.label;
  const value = parseInt(label.replace(/[^0-9]/g, ''), 10) || 1;
  if (label.startsWith('+')) return 3 + value * 4;   // +1→7,  +3→15, +5→23
  if (label.startsWith('×')) return 10 + value * 6;  // ×2→22, ×3→28
  if (label.startsWith('-')) return 3 + value * 3;   // -1→6,  -3→12
  if (label.startsWith('÷')) return 8 + value * 6;   // ÷2→20, ÷3→26
  return 12;
}

export function strokeForColor(color: number): string {
  if (color === 0x51cf66) return '#1a5c2a';
  if (color === 0xff6b6b) return '#661010';
  if (color === 0xffd43b) return '#665510';
  if (color === 0x00d4ff) return '#0a3355';
  return '#000000';
}
