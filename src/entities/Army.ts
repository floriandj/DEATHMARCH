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

  // Scale down spacing when army is large so it fits on screen
  const spacing = unitCount > 30
    ? Math.max(8, FORMATION_SPACING * (30 / unitCount))
    : FORMATION_SPACING;

  const positions: Position[] = [];
  let placed = 0;
  let row = 0;

  while (placed < unitCount) {
    const unitsInRow = row + 1;
    const unitsToPlace = Math.min(unitsInRow, unitCount - placed);
    // Grow UPWARD (negative Y) so units don't go below the screen
    const rowY = centerY - row * spacing;
    const rowWidth = (unitsToPlace - 1) * spacing;
    const startX = centerX - rowWidth / 2;

    for (let i = 0; i < unitsToPlace; i++) {
      positions.push({
        x: startX + i * spacing,
        y: rowY,
      });
    }

    placed += unitsToPlace;
    row++;
  }

  return positions;
}
