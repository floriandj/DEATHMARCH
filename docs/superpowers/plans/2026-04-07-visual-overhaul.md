# Visual Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform DEATHMARCH from pixel-art rectangles to polished Clash-of-Clans-style 2D cartoon graphics with enhanced rendering effects and redesigned UI.

**Architecture:** Drop-in SVG replacements for all 41 sprite files (same dimensions/frame layout), enhanced procedural textures in BootScene, shadow/trail rendering in GameScene/BossScene, and full UI redesign of all 5 scene files. Zero gameplay logic changes.

**Tech Stack:** Phaser 3, SVG with gradients/curves/paths, Phaser Graphics API for procedural textures, Phaser particle emitters for ambient effects.

---

## File Map

**SVG replacements (same dimensions, new art):**
- `public/assets/sprites/unit.svg` — 40x20 (2 frames of 20x20)
- `public/assets/sprites/enemy_goblin.svg` — 48x24 (2 frames of 24x24, size=12)
- `public/assets/sprites/enemy_orc.svg` — 64x32 (2 frames of 32x32, size=16)
- `public/assets/sprites/enemy_troll.svg` — 88x44 (2 frames of 44x44, size=22)
- `public/assets/sprites/enemy_demon.svg` — 64x32 (2 frames of 32x32, size=16)
- `public/assets/sprites/enemy_berserker.svg` — 56x28 (2 frames of 28x28, size=14)
- `public/assets/sprites/enemy_hellhound.svg` — 52x26 (2 frames of 26x26, size=13)
- `public/assets/sprites/enemy_warlock.svg` — 60x30 (2 frames of 30x30, size=15)
- `public/assets/sprites/enemy_frostbite.svg` — 44x22 (2 frames of 22x22, size=11)
- `public/assets/sprites/enemy_ice_golem.svg` — 104x52 (2 frames of 52x52, size=26)
- `public/assets/sprites/enemy_banshee.svg` — 52x26 (2 frames of 26x26, size=13)
- `public/assets/sprites/enemy_yeti.svg` — 96x48 (2 frames of 48x48, size=24)
- `public/assets/sprites/enemy_rat_swarm.svg` — 40x20 (2 frames of 20x20, size=10)
- `public/assets/sprites/enemy_blighted.svg` — 72x36 (2 frames of 36x36, size=18)
- `public/assets/sprites/enemy_spore_carrier.svg` — 80x40 (2 frames of 40x40, size=20)
- `public/assets/sprites/enemy_abomination.svg` — 112x56 (2 frames of 56x56, size=28)
- `public/assets/sprites/enemy_shadow_knight.svg` — 72x36 (2 frames of 36x36, size=18)
- `public/assets/sprites/enemy_ashwalker.svg` — 56x28 (2 frames of 28x28, size=14)
- `public/assets/sprites/enemy_void_weaver.svg` — 48x24 (2 frames of 24x24, size=12)
- `public/assets/sprites/enemy_archfiend.svg` — 112x56 (2 frames of 56x56, size=28)
- `public/assets/sprites/boss.svg` — 176x88 (2 frames of 88x88)
- `public/assets/sprites/boss_frost.svg` — 176x88
- `public/assets/sprites/boss_gorath.svg` — 176x88
- `public/assets/sprites/boss_inferno.svg` — 176x88
- `public/assets/sprites/boss_lich.svg` — 176x88
- `public/assets/sprites/boss_plague.svg` — 176x88
- `public/assets/sprites/weapon_pistol.svg` — weapon icon
- `public/assets/sprites/weapon_smg.svg`
- `public/assets/sprites/weapon_ar.svg`
- `public/assets/sprites/weapon_lmg.svg`
- `public/assets/sprites/weapon_minigun.svg`
- `public/assets/sprites/weapon_cryo.svg`
- `public/assets/sprites/weapon_railgun.svg`
- `public/assets/sprites/weapon_plasma.svg`
- `public/assets/sprites/weapon_flamer.svg`
- `public/assets/sprites/weapon_voidbeam.svg`
- `public/assets/sprites/weapon_godslayer.svg`
- `public/assets/sprites/bullet.svg`
- `public/assets/sprites/death_particle.svg`
- `public/assets/sprites/gold_pouch.svg`

**New SVG files:**
- `public/assets/sprites/decor_tree.svg` — small decoration tree
- `public/assets/sprites/decor_rock.svg` — small decoration rock
- `public/assets/sprites/decor_bush.svg` — small decoration bush

**Code modifications:**
- `src/scenes/BootScene.ts` — enhanced gate/VFX textures, shadow texture, load decoration sprites
- `src/systems/Background.ts` — richer terrain, decoration sprites, ambient particles
- `src/scenes/GameScene.ts` — shadow sprites on entities
- `src/scenes/BossScene.ts` — shadow sprites on boss/units
- `src/scenes/SplashScene.ts` — full visual redesign
- `src/scenes/MenuScene.ts` — full visual redesign
- `src/scenes/HUDScene.ts` — full visual redesign
- `src/scenes/GameOverScene.ts` — full visual redesign
- `src/scenes/SettingsScene.ts` — visual consistency pass

---

## SVG Art Style Guide

Every SVG in this overhaul follows these rules:

1. **Rounded shapes** — use `<ellipse>`, `<circle>`, `<path>` with bezier curves. No pixel-art `<rect>` grids.
2. **`<defs>` block with gradients** — each sprite defines `<linearGradient>` (body shading, light from top-left) and `<radialGradient>` (glows, energy). IDs must be unique per SVG (prefix with entity name, e.g. `id="unit-body-grad"`).
3. **Bold dark outlines** — 2-3px `stroke` on major shape groups using `<g stroke="#1a1a2e" stroke-width="2">`.
4. **Highlight layer** — a semi-transparent white/light shape on top surfaces for specular shine.
5. **Shadow layer** — darker color on bottom/underside of forms.
6. **Expressive proportions** — big heads (~40% of height), chunky bodies, oversized hands/weapons.
7. **`shape-rendering="geometricPrecision"`** — smooth anti-aliased edges (replaces `crispEdges`).
8. **2-frame spritesheets** — frame 0 on left half, frame 1 on right half, separated by `<g transform="translate(frameWidth, 0)">`.

---

## Task 1: Player Unit SVG

**Files:**
- Replace: `public/assets/sprites/unit.svg`

- [ ] **Step 1: Create the polished player unit SVG**

Replace `public/assets/sprites/unit.svg` with a CoC-style armored soldier. viewBox="0 0 40 20", width=40, height=20. Frame 0 (x=0..19) standing, Frame 1 (x=20..39) mid-step.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 20" width="40" height="20" shape-rendering="geometricPrecision">
  <defs>
    <linearGradient id="unit-armor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4fc3f7"/>
      <stop offset="100%" stop-color="#0277bd"/>
    </linearGradient>
    <linearGradient id="unit-helm" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#b0bec5"/>
      <stop offset="100%" stop-color="#546e7a"/>
    </linearGradient>
    <radialGradient id="unit-visor" cx="0.5" cy="0.3" r="0.5">
      <stop offset="0%" stop-color="#80deea"/>
      <stop offset="100%" stop-color="#00838f"/>
    </radialGradient>
  </defs>
  <!-- Frame 0: standing -->
  <g transform="translate(0,0)">
    <g stroke="#1a1a2e" stroke-width="1.2" stroke-linejoin="round">
      <!-- Shadow base -->
      <ellipse cx="10" cy="19" rx="6" ry="1.5" fill="#000" opacity="0.2" stroke="none"/>
      <!-- Boots -->
      <ellipse cx="7" cy="17.5" rx="3" ry="2" fill="#37474f"/>
      <ellipse cx="13" cy="17.5" rx="3" ry="2" fill="#37474f"/>
      <!-- Legs -->
      <rect x="5.5" y="13" width="3.5" height="5" rx="1.5" fill="#1565c0"/>
      <rect x="11" y="13" width="3.5" height="5" rx="1.5" fill="#1565c0"/>
      <!-- Torso -->
      <path d="M5,7 Q5,5 7,5 L13,5 Q15,5 15,7 L15,13 Q15,14 14,14 L6,14 Q5,14 5,13 Z" fill="url(#unit-armor)"/>
      <!-- Belt -->
      <rect x="5" y="12" width="10" height="1.8" rx="0.5" fill="#ffd54f"/>
      <!-- Chest emblem -->
      <circle cx="10" cy="9" r="1.8" fill="#ffd54f" opacity="0.7" stroke="none"/>
      <!-- Arms -->
      <rect x="3" y="6" width="2.5" height="6" rx="1.2" fill="url(#unit-armor)"/>
      <rect x="14.5" y="6" width="2.5" height="6" rx="1.2" fill="url(#unit-armor)"/>
      <!-- Hands -->
      <circle cx="4.2" cy="12.5" r="1.3" fill="#ffcc80"/>
      <circle cx="15.8" cy="12.5" r="1.3" fill="#ffcc80"/>
      <!-- Helmet -->
      <path d="M6,1 Q6,0 10,0 Q14,0 14,1 L14,5 Q14,6 10,6 Q6,6 6,5 Z" fill="url(#unit-helm)"/>
      <!-- Visor -->
      <rect x="7" y="3" width="6" height="2" rx="1" fill="url(#unit-visor)"/>
      <!-- Helmet highlight -->
      <path d="M7,1 Q10,0.5 13,1 L13,2 Q10,1.5 7,2 Z" fill="#fff" opacity="0.3" stroke="none"/>
      <!-- Weapon -->
      <rect x="15.5" y="3" width="1.5" height="6" rx="0.5" fill="#78909c"/>
      <rect x="15" y="2" width="2.5" height="1.5" rx="0.5" fill="#90a4ae"/>
    </g>
  </g>
  <!-- Frame 1: mid-step -->
  <g transform="translate(20,0)">
    <g stroke="#1a1a2e" stroke-width="1.2" stroke-linejoin="round">
      <ellipse cx="10" cy="19" rx="6" ry="1.5" fill="#000" opacity="0.2" stroke="none"/>
      <!-- Boots (stride) -->
      <ellipse cx="6" cy="17" rx="3" ry="2" fill="#37474f"/>
      <ellipse cx="14" cy="18.5" rx="3" ry="1.5" fill="#37474f"/>
      <!-- Legs (stride) -->
      <rect x="4.5" y="12.5" width="3.5" height="5" rx="1.5" fill="#1565c0" transform="rotate(-8,6,15)"/>
      <rect x="12" y="14" width="3.5" height="5" rx="1.5" fill="#1565c0" transform="rotate(8,14,16)"/>
      <!-- Torso -->
      <path d="M5,7 Q5,5 7,5 L13,5 Q15,5 15,7 L15,13 Q15,14 14,14 L6,14 Q5,14 5,13 Z" fill="url(#unit-armor)"/>
      <rect x="5" y="12" width="10" height="1.8" rx="0.5" fill="#ffd54f"/>
      <circle cx="10" cy="9" r="1.8" fill="#ffd54f" opacity="0.7" stroke="none"/>
      <!-- Arms (swinging) -->
      <rect x="2" y="7" width="2.5" height="5.5" rx="1.2" fill="url(#unit-armor)" transform="rotate(10,3,9)"/>
      <rect x="15.5" y="5" width="2.5" height="5.5" rx="1.2" fill="url(#unit-armor)" transform="rotate(-10,17,8)"/>
      <circle cx="3.5" cy="13" r="1.3" fill="#ffcc80"/>
      <circle cx="16.5" cy="10.5" r="1.3" fill="#ffcc80"/>
      <!-- Helmet -->
      <path d="M6,1 Q6,0 10,0 Q14,0 14,1 L14,5 Q14,6 10,6 Q6,6 6,5 Z" fill="url(#unit-helm)"/>
      <rect x="7" y="3" width="6" height="2" rx="1" fill="url(#unit-visor)"/>
      <path d="M7,1 Q10,0.5 13,1 L13,2 Q10,1.5 7,2 Z" fill="#fff" opacity="0.3" stroke="none"/>
      <!-- Weapon (angled) -->
      <rect x="16" y="1.5" width="1.5" height="6" rx="0.5" fill="#78909c" transform="rotate(-15,17,4)"/>
      <rect x="15.5" y="0.5" width="2.5" height="1.5" rx="0.5" fill="#90a4ae" transform="rotate(-15,17,1)"/>
    </g>
  </g>
</svg>
```

- [ ] **Step 2: Verify the sprite loads correctly**

Run: `npm run build`
Expected: Build succeeds with no errors. The SVG is loaded as a spritesheet in BootScene with frameWidth=20, frameHeight=20.

- [ ] **Step 3: Commit**

```bash
git add public/assets/sprites/unit.svg
git commit -m "art: replace player unit with polished cartoon SVG"
```

---

## Task 2: Fodder Enemy SVGs (goblin, rat_swarm, ashwalker, frostbite)

**Files:**
- Replace: `public/assets/sprites/enemy_goblin.svg` (48x24, frames 24x24)
- Replace: `public/assets/sprites/enemy_rat_swarm.svg` (40x20, frames 20x20)
- Replace: `public/assets/sprites/enemy_ashwalker.svg` (56x28, frames 28x28)
- Replace: `public/assets/sprites/enemy_frostbite.svg` (44x22, frames 22x22)

Each SVG follows the art style guide. All enemies get:
- Menacing eyes with glow
- Rounded body shapes with gradient fills
- Dark outlines
- 2 animation frames (idle + attack/walk)
- `shape-rendering="geometricPrecision"`

- [ ] **Step 1: Create enemy_goblin.svg**

Small green-skinned creature with big ears, yellow eyes, crude dagger. viewBox="0 0 48 24".

Frame 0 (hunched idle), Frame 1 (lunging forward). Use green body gradient (`#66bb6a` → `#2e7d32`), yellow eyes with red pupil dots, jagged teeth, scrawny arms with claws.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 24" width="48" height="24" shape-rendering="geometricPrecision">
  <defs>
    <linearGradient id="gob-body" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#66bb6a"/>
      <stop offset="100%" stop-color="#2e7d32"/>
    </linearGradient>
    <radialGradient id="gob-eye" cx="0.5" cy="0.4" r="0.5">
      <stop offset="0%" stop-color="#ffee58"/>
      <stop offset="100%" stop-color="#f9a825"/>
    </radialGradient>
  </defs>
  <!-- Frame 0 -->
  <g>
    <g stroke="#1a1a2e" stroke-width="1" stroke-linejoin="round">
      <ellipse cx="12" cy="23" rx="7" ry="1.5" fill="#000" opacity="0.2" stroke="none"/>
      <!-- Feet -->
      <ellipse cx="8" cy="21.5" rx="3.5" ry="2" fill="#1b5e20"/>
      <ellipse cx="16" cy="21.5" rx="3.5" ry="2" fill="#1b5e20"/>
      <!-- Legs -->
      <rect x="6.5" y="16" width="3.5" height="6" rx="1.5" fill="url(#gob-body)"/>
      <rect x="14" y="16" width="3.5" height="6" rx="1.5" fill="url(#gob-body)"/>
      <!-- Body (hunched) -->
      <ellipse cx="12" cy="13" rx="7" ry="5" fill="url(#gob-body)"/>
      <!-- Belly highlight -->
      <ellipse cx="12" cy="12" rx="4" ry="3" fill="#81c784" opacity="0.4" stroke="none"/>
      <!-- Arms -->
      <path d="M4,10 Q2,12 3,15" stroke-width="2.5" fill="none" stroke="#43a047"/>
      <path d="M20,10 Q22,12 21,15" stroke-width="2.5" fill="none" stroke="#43a047"/>
      <!-- Claws -->
      <circle cx="3" cy="15.5" r="1.2" fill="#a5d6a7"/>
      <circle cx="21" cy="15.5" r="1.2" fill="#a5d6a7"/>
      <!-- Head (big) -->
      <ellipse cx="12" cy="6" rx="8" ry="6" fill="url(#gob-body)"/>
      <!-- Ears -->
      <path d="M3,5 Q1,2 4,4" fill="#43a047" stroke-width="1.5"/>
      <path d="M21,5 Q23,2 20,4" fill="#43a047" stroke-width="1.5"/>
      <!-- Eyes -->
      <ellipse cx="9" cy="5.5" rx="2.2" ry="2" fill="url(#gob-eye)"/>
      <ellipse cx="15" cy="5.5" rx="2.2" ry="2" fill="url(#gob-eye)"/>
      <circle cx="9.5" cy="5.5" r="1" fill="#d32f2f"/>
      <circle cx="15.5" cy="5.5" r="1" fill="#d32f2f"/>
      <circle cx="9.2" cy="5" r="0.4" fill="#fff" stroke="none"/>
      <circle cx="15.2" cy="5" r="0.4" fill="#fff" stroke="none"/>
      <!-- Mouth -->
      <path d="M8,9 Q12,11 16,9" fill="#1b5e20" stroke-width="0.8"/>
      <rect x="9.5" y="8.5" width="1" height="1.5" rx="0.3" fill="#e0e0e0" stroke="none"/>
      <rect x="13.5" y="8.5" width="1" height="1.5" rx="0.3" fill="#e0e0e0" stroke="none"/>
    </g>
  </g>
  <!-- Frame 1 -->
  <g transform="translate(24,0)">
    <g stroke="#1a1a2e" stroke-width="1" stroke-linejoin="round">
      <ellipse cx="12" cy="23" rx="7" ry="1.5" fill="#000" opacity="0.2" stroke="none"/>
      <ellipse cx="6" cy="21" rx="3.5" ry="2" fill="#1b5e20"/>
      <ellipse cx="17" cy="22" rx="3.5" ry="1.5" fill="#1b5e20"/>
      <rect x="4.5" y="15.5" width="3.5" height="6" rx="1.5" fill="url(#gob-body)" transform="rotate(-10,6,18)"/>
      <rect x="15" y="17" width="3.5" height="6" rx="1.5" fill="url(#gob-body)" transform="rotate(10,17,19)"/>
      <ellipse cx="12" cy="13" rx="7" ry="5" fill="url(#gob-body)"/>
      <ellipse cx="12" cy="12" rx="4" ry="3" fill="#81c784" opacity="0.4" stroke="none"/>
      <!-- Arms (reaching forward) -->
      <path d="M4,9 Q1,11 2,14" stroke-width="2.5" fill="none" stroke="#43a047"/>
      <path d="M20,9 Q23,10 22,13" stroke-width="2.5" fill="none" stroke="#43a047"/>
      <circle cx="2" cy="14.5" r="1.2" fill="#a5d6a7"/>
      <circle cx="22" cy="13.5" r="1.2" fill="#a5d6a7"/>
      <!-- Head -->
      <ellipse cx="12" cy="5.5" rx="8" ry="6" fill="url(#gob-body)"/>
      <path d="M3,4.5 Q1,1.5 4,3.5" fill="#43a047" stroke-width="1.5"/>
      <path d="M21,4.5 Q23,1.5 20,3.5" fill="#43a047" stroke-width="1.5"/>
      <!-- Eyes (wider, aggressive) -->
      <ellipse cx="9" cy="5" rx="2.5" ry="2.2" fill="url(#gob-eye)"/>
      <ellipse cx="15" cy="5" rx="2.5" ry="2.2" fill="url(#gob-eye)"/>
      <circle cx="10" cy="5" r="1.2" fill="#d32f2f"/>
      <circle cx="16" cy="5" r="1.2" fill="#d32f2f"/>
      <circle cx="9.6" cy="4.5" r="0.4" fill="#fff" stroke="none"/>
      <circle cx="15.6" cy="4.5" r="0.4" fill="#fff" stroke="none"/>
      <!-- Mouth (open) -->
      <path d="M7,8.5 Q12,12 17,8.5" fill="#1b5e20" stroke-width="0.8"/>
      <rect x="9" y="8" width="1.2" height="2" rx="0.3" fill="#e0e0e0" stroke="none"/>
      <rect x="13.8" y="8" width="1.2" height="2" rx="0.3" fill="#e0e0e0" stroke="none"/>
      <rect x="11.2" y="9.5" width="1.2" height="1.5" rx="0.3" fill="#e0e0e0" stroke="none"/>
    </g>
  </g>
</svg>
```

- [ ] **Step 2: Create enemy_rat_swarm.svg**

Cluster of 3 small rats with beady red eyes, long tails. viewBox="0 0 40 20". Brown body gradient (`#8d6e63` → `#4e342e`), pink tails, red eyes.

Frame 0 (clustered), Frame 1 (scattering motion). Use `<ellipse>` for rat bodies, small circles for eyes, curved `<path>` for tails.

- [ ] **Step 3: Create enemy_ashwalker.svg**

Charred humanoid wreathed in ember particles. viewBox="0 0 56 28". Dark grey/charcoal body (`#424242` → `#212121`) with orange-red cracks/veins drawn as thin `<path>` lines. Glowing orange eyes. Embers as small orange circles around head.

Frame 0 (standing, arms at sides), Frame 1 (arms raised, more ember particles visible).

- [ ] **Step 4: Create enemy_frostbite.svg**

Small ice sprite/elemental. viewBox="0 0 44 22". Icy blue body (`#b3e5fc` → `#0288d1`) with crystalline faceted shapes. White frost particles around it. Cold blue eyes with white glow.

Frame 0 (floating), Frame 1 (darting to side).

- [ ] **Step 5: Build and verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add public/assets/sprites/enemy_goblin.svg public/assets/sprites/enemy_rat_swarm.svg public/assets/sprites/enemy_ashwalker.svg public/assets/sprites/enemy_frostbite.svg
git commit -m "art: replace fodder enemy sprites with cartoon SVGs"
```

---

## Task 3: Standard Enemy SVGs (orc, berserker, hellhound, blighted, spore_carrier)

**Files:**
- Replace: `public/assets/sprites/enemy_orc.svg` (64x32, frames 32x32, size=16)
- Replace: `public/assets/sprites/enemy_berserker.svg` (56x28, frames 28x28, size=14)
- Replace: `public/assets/sprites/enemy_hellhound.svg` (52x26, frames 26x26, size=13)
- Replace: `public/assets/sprites/enemy_blighted.svg` (72x36, frames 36x36, size=18)
- Replace: `public/assets/sprites/enemy_spore_carrier.svg` (80x40, frames 40x40, size=20)

- [ ] **Step 1: Create enemy_orc.svg**

Muscular green-brown warrior with tusks, crude armor plates, war axe. viewBox="0 0 64 32". Olive green body (`#689f38` → `#33691e`), brown leather armor straps, yellow tusks. Stocky proportions — wide shoulders, short legs.

Frame 0 (standing with axe), Frame 1 (axe swing pose).

- [ ] **Step 2: Create enemy_berserker.svg**

Red-skinned rage warrior, no armor, dual weapons. viewBox="0 0 56 28". Red body (`#ef5350` → `#b71c1c`), wild hair (spiky paths), glowing orange eyes, veins visible on arms. Lean and aggressive pose.

Frame 0 (crouched ready), Frame 1 (leaping forward).

- [ ] **Step 3: Create enemy_hellhound.svg**

Flaming wolf/dog creature on all fours. viewBox="0 0 52 26". Dark body (`#bf360c` → `#4e342e`) with flame wisps on back/tail (orange/yellow gradient paths). Red glowing eyes, sharp teeth.

Frame 0 (stalking), Frame 1 (pouncing with front legs extended).

- [ ] **Step 4: Create enemy_blighted.svg**

Corrupted humanoid oozing toxic green. viewBox="0 0 72 36". Sickly green-purple body (`#7cb342` → `#4a148c`), dripping slime (teardrop shapes along edges), hollow eyes with green glow, mushroom growths on shoulders.

Frame 0 (shambling), Frame 1 (lunging with outstretched arms).

- [ ] **Step 5: Create enemy_spore_carrier.svg**

Walking mushroom/fungal creature. viewBox="0 0 80 40". Large mushroom cap on top (brown-red gradient), stubby legs, spore cloud (small semi-transparent circles around cap). Beady eyes under cap brim.

Frame 0 (walking), Frame 1 (cap puffing with larger spore cloud).

- [ ] **Step 6: Build and verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add public/assets/sprites/enemy_orc.svg public/assets/sprites/enemy_berserker.svg public/assets/sprites/enemy_hellhound.svg public/assets/sprites/enemy_blighted.svg public/assets/sprites/enemy_spore_carrier.svg
git commit -m "art: replace standard enemy sprites with cartoon SVGs"
```

---

## Task 4: Elite Enemy SVGs (troll, demon, banshee, ice_golem, yeti, hellhound already done)

**Files:**
- Replace: `public/assets/sprites/enemy_troll.svg` (88x44, frames 44x44, size=22)
- Replace: `public/assets/sprites/enemy_demon.svg` (64x32, frames 32x32, size=16)
- Replace: `public/assets/sprites/enemy_banshee.svg` (52x26, frames 26x26, size=13)
- Replace: `public/assets/sprites/enemy_ice_golem.svg` (104x52, frames 52x52, size=26)
- Replace: `public/assets/sprites/enemy_yeti.svg` (96x48, frames 48x48, size=24)

- [ ] **Step 1: Create enemy_troll.svg**

Massive, hunched brute with stone-like skin. viewBox="0 0 88 44". Grey-green body (`#78909c` → `#37474f`), rocky texture (small angular shapes on skin), underbite with big lower teeth, tiny eyes, huge fists. Very wide and stocky.

Frame 0 (standing, fists at sides), Frame 1 (ground pound, fists raised).

- [ ] **Step 2: Create enemy_demon.svg**

Fiery imp with wings and horns. viewBox="0 0 64 32". Red-orange body (`#ff5722` → `#bf360c`), small bat wings, curved horns, forked tail, yellow fire eyes. Fast-looking, lean pose.

Frame 0 (hovering), Frame 1 (diving forward with claws out).

- [ ] **Step 3: Create enemy_banshee.svg**

Ghostly floating wraith. viewBox="0 0 52 26". Translucent blue-white body (`#e1f5fe` → `#4fc3f7`, use opacity 0.8), flowing robes that taper to nothing (no legs), hollow eyes with purple glow, open screaming mouth, wispy hair.

Frame 0 (floating), Frame 1 (screaming with outstretched arms).

- [ ] **Step 4: Create enemy_ice_golem.svg**

Massive ice construct. viewBox="0 0 104 52". Crystalline blue body made of angular ice chunks (`#4fc3f7` → `#01579b`), glowing ice-blue eyes, frost particles, cracks with inner white glow. Blocky but rounded edges.

Frame 0 (standing), Frame 1 (arm raised to smash).

- [ ] **Step 5: Create enemy_yeti.svg**

Large furry snow beast. viewBox="0 0 96 48". White-grey fur (`#eceff1` → `#90a4ae`), fur texture (wavy paths along edges), icy blue eyes, large fang teeth, huge arms with claws. Hunched ape-like posture.

Frame 0 (standing), Frame 1 (roaring with arms wide).

- [ ] **Step 6: Build and verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add public/assets/sprites/enemy_troll.svg public/assets/sprites/enemy_demon.svg public/assets/sprites/enemy_banshee.svg public/assets/sprites/enemy_ice_golem.svg public/assets/sprites/enemy_yeti.svg
git commit -m "art: replace elite enemy sprites with cartoon SVGs"
```

---

## Task 5: Boss-Tier Enemy SVGs (shadow_knight, warlock, void_weaver, archfiend, abomination)

**Files:**
- Replace: `public/assets/sprites/enemy_shadow_knight.svg` (72x36, frames 36x36, size=18)
- Replace: `public/assets/sprites/enemy_warlock.svg` (60x30, frames 30x30, size=15)
- Replace: `public/assets/sprites/enemy_void_weaver.svg` (48x24, frames 24x24, size=12)
- Replace: `public/assets/sprites/enemy_archfiend.svg` (112x56, frames 56x56, size=28)
- Replace: `public/assets/sprites/enemy_abomination.svg` (112x56, frames 56x56, size=28)

- [ ] **Step 1: Create enemy_shadow_knight.svg**

Dark armored knight with glowing sword. viewBox="0 0 72 36". Dark steel armor (`#263238` → `#000a12`), purple energy sword glow, red visor slit, tattered dark cape.

Frame 0 (guard stance), Frame 1 (sword slash).

- [ ] **Step 2: Create enemy_warlock.svg**

Robed dark mage with staff. viewBox="0 0 60 30". Purple robes (`#7b1fa2` → `#4a148c`), glowing orb on staff, arcane circle hints, glowing purple eyes under hood.

Frame 0 (floating with staff), Frame 1 (casting, arms raised, orb brighter).

- [ ] **Step 3: Create enemy_void_weaver.svg**

Small fast shadow creature. viewBox="0 0 48 24". Dark purple-black body (`#4a148c` → `#12005e`) with void energy wisps (semi-transparent purple tendrils), multiple small white eyes, no legs — floats.

Frame 0 (coiled), Frame 1 (stretching forward).

- [ ] **Step 4: Create enemy_archfiend.svg**

Massive demon lord. viewBox="0 0 112 56". Dark red body (`#c62828` → `#4e0000`), large horns, heavy armor plates with gold trim, burning orange eyes, massive clawed hands, bat-like wings folded behind.

Frame 0 (standing menacingly), Frame 1 (wings flared, claws raised).

- [ ] **Step 5: Create enemy_abomination.svg**

Grotesque stitched-together horror. viewBox="0 0 112 56". Mottled flesh (`#8e24aa` → `#4a148c`) with stitch lines (dashed paths), multiple mismatched arms, exposed bones, toxic green drool, asymmetric body.

Frame 0 (lurching), Frame 1 (reaching with multiple arms).

- [ ] **Step 6: Build and verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add public/assets/sprites/enemy_shadow_knight.svg public/assets/sprites/enemy_warlock.svg public/assets/sprites/enemy_void_weaver.svg public/assets/sprites/enemy_archfiend.svg public/assets/sprites/enemy_abomination.svg
git commit -m "art: replace boss-tier enemy sprites with cartoon SVGs"
```

---

## Task 6: Boss SVGs

**Files:**
- Replace: `public/assets/sprites/boss.svg` (176x88, frames 88x88)
- Replace: `public/assets/sprites/boss_frost.svg` (176x88)
- Replace: `public/assets/sprites/boss_gorath.svg` (176x88)
- Replace: `public/assets/sprites/boss_inferno.svg` (176x88)
- Replace: `public/assets/sprites/boss_lich.svg` (176x88)
- Replace: `public/assets/sprites/boss_plague.svg` (176x88)

Boss SVGs are the most detailed sprites. They get:
- Complex gradient layering (3-4 gradients per boss)
- Glowing energy effects (radial gradients)
- Ornate armor/decorations
- Expressive animated frames (idle vs aggressive/channeling)

- [ ] **Step 1: Create boss.svg (Demon King)**

Massive demon king with crown, energy core, spiked armor. viewBox="0 0 176 88". Red body (`#e53935` → `#7f0000`), golden crown with gem, purple energy core in chest (radial gradient pulsing), spiked shoulder pauldrons, massive fists.

Frame 0 (idle, core dim), Frame 1 (aggressive, core bright, mouth open wider).

- [ ] **Step 2: Create boss_frost.svg (Ice Titan)**

Crystalline ice giant. viewBox="0 0 176 88". Ice blue body (`#4fc3f7` → `#01579b`), crystalline armor facets, frost aura (semi-transparent white/blue circles), ice crown, glowing white-blue eyes, frozen breath wisps.

Frame 0 (standing), Frame 1 (arms raised, more frost particles).

- [ ] **Step 3: Create boss_gorath.svg (War Beast)**

Armored war beast/minotaur. viewBox="0 0 176 88". Dark iron body (`#455a64` → `#1b2631`), heavy plate armor with molten cracks (orange `<path>` lines), glowing orange eyes, bull horns, massive war hammer.

Frame 0 (standing with hammer), Frame 1 (hammer raised overhead).

- [ ] **Step 4: Create boss_inferno.svg (Fire Demon)**

Fire demon with flame wings. viewBox="0 0 176 88". Lava body (`#ff6f00` → `#bf360c`), flame wings spread wide (gradient yellow → orange → red paths), lava veins (bright orange lines on dark body), fire crown, molten eyes.

Frame 0 (wings folded), Frame 1 (wings spread, flames intensified).

- [ ] **Step 5: Create boss_lich.svg (Undead Sorcerer)**

Floating undead sorcerer. viewBox="0 0 176 88". Bone-white and dark purple (`#e0e0e0` skull, `#4a148c` robes), floating soul orbs (green radial gradients), ornate dark staff, hollow glowing green eyes, tattered flowing robes.

Frame 0 (floating, orbs orbiting), Frame 1 (casting, orbs gathered, staff glowing).

- [ ] **Step 6: Create boss_plague.svg (Bloated Horror)**

Bloated toxic horror. viewBox="0 0 176 88". Sickly green-brown body (`#689f38` → `#33691e`), pustules (yellow-green circles), toxic cloud (semi-transparent green ellipses), exposed bones, dripping ooze, distended belly.

Frame 0 (lurching), Frame 1 (belly pulsing larger, more toxic cloud).

- [ ] **Step 7: Build and verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 8: Commit**

```bash
git add public/assets/sprites/boss.svg public/assets/sprites/boss_frost.svg public/assets/sprites/boss_gorath.svg public/assets/sprites/boss_inferno.svg public/assets/sprites/boss_lich.svg public/assets/sprites/boss_plague.svg
git commit -m "art: replace all boss sprites with detailed cartoon SVGs"
```

---

## Task 7: Weapon Icon SVGs

**Files:**
- Replace: all 11 weapon SVGs in `public/assets/sprites/weapon_*.svg`

Weapon icons are loaded as images (not spritesheets). Each should be ~32x32 viewBox with a metallic weapon on transparent background. Consistent style: barrel pointing left, grip on right, metallic gradient body, colored energy accents.

- [ ] **Step 1: Create all 11 weapon SVGs**

Each weapon SVG: viewBox="0 0 32 32", metallic body with `<linearGradient>`, dark outline, energy accent color.

| Weapon | Silhouette | Energy Color |
|--------|-----------|-------------|
| pistol | Small handgun | `#bdbdbd` (white/grey) |
| smg | Compact SMG, forward grip | `#4fc3f7` (light blue) |
| ar | Assault rifle, stock | `#1e88e5` (blue) |
| lmg | Belt-fed, bipod hint | `#43a047` (green) |
| minigun | Multi-barrel rotary | `#2e7d32` (dark green) |
| cryo | Boxy with ice crystals | `#00bcd4` (ice blue) |
| railgun | Long barrel, coils | `#1565c0` (electric blue) |
| plasma | Bulbous chamber | `#e91e63` (magenta) |
| flamer | Nozzle with flame tips | `#ff6f00` (orange) |
| voidbeam | Sleek with purple glow | `#7b1fa2` (purple) |
| godslayer | Ornate gold/purple | `#ffd600`/`#7b1fa2` (gold+purple) |

Each weapon file: metallic body gradient (`#9e9e9e` → `#424242`), bold 1.5px dark outline, energy glow effect on barrel/chamber as colored radial gradient.

- [ ] **Step 2: Build and verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add public/assets/sprites/weapon_*.svg
git commit -m "art: replace all weapon icons with polished metallic SVGs"
```

---

## Task 8: Utility Sprite SVGs (bullet, death_particle, gold_pouch)

**Files:**
- Replace: `public/assets/sprites/bullet.svg`
- Replace: `public/assets/sprites/death_particle.svg`
- Replace: `public/assets/sprites/gold_pouch.svg`

- [ ] **Step 1: Create bullet.svg**

Glowing energy projectile. Small (e.g. 12x8 viewBox). Elongated oval with radial gradient: bright white center → cyan → blue edge → transparent. No outline.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 8" width="12" height="8" shape-rendering="geometricPrecision">
  <defs>
    <radialGradient id="bullet-glow" cx="0.4" cy="0.5" r="0.6">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="30%" stop-color="#4fc3f7"/>
      <stop offset="70%" stop-color="#0288d1"/>
      <stop offset="100%" stop-color="#01579b" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <ellipse cx="5" cy="4" rx="5" ry="3" fill="url(#bullet-glow)"/>
  <ellipse cx="4" cy="4" rx="2.5" ry="1.5" fill="#fff" opacity="0.8"/>
</svg>
```

- [ ] **Step 2: Create death_particle.svg**

Bright spark with radial fade. Small (8x8 viewBox). Star/diamond shape with radial gradient: white center → orange → transparent.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" width="8" height="8" shape-rendering="geometricPrecision">
  <defs>
    <radialGradient id="dp-glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="40%" stop-color="#ffab40"/>
      <stop offset="100%" stop-color="#ff6d00" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="4" cy="4" r="4" fill="url(#dp-glow)"/>
  <path d="M4,0 L4.8,3.2 L8,4 L4.8,4.8 L4,8 L3.2,4.8 L0,4 L3.2,3.2 Z" fill="#fff" opacity="0.9"/>
</svg>
```

- [ ] **Step 3: Create gold_pouch.svg**

Cloth sack with coins. ~24x24 viewBox. Brown cloth sack (gradient `#a1887f` → `#5d4037`), tied with rope at top (tan path), 2-3 gold coins spilling out (gold circles with gradient and shine dot).

- [ ] **Step 4: Build and verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add public/assets/sprites/bullet.svg public/assets/sprites/death_particle.svg public/assets/sprites/gold_pouch.svg
git commit -m "art: replace bullet, particle, and gold pouch with polished SVGs"
```

---

## Task 9: Decoration SVGs (new files)

**Files:**
- Create: `public/assets/sprites/decor_tree.svg`
- Create: `public/assets/sprites/decor_rock.svg`
- Create: `public/assets/sprites/decor_bush.svg`

Small, simple decoration sprites for background terrain. These are loaded as images (not spritesheets). Neutral colors that work with any world theme (they'll be tinted per-world).

- [ ] **Step 1: Create decor_tree.svg**

Dead/bare tree silhouette. viewBox="0 0 24 32". Dark brown trunk (`#5d4037` → `#3e2723`), 2-3 bare branches as curved paths, no leaves (so tinting works for any theme).

- [ ] **Step 2: Create decor_rock.svg**

Small rock cluster. viewBox="0 0 20 16". Grey-brown rocks (2-3 overlapping rounded shapes, `#78909c` → `#455a64`), slight highlight on top.

- [ ] **Step 3: Create decor_bush.svg**

Low bush/shrub. viewBox="0 0 22 16". Rounded bush shape (`#6d4c41` → `#3e2723`), neutral brown-grey so tinting colors it per world theme.

- [ ] **Step 4: Build and verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add public/assets/sprites/decor_tree.svg public/assets/sprites/decor_rock.svg public/assets/sprites/decor_bush.svg
git commit -m "art: add decoration sprites for background terrain"
```

---

## Task 10: BootScene — Enhanced Textures and Decoration Loading

**Files:**
- Modify: `src/scenes/BootScene.ts`

- [ ] **Step 1: Add decoration sprite loading to preload()**

Add after the gold pouch load (line 52 in current BootScene.ts):

```typescript
    // Decoration sprites for background
    this.load.image('decor_tree', 'assets/sprites/decor_tree.svg');
    this.load.image('decor_rock', 'assets/sprites/decor_rock.svg');
    this.load.image('decor_bush', 'assets/sprites/decor_bush.svg');
```

- [ ] **Step 2: Add shadow texture generation to generateVfxTextures()**

Add at the end of `generateVfxTextures()` (after the burst texture, around line 149):

```typescript
    // Entity shadow
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillEllipse(16, 4, 32, 8);
    shadow.generateTexture('vfx_shadow', 32, 8);
    shadow.destroy();
```

- [ ] **Step 3: Upgrade gate textures in generateGateTextures()**

Replace the entire `generateGateTextures()` method body (lines 62-124) with enhanced versions. The new gates have a 3D beveled look with icon symbols:

```typescript
  private generateGateTextures(): void {
    const w = 120, h = 60, r = 14;

    // ── Multiply gate — bright green with bevel and "×" icon ──
    const gGreen = this.add.graphics();
    // Dark outer bevel
    gGreen.fillStyle(0x1a5c2a, 1);
    gGreen.fillRoundedRect(0, 2, w, h, r);
    // Main body
    gGreen.fillStyle(0x2a8a3e, 1);
    gGreen.fillRoundedRect(0, 0, w, h - 2, r);
    // Inner face
    gGreen.fillStyle(0x51cf66, 1);
    gGreen.fillRoundedRect(4, 3, w - 8, h - 8, r - 3);
    // Top highlight
    gGreen.fillStyle(0x7ddf8a, 0.6);
    gGreen.fillRoundedRect(8, 5, w - 16, (h - 8) / 3, r - 5);
    // "×" icon
    gGreen.lineStyle(4, 0xffffff, 0.9);
    gGreen.beginPath();
    gGreen.moveTo(w / 2 - 8, h / 2 - 8); gGreen.lineTo(w / 2 + 8, h / 2 + 8);
    gGreen.moveTo(w / 2 + 8, h / 2 - 8); gGreen.lineTo(w / 2 - 8, h / 2 + 8);
    gGreen.strokePath();
    gGreen.generateTexture('gate_multiply', w, h);
    gGreen.destroy();

    // ── Add gate — bright blue with bevel and "+" icon ──
    const gBlue = this.add.graphics();
    gBlue.fillStyle(0x006688, 1);
    gBlue.fillRoundedRect(0, 2, w, h, r);
    gBlue.fillStyle(0x0088aa, 1);
    gBlue.fillRoundedRect(0, 0, w, h - 2, r);
    gBlue.fillStyle(0x00d4ff, 1);
    gBlue.fillRoundedRect(4, 3, w - 8, h - 8, r - 3);
    gBlue.fillStyle(0x66e4ff, 0.6);
    gBlue.fillRoundedRect(8, 5, w - 16, (h - 8) / 3, r - 5);
    // "+" icon
    gBlue.lineStyle(4, 0xffffff, 0.9);
    gBlue.beginPath();
    gBlue.moveTo(w / 2, h / 2 - 10); gBlue.lineTo(w / 2, h / 2 + 10);
    gBlue.moveTo(w / 2 - 10, h / 2); gBlue.lineTo(w / 2 + 10, h / 2);
    gBlue.strokePath();
    gBlue.generateTexture('gate_add', w, h);
    gBlue.destroy();

    // ── Subtract gate — dark red with bevel, stripes, and "−" icon ──
    const gRed = this.add.graphics();
    gRed.fillStyle(0x660a0a, 1);
    gRed.fillRoundedRect(0, 2, w, h, r);
    gRed.fillStyle(0x881111, 1);
    gRed.fillRoundedRect(0, 0, w, h - 2, r);
    gRed.fillStyle(0xcc2222, 1);
    gRed.fillRoundedRect(4, 3, w - 8, h - 8, r - 3);
    // Danger stripes
    gRed.fillStyle(0x991111, 0.5);
    for (let sx = 12; sx < w - 8; sx += 16) {
      gRed.fillRect(sx, 5, 8, h - 12);
    }
    // Top bevel highlight
    gRed.fillStyle(0xdd3333, 0.4);
    gRed.fillRoundedRect(8, 5, w - 16, (h - 8) / 3, r - 5);
    // "−" icon
    gRed.lineStyle(4, 0xffffff, 0.9);
    gRed.beginPath();
    gRed.moveTo(w / 2 - 10, h / 2); gRed.lineTo(w / 2 + 10, h / 2);
    gRed.strokePath();
    gRed.generateTexture('gate_subtract', w, h);
    gRed.destroy();

    // ── Boss gate — wide ominous banner with skull icon ──
    const bw = 600, bh = 70, br = 12;
    const gBoss = this.add.graphics();
    gBoss.fillStyle(0x15000a, 1);
    gBoss.fillRoundedRect(0, 3, bw, bh, br);
    gBoss.fillStyle(0x220011, 1);
    gBoss.fillRoundedRect(0, 0, bw, bh - 3, br);
    gBoss.fillStyle(0x660022, 1);
    gBoss.fillRoundedRect(4, 3, bw - 8, bh - 10, br - 3);
    // Danger stripes
    gBoss.fillStyle(0x440016, 0.5);
    for (let sx = 10; sx < bw - 8; sx += 20) {
      gBoss.fillRect(sx, 5, 10, bh - 14);
    }
    // Inner glow
    gBoss.fillStyle(0x990033, 0.35);
    gBoss.fillRoundedRect(8, 5, bw - 16, (bh - 10) / 3, br - 5);
    // Skull icon (simplified)
    const cx = bw / 2, cy = bh / 2;
    gBoss.fillStyle(0xffffff, 0.6);
    gBoss.fillCircle(cx, cy - 2, 12);
    gBoss.fillRect(cx - 6, cy + 6, 12, 8);
    gBoss.fillStyle(0x660022, 1);
    gBoss.fillCircle(cx - 4, cy - 3, 3);
    gBoss.fillCircle(cx + 4, cy - 3, 3);
    gBoss.fillRect(cx - 4, cy + 8, 2, 4);
    gBoss.fillRect(cx - 1, cy + 8, 2, 4);
    gBoss.fillRect(cx + 2, cy + 8, 2, 4);
    gBoss.generateTexture('gate_boss', bw, bh);
    gBoss.destroy();
  }
```

- [ ] **Step 4: Upgrade VFX textures in generateVfxTextures()**

Replace the entire `generateVfxTextures()` method body (lines 126-150) with gradient-based versions:

```typescript
  private generateVfxTextures(): void {
    // Spark — radial gradient white to transparent
    const spark = this.add.graphics();
    spark.fillStyle(0xffffff, 1);
    spark.fillCircle(4, 4, 4);
    spark.fillStyle(0xffffff, 0.5);
    spark.fillCircle(4, 4, 2);
    spark.generateTexture('vfx_spark', 8, 8);
    spark.destroy();

    // Ring — donut shape
    const ring = this.add.graphics();
    ring.lineStyle(2, 0xff4444, 0.8);
    ring.strokeCircle(6, 6, 4);
    ring.fillStyle(0xff0000, 0.3);
    ring.fillCircle(6, 6, 2);
    ring.generateTexture('vfx_ring', 12, 12);
    ring.destroy();

    // Trail — elongated teardrop
    const trail = this.add.graphics();
    trail.fillStyle(0xff6600, 0.8);
    trail.fillEllipse(6, 4, 12, 6);
    trail.fillStyle(0xffaa00, 0.6);
    trail.fillEllipse(4, 4, 6, 4);
    trail.fillStyle(0xffffff, 0.4);
    trail.fillEllipse(3, 4, 3, 2);
    trail.generateTexture('vfx_trail', 12, 8);
    trail.destroy();

    // Burst — star cross shape
    const burst = this.add.graphics();
    burst.fillStyle(0xff2200, 0.9);
    burst.fillRect(2, 0, 4, 8);
    burst.fillRect(0, 2, 8, 4);
    burst.fillStyle(0xffaa00, 0.7);
    burst.fillRect(3, 1, 2, 6);
    burst.fillRect(1, 3, 6, 2);
    burst.fillStyle(0xffffff, 0.5);
    burst.fillCircle(4, 4, 1.5);
    burst.generateTexture('vfx_burst', 8, 8);
    burst.destroy();

    // Entity shadow
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillEllipse(16, 4, 32, 8);
    shadow.generateTexture('vfx_shadow', 32, 8);
    shadow.destroy();
  }
```

- [ ] **Step 5: Build and verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 6: Run existing tests**

Run: `npm test`
Expected: All existing tests pass (we haven't changed any game logic).

- [ ] **Step 7: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "feat: upgrade BootScene with enhanced textures and decoration loading"
```

---

## Task 11: Background Overhaul

**Files:**
- Modify: `src/systems/Background.ts`

- [ ] **Step 1: Add decoration sprite placement and richer terrain**

Replace the `generateChunk` method in `Background.ts` (lines 40-135). The new version adds:
- Decoration sprite placement (trees, rocks, bushes) alongside procedural shapes
- Richer ground variation with more color bands
- Path/road markings down the center
- The same RNG-based deterministic placement

```typescript
  private generateChunk(index: number): void {
    const t = this.theme;
    const container = this.scene.add.container(0, index * CHUNK_HEIGHT);
    container.setDepth(-100);

    const seed = Math.abs(index * 7919 + 1327);
    const rng = (n: number) => {
      const x = Math.sin(seed + n * 9973) * 43758.5453;
      return x - Math.floor(x);
    };

    // Ground base
    const bg = this.scene.add.rectangle(
      GAME_WIDTH / 2, CHUNK_HEIGHT / 2,
      GAME_WIDTH, CHUNK_HEIGHT,
      t.groundColor,
    );
    container.add(bg);

    // Road/path down center
    const pathColor = this.blendColor(t.groundColor, 0x000000, 0.15);
    const road = this.scene.add.rectangle(
      GAME_WIDTH / 2, CHUNK_HEIGHT / 2,
      60, CHUNK_HEIGHT,
      pathColor, 0.3,
    );
    container.add(road);
    // Road edges (subtle darker lines)
    const roadEdgeL = this.scene.add.rectangle(GAME_WIDTH / 2 - 30, CHUNK_HEIGHT / 2, 2, CHUNK_HEIGHT, pathColor, 0.15);
    const roadEdgeR = this.scene.add.rectangle(GAME_WIDTH / 2 + 30, CHUNK_HEIGHT / 2, 2, CHUNK_HEIGHT, pathColor, 0.15);
    container.add(roadEdgeL);
    container.add(roadEdgeR);

    // Color variation bands (richer)
    const bandCount = 3 + Math.floor(rng(50) * 4);
    for (let b = 0; b < bandCount; b++) {
      const bandY = rng(60 + b) * CHUNK_HEIGHT;
      const bandH = 30 + rng(70 + b) * 120;
      const bandColor = t.detailColors[Math.floor(rng(80 + b) * t.detailColors.length)];
      const band = this.scene.add.rectangle(
        GAME_WIDTH / 2, bandY,
        GAME_WIDTH, bandH,
        bandColor, 0.25,
      );
      container.add(band);
    }

    // Ambient glow patches
    if (rng(90) < 0.5) {
      const glowColor = t.glowColors[Math.floor(rng(91) * t.glowColors.length)];
      const glowX = rng(92) * GAME_WIDTH;
      const glowY = rng(93) * CHUNK_HEIGHT;
      const glow = this.scene.add.ellipse(
        glowX, glowY,
        140 + rng(94) * 220, 90 + rng(95) * 140,
        glowColor, 0.15,
      );
      container.add(glow);
    }

    // Ground details (procedural shapes)
    const detailCount = 8 + Math.floor(rng(0) * 10);
    for (let i = 0; i < detailCount; i++) {
      const x = rng(i * 3 + 1) * GAME_WIDTH;
      const y = rng(i * 3 + 2) * CHUNK_HEIGHT;
      const type = rng(i * 3 + 4);

      if (type < 0.2) {
        const color = t.detailColors[Math.floor(rng(i * 3 + 3) * t.detailColors.length)];
        const w = 20 + rng(i * 3 + 5) * 60;
        const h = 10 + rng(i * 3 + 6) * 30;
        container.add(this.scene.add.ellipse(x, y, w, h, color, 0.4));
      } else if (type < 0.35) {
        const size = 2 + rng(i * 3 + 7) * 8;
        container.add(this.scene.add.circle(x, y, size, t.detailColors[0], 0.4));
        container.add(this.scene.add.circle(x - size * 0.2, y - size * 0.2, size * 0.3, t.glowColors[0], 0.25));
      } else if (type < 0.55) {
        const grassColor = this.blendColor(t.groundColor, t.glowColors[0], 0.4);
        for (let b = 0; b < 3; b++) {
          const blade = this.scene.add.rectangle(x + b * 3 - 3, y, 2, 6 + rng(i * 3 + 8 + b) * 8, grassColor, 0.5);
          blade.setAngle(rng(i * 3 + 12 + b) * 30 - 15);
          container.add(blade);
        }
      } else if (type < 0.7) {
        const flowerColor = t.glowColors[Math.floor(rng(i * 3 + 20) * t.glowColors.length)];
        container.add(this.scene.add.circle(x, y, 2 + rng(i * 3 + 21) * 2, flowerColor, 0.5));
      } else {
        container.add(this.scene.add.ellipse(x, y, 30 + rng(i * 3 + 23) * 40, 15, 0x000000, 0.06));
      }
    }

    // Decoration sprites (trees, rocks, bushes) — placed away from center road
    const decorCount = 2 + Math.floor(rng(200) * 3);
    const decorKeys = ['decor_tree', 'decor_rock', 'decor_bush'];
    for (let d = 0; d < decorCount; d++) {
      const dx = rng(210 + d * 3);
      // Avoid center road area (40%-60% of width)
      const decorX = dx < 0.5
        ? rng(211 + d * 3) * GAME_WIDTH * 0.35
        : GAME_WIDTH * 0.65 + rng(211 + d * 3) * GAME_WIDTH * 0.35;
      const decorY = rng(212 + d * 3) * CHUNK_HEIGHT;
      const key = decorKeys[Math.floor(rng(213 + d * 3) * decorKeys.length)];

      if (this.scene.textures.exists(key)) {
        const sprite = this.scene.add.image(decorX, decorY, key);
        sprite.setAlpha(0.5 + rng(214 + d * 3) * 0.3);
        sprite.setScale(0.6 + rng(215 + d * 3) * 0.6);
        sprite.setTint(t.detailColors[Math.floor(rng(216 + d * 3) * t.detailColors.length)]);
        container.add(sprite);
      }
    }

    // Worn path (occasional)
    if (rng(99) < 0.25) {
      const pathX = GAME_WIDTH * 0.2 + rng(100) * GAME_WIDTH * 0.6;
      const pathW = 10 + rng(101) * 16;
      const pc = t.detailColors[1] ?? t.detailColors[0];
      const p = this.scene.add.rectangle(pathX, CHUNK_HEIGHT / 2, pathW, CHUNK_HEIGHT, pc, 0.15);
      container.add(p);
    }

    this.chunks.set(index, container);
  }
```

- [ ] **Step 2: Build and verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/systems/Background.ts
git commit -m "feat: enhance background with decoration sprites and richer terrain"
```

---

## Task 12: GameScene — Entity Shadows

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Add shadow sprites to player units at spawn**

In `GameScene.ts`, find the `respawnArmy()` method (around line 502). After each unit is spawned via `unit.spawn(sx, sy)`, add a shadow sprite below it. We need to track shadow sprites so we can update their positions.

Add a new property at the top of the class (around line 28):

```typescript
  private unitShadows: Phaser.GameObjects.Image[] = [];
  private enemyShadows: Map<Enemy, Phaser.GameObjects.Image> = new Map();
```

In `respawnArmy()` (around line 502), after the unit pool is created, clear and recreate shadows. Add after `this.units[i].spawn(sx, sy)`:

```typescript
      // Add shadow below unit
      if (!this.unitShadows[i]) {
        this.unitShadows[i] = this.add.image(sx, sy + 10, 'vfx_shadow').setAlpha(0.3).setDepth(-1);
      }
      this.unitShadows[i].setPosition(sx, sy + 10).setVisible(true).setScale(0.6);
```

- [ ] **Step 2: Update shadow positions in the update loop**

In the main `update()` method, after unit physics are updated (around line 270 where units are positioned), add shadow position tracking:

```typescript
      // Update unit shadows
      for (let i = 0; i < this.units.length; i++) {
        const u = this.units[i];
        if (u.active && this.unitShadows[i]) {
          this.unitShadows[i].setPosition(u.x, u.y + 10).setVisible(true);
        } else if (this.unitShadows[i]) {
          this.unitShadows[i].setVisible(false);
        }
      }
```

- [ ] **Step 3: Add shadow spawning for enemies**

In the enemy spawning section of `update()` (around line 310 where enemies are spawned), after `e.spawn(...)`, add:

```typescript
        // Add enemy shadow
        if (!this.enemyShadows.has(e)) {
          const es = this.add.image(e.x, e.y + e.displayHeight * 0.4, 'vfx_shadow').setAlpha(0.25).setDepth(-1);
          this.enemyShadows.set(e, es);
        }
        const es = this.enemyShadows.get(e)!;
        es.setPosition(e.x, e.y + e.displayHeight * 0.4).setVisible(true);
        es.setScale(e.displayWidth / 32);
```

In the enemy update section (where enemy positions are updated), also update enemy shadow positions. And when enemies die/despawn, hide the shadow:

```typescript
        // Update enemy shadows
        for (const [enemy, shadow] of this.enemyShadows) {
          if (enemy.active) {
            shadow.setPosition(enemy.x, enemy.y + enemy.displayHeight * 0.4).setVisible(true);
          } else {
            shadow.setVisible(false);
          }
        }
```

- [ ] **Step 4: Build and verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat: add drop shadows under units and enemies in GameScene"
```

---

## Task 13: BossScene — Entity Shadows

**Files:**
- Modify: `src/scenes/BossScene.ts`

- [ ] **Step 1: Add shadow sprites for boss and units**

Add properties at the top of BossScene class:

```typescript
  private bossShadow!: Phaser.GameObjects.Image;
  private unitShadows: Phaser.GameObjects.Image[] = [];
```

In `create()` (around line 115 after boss sprite creation), add boss shadow:

```typescript
    // Boss shadow
    this.bossShadow = this.add.image(this.bossSprite.x, this.bossSprite.y + 60, 'vfx_shadow')
      .setAlpha(0.3).setScale(3).setDepth(-1);
```

- [ ] **Step 2: Update shadow positions**

In `respawnArmy()` (around line 811), after each unit is spawned, add unit shadows:

```typescript
      if (!this.unitShadows[i]) {
        this.unitShadows[i] = this.add.image(sx, sy + 10, 'vfx_shadow').setAlpha(0.3).setDepth(-1);
      }
      this.unitShadows[i].setPosition(sx, sy + 10).setVisible(true).setScale(0.6);
```

In `update()`, after boss position changes and unit position changes, update shadows:

```typescript
    // Update boss shadow
    if (this.bossShadow && this.bossSprite) {
      this.bossShadow.setPosition(this.bossSprite.x, this.bossSprite.y + 60);
    }

    // Update unit shadows
    for (let i = 0; i < this.units.length; i++) {
      const u = this.units[i];
      if (u.active && this.unitShadows[i]) {
        this.unitShadows[i].setPosition(u.x, u.y + 10).setVisible(true);
      } else if (this.unitShadows[i]) {
        this.unitShadows[i].setVisible(false);
      }
    }
```

- [ ] **Step 3: Build and verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/scenes/BossScene.ts
git commit -m "feat: add drop shadows in BossScene for boss and units"
```

---

## Task 14: SplashScene Redesign

**Files:**
- Modify: `src/scenes/SplashScene.ts` (full rewrite of `create()` method)

- [ ] **Step 1: Rewrite SplashScene with metallic title and enhanced effects**

Replace the entire `create()` method (lines 10-179) with the new version. Key changes:
- Metallic gold gradient title text (use Phaser text stroke + shadow for faux metallic)
- More particle layers (ember + dust)
- Ornate separator lines with glow
- Subtitle with enhanced styling
- Version badge in gold accent

```typescript
  create(): void {
    this.cameras.main.setBackgroundColor('#0a0f1a');

    // Deep background gradient (dark navy → black vignette)
    const vignetteOuter = this.add.graphics();
    vignetteOuter.fillStyle(0x0a0f1a, 1);
    vignetteOuter.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    // Center glow (warm red/orange)
    const glow1 = this.add.graphics();
    glow1.fillStyle(0xff2040, 0.04);
    glow1.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT * 0.36, 500);
    glow1.fillStyle(0xff4400, 0.06);
    glow1.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT * 0.38, 350);
    glow1.fillStyle(0xff6600, 0.08);
    glow1.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT * 0.38, 180);

    // Floating dust particles (subtle background layer)
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const size = Phaser.Math.FloatBetween(0.5, 2);
      const dust = this.add.circle(x, y, size, 0xffffff, 0);
      this.tweens.add({
        targets: dust,
        alpha: { from: 0, to: Phaser.Math.FloatBetween(0.1, 0.3) },
        y: y - Phaser.Math.Between(50, 200),
        x: x + Phaser.Math.Between(-30, 30),
        duration: Phaser.Math.Between(4000, 8000),
        delay: Phaser.Math.Between(0, 3000),
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut',
      });
    }

    // Rising ember particles
    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(GAME_HEIGHT + 20, GAME_HEIGHT + 400);
      const size = Phaser.Math.Between(1, 3);
      const color = [0xff4040, 0xff6600, 0xffaa00][Phaser.Math.Between(0, 2)];
      const ember = this.add.circle(x, y, size, color, 0);
      this.tweens.add({
        targets: ember,
        y: Phaser.Math.Between(-100, GAME_HEIGHT * 0.2),
        x: ember.x + Phaser.Math.Between(-80, 80),
        alpha: { from: 0, to: Phaser.Math.FloatBetween(0.3, 0.8) },
        scale: { from: 1, to: 0.2 },
        duration: Phaser.Math.Between(2500, 5000),
        delay: Phaser.Math.Between(0, 1500),
        ease: 'Sine.easeOut',
      });
    }

    // Ornate separator lines
    const mainSlash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT * 0.45, 0, 3, 0xff4040, 0.9);
    this.tweens.add({ targets: mainSlash, width: GAME_WIDTH * 0.75, duration: 400, delay: 500, ease: 'Power3' });

    // Flanking thin lines with glow
    const topLine = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT * 0.45 - 14, 0, 1, 0xffd700, 0.4);
    const botLine = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT * 0.45 + 14, 0, 1, 0xffd700, 0.4);
    this.tweens.add({ targets: [topLine, botLine], width: GAME_WIDTH * 0.55, duration: 450, delay: 700, ease: 'Power2' });

    // Gold ornament dots at line ends
    const dotL = this.add.circle(GAME_WIDTH * 0.15, GAME_HEIGHT * 0.45, 3, 0xffd700, 0).setDepth(2);
    const dotR = this.add.circle(GAME_WIDTH * 0.85, GAME_HEIGHT * 0.45, 3, 0xffd700, 0).setDepth(2);
    this.tweens.add({ targets: [dotL, dotR], alpha: 0.8, duration: 300, delay: 900 });

    // Pulsing glow behind title
    const titleGlow = this.add.circle(GAME_WIDTH / 2, GAME_HEIGHT * 0.38, 120, 0xff2040, 0);
    this.tweens.add({ targets: titleGlow, alpha: 0.12, scale: 2.5, duration: 1800, delay: 200, ease: 'Sine.easeOut' });

    // Main title — metallic gold effect via stroke layering
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.38, 'DEATHMARCH', {
      fontSize: '68px',
      color: '#ffd700',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontStyle: 'bold',
      stroke: '#b8860b',
      strokeThickness: 4,
      shadow: { offsetX: 2, offsetY: 3, color: '#000000', blur: 6, fill: true },
    }).setOrigin(0.5).setAlpha(0).setScale(1.8);

    this.tweens.add({ targets: title, alpha: 1, scale: 1, duration: 800, delay: 300, ease: 'Back.easeOut' });

    // Subtitle
    const subtitle = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.50, 'ENDLESS WAR AWAITS', {
      fontSize: '16px',
      color: '#ff6b6b',
      fontFamily: 'Arial, Helvetica, sans-serif',
      letterSpacing: 12,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: subtitle, alpha: 0.8, y: GAME_HEIGHT * 0.47, duration: 600, delay: 900, ease: 'Sine.easeOut' });

    // Version badge with gold accent
    const vBadgeW = 90, vBadgeH = 26;
    const vBg = this.add.graphics()
      .fillStyle(0xffd700, 0.08)
      .fillRoundedRect(GAME_WIDTH / 2 - vBadgeW / 2, GAME_HEIGHT * 0.53, vBadgeW, vBadgeH, vBadgeH / 2)
      .lineStyle(1, 0xffd700, 0.2)
      .strokeRoundedRect(GAME_WIDTH / 2 - vBadgeW / 2, GAME_HEIGHT * 0.53, vBadgeW, vBadgeH, vBadgeH / 2)
      .setAlpha(0);

    const versionText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.53 + vBadgeH / 2, 'v2.0', {
      fontSize: '12px', color: '#b8860b', fontFamily: 'Arial, Helvetica, sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: [vBg, versionText], alpha: 1, duration: 400, delay: 1200 });

    // "Tap to continue" with gold underline
    const tapText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.75, 'TAP TO CONTINUE', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif', letterSpacing: 5,
    }).setOrigin(0.5).setAlpha(0);

    const tapLine = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT * 0.75 + 18, 0, 2, 0xffd700, 0.6);

    this.tweens.add({
      targets: tapText, alpha: 0.7, duration: 500, delay: 2000,
      onComplete: () => {
        this.tweens.add({ targets: tapLine, width: 180, duration: 400, ease: 'Power2' });
        this.tweens.add({ targets: tapText, alpha: 0.3, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.input.once('pointerdown', () => this.transitionToMenu());
      },
    });

    this.time.delayedCall(6000, () => this.transitionToMenu());
  }
```

- [ ] **Step 2: Build and verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/SplashScene.ts
git commit -m "feat: redesign SplashScene with metallic title and enhanced particles"
```

---

## Task 15: MenuScene Redesign

**Files:**
- Modify: `src/scenes/MenuScene.ts` (full rewrite)

This is the largest UI file. Key visual changes:
- Textured dark background with subtle pattern
- Gold accent title with metallic styling
- Ornate circular node frames with icon badges
- Ribbon-style world banners
- Enhanced play button with stronger 3D bevel and glow

- [ ] **Step 1: Update MenuScene header styling**

In `create()` (line 49-76), replace the header panel with a gold-accented version. Change the title text to use metallic gold styling. Update the score/gold pills to use shield-like frames:

Replace the header section (lines 49-76) with:

```typescript
    // ── Header panel (fixed) ──
    const headerH = 110;
    const hdr = this.add.graphics().setDepth(10);
    // Dark panel with subtle gradient feel
    hdr.fillStyle(0x0d1520, 1);
    hdr.fillRect(0, 0, GAME_WIDTH, headerH);
    // Gold accent line at top
    hdr.fillStyle(0xffd700, 0.9);
    hdr.fillRect(0, 0, GAME_WIDTH, 3);
    // Bottom gold trim
    hdr.lineStyle(1, 0xffd700, 0.2);
    hdr.lineBetween(0, headerH, GAME_WIDTH, headerH);
    // Subtle inner glow
    hdr.fillStyle(0xffd700, 0.03);
    hdr.fillRect(0, headerH - 20, GAME_WIDTH, 20);

    this.add.text(GAME_WIDTH / 2, 32, 'DEATHMARCH', {
      fontSize: '38px', color: '#ffd700', fontFamily: F, fontStyle: 'bold',
      stroke: '#b8860b', strokeThickness: 3,
      shadow: { offsetX: 1, offsetY: 2, color: '#000', blur: 4, fill: true },
    }).setOrigin(0.5).setDepth(11);

    // Score badge (shield shape via pill with gold border)
    const scorePillG = this.add.graphics().setDepth(11);
    scorePillG.fillStyle(0xffd700, 0.1);
    scorePillG.fillRoundedRect(PAD, 58, 150, 38, 19);
    scorePillG.lineStyle(1.5, 0xffd700, 0.4);
    scorePillG.strokeRoundedRect(PAD, 58, 150, 38, 19);
    this.add.text(PAD + 14, 77, `\u2B50 ${localStorage.getItem('deathmarch-highscore') || '0'}`, {
      fontSize: '16px', color: '#ffd700', fontFamily: F, fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(11);

    // Gold badge
    const goldPillG = this.add.graphics().setDepth(11);
    goldPillG.fillStyle(0xffd700, 0.1);
    goldPillG.fillRoundedRect(GAME_WIDTH - PAD - 140, 58, 140, 38, 19);
    goldPillG.lineStyle(1.5, 0xffd700, 0.4);
    goldPillG.strokeRoundedRect(GAME_WIDTH - PAD - 140, 58, 140, 38, 19);
    this.add.text(GAME_WIDTH - PAD - 14, 77, `\u{1FA99} ${WalletManager.gold}g`, {
      fontSize: '16px', color: '#ffd700', fontFamily: F, fontStyle: 'bold',
    }).setOrigin(1, 0.5).setDepth(11);
```

- [ ] **Step 2: Update level node styling**

In `drawNodes()` (around line 197), update the current/completed/locked node styling. Current nodes get a gold ring, completed nodes get a green check with ornate border, locked nodes get a darker locked look:

Update the current node section (starting around line 207) — replace the glow and node graphics with:

```typescript
      if (isCurrent) {
        // Gold pulsing glow
        const glow = this.add.graphics();
        glow.fillStyle(0xffd700, 0.1);
        glow.fillCircle(0, 0, NODE_R + 14);
        nc.add(glow);
        this.tweens.add({ targets: glow, alpha: { from: 0.08, to: 0.35 }, scale: { from: 0.95, to: 1.12 },
          duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        // Filled node with gold border
        const ng = this.add.graphics();
        ng.fillStyle(C_GREEN, 1);
        ng.fillCircle(0, 0, NODE_R);
        ng.fillStyle(0xffffff, 0.2);
        ng.fillCircle(0, -NODE_R * 0.2, NODE_R * 0.6);
        ng.lineStyle(3, 0xffd700, 0.8);
        ng.strokeCircle(0, 0, NODE_R);
        ng.lineStyle(1.5, 0xffffff, 0.3);
        ng.strokeCircle(0, 0, NODE_R - 3);
        nc.add(ng);
```

- [ ] **Step 3: Update world banner styling**

In `drawWorldBanners()` (around line 173), replace the pill banners with ribbon-style banners. The banner background gets pointed ends (triangle shapes at sides):

```typescript
  private drawWorldBanners(positions: { x: number; y: number }[], visibleCount: number): void {
    const worldInfos = getWorldInfoForLevels(visibleCount - 1);
    for (const world of worldInfos) {
      if (world.startLevel >= positions.length) continue;
      const y = positions[world.startLevel].y - 48;
      const lvl = generateLevel(world.startLevel);
      const accent = lvl.theme.accentColor;

      const ribbonW = 300, ribbonH = 32, notchW = 12;
      const rx = GAME_WIDTH / 2 - ribbonW / 2;
      const bg = this.add.graphics();
      // Ribbon body
      bg.fillStyle(accent, 0.85);
      bg.beginPath();
      bg.moveTo(rx + notchW, y - ribbonH / 2);
      bg.lineTo(rx + ribbonW - notchW, y - ribbonH / 2);
      bg.lineTo(rx + ribbonW, y);
      bg.lineTo(rx + ribbonW - notchW, y + ribbonH / 2);
      bg.lineTo(rx + notchW, y + ribbonH / 2);
      bg.lineTo(rx, y);
      bg.closePath();
      bg.fillPath();
      // Inner highlight
      bg.fillStyle(0xffffff, 0.15);
      bg.fillRect(rx + notchW + 4, y - ribbonH / 2 + 3, ribbonW - notchW * 2 - 8, ribbonH / 3);
      // Dark border
      bg.lineStyle(1.5, 0x000000, 0.3);
      bg.beginPath();
      bg.moveTo(rx + notchW, y - ribbonH / 2);
      bg.lineTo(rx + ribbonW - notchW, y - ribbonH / 2);
      bg.lineTo(rx + ribbonW, y);
      bg.lineTo(rx + ribbonW - notchW, y + ribbonH / 2);
      bg.lineTo(rx + notchW, y + ribbonH / 2);
      bg.lineTo(rx, y);
      bg.closePath();
      bg.strokePath();
      this.scrollContainer.add(bg);

      this.scrollContainer.add(this.add.text(GAME_WIDTH / 2, y, world.name.toUpperCase(), {
        fontSize: '13px', color: '#ffffff', fontFamily: F, fontStyle: 'bold', letterSpacing: 4,
        stroke: '#000', strokeThickness: 1,
      }).setOrigin(0.5));
    }
  }
```

- [ ] **Step 4: Update footer styling**

In `create()` (around line 78), update the footer with gold trim:

```typescript
    // ── Footer (fixed) ──
    const footH = 56;
    const foot = this.add.graphics().setDepth(10);
    foot.fillStyle(0x0d1520, 1);
    foot.fillRect(0, GAME_HEIGHT - footH, GAME_WIDTH, footH);
    foot.lineStyle(1, 0xffd700, 0.15);
    foot.lineBetween(0, GAME_HEIGHT - footH, GAME_WIDTH, GAME_HEIGHT - footH);
```

- [ ] **Step 5: Build and verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/scenes/MenuScene.ts
git commit -m "feat: redesign MenuScene with gold accents and ribbon banners"
```

---

## Task 16: HUDScene Redesign

**Files:**
- Modify: `src/scenes/HUDScene.ts`

- [ ] **Step 1: Update top bar with gold trim and ornate badges**

Replace the top bar creation section in `create()` (lines 82-124). The new version has:
- Beveled dark panel with gold trim line at bottom
- Score in a shield-shaped gold-bordered badge
- Unit count in a blue-bordered badge
- Distance in subtle center
- Gold text with coin icon

```typescript
    // ── Top bar (beveled with gold trim) ──
    this.topElements = this.add.container(0, 0);

    const topBarBg = this.add.graphics();
    topBarBg.fillStyle(0x0d1520, 0.85);
    topBarBg.fillRect(0, 0, GAME_WIDTH, 74);
    // Gold trim line
    topBarBg.fillStyle(0xffd700, 0.6);
    topBarBg.fillRect(0, 72, GAME_WIDTH, 2);
    // Bottom fade
    topBarBg.fillStyle(0x000000, 0.15);
    topBarBg.fillRect(0, 74, GAME_WIDTH, 8);
    this.topElements.add(topBarBg);

    // Score badge (gold border)
    const scoreBadge = this.add.graphics();
    scoreBadge.fillStyle(0xffd700, 0.1);
    scoreBadge.fillRoundedRect(PAD - 4, 8, 190, 40, 20);
    scoreBadge.lineStyle(1.5, 0xffd700, 0.5);
    scoreBadge.strokeRoundedRect(PAD - 4, 8, 190, 40, 20);
    this.topElements.add(scoreBadge);
    this.topElements.add(this.add.text(PAD + 10, 22, '\u2605', { fontSize: '20px', color: '#ffd700' }).setOrigin(0, 0.5));
    this.scoreText = this.add.text(PAD + 34, 22, '0', {
      fontSize: '22px', color: '#ffd700', fontFamily: 'Arial, Helvetica, sans-serif', fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    this.topElements.add(this.scoreText);

    // Distance (center, subtle gold)
    this.distanceText = this.add.text(GAME_WIDTH / 2, 22, '0m', {
      fontSize: '14px', color: '#b8860b', fontFamily: 'Arial, Helvetica, sans-serif',
    }).setOrigin(0.5);
    this.topElements.add(this.distanceText);

    // Units badge (blue border)
    const unitBadge = this.add.graphics();
    unitBadge.fillStyle(0x00d4ff, 0.1);
    unitBadge.fillRoundedRect(GAME_WIDTH - PAD - 148, 8, 148, 40, 20);
    unitBadge.lineStyle(1.5, 0x00d4ff, 0.5);
    unitBadge.strokeRoundedRect(GAME_WIDTH - PAD - 148, 8, 148, 40, 20);
    this.topElements.add(unitBadge);
    this.topElements.add(this.add.text(GAME_WIDTH - PAD - 134, 22, '\u2694', { fontSize: '20px', color: '#00d4ff' }).setOrigin(0, 0.5));
    this.unitText = this.add.text(GAME_WIDTH - PAD - 8, 22, '0', {
      fontSize: '22px', color: '#00d4ff', fontFamily: 'Arial, Helvetica, sans-serif', fontStyle: 'bold',
    }).setOrigin(1, 0.5);
    this.topElements.add(this.unitText);

    // Gold (below score)
    this.goldText = this.add.text(PAD + 10, 52, '\u{1FA99} 0g', {
      fontSize: '13px', color: '#ffd700', fontFamily: 'Arial, Helvetica, sans-serif', fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    this.topElements.add(this.goldText);
```

- [ ] **Step 2: Update weapon indicator styling**

Replace the weapon indicator section (lines 144-149) with a circular frame:

```typescript
    // ── Weapon indicator (circular frame with tier-colored border) ──
    const wFrame = this.add.graphics();
    wFrame.fillStyle(0x0d1520, 0.8);
    wFrame.fillCircle(PAD + 24, GAME_HEIGHT - 80, 22);
    wFrame.lineStyle(2, 0x888888, 0.6);
    wFrame.strokeCircle(PAD + 24, GAME_HEIGHT - 80, 22);
    this.weaponIcon = this.add.sprite(PAD + 24, GAME_HEIGHT - 80, 'weapon_svg_pistol')
      .setDisplaySize(28, 28).setAlpha(0).setOrigin(0.5);
    this.weaponLabel = this.add.text(PAD + 52, GAME_HEIGHT - 80, '', {
      fontSize: '14px', color: '#cccccc', fontFamily: 'Arial, Helvetica, sans-serif', fontStyle: 'bold',
    }).setOrigin(0, 0.5).setAlpha(0);
```

- [ ] **Step 3: Update pause button styling**

Replace the pause button section (lines 152-171) with gold accent:

```typescript
    // ── Pause button (gold accent) ──
    const pauseBg = this.add.graphics();
    pauseBg.fillStyle(0x0d1520, 0.8);
    pauseBg.fillRoundedRect(GAME_WIDTH - PAD - 46, 52, 46, 46, 14);
    pauseBg.lineStyle(1, 0xffd700, 0.3);
    pauseBg.strokeRoundedRect(GAME_WIDTH - PAD - 46, 52, 46, 46, 14);
    this.topElements.add(pauseBg);

    const pauseBtn = this.add.text(GAME_WIDTH - PAD - 23, 70, '\u23F8', {
      fontSize: '22px', color: '#ffd700',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(5);
    this.topElements.add(pauseBtn);
```

- [ ] **Step 4: Update kill streak popup styling**

Replace `showStreakPopup()` (lines 308-326) with fiery styling:

```typescript
  private showStreakPopup(streak: number): void {
    const x = GAME_WIDTH / 2 + (Math.random() - 0.5) * 100;
    const y = GAME_HEIGHT * 0.45;
    const size = Math.min(52, 26 + streak * 3);
    const color = streak >= 10 ? '#ffd700' : streak >= 5 ? '#ff6600' : '#ff4444';
    const txt = this.add.text(x, y, `x${streak}`, {
      fontSize: `${size}px`, color, fontFamily: 'Arial, Helvetica, sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 5,
      shadow: { offsetX: 0, offsetY: 0, color: color, blur: 8, fill: false, stroke: true },
    }).setOrigin(0.5).setDepth(15);

    this.tweens.add({
      targets: txt,
      y: y - 90,
      alpha: 0,
      scale: 1.6,
      duration: 900,
      ease: 'Power2',
      onComplete: () => txt.destroy(),
    });
  }
```

- [ ] **Step 5: Build and verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/scenes/HUDScene.ts
git commit -m "feat: redesign HUDScene with gold trim and ornate badges"
```

---

## Task 17: GameOverScene Redesign

**Files:**
- Modify: `src/scenes/GameOverScene.ts`

- [ ] **Step 1: Update background and title panel**

Replace the background color and title panel section (lines 30-75). Add dark vignette overlay and ribbon-style victory/defeat banner:

Change the background color from `#0f1923` to `#0a0f1a` (darker).

Replace the title panel with a ribbon banner style. Instead of a rectangular panel, use a pointed ribbon shape (similar to MenuScene world banners but larger):

```typescript
    this.cameras.main.setBackgroundColor('#0a0f1a');

    // Vignette overlay
    const vignette = this.add.graphics();
    vignette.fillStyle(0x000000, 0.3);
    vignette.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    vignette.fillStyle(0x000000, 0);
    vignette.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT * 0.4, 400);
```

For the title panel (lines 47-74), replace with a ribbon banner using the same pointed-end style from the MenuScene. Use `headerColor` as the ribbon fill.

- [ ] **Step 2: Update stat cards layout**

Replace the stats panel (lines 77-118) with individual stat cards. Each stat gets its own small card with an icon and gold accent:

Create 3 horizontal stat cards for Score, Distance, and Gold instead of one combined panel. Each card: dark panel with colored top accent, icon badge, value text.

- [ ] **Step 3: Update buttons with enhanced 3D bevel**

The `btn()` method (lines 239-276) already has a 3D look. Enhance it with gold trim for the primary button and make the shadow more pronounced:

Update the primary action button (NEXT LEVEL / TRY AGAIN) to use gold border accent:

```typescript
    // Add gold border for primary button
    if (colorTop === C_GREEN || colorTop === C_BLUE) {
      bg.lineStyle(1.5, 0xffd700, 0.4);
      bg.strokeRoundedRect(-w / 2, -r, w, h, r);
    }
```

- [ ] **Step 4: Build and verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/GameOverScene.ts
git commit -m "feat: redesign GameOverScene with vignette and ribbon banners"
```

---

## Task 18: SettingsScene Visual Consistency

**Files:**
- Modify: `src/scenes/SettingsScene.ts`

- [ ] **Step 1: Update header and panel styling to match new design language**

Update the background color to `#0a0f1a`. Update the header with gold accent (matching MenuScene). Update section panels with gold accent dots and borders:

Replace the header section (lines 26-37):

```typescript
    this.cameras.main.setBackgroundColor('#0a0f1a');

    // Header
    const hdr = this.add.graphics();
    hdr.fillStyle(0x0d1520, 1);
    hdr.fillRect(0, 0, GAME_WIDTH, 84);
    hdr.fillStyle(0xffd700, 0.9);
    hdr.fillRect(0, 0, GAME_WIDTH, 3);
    hdr.lineStyle(1, 0xffd700, 0.2);
    hdr.lineBetween(0, 84, GAME_WIDTH, 84);

    this.add.text(GAME_WIDTH / 2, 46, '\u2699  SETTINGS', {
      fontSize: '32px', color: '#ffd700', fontFamily: F, fontStyle: 'bold',
      stroke: '#b8860b', strokeThickness: 2,
      shadow: { offsetX: 1, offsetY: 2, color: '#000', blur: 4, fill: true },
    }).setOrigin(0.5);
```

Update the `section()` method (lines 69-114) to use gold accent dot instead of the current colored dot, and gold-tinted border:

```typescript
    // Accent dot — gold
    g.fillStyle(0xffd700, 0.5);
    g.fillCircle(PAD + 20, y + Math.round(32 * vs), 5);
```

Update the version info section (lines 57-62) to match:

```typescript
    const verBg = this.add.graphics();
    verBg.fillStyle(0x0d1520, 0.8);
    verBg.fillRoundedRect(PAD, GAME_HEIGHT - 124, CW, 48, 14);
    verBg.lineStyle(1, 0xffd700, 0.15);
    verBg.strokeRoundedRect(PAD, GAME_HEIGHT - 124, CW, 48, 14);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 100, `DEATHMARCH v2.0  \u2022  ${new Date().toISOString().slice(0, 10)}`, {
      fontSize: '12px', color: '#b8860b', fontFamily: F,
    }).setOrigin(0.5);
```

- [ ] **Step 2: Build and verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Run all tests**

Run: `npm test`
Expected: All existing tests pass (no game logic changed).

- [ ] **Step 4: Commit**

```bash
git add src/scenes/SettingsScene.ts
git commit -m "feat: update SettingsScene styling to match new gold-accent design"
```

---

## Task 19: Final Verification

- [ ] **Step 1: Full build**

Run: `npm run build`
Expected: Build succeeds with zero errors.

- [ ] **Step 2: Full test suite**

Run: `npm test`
Expected: All tests pass.

- [ ] **Step 3: Visual smoke test**

Run: `npm run dev`
Manually verify in browser:
- Splash screen: metallic gold title, ember particles, gold separator lines
- Menu: gold accents, ribbon world banners, ornate level nodes, play button glow
- Game: polished unit/enemy sprites, drop shadows, enhanced gates, richer background
- Boss: boss sprites detailed, shadow under boss and units
- HUD: gold trim, ornate badges, fiery kill streaks
- Game Over: vignette, ribbon banner, stat cards
- Settings: gold accent consistency

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: visual overhaul complete — CoC-style cartoon graphics"
```
