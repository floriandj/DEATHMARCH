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

function toRuntimeOption(cfg: { op: 'multiply' | 'divide' | 'add' | 'subtract'; value: number }): GateOption {
  return {
    label: gateLabel(cfg),
    color: gateColor(cfg),
    apply: gateApplyFn(cfg),
  };
}

export function pickGatePair(distance: number): GatePair {
  const templates = LevelManager.instance.getAvailableGateTemplates(distance);
  if (templates.length === 0) {
    // Fallback: basic +5 / +5
    const fallback = { op: 'add' as const, value: 5 };
    return { left: toRuntimeOption(fallback), right: toRuntimeOption(fallback) };
  }

  const idx = Math.floor(Math.random() * templates.length);
  const template = templates[idx];

  const left = toRuntimeOption(template.left);
  const right = toRuntimeOption(template.right);

  if (Math.random() < 0.5) {
    return { left, right };
  }
  return { left: right, right: left };
}

/** Create a weapon gate: one side upgrades the weapon, other side gives units */
export function pickWeaponGatePair(weaponName: string, weaponType: string, unitBonus: number): GatePair {
  const weaponOption: GateOption = {
    label: weaponName,
    color: 0xffd43b, // gold for weapon upgrades
    apply: (c) => c, // no unit change
    weaponUpgrade: weaponType,
  };
  const unitOption: GateOption = {
    label: `+${unitBonus}`,
    color: 0x00d4ff, // blue for add
    apply: (c) => c + unitBonus,
  };

  if (Math.random() < 0.5) {
    return { left: weaponOption, right: unitOption };
  }
  return { left: unitOption, right: weaponOption };
}
