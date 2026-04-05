# Iso-Metric War -- V1 Game Design Spec

## Overview

An endless isometric (2.5D) mobile war game where the player controls an army marching forward through waves of melee monsters. The player drags left/right to position their army, chooses gates that multiply or add units, and fights a phase-based boss at the end of each run. Units auto-fire bullets at approaching enemies. Score is distance + kills + bonuses.

## Core Loop

1. **March** -- army auto-advances upward through isometric terrain
2. **Fight** -- units auto-fire at nearest enemies; melee enemies charge toward player
3. **Choose Gate** -- pairs of gates appear periodically; player steers army through one side
4. **Boss** -- at 1200m distance, boss spawns for a dodge-and-shoot phase fight
5. **Score** -- game over screen with final score; retry

## Tech Stack

- **Engine**: Phaser 3 (WebGL renderer)
- **Language**: TypeScript
- **Build**: Vite
- **Art**: Placeholder geometric shapes (V1), replaceable with real art later
- **Target**: 60 FPS on mobile browsers, ~300 active entity cap

## Controls

- **Input**: Touch drag from center (virtual joystick style)
- **Movement**: Army starts centered; player drags left/right relative to touch start point
- **No vertical control**: Army auto-marches forward at a steady pace
- **No aiming**: Units auto-fire at nearest enemy

## Player Army

- **Starting count**: 5 units
- Each unit is an individual Phaser sprite with its own position in formation
- **Formation**: Triangle shape, grows outward from center as units are added
- **March speed**: 100 game-units/sec (constant throughout the run)
- **Fire rate**: 1 bullet per second per unit
- **Damage**: 1 per bullet
- **Targeting**: Nearest enemy
- **No individual HP**: Units die on enemy contact (front-line consumed first)
- **Game over**: Unit count reaches 0

## Enemy Types

All enemies are melee -- they march toward the player army and deal damage on contact, then die.

| Type   | HP | Speed     | Size   | Contact Damage      | Appears At |
|--------|----|-----------|--------|---------------------|------------|
| Goblin | 1  | Normal    | Small  | Kills 1 unit        | 0m         |
| Orc    | 3  | Slow      | Medium | Kills 2 units       | 300m       |
| Troll  | 8  | Very slow | Large  | Kills 3 units       | 600m       |
| Demon  | 5  | Fast      | Medium | Kills 2 + splash (kills 1 extra unit within 50px radius) | 900m |

### Escalating Mix

- 0-300m: 100% Goblins
- 300-600m: Goblins + Orcs
- 600-900m: Goblins + Orcs + Trolls
- 900-1200m: All four types, roughly 30/30/20/20 mix
- Enemy wave density increases with distance
- Spawns come in bursts with brief breathing room between waves

## Gate System

Gates appear every ~150m of distance traveled. Each gate encounter is a pair of two gates side by side; the player steers the army through one.

### Gate Types

- **Multiply**: x2, x3, x5 -- multiplies current unit count
- **Add**: +5, +10, +20 -- adds flat number of units
- **Subtract**: -5, /2 -- risk/trap gates paired with high-reward options

### Pairing Logic

Gate pairs are selected randomly from a template pool. Each template defines the left and right gate values. Templates are weighted so riskier pairings appear more at higher distances.

Example templates:

- x3 vs +10 -- multiplier great with many units, add safer when low
- x5 vs -5 -- forced choice, one side is a trap
- +20 vs +5 -- obvious choice, but +20 side may have enemies blocking the path
- x2 vs +5 -- mild choice, common early game
- /2 vs x3 -- high risk/reward, appears after 600m

## Boss Fight: Warlord Gorath

### Trigger

At 1200m distance, enemy spawning stops. A final dense wave clears out. Boss spawns with dramatic entrance (screen shake, flash). No more gates during boss fight.

### Stats

- **HP**: 500
- **Size**: 4x a troll, fills upper portion of arena

### Phase Cycle (repeats until dead)

**Phase 1 -- Vulnerable (5 seconds)**
- Boss stands still, takes full damage
- Player positions army for maximum DPS
- This is the primary damage window

**Phase 2 -- Ground Slam (3 seconds)**
- Red warning zones flash on ground for 1.5 seconds
- After warning, slam hits -- kills all units inside the zones
- Player dodges left or right to safe areas
- Boss takes 50% reduced damage during this phase

**Phase 3 -- Sweeping Charge (4 seconds)**
- Boss charges from one side of the field to the other
- Player must move army to the opposite side quickly
- Kills any units caught in the charge path
- Boss is invulnerable during charge

### Enrage (below 20% HP)

- Attack speed doubles
- Warning windows shrink: 1.5s → 0.8s
- Charge speed increases
- Creates tension in the final stretch

### Victory

- Boss death animation (explosion, collapse)
- Victory screen with final score

## Scoring

- **Distance traveled**: 1 point per meter
- **Kill bonus**: Points per enemy killed (scaled by enemy type)
- **Remaining units bonus**: Bonus for units alive at end
- **Boss kill bonus**: Large flat bonus for defeating the boss
- **High score**: Saved to localStorage

## Scenes

| Scene         | Purpose                                   |
|---------------|-------------------------------------------|
| BootScene     | Load all assets, show loading bar          |
| MenuScene     | Title screen, high score display, start button |
| GameScene     | Main gameplay loop (marching, fighting, gates) |
| BossScene     | Boss encounter with phase mechanics        |
| GameOverScene | Final score, retry button                  |
| HUDScene      | Overlay on GameScene/BossScene -- score, unit count, distance |

## Isometric Rendering

### Coordinate Transform

```
screenX = (gameX - gameY) * TILE_WIDTH / 2
screenY = (gameX + gameY) * TILE_HEIGHT / 2
```

### Depth Sorting

All sprites sorted by `depth = gameY` so entities closer to the camera render on top.

### Camera

- Follows army's Y position with smooth lerp
- Locked on X center
- World scrolls as army auto-marches forward

## Entity Architecture

Individual entity system -- every unit, enemy, bullet, and gate is a discrete Phaser sprite with its own game logic.

### Object Pools

Bullets, enemies, and player units use object pools to avoid garbage collection spikes. Entities are recycled rather than created/destroyed.

### Offscreen Culling

Entities outside the camera viewport skip rendering updates.

### Texture Atlas

All placeholder sprites packed into a single atlas for draw call batching.

## Project Structure

```
iso-metric-war/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── main.ts                  -- Phaser config & launch
│   ├── scenes/
│   │   ├── BootScene.ts          -- Asset loading
│   │   ├── MenuScene.ts          -- Title screen
│   │   ├── GameScene.ts          -- Main gameplay loop
│   │   ├── BossScene.ts          -- Boss encounter
│   │   ├── GameOverScene.ts      -- Results screen
│   │   └── HUDScene.ts           -- Score/unit overlay
│   ├── entities/
│   │   ├── PlayerUnit.ts         -- Single player unit
│   │   ├── Army.ts               -- Army manager (formation, spawning)
│   │   ├── Enemy.ts              -- Base enemy class
│   │   ├── EnemyTypes.ts         -- Goblin/Orc/Troll/Demon configs
│   │   ├── Bullet.ts             -- Projectile entity
│   │   ├── Gate.ts               -- Gate pair entity
│   │   └── Boss.ts               -- Boss with phase logic
│   ├── systems/
│   │   ├── IsoHelper.ts          -- 2D → isometric coordinate math
│   │   ├── ObjectPool.ts         -- Reusable object pool
│   │   ├── WaveSpawner.ts        -- Enemy wave generation
│   │   ├── GateSpawner.ts        -- Gate placement logic
│   │   └── InputHandler.ts       -- Touch/drag controls
│   └── config/
│       ├── GameConfig.ts         -- Tuning constants
│       └── EnemyConfig.ts        -- Enemy stats table
└── public/
    └── assets/                   -- Placeholder sprites/sounds
```

## Difficulty Curve

| Distance   | Difficulty | Description                           |
|------------|------------|---------------------------------------|
| 0-300m     | Easy       | Goblins only, sparse waves            |
| 300-600m   | Medium     | Orcs introduced, denser waves         |
| 600-900m   | Hard       | Trolls added, mixed formations        |
| 900-1200m  | Intense    | Demons appear, all types, dense chaos |
| 1200m+     | Boss       | Warlord Gorath encounter              |

## HUD Elements

- **Score**: Top-left, running total
- **Distance**: Top-left, meters traveled
- **Unit count**: Top-right, current army size
- **Kill streak**: Top-right, consecutive kills
- **Boss HP bar**: Top-center, only during boss fight
