# Pixel Sprite Replacement — Design

**Date:** 2026-04-24
**Status:** Approved, ready for implementation plan
**Scope:** Replace all 42 SVG assets with cohesive pixel-art sprites from CC0 packs; keep bullet/particle/gold procedural.

## 1. Sources & licenses

| Asset group | Pack | License | URL |
|---|---|---|---|
| Characters (player, 19 enemies, 6 bosses) | 0x72 Dungeon Tileset II | CC0 | https://0x72.itch.io/dungeontileset-ii |
| Weapon icons (11) | Kenney Game Icons | CC0 | https://kenney.nl/assets/game-icons |
| Decor (tree, rock, bush) | Kenney Tiny Dungeon | CC0 | https://kenney.nl/assets/tiny-dungeon |
| Bullet, death particle, gold pouch | Keep procedural (BootScene graphics) | — | — |

Both CC0. Courtesy credit line added to README: "Sprites by 0x72 (CC0) and Kenney (CC0)."

## 2. File layout

```
public/assets/
├── sprites/            # legacy SVGs — deleted at end of rollout
└── sprites-pixel/
    ├── characters.png  # 0x72 atlas (~40KB, single packed PNG)
    ├── characters.json # Phaser atlas JSON (named frames)
    ├── weapons/        # 11 Kenney icon PNGs
    └── decor/          # 3 Kenney tile PNGs
```

Rationale for atlas: 0x72 ships one packed PNG with ~120 frames. One atlas = one HTTP fetch, one GPU texture, all frames addressable by name.

## 3. Loading strategy

`BootScene.preload()` replaces ~25 `load.spritesheet()` calls with a single `load.atlas()` call plus image loads for weapons/decor. In `create()`, the characters texture is set to `Phaser.Textures.FilterMode.NEAREST` — required for crisp pixel art at non-1× scale.

`SVG_RENDER_SCALE = 4` (GameConfig.ts) is removed. It existed solely to rasterize SVGs at a large fixed size; PNGs load at native resolution and scale is applied at display time via `setScale()`.

## 4. Atlas generation

One-off Node script committed at `scripts/build-atlas.ts` that reads the 0x72 source PNG (16×16 grid of frames), maps grid cells to named frames (e.g. `goblin_idle_0` … `goblin_run_3`), and emits `characters.json` in Phaser's atlas format. Committed so regeneration is reproducible.

## 5. Sprite-to-entity mapping

### Enemies (19 → 0x72)

Base sprite per archetype. Per-world tinting in ProceduralEnemy.ts is unchanged — same sprite recolors for goblin / infernal / frost / plague / ash worlds.

| Current type | 0x72 base | Tier |
|---|---|---|
| goblin | goblin | 0 |
| rat_swarm | tiny_zombie | 0 |
| frostbite | imp | 0 |
| hellhound | swampy | 0 |
| ashwalker | skeleton | 0 |
| orc | orc_warrior | 1 |
| berserker | masked_orc | 1 |
| banshee | wogol | 1 |
| blighted | zombie | 1 |
| void_weaver | necromancer | 1 |
| troll | muddy | 2 |
| warlock | ice_zombie | 2 |
| yeti | pumpkin | 2 |
| spore_carrier | lizard | 2 |
| shadow_knight | chort | 2 |
| demon | big_demon | 3 |
| ice_golem | big_zombie | 3 |
| abomination | ogre | 3 |
| archfiend | big_demon (reused + alt tint) | 3 |

### Bosses (6 → scaled 0x72 + tint)

Bosses render at `setScale(2)` vs enemy `setScale(1)`; same atlas frames, larger display size.

| Boss | 0x72 base | Tint |
|---|---|---|
| boss_gorath | ogre | default |
| boss_inferno | big_demon | 0xff3300 |
| boss_frost | big_zombie | 0x88ccff |
| boss_plague | big_zombie | 0x66aa44 |
| boss_lich | necromancer | 0xaa66ff |
| boss (legacy) | big_demon | default |

### Weapon icons (11 → Kenney Game Icons)

Kenney has ~3 "gun" icons; sci-fi weapons share a base + runtime tint.

| Weapon | Kenney icon | Tint |
|---|---|---|
| pistol | pistol.png | default |
| smg | smg.png | default |
| ar | machineGun.png | default |
| lmg | machineGun.png | 0xccaa66 |
| minigun | machineGun.png | 0x888888 |
| flamer | flame.png | default |
| cryo | freeze.png | default |
| railgun | laserGun.png | default |
| plasma | laserGun.png | 0x00ccff |
| voidbeam | laserGun.png | 0xaa66ff |
| godslayer | laserGun.png | 0xffcc33 |

### Decor (3 → 1:1)

`decor_tree` / `decor_rock` / `decor_bush` → matching Kenney Tiny Dungeon tiles.

## 6. Animation model

Each character gets two animations:
- `<name>_idle` — 4 frames @ 6 fps, loop
- `<name>_run` — 4 frames @ 10 fps, loop

Enemy.ts switches between them based on velocity (already tracked). Bosses use `_idle` during pre-fight banner, `_run` when advancing.

Current 2-frame unit_march becomes 4-frame `knight_m_run`.

## 7. Code touch list

- `src/scenes/BootScene.ts` — atlas load, NEAREST filter, anim creation loop over frame names
- `src/systems/ProceduralEnemy.ts` — `SPRITE_POOL` / `TIER_SPRITES` retargeted to 0x72 frame names
- `src/entities/Enemy.ts` — texture becomes `'characters'`, frame becomes `<base>_idle_0` etc.; idle↔run swap on velocity threshold
- `src/entities/Boss.ts` — same atlas pattern, `setScale(2)`, tint per boss
- `src/entities/PlayerUnit.ts` — `knight_m` frames
- `src/config/GameConfig.ts` — remove `SVG_RENDER_SCALE`
- `src/scenes/MenuScene.ts` / `src/scenes/PerkSelectScene.ts` — new weapon icon paths

## 8. Testing

- Existing pure-logic tests untouched (ObjectPool, Army, Boss state machine, GateSpawner, WaveSpawner, IsoHelper).
- New smoke test: every procedural enemy `spriteBase` maps to a frame present in the generated `characters.json` (prevents silent missing-frame regressions when mapping table drifts).

## 9. Rollout

1. Land atlas + new code on `main` behind new asset paths.
2. Verify in dev build — all 5 world cycles play, bosses spawn, weapon icons render in menu/perk UI.
3. Delete `public/assets/sprites/*.svg` in the same commit that flips the last SVG reference.
4. README credit line added.

## 10. Risks

- **Itch.io direct download may require click-through.** Fallback: user downloads 0x72 pack manually and drops into `public/assets/sprites-pixel/` as `characters.png`; build-atlas.ts regenerates JSON.
- **0x72 frames aren't perfectly uniform.** Most are 16×16, some are 16×28 (tall creatures) and bosses are 32×36. Atlas JSON handles this; no code assumption on frame size.
- **Pixel art look is an aesthetic shift** from the current clean vector. Accepted explicitly by user.
- **Gate textures stay procedural** — they're drawn in BootScene.generateGateTextures and aren't SVGs. Out of scope.
