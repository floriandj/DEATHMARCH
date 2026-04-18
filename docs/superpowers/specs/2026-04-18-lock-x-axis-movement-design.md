# Lock player movement to the X axis

## Goal
Player input should only steer the army left/right. The army continues to auto-march forward. Remove all Y-axis input: keyboard (W/S + up/down), joystick vertical, and the vertical joystick thumb animation.

## Non-goals
- Don't change auto-march speed, camera follow, or combat.
- Don't rip out `armyYOffset` — it's read by rendering/hit-position code in `GameScene.ts:695` and `BossScene.ts:681, 728, 756, 840`. Leaving it at its current zero default keeps those call sites working without a wider refactor.

## Changes

### `src/systems/InputHandler.ts`
- Remove `offsetY`, `targetOffsetY`, `getNormalizedY`, `getKeyboardY`.
- Remove W/S key registrations and up/down cursor handling.
- `keyboardActive` checks X only.
- `pointerdown`/`pointermove` stop computing/storing `rawY`.
- Joystick thumb is drawn at `baseY` (fixed Y); `drawJoystick` signature drops the `normY` parameter.
- `update()` no longer lerps Y.
- `destroy()` no longer touches Y state.

### `src/scenes/GameScene.ts`
- Delete lines 256-258 (the three `normalizedY`/`armyYOffset` lines).
- Remove now-unused imports: `ARMY_INPUT_Y_RANGE`, `ARMY_Y_OFFSET_FORWARD_MAX`, `ARMY_Y_OFFSET_BACK_MAX`, `ARMY_VERTICAL_SPEED`.
- Keep the `armyYOffset` field (still read at line 695 for rendering); it will remain 0.

### `src/scenes/BossScene.ts`
- Delete lines 203-205 (same block).
- Remove the same now-unused imports.
- Keep `armyYOffset` field (still read at multiple render sites).

### `src/config/GameConfig.ts`
- Leave constants in place if no longer imported anywhere — they're cheap and keep the diff minimal. If `tsc --noEmit` warns on unused imports at call sites, remove those imports. The constants themselves stay (they may be useful if the Y control is ever restored; deletion can be a follow-up).

## Verification
- `npm run build` passes (type-check + vite build).
- Manual test in browser at dev-server URL: army moves left/right with joystick/A/D/←/→; W/S and up/down do nothing; joystick thumb slides only horizontally.
