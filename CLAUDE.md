# CLAUDE.md

## Project Overview

DEATHMARCH is a web-based isometric mobile game built with **Phaser 3**. It's an endless wave-based army strategy game where players control units, pass through gates for unit multiplication/addition, and face multi-phase boss battles across 5 levels.

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
npm run dev          # Start dev server on port 3000
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
│   ├── Gate.ts              # Unit multiplication/division gates
│   ├── PlayerUnit.ts        # Individual army unit
│   └── WeaponCrate.ts       # Weapon upgrade pickup
├── scenes/                  # Phaser scenes
│   ├── BootScene.ts         # Asset loading
│   ├── SplashScene.ts       # Splash screen
│   ├── MenuScene.ts         # Main menu with level selection
│   ├── SettingsScene.ts     # Settings/preferences
│   ├── GameScene.ts         # Core gameplay loop
│   ├── BossScene.ts         # Boss fight phase management
│   ├── HUDScene.ts          # Score/unit count overlay
│   └── GameOverScene.ts     # Results screen
├── systems/                 # Cross-entity coordination
│   ├── ObjectPool.ts        # Generic object pooling (bullets, enemies, units)
│   ├── IsoHelper.ts         # Isometric coordinate transforms
│   ├── WaveSpawner.ts       # Distance-based enemy wave generation
│   ├── GateSpawner.ts       # Gate pair selection from templates
│   ├── InputHandler.ts      # Touch/drag input handling
│   └── Background.ts        # Scrolling background
└── config/                  # Game tuning
    ├── GameConfig.ts        # Constants (speeds, pool sizes, boss timings)
    ├── EnemyConfig.ts       # Enemy stats
    ├── WeaponConfig.ts      # Weapon definitions
    └── progression/         # Level system
        ├── LevelManager.ts  # Singleton managing level state
        └── levels/          # JSON configs (level1.json–level5.json)

tests/                       # Vitest unit tests
public/assets/               # SVG sprite assets
docs/                        # Game design specs and plans
```

## Architecture & Key Patterns

- **Object Pooling:** `ObjectPool<T>` reuses entities to avoid GC spikes. Pool sizes: bullets (10,000), enemies (100), units (200).
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
