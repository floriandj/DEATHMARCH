# Balance Retuning — Design Spec

**Date:** 2026-04-07
**Goal:** 3-8 units on screen, forgiving difficulty (win first try but barely), gold shop for comfort not survival, no unit upgrades, fewer but more impactful gates.

---

## 1. Gate System

**Interval:** 800m (was 500m). Boss trigger stays at 3000m → 3-4 gates per level.

**Gate templates (replace all existing templates in LevelGenerator.ts):**

| Left | Right | Appears at (% of trigger) | Notes |
|------|-------|--------------------------|-------|
| +1 | +1 | 0% | Safe early gate |
| +2 | -1 | 0% | Risk/reward |
| +1 | -1 | 15% | Neutral |
| +2 | +1 | 30% | Growth gate |
| +1 | -2 | 45% | Risky |
| +2 | -1 | 60% | Late growth |
| +3 | -2 | 75% | Big risk/reward, rare |

No multiply or divide gates. Max single gain is +3. Average +1.5 per gate → player grows from 1 to 5-7 units by boss time. Bad luck → 3-4. Good luck → 7-8.

## 2. Unit Upgrade System — Removed

**Delete from GameConfig.ts:**
- `UNIT_MAX_LEVEL`
- `UNIT_KILLS_TO_LEVEL`
- `UNIT_FIRE_RATE_MULT`
- `UNIT_DAMAGE_MULT`
- `UNIT_LEVEL_TINT`
- `UNIT_LEVEL_SCALE`

**Strip from PlayerUnit.ts:**
- `unitLevel`, `kills` properties
- `addKill()`, `resetLevel()`, `applyLevelVisuals()` methods
- Kill tracking and level-up logic
- Units always render at base scale (`1.5 * ENTITY_SCALE / SVG_RENDER_SCALE`) with no tint

**Strip from GameScene.ts:**
- `awardKillToUnit()` method
- `showLevelUpEffect()` method
- All kill-to-unit routing in the bullet collision section

**Strip from BossScene.ts:**
- `unitLevels` array in BossSceneData and create()
- `getEffectivePower()` method — replace with raw `this.activeUnitCount`
- HP scaling: use `unitCount` instead of `effectivePower`

**Strip from HUDScene.ts:**
- `effectivePower` property
- The `effectivePower > unitCount` conditional display in update()

## 3. Starting Units

Keep at 1. The shop "+3 UNITS" boost (50g) lets players start at 4.

## 4. Enemy Tuning

No changes. Difficulty controlled by unit count + weapon progression + wave density.

## 5. Boss HP Scaling

Simplify formula: `Math.max(1, unitCount / 30) * baseHp`. With 5-7 units this produces low scaling. Remove `effectivePower` from BossSceneData interface.

## 6. Shop / Gold

No changes to shop items, prices, or gold earning rates.

## 7. Files Changed

| File | Change |
|------|--------|
| `GameConfig.ts` | `GATE_INTERVAL` 500→800, delete 6 upgrade constants |
| `LevelGenerator.ts` | Replace gate templates (no multiply/divide, smaller values) |
| `PlayerUnit.ts` | Remove upgrade system |
| `GameScene.ts` | Remove kill routing, level-up effects |
| `BossScene.ts` | Remove unitLevels/effectivePower, simplify HP scaling |
| `HUDScene.ts` | Remove effectivePower display |
