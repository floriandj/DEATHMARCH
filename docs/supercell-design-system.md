# DEATHMARCH — Supercell / Clash Royale Design System

> A comprehensive visual identity guide for mobile strategy game UI in the "Supercell style."

---

## 1. Visual Language & Materials

### Character Style: "Chibi-Plus" Proportions

Characters use exaggerated proportions for maximum readability at small mobile sizes:

| Body Part | Ratio | Purpose |
|-----------|-------|---------|
| **Head** | 1/3 of total body height | Instant recognition, emotionally expressive |
| **Hands** | 1.5x normal scale | Clear gesture readability during gameplay |
| **Feet** | 1.2x normal scale | Stable, "grounded" silhouette |
| **Eyes** | 40% of head width | Maximum expressiveness at tiny render sizes |

**Subsurface Scattering (SSS):** All character skin uses a vinyl/plastic look — light penetrates the surface slightly, creating the "soft gummy toy" feel. In 2D/Phaser, we simulate this with:
- Warm edge highlights (not pure white — use `#fff4b0` gold-tinted highlights)
- Shadows that are deep purple (`#1a0a30`) rather than black
- Smooth gradients on skin tones, avoiding harsh edges

### Lighting Model

Single strong directional light at **45° from top-left**:

```
Light direction: ↘ (top-left to bottom-right)
Key light:       100% intensity, warm white
Fill light:      20% intensity, cool blue (#3498db tinted)
Ambient:         Deep purple (#1a0e2e), never pure black
```

**High-contrast ambient occlusion** in crevices creates the "tactile toy" feel — every button, panel, and character looks like you could pick it up off the screen.

**In Phaser (2D simulation):**
- Top-half bright shine layer on every interactive element
- Bottom-offset dark shadow (the "physical slab" underneath)
- Edge highlights using lighter strokes along top/left borders
- Deepest shadow = `#1a0a30` (purple), never `#000000`

---

## 2. UI/UX Components: The "Royale" HUD

### The "Gold Standard" — Primary Button Gradient

The iconic golden glossy button uses these exact stops:

| Stop | Hex | RGB | Role |
|------|-----|-----|------|
| **Shine** | `#fff4b0` | 255, 244, 176 | Top highlight strip (25% opacity) |
| **Bright** | `#ffc107` | 255, 193, 7 | Upper face (top 52%) |
| **Mid** | `#e5a100` | 229, 161, 0 | Transition zone |
| **Dark** | `#b07800` | 176, 120, 0 | Lower face (bottom 48%) |
| **Shadow** | `#7a5200` | 122, 82, 0 | Deep base underneath (+4px offset) |

Button anatomy (top to bottom):
```
┌─────────────────────────────┐  ← Outer bevel stroke (#ffd54f @ 50%)
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░│  ← Glossy shine strip (#fff @ 25%, top 30%)
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  ← Bright face (#ffc107)
│ █████████████████████████████│  ← Dark face (#b07800)
├─────────────────────────────┤
│▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│  ← Shadow slab (#1a0a30 @ 55%, +4px down)
└─────────────────────────────┘
```

### Typography

**Font Pairing — Bold & Heroic:**

| Usage | Font Stack | Weight | Notes |
|-------|-----------|--------|-------|
| **Display** (titles, big numbers) | `"Arial Black", "Impact", "Trebuchet MS"` | Bold | Chunky, heroic, reads at any size |
| **Body** (labels, descriptions) | `"Trebuchet MS", "Segoe UI", Arial` | Regular/Bold | Clean, legible at 12px on mobile |
| **Mono** (stats, counters) | `"Courier New", Courier` | Regular | Tabular alignment for numbers |

All display text uses heavy strokes (`#1a0a30`, 3-6px thickness) for that "carved into stone" look.

**Text Size Scale:**

| Level | Size | Use Case |
|-------|------|----------|
| Title | 48-64px | Scene headers ("VICTORY!", "DEATHMARCH") |
| Heading | 24-30px | Section titles, banner names |
| Label | 18-22px | HUD values, button text |
| Body | 14-16px | Descriptions, hints |
| Caption | 11-13px | Version info, fine print |

### Depth & Layering: The "Stone Slab" System

Every UI panel looks like a physical slab of carved stone or polished wood:

**Panel Construction:**
1. **Shadow Slab** — `#1a0a30` at 55% opacity, offset +1px right, +4px down
2. **Panel Body** — `#2a1a4a` (deep purple-navy)
3. **Inner Top Gradient** — `#362158` at 50%, top 35% only (simulates top-lit surface)
4. **Outer Bevel Stroke** — `#4a3570` at 80%, 3px width
5. **Inner Highlight Stroke** — `#7b5ea7` at 35%, 1px, inset 2px
6. **Accent Bar** — Colored strip at very top (7px), rounded to match panel corners
7. **Accent Shine** — White at 20%, thin 2px line on top of accent bar

Corner radius: **18px** for panels, **28px** for buttons (pill shape).

---

## 3. Color Palette Strategy

### Primary Palette (High-Saturation "Royale" Scheme)

| Element | Color | Hex | Effect |
|---------|-------|-----|--------|
| **Primary Buttons** | Vibrant Gold | `#ffc107` | Signals importance, "premium" feel |
| **Player / Friendly** | Sky Blue | `#3498db` | Friendly, calm, "heroic" |
| **Enemy / Danger** | Crimson Red | `#e74c3c` | Aggression, danger, urgency |
| **Success** | Bright Green | `#4caf50` | Victory, completion, go |
| **Info / Cool** | Teal | `#26c6da` | Stats, distance, neutral info |
| **Warning** | Orange | `#ff9800` | Gold earned, shop, attention |
| **Epic Rarity** | Purple | `#ab47bc` | High-contrast neon on dark |
| **Legendary Rarity** | Teal Neon | `#26c6da` | Premium, shimmering |

### The "No Pure Black" Rule

**Shadows are NEVER `#000000`**. They are always deep purple-blue:

| Shadow Type | Color | Hex | Usage |
|-------------|-------|-----|-------|
| Primary Shadow | Deep Purple | `#1a0a30` | Text strokes, panel shadows |
| Blue Shadow | Dark Navy | `#0a1428` | Subtle background depth |
| Overlay | Night Purple | `#0a0618` | Pause/modal dimming |

This keeps the game looking **magical and vibrant** rather than gritty/realistic.

### Background Surfaces

| Surface | Color | Hex |
|---------|-------|-----|
| Scene Background | Dark Parchment-Navy | `#1a0e2e` |
| Panel Fill | Purple-Navy | `#2a1a4a` |
| Elevated Surface | Lighter Purple | `#362158` |

---

## 4. "Gummy" Texturing Guidelines

For sprites and icons:

- **Exaggerated Edge Highlights**: Every corner of a weapon or shield gets a bright `#fff4b0` gold-tinted nick painted on it
- **Top-half Shine Ellipse**: Circular shine on round objects (badges, nodes, icons)
- **No Pure Blacks**: Deepest shadow in textures is `#1a0a30` purple
- **Warm Highlights**: Use `#fff4b0` (gold-tinted white) instead of pure `#ffffff` for highlight edges
- **Color Saturation**: Keep all colors at 70%+ saturation. Muted colors look dead against the dark backgrounds

---

## 5. UI Animation: "The Juice"

### Overshoot Pop-In (Menus, Chests, Rewards)

The signature Supercell animation: elements scale from 0% → ~110% → 100%.

```
Scale:    0%  ────────► 110%  ──► 100%
Time:     0ms            350ms    450ms
Easing:   Back.easeOut (natural overshoot)
```

In Phaser:
```typescript
import { ANIM } from '@/ui/RoyaleTheme';
import { popIn } from '@/ui/RoyaleUI';

// Apply to any game object:
popIn(this, myContainer, delay, ANIM.overshoot.duration);

// Manual tween:
this.tweens.add({
  targets: element,
  scale: { from: 0, to: 1 },
  alpha: { from: 0, to: 1 },
  duration: 450,
  ease: 'Back.easeOut',  // This naturally overshoots to ~110%
});
```

### Button Press Squash

```
Scale:    100%  ──► 88%  ──► 100%
Time:     0ms      60ms    120ms
Easing:   Power2 (yoyo)
```

### Staggered Entrance

Menu items and buttons slide up with increasing delays:

```
Item 1: delay  0ms, slide up 20px, fade in 350ms
Item 2: delay 100ms, slide up 20px, fade in 350ms
Item 3: delay 200ms, slide up 20px, fade in 350ms
```

### Pulsing Glow (Active Elements)

Current level node, selected items:
```
Alpha:  0.4 ←→ 1.0  (yoyo, infinite)
Scale:  0.96 ←→ 1.04
Duration: 800ms
Easing: Sine.easeInOut
```

---

## 6. Z-Depth Layers

| Layer | Depth Value | Contents |
|-------|-------------|----------|
| Background | 0 | Scene bg, scrolling terrain |
| Scroll Content | 5 | Map nodes, paths, world banners |
| Fixed UI | 10 | Header bar, footer bar |
| Fixed Text | 11 | Title, pill text |
| HUD | 15 | Kill streaks, floating numbers |
| Popup | 20 | Level banner, tooltips |
| Overlay | 30 | Pause screen, dimming |
| Overlay Text | 31 | Pause menu buttons/text |
| Toast | 40 | Notifications |

---

## 7. Implementation Reference

### File Structure

```
src/ui/
├── RoyaleTheme.ts    # All constants: colors, fonts, bevel, animation, z-layers
└── RoyaleUI.ts       # Phaser components: drawPanel, createButton, drawPill, etc.
```

### Key Exports from RoyaleTheme

```typescript
// Colors
import { BG, BORDER, GOLD, ACCENT, NEUTRAL, TEAM, RARITY } from '@/ui/RoyaleTheme';

// Typography
import { FONT, TEXT_STYLE } from '@/ui/RoyaleTheme';

// Constants
import { BEVEL, ANIM, Z } from '@/ui/RoyaleTheme';

// Utilities
import { darken, lighten, toHex } from '@/ui/RoyaleTheme';
```

### Key Exports from RoyaleUI

```typescript
import {
  drawPanel,      // Stone-slab panel with accent bar
  createButton,   // 3D beveled glossy button
  drawPill,       // Status badge pill
  drawIconBadge,  // Circular icon with glow
  drawHeaderBar,  // Fixed top bar with gold accent
  drawFooterBar,  // Fixed bottom bar
  drawSection,    // Settings card with action button
  drawHpBar,      // Boss HP bar with bevel frame
  drawLevelNode,  // Map node (current/completed/locked)
  popIn,          // Overshoot pop animation
} from '@/ui/RoyaleUI';
```

---

## 8. CSS/Tailwind: "Royale-Style" Battle Button

The following CSS creates a standalone "Clash Royale" battle button with 3D depth, glossy sheen, and press animation — usable outside of Phaser for web UI.

### Pure CSS Version

```css
/* ─── Royale Battle Button ─── */
.royale-btn {
  /* Reset */
  appearance: none;
  border: none;
  cursor: pointer;
  outline: none;

  /* Sizing */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 16px 48px;
  min-width: 220px;
  border-radius: 28px;
  position: relative;

  /* The two-tone gradient face */
  background:
    linear-gradient(
      180deg,
      #ffc107 0%,       /* Bright gold top */
      #ffc107 48%,
      #e5a100 50%,      /* Mid transition */
      #b07800 100%      /* Dark gold bottom */
    );

  /* Heavy "physical slab" shadow (the thickness underneath) */
  box-shadow:
    0  4px 0  0 #7a5200,           /* Dark base edge */
    0  6px 0  0 #5a3a00,           /* Even deeper base */
    0  8px 16px rgba(26, 10, 48, 0.55), /* Soft ambient shadow */
    inset 0  2px 0 rgba(255, 244, 176, 0.35), /* Inner top highlight */
    inset 0 -2px 0 rgba(26, 10, 48, 0.2);     /* Inner bottom darken */

  /* Outer bevel glow */
  border: 3px solid rgba(255, 213, 79, 0.5);

  /* Text styling */
  font-family: "Arial Black", Impact, "Trebuchet MS", Arial, sans-serif;
  font-size: 22px;
  font-weight: bold;
  color: #ffffff;
  text-shadow:
    0 2px 0 #1a0a30,  /* Hard drop shadow */
    0 0 8px rgba(255, 193, 7, 0.3);  /* Gold glow */
  letter-spacing: 2px;
  text-transform: uppercase;

  /* Smooth transitions */
  transition: transform 0.08s ease, box-shadow 0.08s ease;
}

/* Glossy sheen strip (pseudo-element) */
.royale-btn::before {
  content: '';
  position: absolute;
  top: 3px;
  left: 8px;
  right: 8px;
  height: 38%;
  border-radius: 24px 24px 4px 4px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.30) 0%,
    rgba(255, 255, 255, 0.08) 100%
  );
  pointer-events: none;
}

/* Press state — squash down into the "slab" */
.royale-btn:active {
  transform: translateY(4px) scale(0.97);
  box-shadow:
    0  0px 0  0 #7a5200,
    0  2px 0  0 #5a3a00,
    0  4px 8px rgba(26, 10, 48, 0.4),
    inset 0  2px 0 rgba(255, 244, 176, 0.25),
    inset 0 -2px 0 rgba(26, 10, 48, 0.25);
}

/* Hover state — subtle lift */
.royale-btn:hover {
  transform: translateY(-1px);
  box-shadow:
    0  5px 0  0 #7a5200,
    0  7px 0  0 #5a3a00,
    0  10px 20px rgba(26, 10, 48, 0.6),
    inset 0  2px 0 rgba(255, 244, 176, 0.4),
    inset 0 -2px 0 rgba(26, 10, 48, 0.15);
}

/* ─── Color Variants ─── */

/* Green (Play / Confirm) */
.royale-btn--green {
  background: linear-gradient(180deg, #66bb6a 0%, #66bb6a 48%, #43a047 50%, #2e7d32 100%);
  box-shadow:
    0 4px 0 0 #1b5e20,  0 6px 0 0 #0d3b0f,
    0 8px 16px rgba(26, 10, 48, 0.55),
    inset 0 2px 0 rgba(255, 255, 255, 0.3),
    inset 0 -2px 0 rgba(26, 10, 48, 0.2);
  border-color: rgba(129, 199, 132, 0.5);
}

/* Red (Danger / Enemy) */
.royale-btn--red {
  background: linear-gradient(180deg, #ff6b6b 0%, #ff6b6b 48%, #ef5350 50%, #c62828 100%);
  box-shadow:
    0 4px 0 0 #8e1515,  0 6px 0 0 #5e0d0d,
    0 8px 16px rgba(26, 10, 48, 0.55),
    inset 0 2px 0 rgba(255, 255, 255, 0.3),
    inset 0 -2px 0 rgba(26, 10, 48, 0.2);
  border-color: rgba(239, 154, 154, 0.5);
}

/* Blue (Info / Replay) */
.royale-btn--blue {
  background: linear-gradient(180deg, #64b5f6 0%, #64b5f6 48%, #42a5f5 50%, #1565c0 100%);
  box-shadow:
    0 4px 0 0 #0d47a1,  0 6px 0 0 #082e6a,
    0 8px 16px rgba(26, 10, 48, 0.55),
    inset 0 2px 0 rgba(255, 255, 255, 0.3),
    inset 0 -2px 0 rgba(26, 10, 48, 0.2);
  border-color: rgba(144, 202, 249, 0.5);
}
```

### Tailwind CSS Version

```html
<!-- Royale Battle Button — Tailwind (with arbitrary values) -->
<button class="
  relative inline-flex items-center justify-center
  px-12 py-4 min-w-[220px]
  rounded-[28px]
  bg-gradient-to-b from-[#ffc107] via-[#e5a100] to-[#b07800]
  border-[3px] border-[rgba(255,213,79,0.5)]
  shadow-[0_4px_0_0_#7a5200,0_6px_0_0_#5a3a00,0_8px_16px_rgba(26,10,48,0.55),inset_0_2px_0_rgba(255,244,176,0.35),inset_0_-2px_0_rgba(26,10,48,0.2)]
  font-['Arial_Black',Impact,sans-serif] text-[22px] font-bold text-white uppercase tracking-wider
  [text-shadow:0_2px_0_#1a0a30,0_0_8px_rgba(255,193,7,0.3)]
  transition-transform duration-75 ease-out
  active:translate-y-1 active:scale-[0.97]
  active:shadow-[0_0_0_0_#7a5200,0_2px_0_0_#5a3a00,0_4px_8px_rgba(26,10,48,0.4)]
  hover:-translate-y-px
  cursor-pointer
">
  <!-- Glossy sheen -->
  <span class="
    absolute top-[3px] left-2 right-2 h-[38%]
    rounded-t-[24px] rounded-b-[4px]
    bg-gradient-to-b from-white/30 to-white/[0.08]
    pointer-events-none
  "></span>
  ⚔️ BATTLE!
</button>
```

### Usage in HTML

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="royale-button.css">
</head>
<body style="background: #1a0e2e; display: grid; place-items: center; min-height: 100vh;">

  <!-- Gold (default) -->
  <button class="royale-btn">⚔️ BATTLE!</button>

  <!-- Green variant -->
  <button class="royale-btn royale-btn--green">▶ PLAY</button>

  <!-- Red variant -->
  <button class="royale-btn royale-btn--red">💀 ATTACK!</button>

  <!-- Blue variant -->
  <button class="royale-btn royale-btn--blue">↻ REPLAY</button>

</body>
</html>
```

---

## 9. Quick Reference Card

| Property | Value |
|----------|-------|
| **Background** | `#1a0e2e` |
| **Panel Fill** | `#2a1a4a` |
| **Gold Bright** | `#ffc107` |
| **Gold Dark** | `#b07800` |
| **Shadow** | `#1a0a30` (never black) |
| **Panel Radius** | 18px |
| **Button Radius** | 28px |
| **Shadow Offset** | +4px Y, +1px X |
| **Shine Opacity** | 25% |
| **Display Font** | Arial Black / Impact |
| **Body Font** | Trebuchet MS / Segoe UI |
| **Pop-In Ease** | Back.easeOut (450ms) |
| **Press Squash** | 88% scale (60ms yoyo) |
