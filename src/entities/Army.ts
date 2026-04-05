import { FORMATION_SPACING } from '@/config/GameConfig';

export interface Position {
  x: number;
  y: number;
}

export function computeFormation(
  unitCount: number,
  centerX: number,
  centerY: number,
): Position[] {
  if (unitCount <= 0) return [];

  const positions: Position[] = [];
  let placed = 0;
  let row = 0;

  while (placed < unitCount) {
    const unitsInRow = row + 1;
    const unitsToPlace = Math.min(unitsInRow, unitCount - placed);
    const rowY = centerY + row * FORMATION_SPACING;
    const rowWidth = (unitsToPlace - 1) * FORMATION_SPACING;
    const startX = centerX - rowWidth / 2;

    for (let i = 0; i < unitsToPlace; i++) {
      positions.push({
        x: startX + i * FORMATION_SPACING,
        y: rowY,
      });
    }

    placed += unitsToPlace;
    row++;
  }

  return positions;
}
