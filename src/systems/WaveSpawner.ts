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
    if (distance < 300) return 1;                                   // solo
    if (distance < 600) return 1;                                   // solo, more frequent
    if (distance < 1000) return 1 + Math.floor(Math.random() * 2); // 1-2
    if (distance < 1400) return 2 + Math.floor(Math.random() * 2); // 2-3
    if (distance < 2000) return 2 + Math.floor(Math.random() * 3); // 2-4
    if (distance < 2500) return 3 + Math.floor(Math.random() * 3); // 3-5
    return 4 + Math.floor(Math.random() * 4);                       // 4-7
  }

  private getSpawnInterval(distance: number): number {
    if (distance < 300) return 120 + Math.random() * 60;   // very sparse
    if (distance < 600) return 80 + Math.random() * 40;    // gentle
    if (distance < 1000) return 60 + Math.random() * 25;   // warming up
    if (distance < 1400) return 45 + Math.random() * 20;   // orcs arrive
    if (distance < 2000) return 35 + Math.random() * 15;   // picking up
    if (distance < 2500) return 25 + Math.random() * 10;   // intense
    return 18 + Math.random() * 8;                          // pre-boss chaos
  }
}
