# CLAUDE.md

## Project Overview

DEATHMARCH is a web-based isometric mobile game built with **Phaser 3**. It's an endless wave-based army strategy game where players steer a formation left/right by holding/dragging their finger, pass through gates that add/multiply/divide units, swap weapons, or apply penalties, and face multi-phase boss battles. Level progression is endless: five JSON seed configs feed a procedural `LevelGenerator`, then new levels are generated on demand.

Deployed as a **Progressive Web App** via Docker (nginx serving static assets).

## Tech Stack

- **Engine:** Phaser 3.90.0
- **Language:** TypeScript 6.0 (strict mode)
- **Build:** Vite 8.0
- **Tests:** Vitest 4.1
- **PWA:** vite-plugin-pwa
- **Deploy:** Docker multi-stage build → nginx on port 80
- **CI:** GitHub Actions → GitHub Container Registry (GHCR)

## Commands

```bash
npm run dev          # Start Vite dev server (prefers 3000, falls back to 3001/3002)
npm run build        # Type-check (tsc --noEmit) then Vite build
npm test             # Run tests once (vitest run)
npm run test:watch   # Run tests in watch mode
```

**Important:** `npm run build` runs `tsc --noEmit` first — type errors will fail the build.

## Project Structure

```
src/
├── main.ts                  # Entry point, Phaser game config
├── entities/                # Game entity classes
│   ├── Army.ts              # Formation management (triangular layout)
│   ├── Boss.ts              # Boss state machine with phase cycles
│   ├── Bullet.ts            # Projectile (pooled)
│   ├── Enemy.ts             # Enemy with health, movement, death effects
│   ├── Gate.ts              # Gates: add/multiply/divide units, weapon swap, or penalties
│   ├── PlayerUnit.ts        # Individual army unit
│   └── WeaponCrate.ts       # Weapon upgrade pickup
├── scenes/                  # Phaser scenes
│   ├── BootScene.ts         # Asset loading
│   ├── SplashScene.ts       # Splash screen
│   ├── MenuScene.ts         # Main menu with level selection
│   ├── SettingsScene.ts     # Settings (boss test, reset)
│   ├── GameScene.ts         # Core gameplay loop
│   ├── BossScene.ts         # Boss fight phase management
│   ├── HUDScene.ts          # Score/unit count overlay
│   ├── PerkSelectScene.ts   # Between-level perk draft
│   └── GameOverScene.ts     # Results screen
├── systems/                 # Cross-entity coordination
│   ├── ObjectPool.ts        # Generic object pooling (bullets, enemies, units)
│   ├── BulletPool.ts        # Bullet-specific pool management
│   ├── IsoHelper.ts         # Isometric coordinate transforms
│   ├── WaveSpawner.ts       # Distance-based enemy wave generation
│   ├── GateSpawner.ts       # Gate pair selection from templates
│   ├── InputHandler.ts      # Finger-follow X-axis + keyboard steering
│   ├── Background.ts        # Scrolling background
│   ├── ProceduralEnemy.ts   # Procedural enemy generation
│   ├── SoundManager.ts      # Audio management
│   ├── WakeLock.ts          # Screen wake lock for mobile
│   ├── PerkManager.ts       # Singleton: active perks, checkpoints, run state
│   └── WalletManager.ts     # In-game currency/wallet system
├── pwa.ts                   # PWA service worker registration
├── pwa-register.d.ts        # PWA type declarations
└── config/                  # Game tuning
    ├── GameConfig.ts        # Constants (speeds, pool sizes, boss timings)
    ├── EnemyConfig.ts       # Enemy stats
    ├── WeaponConfig.ts      # Weapon definitions
    └── progression/         # Level system
        ├── LevelManager.ts  # Singleton managing level state
        ├── LevelGenerator.ts # Procedural level generation
        ├── types.ts         # Progression type definitions
        ├── index.ts         # Barrel export
        └── levels/          # JSON configs (level1.json–level5.json)

tests/                       # Vitest unit tests
public/assets/sprites/       # SVG sprite assets
docs/                        # Game design specs and plans
```

## Architecture & Key Patterns

- **Object Pooling:** `ObjectPool<T>` reuses entities to avoid GC spikes. Pool sizes: bullets (`BULLET_POOL_SIZE = 3000`), enemies (`ENEMY_POOL_SIZE`, 100), units (`MAX_UNITS = 200` — unit overflow converts 1:1 into level gold).
- **Configuration-Driven Levels:** All level progression is defined in JSON files (`src/config/progression/levels/`). Enemy types, weapons, gates, and bosses are loaded from config — no code changes needed for level tuning.
- **Singleton LevelManager:** Manages progression state across scenes. Provides methods for enemy selection, weapon progression, gate templates, and scoring.
- **State Machines:** Boss entities use phase-based state machines with enrage mechanics.
- **Isometric Rendering:** `IsoHelper` handles game-to-screen coordinate transforms. Depth sorting by Y position.
- **Scene-Based Architecture:** Phaser scenes separate concerns (menu, gameplay, HUD, boss fight, game over).

## Path Aliases

TypeScript and Vite are configured with `@/` mapping to `src/`:
```ts
import { Something } from '@/systems/ObjectPool';
```

## Testing Conventions

- Test files live in `tests/` (not co-located with source)
- Naming: `{ModuleName}.test.ts`
- Uses Vitest `describe`, `it`, `expect`, and `vi` for mocking
- Existing coverage: ObjectPool, Army, Boss, GateSpawner, WaveSpawner, IsoHelper
- Run a single test file: `npx vitest run tests/ObjectPool.test.ts`

## Git Workflow

- **Push directly to `main`** — do not create pull requests from feature branches.
- Commit and push finished work straight to `main`.
- No branch-based PR workflow is used for this project.

## Code Conventions

- TypeScript strict mode — no implicit `any`, strict null checks
- No linter or formatter configured — follow existing code style
- Entities extend Phaser sprite classes with self-contained logic
- Systems are standalone modules that coordinate across entities
- Prefer object pooling over creating/destroying entities at runtime

## CI/CD

GitHub Actions (`.github/workflows/publish.yml`):
- Triggers on push to `main`/`master` or version tags (`v*`)
- Builds Docker image and pushes to GHCR as `ghcr.io/{repo}:latest`
- Uses GitHub Actions cache for Docker build layers

## Performance Targets

- ~300 active entities max
- 60 FPS on mobile browsers
- Offscreen entities skip rendering
- Sprites packed into atlas for batch rendering
