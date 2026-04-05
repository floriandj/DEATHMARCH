import { FIELD_WIDTH } from '@/config/GameConfig';
import { LevelManager } from '@/config/progression';

export interface SpawnCommand {
  type: string;
  x: number;
}

export class WaveSpawner {
  private nextSpawnDistance: number;
  private stopped = false;

  constructor() {
    this.nextSpawnDistance = LevelManager.instance.current.waves.gracePeriod;
  }

  update(currentDistance: number): SpawnCommand[] {
    if (this.stopped) return [];

    const level = LevelManager.instance.current;
    if (currentDistance >= level.boss.triggerDistance) {
      this.stopped = true;
      return [];
    }

    const spawns: SpawnCommand[] = [];

    while (this.nextSpawnDistance <= currentDistance) {
      const bracket = LevelManager.instance.getWaveBracket(this.nextSpawnDistance);
      const range = bracket.clusterMax - bracket.clusterMin;
      const clusterSize = bracket.clusterMin + Math.floor(Math.random() * (range + 1));

      const clusterCenterX = (Math.random() - 0.5) * FIELD_WIDTH * 0.5;
      for (let i = 0; i < clusterSize; i++) {
        spawns.push({
          type: LevelManager.instance.pickEnemyType(this.nextSpawnDistance),
          x: clusterCenterX + (Math.random() - 0.5) * 80,
        });
      }

      const interval = bracket.intervalMin + Math.random() * (bracket.intervalMax - bracket.intervalMin);
      this.nextSpawnDistance += interval;
    }

    return spawns;
  }
}
