import { LevelManager, gateApplyFn, gateLabel, gateColor } from '@/config/progression';

export interface GateOption {
  label: string;
  color: number;
  apply: (unitCount: number) => number;
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
