import { EnemyType, pickEnemyType } from '@/config/EnemyConfig';
import { BOSS_TRIGGER_DISTANCE, FIELD_WIDTH } from '@/config/GameConfig';

export interface SpawnCommand {
  type: EnemyType;
  x: number;
}

export class WaveSpawner {
  private nextSpawnDistance = 120; // grace period before first enemies
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
    if (distance < 200) return 1;                              // solo goblins
    if (distance < 400) return 1;                              // still solo
    if (distance < 600) return 1 + Math.floor(Math.random() * 2); // 1-2
    if (distance < 800) return 2 + Math.floor(Math.random() * 2); // 2-3
    if (distance < 1000) return 3 + Math.floor(Math.random() * 2); // 3-4
    return 3 + Math.floor(Math.random() * 4);                      // 3-6
  }

  private getSpawnInterval(distance: number): number {
    if (distance < 200) return 120 + Math.random() * 60;  // very sparse
    if (distance < 400) return 80 + Math.random() * 40;   // gentle
    if (distance < 600) return 55 + Math.random() * 25;   // warming up
    if (distance < 800) return 40 + Math.random() * 15;   // picking up
    if (distance < 1000) return 30 + Math.random() * 10;  // intense
    return 20 + Math.random() * 10;                        // chaos
  }
}
