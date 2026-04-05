import { EnemyType, pickEnemyType } from '@/config/EnemyConfig';
import { BOSS_TRIGGER_DISTANCE, FIELD_WIDTH } from '@/config/GameConfig';

export interface SpawnCommand {
  type: EnemyType;
  x: number;
}

export class WaveSpawner {
  private nextSpawnDistance = 80; // grace period before first enemies
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
    if (distance < 150) return 1;                              // solo goblins
    if (distance < 300) return 1 + Math.floor(Math.random() * 2); // 1-2
    if (distance < 600) return 2 + Math.floor(Math.random() * 2); // 2-3
    if (distance < 900) return 3 + Math.floor(Math.random() * 3); // 3-5
    return 4 + Math.floor(Math.random() * 4);                     // 4-7
  }

  private getSpawnInterval(distance: number): number {
    if (distance < 150) return 80 + Math.random() * 40;  // very sparse, 1 unit can handle
    if (distance < 300) return 50 + Math.random() * 25;  // still gentle
    if (distance < 600) return 35 + Math.random() * 15;  // picking up
    if (distance < 900) return 25 + Math.random() * 10;  // intense
    return 15 + Math.random() * 10;                       // chaos
  }
}
