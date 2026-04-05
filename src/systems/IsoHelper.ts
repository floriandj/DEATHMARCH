import { TILE_WIDTH, TILE_HEIGHT } from '@/config/GameConfig';

const HALF_W = TILE_WIDTH / 2;
const HALF_H = TILE_HEIGHT / 2;

export function toIso(gameX: number, gameY: number): { x: number; y: number } {
  return {
    x: (gameX - gameY) * HALF_W,
    y: (gameX + gameY) * HALF_H,
  };
}

export function fromIso(screenX: number, screenY: number): { x: number; y: number } {
  return {
    x: screenX / (2 * HALF_W) + screenY / (2 * HALF_H),
    y: screenY / (2 * HALF_H) - screenX / (2 * HALF_W),
  };
}

export function isoDepth(gameY: number): number {
  return gameY;
}
