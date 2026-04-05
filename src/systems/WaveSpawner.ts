import { EnemyType, pickEnemyType } from '@/config/EnemyConfig';
import { BOSS_TRIGGER_DISTANCE, FIELD_WIDTH } from '@/config/GameConfig';

export interface SpawnCommand {
  type: EnemyType;
  x: number;
}

export class WaveSpawner {
  private nextSpawnDistance = 30;
  private stopped = false;

  update(currentDistance: number): SpawnCommand[] {
    if (this.stopped) return [];
    if (currentDistance >= BOSS_TRIGGER_DISTANCE) {
      this.stopped = true;
      return [];
    }

    const spawns: SpawnCommand[] = [];

    while (this.nextSpawnDistance <= currentDistance) {
      const clusterSize = this.getClusterSize(this.nextSpawnDistance);
      // Cluster enemies around a random center point (tight tunnel formation)
      const clusterCenterX = (Math.random() - 0.5) * FIELD_WIDTH * 0.5;
      for (let i = 0; i < clusterSize; i++) {
        spawns.push({
          type: pickEnemyType(this.nextSpawnDistance),
          x: clusterCenterX + (Math.random() - 0.5) * 80,
        });
      }
      this.nextSpawnDistance += this.getSpawnInterval(this.nextSpawnDistance);
    }

    return spawns;
  }

  private getClusterSize(distance: number): number {
    if (distance < 300) return 1 + Math.floor(Math.random() * 2);
    if (distance < 600) return 2 + Math.floor(Math.random() * 2);
    if (distance < 900) return 3 + Math.floor(Math.random() * 3);
    return 4 + Math.floor(Math.random() * 4);
  }

  private getSpawnInterval(distance: number): number {
    if (distance < 300) return 40 + Math.random() * 20;
    if (distance < 600) return 30 + Math.random() * 15;
    if (distance < 900) return 20 + Math.random() * 10;
    return 15 + Math.random() * 10;
  }
}
