# Iso-Metric War Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable V1 of an endless isometric army war game with auto-fire, gate multipliers, and a phase-based boss fight.

**Architecture:** Individual entity system built on Phaser 3. Pure game logic (coordinate transforms, object pools, spawning, boss phases) lives in testable modules separate from Phaser scenes. Scenes wire entities and systems together. Placeholder geometric shapes for all art.

**Tech Stack:** Phaser 3, TypeScript, Vite, Vitest

---

## File Map

```
iso-metric-war/
├── index.html                          Entry point
├── package.json                        Dependencies & scripts
├── tsconfig.json                       TypeScript config
├── vite.config.ts                      Vite config
├── src/
│   ├── main.ts                         Phaser game bootstrap
│   ├── config/
│   │   ├── GameConfig.ts               All tuning constants
│   │   └── EnemyConfig.ts              Enemy stats table
│   ├── systems/
│   │   ├── IsoHelper.ts                2D ↔ isometric math
│   │   ├── ObjectPool.ts               Generic reusable pool
│   │   ├── InputHandler.ts             Touch drag controls
│   │   ├── WaveSpawner.ts              Enemy wave generation
│   │   └── GateSpawner.ts              Gate placement & pairing
│   ├── entities/
│   │   ├── PlayerUnit.ts               Single soldier sprite
│   │   ├── Army.ts                     Formation manager
│   │   ├── Bullet.ts                   Projectile sprite
│   │   ├── Enemy.ts                    Base enemy sprite
│   │   ├── Gate.ts                     Gate pair entity
│   │   └── Boss.ts                     Boss with phase logic
│   └── scenes/
│       ├── BootScene.ts                Asset loading
│       ├── MenuScene.ts                Title screen
│       ├── GameScene.ts                Main gameplay
│       ├── BossScene.ts                Boss encounter
│       ├── HUDScene.ts                 Score overlay
│       └── GameOverScene.ts            Results & retry
├── tests/
│   ├── IsoHelper.test.ts
│   ├── ObjectPool.test.ts
│   ├── WaveSpawner.test.ts
│   ├── GateSpawner.test.ts
│   ├── Army.test.ts
│   └── Boss.test.ts
└── public/
    └── assets/                         (empty — placeholder art generated in code)
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.ts`

- [ ] **Step 1: Initialize project and install dependencies**

```bash
cd D:/iso-metric-war
npm init -y
npm install phaser@3
npm install -D typescript vite vitest @types/node
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": ".",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*", "tests/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
```

- [ ] **Step 4: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <title>Iso-Metric War</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; overflow: hidden; }
    canvas { display: block; }
  </style>
</head>
<body>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 5: Create src/main.ts with minimal Phaser boot**

```typescript
import Phaser from 'phaser';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 720,
  height: 1280,
  backgroundColor: '#0a0a1a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: {
    create() {
      const text = this.add.text(360, 640, 'Iso-Metric War', {
        fontSize: '32px',
        color: '#00d4ff',
      });
      text.setOrigin(0.5);
    },
  },
};

new Phaser.Game(config);
```

- [ ] **Step 6: Add scripts to package.json**

Add to the `"scripts"` section:

```json
{
  "dev": "vite",
  "build": "tsc && vite build",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 7: Verify dev server runs**

Run: `npm run dev`
Expected: Browser opens to `localhost:3000`, shows "Iso-Metric War" text centered on a dark background.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts index.html src/main.ts .gitignore
git commit -m "feat: scaffold project with Phaser 3 + TypeScript + Vite"
```

---

### Task 2: Game Config & Enemy Config

**Files:**
- Create: `src/config/GameConfig.ts`, `src/config/EnemyConfig.ts`

- [ ] **Step 1: Create GameConfig.ts**

```typescript
export const GAME_WIDTH = 720;
export const GAME_HEIGHT = 1280;

// Isometric tile dimensions
export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;

// Player army
export const STARTING_UNITS = 5;
export const MARCH_SPEED = 100; // game-units per second
export const UNIT_FIRE_RATE = 1000; // ms between bullets per unit
export const BULLET_SPEED = 400; // pixels per second
export const BULLET_DAMAGE = 1;
export const BULLET_POOL_SIZE = 200;

// Army formation
export const FORMATION_SPACING = 30; // pixels between units in formation

// Gates
export const GATE_INTERVAL = 150; // meters between gate pairs
export const GATE_WIDTH = 120; // pixels wide per gate side
export const GATE_GAP = 40; // pixels between left and right gate

// Battlefield
export const FIELD_WIDTH = 600; // usable width in game coords
export const SPAWN_AHEAD_DISTANCE = 800; // how far ahead enemies spawn

// Boss
export const BOSS_TRIGGER_DISTANCE = 1200;
export const BOSS_HP = 500;
export const BOSS_VULNERABLE_DURATION = 5000; // ms
export const BOSS_SLAM_DURATION = 3000;
export const BOSS_SLAM_WARNING = 1500; // ms before slam hits
export const BOSS_CHARGE_DURATION = 4000;
export const BOSS_ENRAGE_THRESHOLD = 0.2; // 20% HP
export const BOSS_ENRAGE_WARNING = 800; // ms (reduced from 1500)
export const BOSS_DAMAGE_REDUCTION_SLAM = 0.5;

// Scoring
export const SCORE_PER_METER = 1;
export const SCORE_PER_GOBLIN_KILL = 10;
export const SCORE_PER_ORC_KILL = 30;
export const SCORE_PER_TROLL_KILL = 50;
export const SCORE_PER_DEMON_KILL = 40;
export const SCORE_BOSS_KILL = 5000;
export const SCORE_PER_SURVIVING_UNIT = 100;

// Enemy pool
export const ENEMY_POOL_SIZE = 100;
```

- [ ] **Step 2: Create EnemyConfig.ts**

```typescript
export type EnemyType = 'goblin' | 'orc' | 'troll' | 'demon';

export interface EnemyStats {
  type: EnemyType;
  hp: number;
  speed: number; // pixels per second
  size: number; // sprite radius in pixels
  contactDamage: number; // units killed on contact
  splashRadius: number; // 0 = no splash
  splashDamage: number; // extra units killed by splash
  color: number; // hex color for placeholder
  appearsAtDistance: number;
  scoreValue: number;
}

export const ENEMY_STATS: Record<EnemyType, EnemyStats> = {
  goblin: {
    type: 'goblin',
    hp: 1,
    speed: 120,
    size: 12,
    contactDamage: 1,
    splashRadius: 0,
    splashDamage: 0,
    color: 0xff6b6b,
    appearsAtDistance: 0,
    scoreValue: 10,
  },
  orc: {
    type: 'orc',
    hp: 3,
    speed: 80,
    size: 16,
    contactDamage: 2,
    splashRadius: 0,
    splashDamage: 0,
    color: 0xe64980,
    appearsAtDistance: 300,
    scoreValue: 30,
  },
  troll: {
    type: 'troll',
    hp: 8,
    speed: 50,
    size: 22,
    contactDamage: 3,
    splashRadius: 0,
    splashDamage: 0,
    color: 0xbe4bdb,
    appearsAtDistance: 600,
    scoreValue: 50,
  },
  demon: {
    type: 'demon',
    hp: 5,
    speed: 160,
    size: 16,
    contactDamage: 2,
    splashRadius: 50,
    splashDamage: 1,
    color: 0xffd43b,
    appearsAtDistance: 900,
    scoreValue: 40,
  },
};

/** Returns which enemy types are available at a given distance */
export function getAvailableTypes(distance: number): EnemyType[] {
  return (Object.values(ENEMY_STATS) as EnemyStats[])
    .filter((s) => distance >= s.appearsAtDistance)
    .map((s) => s.type);
}

/**
 * Returns a weighted random enemy type for the given distance.
 * Later types get higher weight as distance increases.
 */
export function pickEnemyType(distance: number): EnemyType {
  const available = getAvailableTypes(distance);
  if (available.length === 1) return available[0];

  // Weight newer types more heavily
  const weights = available.map((type) => {
    const stats = ENEMY_STATS[type];
    const distancePastIntro = distance - stats.appearsAtDistance;
    return Math.max(1, Math.floor(distancePastIntro / 100));
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;

  for (let i = 0; i < available.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return available[i];
  }

  return available[available.length - 1];
}
```

- [ ] **Step 3: Commit**

```bash
git add src/config/GameConfig.ts src/config/EnemyConfig.ts
git commit -m "feat: add game config constants and enemy stats table"
```

---

### Task 3: IsoHelper (TDD)

**Files:**
- Create: `src/systems/IsoHelper.ts`, `tests/IsoHelper.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/IsoHelper.test.ts
import { describe, it, expect } from 'vitest';
import { toIso, fromIso, isoDepth } from '../src/systems/IsoHelper';

describe('IsoHelper', () => {
  describe('toIso', () => {
    it('converts origin to origin', () => {
      const result = toIso(0, 0);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('converts a positive game position', () => {
      // With TILE_WIDTH=64, TILE_HEIGHT=32:
      // screenX = (100 - 50) * 32 = 1600
      // screenY = (100 + 50) * 16 = 2400
      const result = toIso(100, 50);
      expect(result.x).toBe(1600);
      expect(result.y).toBe(2400);
    });

    it('converts equal x and y to pure vertical', () => {
      // screenX = (100 - 100) * 32 = 0
      // screenY = (100 + 100) * 16 = 3200
      const result = toIso(100, 100);
      expect(result.x).toBe(0);
      expect(result.y).toBe(3200);
    });
  });

  describe('fromIso', () => {
    it('roundtrips through toIso and fromIso', () => {
      const original = { x: 75, y: 30 };
      const iso = toIso(original.x, original.y);
      const back = fromIso(iso.x, iso.y);
      expect(back.x).toBeCloseTo(original.x, 5);
      expect(back.y).toBeCloseTo(original.y, 5);
    });

    it('converts origin back to origin', () => {
      const result = fromIso(0, 0);
      expect(result.x).toBeCloseTo(0);
      expect(result.y).toBeCloseTo(0);
    });
  });

  describe('isoDepth', () => {
    it('returns gameY as depth value', () => {
      expect(isoDepth(50)).toBe(50);
      expect(isoDepth(200)).toBe(200);
    });

    it('higher gameY means higher depth (renders on top)', () => {
      expect(isoDepth(100)).toBeGreaterThan(isoDepth(50));
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/IsoHelper.test.ts`
Expected: FAIL — module `../src/systems/IsoHelper` not found.

- [ ] **Step 3: Implement IsoHelper**

```typescript
// src/systems/IsoHelper.ts
import { TILE_WIDTH, TILE_HEIGHT } from '@/config/GameConfig';

const HALF_W = TILE_WIDTH / 2;
const HALF_H = TILE_HEIGHT / 2;

/** Convert game-world coordinates to isometric screen coordinates */
export function toIso(gameX: number, gameY: number): { x: number; y: number } {
  return {
    x: (gameX - gameY) * HALF_W,
    y: (gameX + gameY) * HALF_H,
  };
}

/** Convert isometric screen coordinates back to game-world coordinates */
export function fromIso(screenX: number, screenY: number): { x: number; y: number } {
  return {
    x: screenX / (2 * HALF_W) + screenY / (2 * HALF_H),
    y: screenY / (2 * HALF_H) - screenX / (2 * HALF_W),
  };
}

/** Get depth value for sprite sorting (higher gameY = rendered on top) */
export function isoDepth(gameY: number): number {
  return gameY;
}
```

- [ ] **Step 4: Configure vitest to resolve path aliases**

Add to `vite.config.ts` (the alias is already there; vitest uses vite config automatically). Add a `vitest.config.ts` if needed:

Vitest will automatically pick up `vite.config.ts` aliases. No extra config needed.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/IsoHelper.test.ts`
Expected: All 6 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/systems/IsoHelper.ts tests/IsoHelper.test.ts
git commit -m "feat: add isometric coordinate transform helpers with tests"
```

---

### Task 4: ObjectPool (TDD)

**Files:**
- Create: `src/systems/ObjectPool.ts`, `tests/ObjectPool.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/ObjectPool.test.ts
import { describe, it, expect, vi } from 'vitest';
import { ObjectPool } from '../src/systems/ObjectPool';

describe('ObjectPool', () => {
  it('creates items up to pool size using factory', () => {
    const factory = vi.fn(() => ({ active: false, value: 0 }));
    const pool = new ObjectPool(factory, 5);
    expect(factory).toHaveBeenCalledTimes(5);
  });

  it('acquires an inactive item from the pool', () => {
    const pool = new ObjectPool(() => ({ active: false }), 3);
    const item = pool.acquire();
    expect(item).not.toBeNull();
    expect(item!.active).toBe(true);
  });

  it('returns null when all items are active', () => {
    const pool = new ObjectPool(() => ({ active: false }), 2);
    pool.acquire();
    pool.acquire();
    const third = pool.acquire();
    expect(third).toBeNull();
  });

  it('releases an item back to the pool', () => {
    const pool = new ObjectPool(() => ({ active: false }), 1);
    const item = pool.acquire();
    expect(item).not.toBeNull();
    pool.release(item!);
    expect(item!.active).toBe(false);

    // Can acquire again after release
    const reacquired = pool.acquire();
    expect(reacquired).not.toBeNull();
  });

  it('calls reset callback on release if provided', () => {
    const reset = vi.fn();
    const pool = new ObjectPool(() => ({ active: false }), 1, reset);
    const item = pool.acquire()!;
    pool.release(item);
    expect(reset).toHaveBeenCalledWith(item);
  });

  it('iterates over active items with forEach', () => {
    const pool = new ObjectPool(() => ({ active: false, id: 0 }), 5);
    const a = pool.acquire()!;
    a.id = 1;
    const b = pool.acquire()!;
    b.id = 2;

    const seen: number[] = [];
    pool.forEach((item) => seen.push(item.id));
    expect(seen).toEqual([1, 2]);
  });

  it('reports active count', () => {
    const pool = new ObjectPool(() => ({ active: false }), 3);
    expect(pool.activeCount).toBe(0);
    pool.acquire();
    expect(pool.activeCount).toBe(1);
    pool.acquire();
    expect(pool.activeCount).toBe(2);
  });

  it('releaseAll deactivates everything', () => {
    const pool = new ObjectPool(() => ({ active: false }), 3);
    pool.acquire();
    pool.acquire();
    pool.acquire();
    expect(pool.activeCount).toBe(3);
    pool.releaseAll();
    expect(pool.activeCount).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/ObjectPool.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement ObjectPool**

```typescript
// src/systems/ObjectPool.ts
export interface Poolable {
  active: boolean;
}

export class ObjectPool<T extends Poolable> {
  private items: T[];
  private resetFn?: (item: T) => void;

  constructor(
    factory: () => T,
    size: number,
    resetFn?: (item: T) => void,
  ) {
    this.resetFn = resetFn;
    this.items = [];
    for (let i = 0; i < size; i++) {
      this.items.push(factory());
    }
  }

  acquire(): T | null {
    for (const item of this.items) {
      if (!item.active) {
        item.active = true;
        return item;
      }
    }
    return null;
  }

  release(item: T): void {
    item.active = false;
    if (this.resetFn) {
      this.resetFn(item);
    }
  }

  releaseAll(): void {
    for (const item of this.items) {
      if (item.active) {
        this.release(item);
      }
    }
  }

  forEach(callback: (item: T) => void): void {
    for (const item of this.items) {
      if (item.active) {
        callback(item);
      }
    }
  }

  get activeCount(): number {
    let count = 0;
    for (const item of this.items) {
      if (item.active) count++;
    }
    return count;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/ObjectPool.test.ts`
Expected: All 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/systems/ObjectPool.ts tests/ObjectPool.test.ts
git commit -m "feat: add generic object pool with tests"
```

---

### Task 5: Army Formation Logic (TDD)

**Files:**
- Create: `src/entities/Army.ts`, `tests/Army.test.ts`

The Army module manages formation positions. The actual Phaser sprite management will be added in the scene integration task. Here we test the pure math: given N units and a center position, compute where each unit goes.

- [ ] **Step 1: Write failing tests**

```typescript
// tests/Army.test.ts
import { describe, it, expect } from 'vitest';
import { computeFormation } from '../src/entities/Army';

describe('Army formation', () => {
  it('places 1 unit at the center', () => {
    const positions = computeFormation(1, 0, 0);
    expect(positions).toHaveLength(1);
    expect(positions[0].x).toBe(0);
    expect(positions[0].y).toBe(0);
  });

  it('places 3 units in a triangle row pattern', () => {
    const positions = computeFormation(3, 0, 0);
    expect(positions).toHaveLength(3);
    // First unit at front center, next 2 behind and to the sides
    // Front row
    expect(positions[0].x).toBe(0);
    // Back row — two units spread left and right
    expect(positions[1].x).toBeLessThan(0);
    expect(positions[2].x).toBeGreaterThan(0);
    // Back row is behind front row (higher y in game coords = further back)
    expect(positions[1].y).toBeGreaterThan(positions[0].y);
  });

  it('places 5 units in 3 rows', () => {
    const positions = computeFormation(5, 0, 0);
    expect(positions).toHaveLength(5);
  });

  it('offsets all positions by center coordinates', () => {
    const centered = computeFormation(1, 0, 0);
    const offset = computeFormation(1, 100, 200);
    expect(offset[0].x).toBe(centered[0].x + 100);
    expect(offset[0].y).toBe(centered[0].y + 200);
  });

  it('formation width grows with unit count', () => {
    const small = computeFormation(3, 0, 0);
    const large = computeFormation(10, 0, 0);
    const smallWidth = Math.max(...small.map((p) => p.x)) - Math.min(...small.map((p) => p.x));
    const largeWidth = Math.max(...large.map((p) => p.x)) - Math.min(...large.map((p) => p.x));
    expect(largeWidth).toBeGreaterThan(smallWidth);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/Army.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement formation logic**

```typescript
// src/entities/Army.ts
import { FORMATION_SPACING } from '@/config/GameConfig';

export interface Position {
  x: number;
  y: number;
}

/**
 * Compute triangle formation positions for N units.
 * Row 0 (front): 1 unit. Row 1: 2 units. Row 2: 3 units. Etc.
 * Units fill rows front-to-back. Incomplete last row is centered.
 */
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

    // Center the units in this row
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/Army.test.ts`
Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/entities/Army.ts tests/Army.test.ts
git commit -m "feat: add army triangle formation logic with tests"
```

---

### Task 6: GateSpawner (TDD)

**Files:**
- Create: `src/systems/GateSpawner.ts`, `tests/GateSpawner.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/GateSpawner.test.ts
import { describe, it, expect } from 'vitest';
import { GatePair, pickGatePair, GATE_TEMPLATES } from '../src/systems/GateSpawner';

describe('GateSpawner', () => {
  it('has at least 5 gate templates', () => {
    expect(GATE_TEMPLATES.length).toBeGreaterThanOrEqual(5);
  });

  it('each template has a left and right gate with label and operation', () => {
    for (const tpl of GATE_TEMPLATES) {
      expect(tpl.left).toHaveProperty('label');
      expect(tpl.left).toHaveProperty('apply');
      expect(tpl.right).toHaveProperty('label');
      expect(tpl.right).toHaveProperty('apply');
    }
  });

  it('x2 gate doubles the unit count', () => {
    const multiply = GATE_TEMPLATES.find((t) => t.left.label === 'x2' || t.right.label === 'x2');
    expect(multiply).toBeDefined();
    const gate = multiply!.left.label === 'x2' ? multiply!.left : multiply!.right;
    expect(gate.apply(5)).toBe(10);
    expect(gate.apply(1)).toBe(2);
  });

  it('+10 gate adds 10 units', () => {
    const add = GATE_TEMPLATES.find((t) => t.left.label === '+10' || t.right.label === '+10');
    expect(add).toBeDefined();
    const gate = add!.left.label === '+10' ? add!.left : add!.right;
    expect(gate.apply(5)).toBe(15);
  });

  it('-5 gate subtracts but never goes below 1', () => {
    const sub = GATE_TEMPLATES.find((t) => t.left.label === '-5' || t.right.label === '-5');
    expect(sub).toBeDefined();
    const gate = sub!.left.label === '-5' ? sub!.left : sub!.right;
    expect(gate.apply(10)).toBe(5);
    expect(gate.apply(3)).toBe(1);
  });

  it('pickGatePair returns a valid pair', () => {
    const pair = pickGatePair(0);
    expect(pair.left).toHaveProperty('label');
    expect(pair.right).toHaveProperty('label');
  });

  it('pickGatePair at high distance can return late-game templates', () => {
    // Run 50 picks at 1000m — at least one should be a high-distance template
    const labels = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const pair = pickGatePair(1000);
      labels.add(pair.left.label);
      labels.add(pair.right.label);
    }
    // Should have variety
    expect(labels.size).toBeGreaterThan(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/GateSpawner.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement GateSpawner**

```typescript
// src/systems/GateSpawner.ts
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
  return {
    label: `x${n}`,
    color: 0x51cf66,
    apply: (count) => count * n,
  };
}

function add(n: number): GateOption {
  return {
    label: `+${n}`,
    color: 0x00d4ff,
    apply: (count) => count + n,
  };
}

function subtract(n: number): GateOption {
  return {
    label: `-${n}`,
    color: 0xff6b6b,
    apply: (count) => Math.max(1, count - n),
  };
}

function divide(n: number): GateOption {
  return {
    label: `÷${n}`,
    color: 0xff6b6b,
    apply: (count) => Math.max(1, Math.floor(count / n)),
  };
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

  // Randomly swap left/right so the "good" gate isn't always on the same side
  if (Math.random() < 0.5) {
    return { left: template.left, right: template.right };
  }
  return { left: template.right, right: template.left };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/GateSpawner.test.ts`
Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/systems/GateSpawner.ts tests/GateSpawner.test.ts
git commit -m "feat: add gate spawner with template pool and tests"
```

---

### Task 7: WaveSpawner (TDD)

**Files:**
- Create: `src/systems/WaveSpawner.ts`, `tests/WaveSpawner.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/WaveSpawner.test.ts
import { describe, it, expect } from 'vitest';
import { WaveSpawner } from '../src/systems/WaveSpawner';

describe('WaveSpawner', () => {
  it('produces spawn commands based on distance', () => {
    const spawner = new WaveSpawner();
    // Advance 50m — should get some goblin spawns
    const spawns = spawner.update(50);
    // May or may not have spawns at 50m, but type should be correct
    for (const s of spawns) {
      expect(s.type).toBe('goblin');
      expect(s.x).toBeDefined();
    }
  });

  it('only spawns goblins before 300m', () => {
    const spawner = new WaveSpawner();
    // Collect all spawns up to 250m
    const allSpawns = [];
    for (let d = 10; d <= 250; d += 10) {
      allSpawns.push(...spawner.update(d));
    }
    for (const s of allSpawns) {
      expect(s.type).toBe('goblin');
    }
  });

  it('can spawn orcs after 300m', () => {
    const spawner = new WaveSpawner();
    // Fast-forward to 300m
    for (let d = 10; d <= 300; d += 10) {
      spawner.update(d);
    }
    // Collect many spawns after 300m — at least one orc should appear
    const types = new Set<string>();
    for (let d = 310; d <= 600; d += 10) {
      for (const s of spawner.update(d)) {
        types.add(s.type);
      }
    }
    expect(types.has('orc')).toBe(true);
  });

  it('increases spawn density with distance', () => {
    const spawnerEarly = new WaveSpawner();
    const spawnerLate = new WaveSpawner();

    let earlyCount = 0;
    for (let d = 10; d <= 200; d += 10) {
      earlyCount += spawnerEarly.update(d).length;
    }

    // Fast-forward late spawner to 800m
    for (let d = 10; d <= 800; d += 10) {
      spawnerLate.update(d);
    }
    let lateCount = 0;
    for (let d = 810; d <= 1000; d += 10) {
      lateCount += spawnerLate.update(d).length;
    }

    expect(lateCount).toBeGreaterThan(earlyCount);
  });

  it('stops spawning after boss trigger distance', () => {
    const spawner = new WaveSpawner();
    for (let d = 10; d <= 1200; d += 10) {
      spawner.update(d);
    }
    const postBoss = spawner.update(1210);
    expect(postBoss).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/WaveSpawner.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement WaveSpawner**

```typescript
// src/systems/WaveSpawner.ts
import { EnemyType, pickEnemyType } from '@/config/EnemyConfig';
import { BOSS_TRIGGER_DISTANCE, FIELD_WIDTH } from '@/config/GameConfig';

export interface SpawnCommand {
  type: EnemyType;
  x: number; // game-world X position
}

export class WaveSpawner {
  private nextSpawnDistance = 30;
  private stopped = false;

  /** Call each frame with the current distance. Returns enemies to spawn. */
  update(currentDistance: number): SpawnCommand[] {
    if (this.stopped) return [];
    if (currentDistance >= BOSS_TRIGGER_DISTANCE) {
      this.stopped = true;
      return [];
    }

    const spawns: SpawnCommand[] = [];

    while (this.nextSpawnDistance <= currentDistance) {
      const clusterSize = this.getClusterSize(this.nextSpawnDistance);
      for (let i = 0; i < clusterSize; i++) {
        spawns.push({
          type: pickEnemyType(this.nextSpawnDistance),
          x: (Math.random() - 0.5) * FIELD_WIDTH,
        });
      }
      this.nextSpawnDistance += this.getSpawnInterval(this.nextSpawnDistance);
    }

    return spawns;
  }

  /** How many enemies per burst — scales with distance */
  private getClusterSize(distance: number): number {
    if (distance < 300) return 1 + Math.floor(Math.random() * 2); // 1-2
    if (distance < 600) return 2 + Math.floor(Math.random() * 2); // 2-3
    if (distance < 900) return 3 + Math.floor(Math.random() * 3); // 3-5
    return 4 + Math.floor(Math.random() * 4); // 4-7
  }

  /** Distance between spawn bursts — shrinks as difficulty increases */
  private getSpawnInterval(distance: number): number {
    if (distance < 300) return 40 + Math.random() * 20; // 40-60
    if (distance < 600) return 30 + Math.random() * 15; // 30-45
    if (distance < 900) return 20 + Math.random() * 10; // 20-30
    return 15 + Math.random() * 10; // 15-25
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/WaveSpawner.test.ts`
Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/systems/WaveSpawner.ts tests/WaveSpawner.test.ts
git commit -m "feat: add wave spawner with distance-based difficulty scaling and tests"
```

---

### Task 8: Boss Phase Logic (TDD)

**Files:**
- Create: `src/entities/Boss.ts`, `tests/Boss.test.ts`

The Boss module contains the phase state machine as pure logic. Phaser sprite integration happens in the BossScene task.

- [ ] **Step 1: Write failing tests**

```typescript
// tests/Boss.test.ts
import { describe, it, expect } from 'vitest';
import { BossState, BossPhase } from '../src/entities/Boss';

describe('BossState', () => {
  it('starts in vulnerable phase', () => {
    const boss = new BossState();
    expect(boss.phase).toBe(BossPhase.Vulnerable);
    expect(boss.hp).toBe(500);
  });

  it('takes full damage during vulnerable phase', () => {
    const boss = new BossState();
    boss.takeDamage(10);
    expect(boss.hp).toBe(490);
  });

  it('transitions to slam after vulnerable duration', () => {
    const boss = new BossState();
    boss.update(5000); // 5 seconds
    expect(boss.phase).toBe(BossPhase.Slam);
  });

  it('takes reduced damage during slam phase', () => {
    const boss = new BossState();
    boss.update(5000); // move to slam
    boss.takeDamage(10);
    expect(boss.hp).toBe(500 - 5); // 50% reduction
  });

  it('transitions slam -> charge -> vulnerable', () => {
    const boss = new BossState();
    boss.update(5000); // vulnerable -> slam
    expect(boss.phase).toBe(BossPhase.Slam);
    boss.update(3000); // slam -> charge
    expect(boss.phase).toBe(BossPhase.Charge);
    boss.update(4000); // charge -> vulnerable
    expect(boss.phase).toBe(BossPhase.Vulnerable);
  });

  it('takes zero damage during charge (invulnerable)', () => {
    const boss = new BossState();
    boss.update(5000); // -> slam
    boss.update(3000); // -> charge
    boss.takeDamage(100);
    expect(boss.hp).toBe(500);
  });

  it('enters enrage when HP drops below 20%', () => {
    const boss = new BossState();
    boss.takeDamage(410); // 500 - 410 = 90 = 18%
    expect(boss.enraged).toBe(true);
  });

  it('enrage shortens slam warning duration', () => {
    const boss = new BossState();
    expect(boss.slamWarningDuration).toBe(1500);
    boss.takeDamage(410);
    expect(boss.slamWarningDuration).toBe(800);
  });

  it('is dead when HP reaches 0', () => {
    const boss = new BossState();
    boss.takeDamage(500);
    expect(boss.hp).toBe(0);
    expect(boss.isDead).toBe(true);
  });

  it('phase timer resets on transition', () => {
    const boss = new BossState();
    boss.update(3000); // 3s into vulnerable (5s total)
    expect(boss.phase).toBe(BossPhase.Vulnerable);
    boss.update(2000); // 5s total -> transition to slam
    expect(boss.phase).toBe(BossPhase.Slam);
    boss.update(1000); // 1s into slam (3s total)
    expect(boss.phase).toBe(BossPhase.Slam); // still in slam
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/Boss.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement BossState**

```typescript
// src/entities/Boss.ts
import {
  BOSS_HP,
  BOSS_VULNERABLE_DURATION,
  BOSS_SLAM_DURATION,
  BOSS_SLAM_WARNING,
  BOSS_CHARGE_DURATION,
  BOSS_ENRAGE_THRESHOLD,
  BOSS_ENRAGE_WARNING,
  BOSS_DAMAGE_REDUCTION_SLAM,
} from '@/config/GameConfig';

export enum BossPhase {
  Vulnerable = 'vulnerable',
  Slam = 'slam',
  Charge = 'charge',
}

const PHASE_ORDER: BossPhase[] = [
  BossPhase.Vulnerable,
  BossPhase.Slam,
  BossPhase.Charge,
];

export class BossState {
  hp: number = BOSS_HP;
  phase: BossPhase = BossPhase.Vulnerable;
  phaseTimer: number = 0;
  enraged: boolean = false;

  get isDead(): boolean {
    return this.hp <= 0;
  }

  get slamWarningDuration(): number {
    return this.enraged ? BOSS_ENRAGE_WARNING : BOSS_SLAM_WARNING;
  }

  private get phaseDuration(): number {
    const base = {
      [BossPhase.Vulnerable]: BOSS_VULNERABLE_DURATION,
      [BossPhase.Slam]: BOSS_SLAM_DURATION,
      [BossPhase.Charge]: BOSS_CHARGE_DURATION,
    }[this.phase];

    return this.enraged ? base / 2 : base;
  }

  /** Advance the phase timer by deltaMs. Returns true if phase changed. */
  update(deltaMs: number): boolean {
    if (this.isDead) return false;

    this.phaseTimer += deltaMs;

    if (this.phaseTimer >= this.phaseDuration) {
      this.phaseTimer = 0;
      const currentIndex = PHASE_ORDER.indexOf(this.phase);
      this.phase = PHASE_ORDER[(currentIndex + 1) % PHASE_ORDER.length];
      return true;
    }

    return false;
  }

  /** Apply damage with phase-based reduction */
  takeDamage(amount: number): void {
    let effective = amount;

    if (this.phase === BossPhase.Charge) {
      effective = 0; // invulnerable
    } else if (this.phase === BossPhase.Slam) {
      effective = amount * BOSS_DAMAGE_REDUCTION_SLAM;
    }

    this.hp = Math.max(0, this.hp - effective);

    if (this.hp / BOSS_HP <= BOSS_ENRAGE_THRESHOLD) {
      this.enraged = true;
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/Boss.test.ts`
Expected: All 10 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/entities/Boss.ts tests/Boss.test.ts
git commit -m "feat: add boss phase state machine with enrage and tests"
```

---

### Task 9: InputHandler

**Files:**
- Create: `src/systems/InputHandler.ts`

This wraps Phaser's pointer events into a simple "drag offset from touch start" value. No unit test (Phaser pointer dependency) — tested manually in the GameScene.

- [ ] **Step 1: Create InputHandler**

```typescript
// src/systems/InputHandler.ts
import Phaser from 'phaser';

/**
 * Tracks touch drag relative to where the finger first touched.
 * Exposes `offsetX` which is the horizontal distance from the touch origin.
 */
export class InputHandler {
  offsetX: number = 0;
  private dragging: boolean = false;
  private startX: number = 0;

  constructor(scene: Phaser.Scene) {
    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.dragging = true;
      this.startX = pointer.x;
      this.offsetX = 0;
    });

    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.dragging) {
        this.offsetX = pointer.x - this.startX;
      }
    });

    scene.input.on('pointerup', () => {
      this.dragging = false;
      // Keep last offsetX so army doesn't snap back — resets on next touch
    });
  }

  /** Normalized offset clamped to [-1, 1] based on half the game width */
  getNormalized(halfWidth: number): number {
    return Phaser.Math.Clamp(this.offsetX / halfWidth, -1, 1);
  }

  destroy(): void {
    this.dragging = false;
    this.offsetX = 0;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/systems/InputHandler.ts
git commit -m "feat: add touch drag input handler"
```

---

### Task 10: Placeholder Asset Generation & BootScene

**Files:**
- Create: `src/scenes/BootScene.ts`

Instead of loading image files, we generate all placeholder textures programmatically using Phaser's Graphics API. This avoids needing any asset files for V1.

- [ ] **Step 1: Create BootScene**

```typescript
// src/scenes/BootScene.ts
import Phaser from 'phaser';
import { ENEMY_STATS, EnemyType } from '@/config/EnemyConfig';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    this.generatePlayerUnitTexture();
    this.generateBulletTexture();
    this.generateEnemyTextures();
    this.generateBossTexture();
    this.generateGateTextures();

    this.scene.start('MenuScene');
  }

  private generatePlayerUnitTexture(): void {
    const g = this.add.graphics();
    g.fillStyle(0x00d4ff, 1);
    g.fillRect(0, 0, 20, 20);
    g.generateTexture('unit', 20, 20);
    g.destroy();
  }

  private generateBulletTexture(): void {
    const g = this.add.graphics();
    g.fillStyle(0xffd43b, 1);
    g.fillCircle(3, 3, 3);
    g.generateTexture('bullet', 6, 6);
    g.destroy();
  }

  private generateEnemyTextures(): void {
    for (const [type, stats] of Object.entries(ENEMY_STATS)) {
      const g = this.add.graphics();
      g.fillStyle(stats.color, 1);
      const size = stats.size * 2;
      g.fillRect(0, 0, size, size);
      g.generateTexture(`enemy_${type}`, size, size);
      g.destroy();
    }
  }

  private generateBossTexture(): void {
    const g = this.add.graphics();
    g.fillStyle(0xff6b6b, 1);
    g.fillRect(0, 0, 88, 88);
    // Inner detail
    g.fillStyle(0xbe4bdb, 1);
    g.fillRect(10, 10, 68, 68);
    g.generateTexture('boss', 88, 88);
    g.destroy();
  }

  private generateGateTextures(): void {
    // Green (multiply)
    const gGreen = this.add.graphics();
    gGreen.fillStyle(0x51cf66, 1);
    gGreen.fillRect(0, 0, 120, 60);
    gGreen.generateTexture('gate_multiply', 120, 60);
    gGreen.destroy();

    // Blue (add)
    const gBlue = this.add.graphics();
    gBlue.fillStyle(0x00d4ff, 1);
    gBlue.fillRect(0, 0, 120, 60);
    gBlue.generateTexture('gate_add', 120, 60);
    gBlue.destroy();

    // Red (subtract/divide)
    const gRed = this.add.graphics();
    gRed.fillStyle(0xff6b6b, 1);
    gRed.fillRect(0, 0, 120, 60);
    gRed.generateTexture('gate_subtract', 120, 60);
    gRed.destroy();
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "feat: add boot scene with procedural placeholder textures"
```

---

### Task 11: MenuScene

**Files:**
- Create: `src/scenes/MenuScene.ts`

- [ ] **Step 1: Create MenuScene**

```typescript
// src/scenes/MenuScene.ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    // Title
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.3, 'ISO-METRIC WAR', {
        fontSize: '48px',
        color: '#00d4ff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Subtitle
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.38, 'Drag to command your army', {
        fontSize: '18px',
        color: '#888888',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    // High score
    const highScore = localStorage.getItem('iso-metric-war-highscore') || '0';
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.5, `High Score: ${highScore}`, {
        fontSize: '20px',
        color: '#ffd43b',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    // Start button
    const startBtn = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.65, '[ START ]', {
        fontSize: '32px',
        color: '#51cf66',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    startBtn.on('pointerover', () => startBtn.setColor('#ffffff'));
    startBtn.on('pointerout', () => startBtn.setColor('#51cf66'));
    startBtn.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    // Pulse animation on start button
    this.tweens.add({
      targets: startBtn,
      alpha: 0.5,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scenes/MenuScene.ts
git commit -m "feat: add menu scene with title and start button"
```

---

### Task 12: Entity Sprites — PlayerUnit, Bullet, Enemy, Gate

**Files:**
- Create: `src/entities/PlayerUnit.ts`, `src/entities/Bullet.ts`, `src/entities/Enemy.ts`, `src/entities/Gate.ts`

These are thin Phaser sprite wrappers. They hold per-entity state and expose methods the scene calls.

- [ ] **Step 1: Create PlayerUnit**

```typescript
// src/entities/PlayerUnit.ts
import Phaser from 'phaser';
import { UNIT_FIRE_RATE } from '@/config/GameConfig';

export class PlayerUnit extends Phaser.GameObjects.Sprite {
  active: boolean = false;
  fireTimer: number = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'unit');
    scene.add.existing(this);
    this.setVisible(false);
    this.setActive(false);
  }

  spawn(x: number, y: number): void {
    this.setPosition(x, y);
    this.setVisible(true);
    this.setActive(true);
    this.fireTimer = 0;
  }

  despawn(): void {
    this.setVisible(false);
    this.setActive(false);
  }

  /** Returns true when this unit should fire a bullet */
  updateFiring(delta: number): boolean {
    if (!this.active) return false;
    this.fireTimer += delta;
    if (this.fireTimer >= UNIT_FIRE_RATE) {
      this.fireTimer -= UNIT_FIRE_RATE;
      return true;
    }
    return false;
  }
}
```

- [ ] **Step 2: Create Bullet**

```typescript
// src/entities/Bullet.ts
import Phaser from 'phaser';
import { BULLET_SPEED, BULLET_DAMAGE } from '@/config/GameConfig';

export class Bullet extends Phaser.GameObjects.Sprite {
  active: boolean = false;
  velocityX: number = 0;
  velocityY: number = 0;
  damage: number = BULLET_DAMAGE;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'bullet');
    scene.add.existing(this);
    this.setVisible(false);
    this.setActive(false);
  }

  fire(fromX: number, fromY: number, targetX: number, targetY: number): void {
    this.setPosition(fromX, fromY);
    this.setVisible(true);
    this.setActive(true);

    const angle = Math.atan2(targetY - fromY, targetX - fromX);
    this.velocityX = Math.cos(angle) * BULLET_SPEED;
    this.velocityY = Math.sin(angle) * BULLET_SPEED;
  }

  updateMovement(delta: number): void {
    if (!this.active) return;
    const dt = delta / 1000;
    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;
  }

  despawn(): void {
    this.setVisible(false);
    this.setActive(false);
  }
}
```

- [ ] **Step 3: Create Enemy**

```typescript
// src/entities/Enemy.ts
import Phaser from 'phaser';
import { EnemyStats } from '@/config/EnemyConfig';

export class Enemy extends Phaser.GameObjects.Sprite {
  active: boolean = false;
  hp: number = 0;
  speed: number = 0;
  contactDamage: number = 0;
  splashRadius: number = 0;
  splashDamage: number = 0;
  scoreValue: number = 0;
  enemyType: string = '';

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'enemy_goblin');
    scene.add.existing(this);
    this.setVisible(false);
    this.setActive(false);
  }

  spawn(x: number, y: number, stats: EnemyStats): void {
    this.setPosition(x, y);
    this.setTexture(`enemy_${stats.type}`);
    this.setVisible(true);
    this.setActive(true);
    this.hp = stats.hp;
    this.speed = stats.speed;
    this.contactDamage = stats.contactDamage;
    this.splashRadius = stats.splashRadius;
    this.splashDamage = stats.splashDamage;
    this.scoreValue = stats.scoreValue;
    this.enemyType = stats.type;
  }

  /** Move toward a target Y position (the player army). Returns true if reached. */
  updateMovement(delta: number, targetY: number): boolean {
    if (!this.active) return false;
    const dt = delta / 1000;
    // Enemies move downward in screen space toward the player
    const direction = targetY > this.y ? 1 : -1;
    this.y += direction * this.speed * dt;

    // Reached the army if within contact distance
    return Math.abs(this.y - targetY) < 10;
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.despawn();
      return true; // died
    }
    // Flash white on hit
    this.setTint(0xffffff);
    this.scene.time.delayedCall(50, () => {
      if (this.active) this.clearTint();
    });
    return false;
  }

  despawn(): void {
    this.setVisible(false);
    this.setActive(false);
  }
}
```

- [ ] **Step 4: Create Gate**

```typescript
// src/entities/Gate.ts
import Phaser from 'phaser';
import { GateOption } from '@/systems/GateSpawner';
import { GATE_WIDTH, GATE_GAP } from '@/config/GameConfig';

export class Gate extends Phaser.GameObjects.Container {
  leftOption: GateOption | null = null;
  rightOption: GateOption | null = null;
  passed: boolean = false;

  private leftBg: Phaser.GameObjects.Sprite;
  private rightBg: Phaser.GameObjects.Sprite;
  private leftLabel: Phaser.GameObjects.Text;
  private rightLabel: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    scene.add.existing(this);

    const halfGap = GATE_GAP / 2;
    const leftX = -(halfGap + GATE_WIDTH / 2);
    const rightX = halfGap + GATE_WIDTH / 2;

    this.leftBg = scene.add.sprite(leftX, 0, 'gate_multiply');
    this.rightBg = scene.add.sprite(rightX, 0, 'gate_add');
    this.leftLabel = scene.add.text(leftX, 0, '', {
      fontSize: '24px',
      color: '#000000',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.rightLabel = scene.add.text(rightX, 0, '', {
      fontSize: '24px',
      color: '#000000',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add([this.leftBg, this.rightBg, this.leftLabel, this.rightLabel]);
    this.setVisible(false);
    this.setActive(false);
  }

  spawn(y: number, left: GateOption, right: GateOption): void {
    this.setPosition(0, y);
    this.leftOption = left;
    this.rightOption = right;
    this.passed = false;

    this.leftLabel.setText(left.label);
    this.rightLabel.setText(right.label);

    // Set texture based on gate color
    this.leftBg.setTexture(this.textureForColor(left.color));
    this.rightBg.setTexture(this.textureForColor(right.color));

    this.setVisible(true);
    this.setActive(true);
  }

  /** Returns which option the army passed through based on army X position, or null */
  checkPass(armyX: number, armyY: number): GateOption | null {
    if (this.passed || !this.active) return null;
    if (Math.abs(armyY - this.y) > 30) return null;

    this.passed = true;
    // Left side = army X < center, right side = army X >= center
    return armyX < 0 ? this.leftOption : this.rightOption;
  }

  despawn(): void {
    this.setVisible(false);
    this.setActive(false);
  }

  private textureForColor(color: number): string {
    if (color === 0x51cf66) return 'gate_multiply';
    if (color === 0xff6b6b) return 'gate_subtract';
    return 'gate_add';
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add src/entities/PlayerUnit.ts src/entities/Bullet.ts src/entities/Enemy.ts src/entities/Gate.ts
git commit -m "feat: add entity sprites for units, bullets, enemies, and gates"
```

---

### Task 13: HUDScene

**Files:**
- Create: `src/scenes/HUDScene.ts`

Runs as a parallel overlay scene on top of GameScene and BossScene.

- [ ] **Step 1: Create HUDScene**

```typescript
// src/scenes/HUDScene.ts
import Phaser from 'phaser';
import { GAME_WIDTH } from '@/config/GameConfig';

export class HUDScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private distanceText!: Phaser.GameObjects.Text;
  private unitText!: Phaser.GameObjects.Text;
  private killStreakText!: Phaser.GameObjects.Text;
  private bossHpBar!: Phaser.GameObjects.Graphics;
  private bossHpBg!: Phaser.GameObjects.Rectangle;
  private bossHpLabel!: Phaser.GameObjects.Text;

  score: number = 0;
  distance: number = 0;
  unitCount: number = 0;
  killStreak: number = 0;
  bossHpPercent: number = -1; // -1 = hidden

  constructor() {
    super({ key: 'HUDScene' });
  }

  create(): void {
    const style = {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace',
    };

    this.scoreText = this.add.text(16, 16, 'Score: 0', style);
    this.distanceText = this.add.text(16, 38, 'Distance: 0m', style);
    this.unitText = this.add.text(GAME_WIDTH - 16, 16, 'Units: 0', style).setOrigin(1, 0);
    this.killStreakText = this.add.text(GAME_WIDTH - 16, 38, 'Streak: 0', style).setOrigin(1, 0);

    // Boss HP bar (hidden by default)
    const barWidth = 300;
    const barX = (GAME_WIDTH - barWidth) / 2;
    this.bossHpBg = this.add.rectangle(barX, 50, barWidth, 16, 0x333333).setOrigin(0, 0).setVisible(false);
    this.bossHpBar = this.add.graphics().setVisible(false);
    this.bossHpLabel = this.add
      .text(GAME_WIDTH / 2, 53, '', {
        fontSize: '11px',
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0)
      .setVisible(false);
  }

  update(): void {
    this.scoreText.setText(`Score: ${this.score}`);
    this.distanceText.setText(`Distance: ${Math.floor(this.distance)}m`);
    this.unitText.setText(`Units: ${this.unitCount}`);
    this.killStreakText.setText(`Streak: ${this.killStreak}`);

    const showBoss = this.bossHpPercent >= 0;
    this.bossHpBg.setVisible(showBoss);
    this.bossHpBar.setVisible(showBoss);
    this.bossHpLabel.setVisible(showBoss);

    if (showBoss) {
      const barWidth = 300;
      const barX = (GAME_WIDTH - barWidth) / 2;
      this.bossHpBar.clear();
      this.bossHpBar.fillStyle(0xff6b6b, 1);
      this.bossHpBar.fillRect(barX, 50, barWidth * this.bossHpPercent, 16);
      this.bossHpLabel.setText(`GORATH ${Math.ceil(this.bossHpPercent * 100)}%`);
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scenes/HUDScene.ts
git commit -m "feat: add HUD scene with score, distance, units, and boss HP bar"
```

---

### Task 14: GameScene — Main Gameplay Loop

**Files:**
- Create: `src/scenes/GameScene.ts`

This is the big integration scene that wires together all entities and systems.

- [ ] **Step 1: Create GameScene**

```typescript
// src/scenes/GameScene.ts
import Phaser from 'phaser';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  STARTING_UNITS,
  MARCH_SPEED,
  FIELD_WIDTH,
  BULLET_POOL_SIZE,
  ENEMY_POOL_SIZE,
  GATE_INTERVAL,
  BOSS_TRIGGER_DISTANCE,
  SCORE_PER_METER,
} from '@/config/GameConfig';
import { ENEMY_STATS } from '@/config/EnemyConfig';
import { toIso, isoDepth } from '@/systems/IsoHelper';
import { InputHandler } from '@/systems/InputHandler';
import { WaveSpawner } from '@/systems/WaveSpawner';
import { pickGatePair } from '@/systems/GateSpawner';
import { computeFormation } from '@/entities/Army';
import { PlayerUnit } from '@/entities/PlayerUnit';
import { Bullet } from '@/entities/Bullet';
import { Enemy } from '@/entities/Enemy';
import { Gate } from '@/entities/Gate';
import { HUDScene } from '@/scenes/HUDScene';

export class GameScene extends Phaser.Scene {
  private input_handler!: InputHandler;
  private waveSpawner!: WaveSpawner;
  private hud!: HUDScene;

  // Game state
  private armyX: number = 0; // game-world X of army center
  private distance: number = 0;
  private score: number = 0;
  private unitCount: number = STARTING_UNITS;
  private killStreak: number = 0;
  private lastKillTime: number = 0;

  // Entity arrays
  private units: PlayerUnit[] = [];
  private bullets: Bullet[] = [];
  private enemies: Enemy[] = [];
  private gates: Gate[] = [];

  // Gate tracking
  private nextGateDistance: number = GATE_INTERVAL;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.armyX = 0;
    this.distance = 0;
    this.score = 0;
    this.unitCount = STARTING_UNITS;
    this.killStreak = 0;
    this.lastKillTime = 0;
    this.nextGateDistance = GATE_INTERVAL;

    this.input_handler = new InputHandler(this);
    this.waveSpawner = new WaveSpawner();

    // Create entity pools
    this.units = [];
    for (let i = 0; i < 200; i++) {
      this.units.push(new PlayerUnit(this));
    }

    this.bullets = [];
    for (let i = 0; i < BULLET_POOL_SIZE; i++) {
      this.bullets.push(new Bullet(this));
    }

    this.enemies = [];
    for (let i = 0; i < ENEMY_POOL_SIZE; i++) {
      this.enemies.push(new Enemy(this));
    }

    this.gates = [];
    for (let i = 0; i < 5; i++) {
      this.gates.push(new Gate(this));
    }

    // Start HUD
    this.scene.launch('HUDScene');
    this.hud = this.scene.get('HUDScene') as HUDScene;

    // Spawn initial army
    this.respawnArmy();
  }

  update(_time: number, delta: number): void {
    // 1. Advance distance
    const dt = delta / 1000;
    this.distance += MARCH_SPEED * dt;
    this.score += MARCH_SPEED * dt * SCORE_PER_METER;

    // 2. Update army position from input
    const normalized = this.input_handler.getNormalized(GAME_WIDTH / 2);
    this.armyX = normalized * (FIELD_WIDTH / 2);
    this.respawnArmy();

    // 3. Spawn enemies
    const spawnCommands = this.waveSpawner.update(this.distance);
    for (const cmd of spawnCommands) {
      const enemy = this.enemies.find((e) => !e.active);
      if (enemy) {
        const stats = ENEMY_STATS[cmd.type];
        // Spawn enemy ahead of the army in screen space
        const isoPos = toIso(cmd.x, -300); // above the screen
        enemy.spawn(isoPos.x + GAME_WIDTH / 2, isoPos.y + 100, stats);
      }
    }

    // 4. Spawn gates
    if (this.distance >= this.nextGateDistance && this.distance < BOSS_TRIGGER_DISTANCE) {
      const pair = pickGatePair(this.distance);
      const gate = this.gates.find((g) => !g.active);
      if (gate) {
        gate.spawn(200, pair.left, pair.right); // spawn at top area
        gate.setPosition(GAME_WIDTH / 2, 200);
      }
      this.nextGateDistance += GATE_INTERVAL;
    }

    // 5. Update bullets
    const armyScreenY = GAME_HEIGHT - 200;
    for (const bullet of this.bullets) {
      if (!bullet.active) continue;
      bullet.updateMovement(delta);

      // Off-screen check
      if (bullet.y < -50 || bullet.y > GAME_HEIGHT + 50 || bullet.x < -50 || bullet.x > GAME_WIDTH + 50) {
        bullet.despawn();
        continue;
      }

      // Hit check against enemies
      for (const enemy of this.enemies) {
        if (!enemy.active) continue;
        const dx = bullet.x - enemy.x;
        const dy = bullet.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < enemy.displayWidth / 2 + 5) {
          bullet.despawn();
          const killed = enemy.takeDamage(bullet.damage);
          if (killed) {
            this.score += enemy.scoreValue;
            const now = this.time.now;
            if (now - this.lastKillTime < 2000) {
              this.killStreak++;
            } else {
              this.killStreak = 1;
            }
            this.lastKillTime = now;
          }
          break;
        }
      }
    }

    // 6. Update enemies — move toward army
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;

      // Move toward player army Y position
      const reachedArmy = enemy.updateMovement(delta, armyScreenY);

      if (reachedArmy) {
        // Enemy contacts army — kill units
        this.unitCount = Math.max(0, this.unitCount - enemy.contactDamage);

        // Splash damage
        if (enemy.splashRadius > 0) {
          this.unitCount = Math.max(0, this.unitCount - enemy.splashDamage);
        }

        enemy.despawn();

        if (this.unitCount <= 0) {
          this.gameOver();
          return;
        }

        this.respawnArmy();
      }
    }

    // 7. Update gates — check if army passes through
    for (const gate of this.gates) {
      if (!gate.active || gate.passed) continue;

      // Gates scroll down as army advances
      gate.y += MARCH_SPEED * dt;

      const result = gate.checkPass(this.armyX, armyScreenY);
      if (result) {
        this.unitCount = result.apply(this.unitCount);
        this.unitCount = Math.max(1, this.unitCount); // never go to 0 from gate
        this.respawnArmy();
      }

      // Remove gates that scroll off the bottom
      if (gate.y > GAME_HEIGHT + 100) {
        gate.despawn();
      }
    }

    // 8. Fire bullets from units
    for (const unit of this.units) {
      if (!unit.active) continue;
      if (unit.updateFiring(delta)) {
        // Find nearest enemy
        let nearest: Enemy | null = null;
        let nearestDist = Infinity;
        for (const enemy of this.enemies) {
          if (!enemy.active) continue;
          const dx = unit.x - enemy.x;
          const dy = unit.y - enemy.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < nearestDist) {
            nearestDist = d;
            nearest = enemy;
          }
        }
        if (nearest) {
          const bullet = this.bullets.find((b) => !b.active);
          if (bullet) {
            bullet.fire(unit.x, unit.y, nearest.x, nearest.y);
          }
        }
      }
    }

    // 9. Check boss trigger
    if (this.distance >= BOSS_TRIGGER_DISTANCE) {
      // Check if all remaining enemies are dead
      const activeEnemies = this.enemies.filter((e) => e.active).length;
      if (activeEnemies === 0) {
        this.transitionToBoss();
        return;
      }
    }

    // 10. Update HUD
    this.hud.score = Math.floor(this.score);
    this.hud.distance = this.distance;
    this.hud.unitCount = this.unitCount;
    this.hud.killStreak = this.killStreak;

    // 11. Depth sort all visible sprites
    this.children.sort('y', (a: any, b: any) => (a.y || 0) - (b.y || 0));
  }

  private respawnArmy(): void {
    // Deactivate all units first
    for (const unit of this.units) {
      unit.despawn();
    }

    // Compute formation positions
    const armyScreenX = GAME_WIDTH / 2 + this.armyX;
    const armyScreenY = GAME_HEIGHT - 200;
    const positions = computeFormation(this.unitCount, armyScreenX, armyScreenY);

    for (let i = 0; i < positions.length && i < this.units.length; i++) {
      this.units[i].spawn(positions[i].x, positions[i].y);
    }
  }

  private gameOver(): void {
    this.input_handler.destroy();
    this.scene.stop('HUDScene');
    this.scene.start('GameOverScene', {
      score: Math.floor(this.score),
      distance: Math.floor(this.distance),
      bossDefeated: false,
    });
  }

  private transitionToBoss(): void {
    // Screen shake for dramatic effect
    this.cameras.main.shake(500, 0.01);

    this.time.delayedCall(600, () => {
      this.scene.stop('HUDScene');
      this.scene.start('BossScene', {
        score: Math.floor(this.score),
        distance: Math.floor(this.distance),
        unitCount: this.unitCount,
      });
    });
  }
}
```

- [ ] **Step 2: Verify it runs**

Run: `npm run dev`
Expected: After clicking START on the menu, the game scene loads. Army units visible at bottom, enemies spawn and move downward, gates appear. Touch/drag moves the army.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat: add main game scene wiring entities, spawners, and input"
```

---

### Task 15: BossScene

**Files:**
- Create: `src/scenes/BossScene.ts`

- [ ] **Step 1: Create BossScene**

```typescript
// src/scenes/BossScene.ts
import Phaser from 'phaser';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  FIELD_WIDTH,
  BULLET_POOL_SIZE,
  BOSS_HP,
  SCORE_BOSS_KILL,
  SCORE_PER_SURVIVING_UNIT,
} from '@/config/GameConfig';
import { InputHandler } from '@/systems/InputHandler';
import { computeFormation } from '@/entities/Army';
import { PlayerUnit } from '@/entities/PlayerUnit';
import { Bullet } from '@/entities/Bullet';
import { BossState, BossPhase } from '@/entities/Boss';
import { HUDScene } from '@/scenes/HUDScene';

interface BossSceneData {
  score: number;
  distance: number;
  unitCount: number;
}

export class BossScene extends Phaser.Scene {
  private input_handler!: InputHandler;
  private bossState!: BossState;
  private hud!: HUDScene;

  private armyX: number = 0;
  private score: number = 0;
  private distance: number = 0;
  private unitCount: number = 0;

  private units: PlayerUnit[] = [];
  private bullets: Bullet[] = [];
  private bossSprite!: Phaser.GameObjects.Sprite;

  // Slam danger zones
  private dangerZones: Phaser.GameObjects.Rectangle[] = [];
  private slamActive: boolean = false;
  private slamZoneX: number[] = []; // X positions of danger zones

  constructor() {
    super({ key: 'BossScene' });
  }

  create(data: BossSceneData): void {
    this.score = data.score;
    this.distance = data.distance;
    this.unitCount = data.unitCount;
    this.armyX = 0;

    this.input_handler = new InputHandler(this);
    this.bossState = new BossState();

    // Boss sprite
    this.bossSprite = this.add.sprite(GAME_WIDTH / 2, 200, 'boss');
    this.bossSprite.setScale(1.5);

    // Entity pools
    this.units = [];
    for (let i = 0; i < 200; i++) {
      this.units.push(new PlayerUnit(this));
    }
    this.bullets = [];
    for (let i = 0; i < BULLET_POOL_SIZE; i++) {
      this.bullets.push(new Bullet(this));
    }

    // Danger zone rectangles (for slam phase)
    this.dangerZones = [];
    for (let i = 0; i < 3; i++) {
      const zone = this.add.rectangle(0, GAME_HEIGHT - 300, 150, 300, 0xff0000, 0.3);
      zone.setVisible(false);
      zone.setOrigin(0.5, 0);
      this.dangerZones.push(zone);
    }

    // Start HUD
    this.scene.launch('HUDScene');
    this.hud = this.scene.get('HUDScene') as HUDScene;
    this.hud.bossHpPercent = 1;

    this.respawnArmy();

    // Entrance flash
    this.cameras.main.flash(300, 255, 100, 100);
  }

  update(_time: number, delta: number): void {
    if (this.bossState.isDead) return;

    // 1. Update army position
    const normalized = this.input_handler.getNormalized(GAME_WIDTH / 2);
    this.armyX = normalized * (FIELD_WIDTH / 2);
    this.respawnArmy();

    // 2. Update boss phase
    const phaseChanged = this.bossState.update(delta);
    if (phaseChanged) {
      this.onPhaseChange();
    }

    // 3. Handle slam phase
    if (this.bossState.phase === BossPhase.Slam) {
      this.updateSlam(delta);
    }

    // 4. Handle charge phase
    if (this.bossState.phase === BossPhase.Charge) {
      this.updateCharge(delta);
    }

    // 5. Fire bullets at boss
    for (const unit of this.units) {
      if (!unit.active) continue;
      if (unit.updateFiring(delta)) {
        const bullet = this.bullets.find((b) => !b.active);
        if (bullet) {
          bullet.fire(unit.x, unit.y, this.bossSprite.x, this.bossSprite.y);
        }
      }
    }

    // 6. Update bullets
    for (const bullet of this.bullets) {
      if (!bullet.active) continue;
      bullet.updateMovement(delta);

      // Off-screen
      if (bullet.y < -50) {
        bullet.despawn();
        continue;
      }

      // Hit boss
      const dx = bullet.x - this.bossSprite.x;
      const dy = bullet.y - this.bossSprite.y;
      if (Math.sqrt(dx * dx + dy * dy) < 50) {
        bullet.despawn();
        this.bossState.takeDamage(bullet.damage);

        // Flash boss on hit
        this.bossSprite.setTint(0xffffff);
        this.time.delayedCall(30, () => {
          if (!this.bossState.isDead) {
            this.bossSprite.clearTint();
            if (this.bossState.enraged) {
              this.bossSprite.setTint(0xff4040);
            }
          }
        });

        if (this.bossState.isDead) {
          this.bossDefeated();
          return;
        }
      }
    }

    // 7. Update HUD
    this.hud.score = Math.floor(this.score);
    this.hud.distance = this.distance;
    this.hud.unitCount = this.unitCount;
    this.hud.bossHpPercent = this.bossState.hp / BOSS_HP;
  }

  private onPhaseChange(): void {
    // Clean up previous phase visuals
    this.hideDangerZones();
    this.slamActive = false;

    if (this.bossState.phase === BossPhase.Slam) {
      this.prepareSlamZones();
    }

    if (this.bossState.phase === BossPhase.Charge) {
      this.startCharge();
    }
  }

  private prepareSlamZones(): void {
    // Pick 2 random X positions for danger zones, leaving 1 safe lane
    const lanes = [-200, -60, 80, 220];
    const dangerIndices = Phaser.Utils.Array.Shuffle([0, 1, 2, 3]).slice(0, 2);

    this.slamZoneX = dangerIndices.map((i) => lanes[i]);

    for (let i = 0; i < this.slamZoneX.length && i < this.dangerZones.length; i++) {
      this.dangerZones[i].setPosition(GAME_WIDTH / 2 + this.slamZoneX[i], GAME_HEIGHT - 400);
      this.dangerZones[i].setVisible(true);
      this.dangerZones[i].setAlpha(0.3);

      // Flash warning
      this.tweens.add({
        targets: this.dangerZones[i],
        alpha: 0.6,
        duration: 200,
        yoyo: true,
        repeat: 3,
      });
    }

    // Schedule the actual slam hit
    this.time.delayedCall(this.bossState.slamWarningDuration, () => {
      if (this.bossState.phase === BossPhase.Slam) {
        this.executeSlamDamage();
      }
    });
  }

  private executeSlamDamage(): void {
    this.slamActive = true;

    // Flash zones red
    for (const zone of this.dangerZones) {
      if (zone.visible) {
        zone.setFillStyle(0xff0000, 0.6);
      }
    }

    // Check if army is in a danger zone
    const armyScreenX = GAME_WIDTH / 2 + this.armyX;
    for (const zoneX of this.slamZoneX) {
      const zoneCenterX = GAME_WIDTH / 2 + zoneX;
      if (Math.abs(armyScreenX - zoneCenterX) < 100) {
        // Hit! Kill some units
        const unitsToKill = Math.ceil(this.unitCount * 0.3);
        this.unitCount = Math.max(0, this.unitCount - unitsToKill);

        this.cameras.main.shake(200, 0.02);

        if (this.unitCount <= 0) {
          this.gameOver();
          return;
        }
        this.respawnArmy();
        break;
      }
    }
  }

  private hideDangerZones(): void {
    for (const zone of this.dangerZones) {
      zone.setVisible(false);
      zone.setFillStyle(0xff0000, 0.3);
    }
  }

  private chargeDirection: number = 1;
  private chargeStartX: number = 0;

  private startCharge(): void {
    // Boss charges from one side to the other
    this.chargeDirection = Math.random() < 0.5 ? -1 : 1;
    this.chargeStartX = this.chargeDirection === 1 ? 50 : GAME_WIDTH - 50;
    this.bossSprite.x = this.chargeStartX;
    this.bossSprite.y = GAME_HEIGHT - 250;
  }

  private updateCharge(delta: number): void {
    const speed = this.bossState.enraged ? 600 : 400;
    this.bossSprite.x += this.chargeDirection * speed * (delta / 1000);

    // Check collision with army
    const armyScreenX = GAME_WIDTH / 2 + this.armyX;
    const armyScreenY = GAME_HEIGHT - 200;

    if (
      Math.abs(this.bossSprite.x - armyScreenX) < 80 &&
      Math.abs(this.bossSprite.y - armyScreenY) < 100
    ) {
      const unitsToKill = Math.ceil(this.unitCount * 0.4);
      this.unitCount = Math.max(0, this.unitCount - unitsToKill);
      this.cameras.main.shake(300, 0.03);

      if (this.unitCount <= 0) {
        this.gameOver();
        return;
      }
      this.respawnArmy();
    }

    // Reset boss position when charge completes (off screen)
    if (this.bossSprite.x < -100 || this.bossSprite.x > GAME_WIDTH + 100) {
      this.bossSprite.setPosition(GAME_WIDTH / 2, 200);
    }
  }

  private respawnArmy(): void {
    for (const unit of this.units) {
      unit.despawn();
    }
    const armyScreenX = GAME_WIDTH / 2 + this.armyX;
    const armyScreenY = GAME_HEIGHT - 200;
    const positions = computeFormation(this.unitCount, armyScreenX, armyScreenY);
    for (let i = 0; i < positions.length && i < this.units.length; i++) {
      this.units[i].spawn(positions[i].x, positions[i].y);
    }
  }

  private bossDefeated(): void {
    // Death animation
    this.cameras.main.shake(500, 0.03);
    this.cameras.main.flash(500, 255, 255, 255);

    this.tweens.add({
      targets: this.bossSprite,
      alpha: 0,
      scale: 3,
      duration: 800,
      onComplete: () => {
        this.score += SCORE_BOSS_KILL;
        this.score += this.unitCount * SCORE_PER_SURVIVING_UNIT;

        this.scene.stop('HUDScene');
        this.scene.start('GameOverScene', {
          score: Math.floor(this.score),
          distance: Math.floor(this.distance),
          bossDefeated: true,
        });
      },
    });
  }

  private gameOver(): void {
    this.input_handler.destroy();
    this.scene.stop('HUDScene');
    this.scene.start('GameOverScene', {
      score: Math.floor(this.score),
      distance: Math.floor(this.distance),
      bossDefeated: false,
    });
  }
}
```

- [ ] **Step 2: Verify boss fight works**

Run: `npm run dev`
Expected: After reaching 1200m in the game, the boss spawns. Boss cycles through phases. Bullets hit boss. Danger zones appear during slam. Boss charges during charge phase. Enrage at 20% HP. Victory screen on kill.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/BossScene.ts
git commit -m "feat: add boss scene with phase cycle, slam, charge, and enrage"
```

---

### Task 16: GameOverScene

**Files:**
- Create: `src/scenes/GameOverScene.ts`

- [ ] **Step 1: Create GameOverScene**

```typescript
// src/scenes/GameOverScene.ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';

interface GameOverData {
  score: number;
  distance: number;
  bossDefeated: boolean;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: GameOverData): void {
    // Save high score
    const prev = parseInt(localStorage.getItem('iso-metric-war-highscore') || '0', 10);
    const isNewHigh = data.score > prev;
    if (isNewHigh) {
      localStorage.setItem('iso-metric-war-highscore', String(data.score));
    }

    // Title
    const titleText = data.bossDefeated ? 'VICTORY!' : 'GAME OVER';
    const titleColor = data.bossDefeated ? '#51cf66' : '#ff6b6b';
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.2, titleText, {
        fontSize: '48px',
        color: titleColor,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Stats
    const stats = [
      `Score: ${data.score}`,
      `Distance: ${data.distance}m`,
      data.bossDefeated ? 'Boss Defeated!' : '',
      isNewHigh ? 'NEW HIGH SCORE!' : `Best: ${Math.max(prev, data.score)}`,
    ].filter(Boolean);

    stats.forEach((line, i) => {
      const color = line.includes('NEW HIGH') ? '#ffd43b' : '#cccccc';
      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.4 + i * 36, line, {
          fontSize: '20px',
          color,
          fontFamily: 'monospace',
        })
        .setOrigin(0.5);
    });

    // Retry button
    const retryBtn = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.7, '[ PLAY AGAIN ]', {
        fontSize: '28px',
        color: '#00d4ff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    retryBtn.on('pointerover', () => retryBtn.setColor('#ffffff'));
    retryBtn.on('pointerout', () => retryBtn.setColor('#00d4ff'));
    retryBtn.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    // Menu button
    const menuBtn = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.8, '[ MENU ]', {
        fontSize: '22px',
        color: '#888888',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    menuBtn.on('pointerover', () => menuBtn.setColor('#ffffff'));
    menuBtn.on('pointerout', () => menuBtn.setColor('#888888'));
    menuBtn.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scenes/GameOverScene.ts
git commit -m "feat: add game over scene with score display and high score tracking"
```

---

### Task 17: Wire Up main.ts with All Scenes

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Update main.ts to register all scenes**

Replace the entire content of `src/main.ts`:

```typescript
// src/main.ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';
import { BootScene } from '@/scenes/BootScene';
import { MenuScene } from '@/scenes/MenuScene';
import { GameScene } from '@/scenes/GameScene';
import { BossScene } from '@/scenes/BossScene';
import { HUDScene } from '@/scenes/HUDScene';
import { GameOverScene } from '@/scenes/GameOverScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0a0a1a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, GameScene, BossScene, HUDScene, GameOverScene],
};

new Phaser.Game(config);
```

- [ ] **Step 2: Run the full game end-to-end**

Run: `npm run dev`

Expected behavior:
1. BootScene loads → generates textures → transitions to MenuScene
2. MenuScene shows title, high score, start button
3. Click START → GameScene begins
4. Army at bottom, drag left/right to move
5. Enemies spawn and march toward army
6. Units auto-fire bullets at enemies
7. Gates appear periodically — walk through one side
8. At 1200m → screen shake → BossScene starts
9. Boss cycles: vulnerable → slam (danger zones) → charge (dodge) → repeat
10. Enrage at 20% HP
11. Boss dies → victory → GameOverScene
12. If army dies → GameOverScene with "GAME OVER"
13. High score persisted in localStorage

- [ ] **Step 3: Commit**

```bash
git add src/main.ts
git commit -m "feat: wire all scenes into main game config"
```

---

### Task 18: Run All Tests & Final Verification

- [ ] **Step 1: Run all tests**

Run: `npx vitest run`

Expected: All tests pass:
- IsoHelper: 6 tests
- ObjectPool: 8 tests
- Army: 5 tests
- GateSpawner: 7 tests
- WaveSpawner: 5 tests
- Boss: 10 tests

Total: 41 tests, 0 failures.

- [ ] **Step 2: Run build to check for TypeScript errors**

Run: `npm run build`

Expected: Clean build with no TypeScript errors.

- [ ] **Step 3: Manual playtest**

Run: `npm run dev`

Test these scenarios:
- [ ] Start game from menu
- [ ] Drag left/right to move army
- [ ] Enemies spawn and die when shot
- [ ] Gates appear and modify unit count
- [ ] Game over when all units die
- [ ] Boss spawns at 1200m
- [ ] Boss slam phase — dodge danger zones
- [ ] Boss charge phase — move to opposite side
- [ ] Boss enrage — faster attacks
- [ ] Boss defeat → victory screen
- [ ] High score persists between sessions
- [ ] Play again works

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete V1 of Iso-Metric War — playable end-to-end"
```
