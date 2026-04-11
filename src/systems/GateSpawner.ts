import { LevelManager, gateApplyFn, gateLabel, gateColor } from '@/config/progression';

export interface GateOption {
  label: string;
  color: number;
  apply: (unitCount: number) => number;
  /** If set, passing this gate upgrades the weapon to this type */
  weaponUpgrade?: string;
}

export interface GatePair {
  left: GateOption;
  right: GateOption;
}

type GateOp = 'multiply' | 'divide' | 'add' | 'subtract';
interface GateCfg { op: GateOp; value: number }

function toOption(cfg: GateCfg): GateOption {
  return {
    label: gateLabel(cfg),
    color: gateColor(cfg),
    apply: gateApplyFn(cfg),
  };
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** How far through the level we are, 0..1 */
function progress(distance: number): number {
  const trigger = LevelManager.instance.current.boss.triggerDistance;
  return Math.min(1, distance / trigger);
}

// ── Gate generators by category ──

function randomPositive(p: number): GateCfg {
  // Early: small adds. Later: bigger adds and multipliers.
  if (p < 0.3 || Math.random() > p) {
    return { op: 'add', value: randomInt(1, 1 + Math.floor(p * 4)) };
  }
  if (Math.random() < 0.4) {
    return { op: 'multiply', value: pick([2, 2, 3]) };
  }
  return { op: 'add', value: randomInt(2, 3 + Math.floor(p * 3)) };
}

function randomNegative(p: number): GateCfg {
  // Early: mild subtracts. Later: bigger subtracts and divides.
  const useDivide = p > 0.25 && Math.random() < 0.3 + p * 0.3;
  if (useDivide) {
    return { op: 'divide', value: pick(p > 0.6 ? [2, 2, 3] : [2]) };
  }
  return { op: 'subtract', value: randomInt(1, 1 + Math.floor(p * 4)) };
}

/**
 * Dynamically generate a gate pair based on current distance.
 *
 * Gate categories (weighted by progression):
 *   - positive vs negative (most common early, stays common)
 *   - both negative (ramps up mid-to-late level)
 *   - positive vs positive (rare treat)
 */
export function pickGatePair(distance: number): GatePair {
  const p = progress(distance);

  // Weight roll to decide gate category
  const bothNegativeChance = Math.min(0.3, p * 0.4);     // 0% at start → 30% late
  const bothPositiveChance = Math.max(0.02, 0.08 - p * 0.06); // 8% early → 2% late
  const roll = Math.random();

  let left: GateCfg;
  let right: GateCfg;

  if (roll < bothNegativeChance) {
    // Both sides negative — pick the lesser evil
    left = randomNegative(p);
    right = randomNegative(p);
    // Ensure they're not identical
    if (left.op === right.op && left.value === right.value) {
      right = right.op === 'divide'
        ? { op: 'subtract', value: randomInt(1, 2 + Math.floor(p * 3)) }
        : { op: 'divide', value: pick([2, 3]) };
    }
  } else if (roll < bothNegativeChance + bothPositiveChance) {
    // Both sides positive — lucky gate
    left = randomPositive(p);
    right = randomPositive(p);
    if (left.op === right.op && left.value === right.value) {
      right.value = Math.max(1, right.value - 1);
    }
  } else {
    // One positive, one negative (standard)
    left = randomPositive(p);
    right = randomNegative(p);
  }

  // Randomly swap sides
  if (Math.random() < 0.5) {
    return { left: toOption(left), right: toOption(right) };
  }
  return { left: toOption(right), right: toOption(left) };
}

/** Create a weapon gate: one side upgrades the weapon, other side gives units */
export function pickWeaponGatePair(weaponName: string, weaponType: string, unitBonus: number): GatePair {
  const weaponOption: GateOption = {
    label: weaponName,
    color: 0xffd43b,
    apply: (c) => c,
    weaponUpgrade: weaponType,
  };
  const unitOption: GateOption = {
    label: `+${unitBonus}`,
    color: 0x00d4ff,
    apply: (c) => c + unitBonus,
  };

  if (Math.random() < 0.5) {
    return { left: weaponOption, right: unitOption };
  }
  return { left: unitOption, right: weaponOption };
}
