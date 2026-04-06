// src/ui/RoyaleTheme.ts
// Supercell / Clash Royale inspired Design System
// All visual constants, color palettes, typography, and material definitions

// ─────────────────────────────────────────────────────────────
// 1. COLOR PALETTE  ("High-Saturation Royale" strategy)
// ─────────────────────────────────────────────────────────────

/** Background & surface tones — deep, warm navy instead of pure black */
export const BG = {
  /** Main scene background – dark parchment-navy */
  primary:    0x1a0e2e,
  /** Panel / card fill – slightly lighter */
  panel:      0x2a1a4a,
  /** Elevated surface (modals, tooltips) */
  elevated:   0x362158,
  /** Overlay tint for pause / modal dimming */
  overlay:    0x0a0618,
} as const;

/** Hex string versions for Phaser text styles */
export const BG_HEX = {
  primary:  '#1a0e2e',
  panel:    '#2a1a4a',
  elevated: '#362158',
} as const;

/** Border / stroke palette — never pure black, always deep purple-blue */
export const BORDER = {
  /** Default panel border */
  base:     0x4a3570,
  /** Highlighted / hovered border */
  bright:   0x7b5ea7,
  /** Subtle separator lines */
  subtle:   0x352650,
  /** Gold trim for premium elements */
  gold:     0xc8a02a,
} as const;

/** Primary action colors — the "Gold Standard" button gradient */
export const GOLD = {
  /** Lightest highlight (top shine) */
  shine:    0xfff4b0,
  /** Bright face */
  bright:   0xffc107,
  /** Mid-tone face */
  mid:      0xe5a100,
  /** Dark base (bottom / shadow edge) */
  dark:     0xb07800,
  /** Deep shadow underside */
  shadow:   0x7a5200,
  /** Hex versions */
  hex: {
    shine:  '#fff4b0',
    bright: '#ffc107',
    mid:    '#e5a100',
    dark:   '#b07800',
  },
} as const;

/** Team / faction colors */
export const TEAM = {
  /** Player / friendly — sky blue */
  player:       0x3498db,
  playerHex:    '#3498db',
  /** Enemy / danger — crimson red */
  enemy:        0xe74c3c,
  enemyHex:     '#e74c3c',
} as const;

/** Rarity tier colors (neon against dark backgrounds) */
export const RARITY = {
  common:       0x9e9e9e,
  rare:         0x42a5f5,
  epic:         0xab47bc,
  legendary:    0x26c6da,
  mythic:       0xff7043,
  commonHex:    '#9e9e9e',
  rareHex:      '#42a5f5',
  epicHex:      '#ab47bc',
  legendaryHex: '#26c6da',
  mythicHex:    '#ff7043',
} as const;

/** UI accent colors — high saturation, never pure black for shadows */
export const ACCENT = {
  green:        0x4caf50,
  greenBright:  0x66bb6a,
  greenDark:    0x2e7d32,
  greenHex:     '#4caf50',

  red:          0xef5350,
  redBright:    0xff6b6b,
  redDark:      0xc62828,
  redHex:       '#ef5350',

  blue:         0x42a5f5,
  blueBright:   0x64b5f6,
  blueDark:     0x1565c0,
  blueHex:      '#42a5f5',

  yellow:       0xffc107,
  yellowBright: 0xffd54f,
  yellowDark:   0xf9a825,
  yellowHex:    '#ffc107',

  teal:         0x26c6da,
  tealHex:      '#26c6da',

  orange:       0xff9800,
  orangeHex:    '#ff9800',

  pink:         0xec407a,
  pinkHex:      '#ec407a',

  /** "Magical" shadow tones — deep purples/blues, never #000 */
  shadowPurple: 0x1a0a30,
  shadowBlue:   0x0a1428,
} as const;

/** White / neutral tones for text & shine */
export const NEUTRAL = {
  white:        0xffffff,
  whiteHex:     '#ffffff',
  light:        0xe8e0f0,
  lightHex:     '#e8e0f0',
  mid:          0x9e8fbf,
  midHex:       '#9e8fbf',
  dim:          0x6a5a8a,
  dimHex:       '#6a5a8a',
  dark:         0x4a3a6a,
  darkHex:      '#4a3a6a',
} as const;

// ─────────────────────────────────────────────────────────────
// 2. TYPOGRAPHY
// ─────────────────────────────────────────────────────────────

/**
 * Font stack: Supercell-style bold sans-serif.
 * Primary: "Lilita One" feel via system bold sans.
 * We use Arial Black / Impact as a fallback for the "chunky hero" look.
 */
export const FONT = {
  /** Primary display font (titles, big numbers) — bold & heroic */
  display: '"Arial Black", "Impact", "Trebuchet MS", Arial, sans-serif',
  /** Body / UI font — legible at small sizes */
  body: '"Trebuchet MS", "Segoe UI", Arial, Helvetica, sans-serif',
  /** Monospace for stats / counters */
  mono: '"Courier New", Courier, monospace',
} as const;

/** Pre-built text style configs for Phaser */
export const TEXT_STYLE = {
  /** Scene titles — 48-64px, white, heavy stroke */
  title: {
    fontSize: '52px',
    color: NEUTRAL.whiteHex,
    fontFamily: FONT.display,
    fontStyle: 'bold',
    stroke: '#1a0a30',
    strokeThickness: 6,
  },
  /** Sub-headings — 24-30px */
  heading: {
    fontSize: '28px',
    color: NEUTRAL.whiteHex,
    fontFamily: FONT.display,
    fontStyle: 'bold',
    stroke: '#1a0a30',
    strokeThickness: 4,
  },
  /** HUD labels — 18-22px, accent color */
  label: {
    fontSize: '20px',
    color: GOLD.hex.bright,
    fontFamily: FONT.body,
    fontStyle: 'bold',
  },
  /** Body text — 14-16px */
  body: {
    fontSize: '15px',
    color: NEUTRAL.lightHex,
    fontFamily: FONT.body,
  },
  /** Small captions — 11-13px */
  caption: {
    fontSize: '12px',
    color: NEUTRAL.midHex,
    fontFamily: FONT.body,
  },
  /** Button text — 22px, white, dark stroke */
  button: {
    fontSize: '22px',
    color: NEUTRAL.whiteHex,
    fontFamily: FONT.display,
    fontStyle: 'bold',
    stroke: '#1a0a30',
    strokeThickness: 3,
  },
  /** Large stat number — 40px, bold */
  stat: {
    fontSize: '40px',
    color: NEUTRAL.whiteHex,
    fontFamily: FONT.display,
    fontStyle: 'bold',
    stroke: '#1a0a30',
    strokeThickness: 3,
  },
} as const;

// ─────────────────────────────────────────────────────────────
// 3. DEPTH & BEVEL CONSTANTS
// ─────────────────────────────────────────────────────────────

/** The "physical thickness" look: offset shadow below every element */
export const BEVEL = {
  /** How many pixels the "slab" shadow is offset downward */
  offsetY: 4,
  /** Horizontal shadow offset (usually 0 or slight) */
  offsetX: 1,
  /** Shadow opacity for the dark bottom edge */
  shadowAlpha: 0.55,
  /** Top shine bar opacity */
  shineAlpha: 0.25,
  /** Shine bar height as fraction of element height */
  shineFraction: 0.30,
  /** Border radius for rounded "stone slab" panels (px) */
  panelRadius: 18,
  /** Border radius for pill/button shapes */
  buttonRadius: 28,
  /** Inner glow opacity for lit elements */
  innerGlowAlpha: 0.15,
} as const;

// ─────────────────────────────────────────────────────────────
// 4. ANIMATION ("The Juice")
// ─────────────────────────────────────────────────────────────

/**
 * Overshoot animation config:
 * Scale from 0% → 110% → 100% (the "chest open" pop)
 */
export const ANIM = {
  /** Overshoot pop-in for menus, chests, rewards */
  overshoot: {
    from: 0,
    to: 1,
    duration: 450,
    ease: 'Back.easeOut',
    // Back.easeOut naturally overshoots to ~110% then settles to 100%
  },
  /** Button press squash */
  buttonPress: {
    scale: 0.88,
    duration: 60,
    yoyo: true,
    ease: 'Power2',
  },
  /** Slide-up entrance */
  slideUp: {
    y: 20,
    alpha: { from: 0, to: 1 },
    duration: 350,
    ease: 'Power2',
  },
  /** Pulsing glow (looping) */
  pulse: {
    alpha: { from: 0.4, to: 1 },
    scale: { from: 0.96, to: 1.04 },
    duration: 800,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  },
  /** Fade transition between scenes */
  sceneFade: {
    duration: 350,
  },
} as const;

// ─────────────────────────────────────────────────────────────
// 5. LIGHTING & MATERIAL hints (informational for artists)
// ─────────────────────────────────────────────────────────────

/**
 * Lighting model description (for reference — not runtime code):
 *
 * - Single strong directional light at 45° top-left
 * - High-contrast ambient occlusion in crevices
 * - "Tactile toy" feel: subsurface scattering on characters
 *   makes skin look like soft vinyl / plastic
 * - "Chibi-Plus" character proportions:
 *   head = 1/3 of body height, hands ~1.5x normal scale
 *   for readability at small mobile sizes
 *
 * In Phaser (2D), we simulate this with:
 * - Top-half shine layers on buttons & panels (bright highlight)
 * - Bottom-offset dark shadows (ground shadow)
 * - Edge highlights on icons (white/cyan stroke on corners)
 * - No pure blacks — deepest shadow is purple (#1a0a30)
 */

// ─────────────────────────────────────────────────────────────
// 6. Z-DEPTH LAYERS (Phaser setDepth values)
// ─────────────────────────────────────────────────────────────

export const Z = {
  background:   0,
  scrollContent: 5,
  fixedUI:      10,
  fixedText:    11,
  hud:          15,
  popup:        20,
  overlay:      30,
  overlayText:  31,
  toast:        40,
} as const;

// ─────────────────────────────────────────────────────────────
// 7. HELPER UTILITIES
// ─────────────────────────────────────────────────────────────

/** Darken a hex color by mixing toward shadow purple */
export function darken(color: number, amount: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const sr = 0x1a, sg = 0x0a, sb = 0x30;
  return (
    (Math.round(r + (sr - r) * amount) << 16) |
    (Math.round(g + (sg - g) * amount) << 8) |
    Math.round(b + (sb - b) * amount)
  );
}

/** Lighten a hex color by mixing toward white */
export function lighten(color: number, amount: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return (
    (Math.min(255, Math.round(r + (255 - r) * amount)) << 16) |
    (Math.min(255, Math.round(g + (255 - g) * amount)) << 8) |
    Math.min(255, Math.round(b + (255 - b) * amount))
  );
}

/** Convert 0xRRGGBB to '#RRGGBB' */
export function toHex(color: number): string {
  return '#' + color.toString(16).padStart(6, '0');
}
