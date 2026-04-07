# DEATHMARCH Visual Overhaul — Design Spec

**Date:** 2026-04-07
**Goal:** Transform DEATHMARCH from pixel-art rectangles to polished Clash-of-Clans-style 2D cartoon graphics. Pure visual layer upgrade — zero gameplay changes.

---

## 1. Art Style

All SVGs follow a consistent CoC-style cartoon language:

- **Rounded shapes** — `<ellipse>`, `<circle>`, `<path>` with bezier curves instead of `<rect>`
- **Gradient shading** — `<linearGradient>` for bodies/armor (light from top-left), `<radialGradient>` for glows and energy effects
- **Bold dark outlines** — 2-3px stroke around all major shapes for readability at small sizes
- **Highlight/shadow layers** — bright highlight on top surfaces, darker undersides
- **Expressive faces** — big eyes with shine dots, exaggerated proportions (big heads, chunky bodies)
- **2-frame spritesheets** preserved — frame 0 (idle), frame 1 (action), same layout as current

### Color Philosophy

- **Player units:** Cool blues/teals with silver armor accents — heroic, clean
- **Enemies:** Distinct warm/dark palettes per type — reds, purples, sickly greens
- **Bosses:** Larger detail, glowing energy cores, ornate armor
- **Weapons:** Metallic gradients with color-coded energy accents per tier

---

## 2. Sprite Breakdown

### Player Unit (`unit.svg` — 40x20, 2 frames of 20x20)

- Armored soldier with rounded helmet, visor slit with inner glow
- Chest plate with small emblem, chunky gauntlets and boots
- Weapon held at side; frame 1 has arm swing and muzzle flash hint

### Enemies (17 types)

Each keeps its existing sprite dimensions (frameSize = size * 2 per EnemyConfig).

| Tier | Types | Visual Style |
|------|-------|-------------|
| Fodder | goblin, rat_swarm, ashwalker | Small, scrappy, minimal armor |
| Standard | orc, berserker, frostbite, blighted, spore_carrier | Medium build, some armor/weapons |
| Elite | troll, demon, hellhound, banshee, ice_golem, yeti | Large, imposing, elemental effects |
| Boss-tier | shadow_knight, warlock, void_weaver, archfiend, abomination | Heavy armor, glowing elements, complex silhouettes |

### Bosses (6 sprites — all 176x88, 2 frames)

| Sprite | Theme |
|--------|-------|
| `boss.svg` | Demon king — crown, energy core, spiked armor |
| `boss_frost.svg` | Ice titan — crystalline armor, frost aura |
| `boss_gorath.svg` | War beast — heavy plate, molten cracks |
| `boss_inferno.svg` | Fire demon — flame wings, lava veins |
| `boss_lich.svg` | Undead sorcerer — floating robes, soul orbs |
| `boss_plague.svg` | Bloated horror — toxic clouds, pustules |

### Weapons (11 icons — loaded as images, not spritesheets)

Metallic bodies with gradient shading. Color-coded energy per tier:
- pistol (white/grey), smg (light blue), ar (blue), lmg (green), minigun (dark green)
- cryo (ice blue), railgun (electric blue), plasma (magenta), flamer (orange/red)
- voidbeam (purple), godslayer (gold/purple)

Consistent silhouette: barrel pointing left, grip on right.

### Other Sprites

- `bullet.svg` — Glowing energy projectile with radial gradient trail
- `death_particle.svg` — Bright spark with radial gradient fade-out
- `gold_pouch.svg` — Cloth sack with coins spilling out, tied with rope

---

## 3. Rendering & Effects Upgrades

### Drop Shadows

- Generate an elliptical shadow texture in BootScene (`generateVfxTextures`)
- Attach as child sprite beneath every unit, enemy, and boss entity
- Semi-transparent (alpha 0.3), scales with entity size
- Implementation: add shadow sprite creation in GameScene/BossScene where entities spawn

### Gate Textures (BootScene `generateGateTextures`)

- **Multiply gate:** Beveled green panel with inner glow, "x" icon in center
- **Add gate:** Beveled blue panel with inner glow, "+" icon in center
- **Subtract gate:** Beveled red panel with danger stripes, "-" icon in center
- **Boss gate:** Wide ominous banner with skull icon, pulsing glow
- All gates get a 3D bevel effect (lighter top edge, darker bottom edge)

### VFX Textures (BootScene `generateVfxTextures`)

- `vfx_spark` — Radial gradient white-to-transparent (currently solid 3px rect)
- `vfx_ring` — Actual ring/donut shape with gradient
- `vfx_trail` — Elongated teardrop with glow
- `vfx_burst` — Star/cross shape with radial fade

### Background Overhaul (`Background.ts`)

- Load small decoration SVGs (trees, rocks, bushes) as sprites in BootScene
- Place decoration sprites in chunks alongside procedural terrain
- Themed decorations per world: dead trees (plague), ice crystals (frost), lava rocks (inferno)
- Ambient particle emitter per theme: floating dust, embers, snowflakes, spores
- Path/road markings down center to guide the eye
- Richer ground variation with more color depth

### Bullet Trails

- Add short particle trail emitter attached to each active bullet
- Use pooled emitters (reuse from BulletPool) to avoid GC spikes
- Trail color matches weapon energy color

---

## 4. UI Redesign

### MenuScene

- **Background:** Subtle dark textured pattern (generated via graphics, not external image)
- **Title "DEATHMARCH":** Metallic gold gradient text with red glow behind it, larger and more stylized
- **Level nodes:** Ornate circular frames with icon badges (sword for normal, skull for boss levels)
- **World banners:** Ribbon/banner shapes replacing plain pills
- **Play button:** 3D beveled look with stronger gradient, glow pulse animation
- **Header/footer panels:** Gold trim accents, subtle ornate borders
- **Score/gold pills:** Shield-shaped frames instead of rounded rects

### HUDScene

- **Top bar:** Beveled dark panel with gold trim line
- **Unit count:** Shield-shaped badge frame with soldier icon
- **Score:** Star-shaped badge frame
- **Weapon display:** Circular frame with tier-colored glowing border
- **Kill streak indicator:** Fiery text with scale-up animation on combo

### GameOverScene

- **Victory/defeat banner:** Ribbon banner at top with metallic text
- **Stats:** Individual card panels with icons (distance, kills, gold, units survived)
- **Buttons:** Same 3D beveled treatment as menu play button
- **Background:** Dark vignette overlay for focus

### SettingsScene

- Consistent dark panel styling matching other scenes
- Polished pill-switch toggles
- Section headers with ornate divider lines

### SplashScene

- Stylized logo with metallic gradient treatment
- Floating particle background (embers/dust)
- Subtle fade-in animation

---

## 5. Files Changed

### SVG Replacements (41 files — art only, no dimension changes)

All files in `public/assets/sprites/`:
- `unit.svg`
- 17 enemy SVGs (`enemy_*.svg`)
- 6 boss SVGs (`boss.svg`, `boss_*.svg`)
- 11 weapon SVGs (`weapon_*.svg`)
- `bullet.svg`, `death_particle.svg`, `gold_pouch.svg`

New decoration SVGs added to `public/assets/sprites/`:
- `decor_tree.svg`, `decor_rock.svg`, `decor_bush.svg` (small, simple, themed neutral)

### Code Changes

| File | Changes |
|------|---------|
| `BootScene.ts` | Load decoration sprites, generate improved gate/VFX/shadow textures |
| `Background.ts` | Decoration sprites, ambient particles, richer terrain, road markings |
| `GameScene.ts` | Attach shadow sprites to entities, bullet trail emitters |
| `BossScene.ts` | Shadow treatment for boss and units |
| `MenuScene.ts` | Full UI redesign |
| `HUDScene.ts` | Redesigned layout with ornate frames |
| `GameOverScene.ts` | Card-based results, ribbon banner, vignette |
| `SettingsScene.ts` | Visual consistency pass |
| `SplashScene.ts` | Logo treatment, particle background |

### Files NOT Changed

- Entity classes: `Army.ts`, `Boss.ts`, `Bullet.ts`, `Enemy.ts`, `Gate.ts`, `PlayerUnit.ts`, `WeaponCrate.ts`
- Systems: `ObjectPool.ts`, `BulletPool.ts`, `WaveSpawner.ts`, `GateSpawner.ts`, `InputHandler.ts`, `IsoHelper.ts`, `ProceduralEnemy.ts`, `SoundManager.ts`, `WakeLock.ts`, `WalletManager.ts`
- Config: `GameConfig.ts`, `EnemyConfig.ts`, `WeaponConfig.ts`
- Progression: `LevelManager.ts`, `LevelGenerator.ts`, level JSONs
- `main.ts`, `pwa.ts`

---

## 6. Constraints

- All SVGs maintain their existing viewBox dimensions and frame layout
- No changes to `frameWidth`/`frameHeight` in BootScene sprite loading
- No changes to animation frame indices
- No gameplay logic changes whatsoever
- Performance budget: stay within ~300 active entities, 60 FPS mobile
- Ambient particles must be lightweight (max 20-30 particles on screen)
- Decoration sprites pooled/chunked same as background
