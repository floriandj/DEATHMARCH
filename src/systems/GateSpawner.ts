export interface GateOption {
  label: string;
  color: number;
  apply: (unitCount: number) => number;
}

export interface GatePair {
  left: GateOption;
  right: GateOption;
}

interface GateTemplate extends GatePair {
  minDistance: number;
}

function multiply(n: number): GateOption {
  return { label: `x${n}`, color: 0x51cf66, apply: (count) => count * n };
}

function add(n: number): GateOption {
  return { label: `+${n}`, color: 0x00d4ff, apply: (count) => count + n };
}

function subtract(n: number): GateOption {
  return { label: `-${n}`, color: 0xff6b6b, apply: (count) => Math.max(1, count - n) };
}

function divide(n: number): GateOption {
  return { label: `÷${n}`, color: 0xff6b6b, apply: (count) => Math.max(1, Math.floor(count / n)) };
}

export const GATE_TEMPLATES: GateTemplate[] = [
  { left: multiply(2), right: add(5), minDistance: 0 },
  { left: add(10), right: add(5), minDistance: 0 },
  { left: multiply(3), right: add(10), minDistance: 150 },
  { left: multiply(2), right: subtract(5), minDistance: 300 },
  { left: add(20), right: add(5), minDistance: 300 },
  { left: multiply(5), right: subtract(5), minDistance: 600 },
  { left: divide(2), right: multiply(3), minDistance: 600 },
  { left: multiply(3), right: divide(2), minDistance: 900 },
  { left: add(20), right: subtract(5), minDistance: 900 },
];

export function pickGatePair(distance: number): GatePair {
  const available = GATE_TEMPLATES.filter((t) => distance >= t.minDistance);
  const idx = Math.floor(Math.random() * available.length);
  const template = available[idx];
  if (Math.random() < 0.5) {
    return { left: template.left, right: template.right };
  }
  return { left: template.right, right: template.left };
}
