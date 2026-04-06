// src/ui/RoyaleUI.ts
// Reusable Phaser UI components in the Supercell / Clash Royale style.
// Every element has physical "thickness" — a dark bottom slab, bright face, and glossy sheen.

import Phaser from 'phaser';
import {
  BG, BORDER, GOLD, ACCENT, NEUTRAL, BEVEL, ANIM, Z, FONT,
  darken, lighten, toHex,
} from './RoyaleTheme';

// ─────────────────────────────────────────────────────────────
// PANEL — "Stone Slab" with beveled border & accent bar
// ─────────────────────────────────────────────────────────────

export interface PanelOptions {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Accent color for the top header bar (defaults to gold) */
  accent?: number;
  /** Corner radius (defaults to BEVEL.panelRadius) */
  radius?: number;
  /** Depth layer */
  depth?: number;
}

/**
 * Draw a "stone slab" panel with:
 * - Dark bottom shadow (physical thickness)
 * - Panel face with subtle inner gradient
 * - Bright top-edge accent bar
 * - Heavy beveled border stroke
 */
export function drawPanel(scene: Phaser.Scene, opts: PanelOptions): Phaser.GameObjects.Graphics {
  const { x, y, w, h, accent = GOLD.mid, radius = BEVEL.panelRadius, depth = 0 } = opts;
  const g = scene.add.graphics().setDepth(depth);

  // 1. Bottom shadow slab (the "thickness")
  g.fillStyle(ACCENT.shadowPurple, BEVEL.shadowAlpha);
  g.fillRoundedRect(x + BEVEL.offsetX, y + BEVEL.offsetY, w, h, radius);

  // 2. Panel body
  g.fillStyle(BG.panel, 1);
  g.fillRoundedRect(x, y, w, h, radius);

  // 3. Inner top lighter zone (simulates top-lit surface)
  g.fillStyle(BG.elevated, 0.5);
  g.fillRoundedRect(x + 3, y + 3, w - 6, h * 0.35, { tl: radius - 2, tr: radius - 2, bl: 4, br: 4 });

  // 4. Heavy beveled border
  g.lineStyle(3, BORDER.base, 0.8);
  g.strokeRoundedRect(x, y, w, h, radius);

  // 5. Bright inner highlight along top edge
  g.lineStyle(1, BORDER.bright, 0.35);
  g.strokeRoundedRect(x + 2, y + 2, w - 4, h - 4, radius - 1);

  // 6. Colored accent bar at top
  g.fillStyle(accent, 0.95);
  g.fillRoundedRect(x + 3, y + 3, w - 6, 7, { tl: radius - 2, tr: radius - 2, bl: 0, br: 0 });

  // 7. Tiny shine line on the accent bar
  g.fillStyle(NEUTRAL.white, 0.2);
  g.fillRoundedRect(x + 8, y + 4, w - 16, 2, 1);

  return g;
}

// ─────────────────────────────────────────────────────────────
// BUTTON — "Golden Glossy" 3D beveled button
// ─────────────────────────────────────────────────────────────

export interface ButtonOptions {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  /** Top face color (default: GOLD.bright) */
  colorTop?: number;
  /** Bottom/dark face color (default: GOLD.dark) */
  colorBot?: number;
  /** Text color hex (default: white) */
  textColor?: string;
  /** Font size override */
  fontSize?: string;
  /** Callback on press */
  onPress?: () => void;
  /** Phaser depth */
  depth?: number;
  /** Start hidden and animate in with delay */
  animDelay?: number;
}

/**
 * Create a full "Royale-style" 3D button with:
 * - Deep shadow underneath (physical base)
 * - Two-tone gradient face (dark bottom, bright top)
 * - Glossy shine strip across top third
 * - Heavy outer bevel stroke
 * - Overshoot press animation
 */
export function createButton(scene: Phaser.Scene, opts: ButtonOptions): Phaser.GameObjects.Container {
  const {
    x, y, w, h,
    label,
    colorTop = GOLD.bright,
    colorBot = GOLD.dark,
    textColor = NEUTRAL.whiteHex,
    fontSize = '22px',
    onPress,
    depth = 0,
    animDelay,
  } = opts;

  const r = Math.min(h / 2, BEVEL.buttonRadius);
  const c = scene.add.container(x, y).setDepth(depth);

  // 1. Deep ground shadow
  const shadow = scene.add.graphics();
  shadow.fillStyle(ACCENT.shadowPurple, BEVEL.shadowAlpha);
  shadow.fillRoundedRect(-w / 2 + BEVEL.offsetX, -r + BEVEL.offsetY + 2, w, h, r);
  c.add(shadow);

  // 2. Dark bottom face (the "thickness")
  const base = scene.add.graphics();
  base.fillStyle(darken(colorBot, 0.3), 1);
  base.fillRoundedRect(-w / 2, -r + 3, w, h, r);
  c.add(base);

  // 3. Main button face
  const face = scene.add.graphics();
  // Bottom half — darker
  face.fillStyle(colorBot, 1);
  face.fillRoundedRect(-w / 2, -r, w, h, r);
  // Top half — brighter
  face.fillStyle(colorTop, 1);
  face.fillRoundedRect(-w / 2, -r, w, h * 0.52, { tl: r, tr: r, bl: 6, br: 6 });
  c.add(face);

  // 4. Glossy sheen strip (top)
  const shine = scene.add.graphics();
  shine.fillStyle(NEUTRAL.white, BEVEL.shineAlpha);
  shine.fillRoundedRect(
    -w / 2 + 6, -r + 3,
    w - 12, h * BEVEL.shineFraction,
    { tl: r - 4, tr: r - 4, bl: 0, br: 0 },
  );
  c.add(shine);

  // 5. Heavy outer bevel border
  const border = scene.add.graphics();
  border.lineStyle(3, lighten(colorTop, 0.3), 0.5);
  border.strokeRoundedRect(-w / 2 + 1, -r + 1, w - 2, h - 2, r - 1);
  c.add(border);

  // 6. Text
  c.add(scene.add.text(0, 1, label, {
    fontSize,
    color: textColor,
    fontFamily: FONT.display,
    fontStyle: 'bold',
    stroke: '#1a0a30',
    strokeThickness: 3,
  }).setOrigin(0.5));

  // 7. Hit zone
  const hit = scene.add.zone(0, 0, w + 8, h + 8).setInteractive({ useHandCursor: true });
  c.add(hit);

  if (onPress) {
    hit.on('pointerdown', () => {
      scene.tweens.add({
        targets: c,
        scale: ANIM.buttonPress.scale,
        duration: ANIM.buttonPress.duration,
        yoyo: true,
        ease: ANIM.buttonPress.ease,
        onComplete: () => { c.setScale(1); onPress(); },
      });
    });
  }

  // Entrance animation
  if (animDelay !== undefined) {
    c.setAlpha(0);
    scene.tweens.add({
      targets: c,
      alpha: 1,
      y: { from: y + ANIM.slideUp.y, to: y },
      duration: ANIM.slideUp.duration,
      delay: animDelay,
      ease: ANIM.slideUp.ease,
    });
  }

  return c;
}

// ─────────────────────────────────────────────────────────────
// PILL — Rounded status badge (score, gold, units)
// ─────────────────────────────────────────────────────────────

export interface PillOptions {
  x: number;
  y: number;
  w: number;
  h: number;
  color: number;
  depth?: number;
}

/** Draw a semi-transparent pill with a beveled edge */
export function drawPill(scene: Phaser.Scene, opts: PillOptions): Phaser.GameObjects.Graphics {
  const { x, y, w, h, color, depth = 0 } = opts;
  const r = h / 2;
  const g = scene.add.graphics().setDepth(depth);

  // Shadow
  g.fillStyle(ACCENT.shadowPurple, 0.3);
  g.fillRoundedRect(x + 1, y + 2, w, h, r);

  // Fill
  g.fillStyle(color, 0.18);
  g.fillRoundedRect(x, y, w, h, r);

  // Border
  g.lineStyle(2, color, 0.4);
  g.strokeRoundedRect(x, y, w, h, r);

  // Top shine
  g.fillStyle(NEUTRAL.white, 0.08);
  g.fillRoundedRect(x + 3, y + 2, w - 6, h * 0.4, { tl: r - 2, tr: r - 2, bl: 0, br: 0 });

  return g;
}

// ─────────────────────────────────────────────────────────────
// ICON BADGE — Circular icon with colored glow
// ─────────────────────────────────────────────────────────────

export function drawIconBadge(
  scene: Phaser.Scene,
  x: number, y: number,
  icon: string,
  color: number,
  vs: number = 1,
): Phaser.GameObjects.Container {
  const r = Math.round(18 * vs);
  const c = scene.add.container(x, y);

  const g = scene.add.graphics();
  // Outer glow
  g.fillStyle(color, 0.12);
  g.fillCircle(0, 0, r + 4);
  // Fill
  g.fillStyle(color, 0.25);
  g.fillCircle(0, 0, r);
  // Border
  g.lineStyle(2, color, 0.5);
  g.strokeCircle(0, 0, r);
  // Top shine
  g.fillStyle(NEUTRAL.white, 0.15);
  g.fillEllipse(0, -r * 0.25, r * 1.1, r * 0.6);
  c.add(g);

  c.add(scene.add.text(0, 0, icon, {
    fontSize: `${Math.round(18 * vs)}px`,
  }).setOrigin(0.5));

  return c;
}

// ─────────────────────────────────────────────────────────────
// HEADER BAR — Fixed top bar with accent line & shadow
// ─────────────────────────────────────────────────────────────

export function drawHeaderBar(
  scene: Phaser.Scene,
  height: number,
  accentColor: number = GOLD.mid,
): Phaser.GameObjects.Graphics {
  const w = scene.cameras.main.width;
  const g = scene.add.graphics().setDepth(Z.fixedUI);

  // Shadow under header
  g.fillStyle(ACCENT.shadowPurple, 0.4);
  g.fillRect(0, height, w, 6);

  // Header body
  g.fillStyle(BG.panel, 1);
  g.fillRect(0, 0, w, height);

  // Inner top gradient
  g.fillStyle(BG.elevated, 0.3);
  g.fillRect(0, 0, w, height * 0.4);

  // Gold accent bar at very top
  g.fillStyle(accentColor, 0.95);
  g.fillRect(0, 0, w, 5);
  // Shine on accent bar
  g.fillStyle(NEUTRAL.white, 0.2);
  g.fillRect(0, 0, w, 2);

  // Bottom border line
  g.lineStyle(2, BORDER.base, 0.6);
  g.lineBetween(0, height, w, height);

  return g;
}

// ─────────────────────────────────────────────────────────────
// FOOTER BAR — Fixed bottom bar
// ─────────────────────────────────────────────────────────────

export function drawFooterBar(
  scene: Phaser.Scene,
  height: number,
): Phaser.GameObjects.Graphics {
  const w = scene.cameras.main.width;
  const h = scene.cameras.main.height;
  const g = scene.add.graphics().setDepth(Z.fixedUI);

  // Shadow above footer
  g.fillStyle(ACCENT.shadowPurple, 0.3);
  g.fillRect(0, h - height - 4, w, 4);

  // Footer body
  g.fillStyle(BG.panel, 1);
  g.fillRect(0, h - height, w, height);

  // Top border
  g.lineStyle(1, BORDER.base, 0.5);
  g.lineBetween(0, h - height, w, h - height);

  return g;
}

// ─────────────────────────────────────────────────────────────
// SECTION — Settings-style card with accent dot & action button
// ─────────────────────────────────────────────────────────────

export interface SectionOptions {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  desc: string;
  color: number;
  btnLabel: string;
  onPress: () => void;
  vs?: number;
}

export function drawSection(scene: Phaser.Scene, opts: SectionOptions): void {
  const { x, y, w, h, title, desc, color, btnLabel, onPress, vs = 1 } = opts;

  drawPanel(scene, { x, y, w, h, accent: color, radius: 16 });

  // Accent dot
  const dotG = scene.add.graphics();
  dotG.fillStyle(color, 0.7);
  dotG.fillCircle(x + 22, y + Math.round(34 * vs), 5);

  // Title
  scene.add.text(x + 38, y + Math.round(30 * vs), title, {
    fontSize: `${Math.round(17 * vs)}px`, color: NEUTRAL.lightHex,
    fontFamily: FONT.body, fontStyle: 'bold',
  }).setOrigin(0, 0.5);

  // Description
  scene.add.text(x + 38, y + Math.round(54 * vs), desc, {
    fontSize: `${Math.round(12 * vs)}px`, color: NEUTRAL.dimHex,
    fontFamily: FONT.body,
  }).setOrigin(0, 0.5);

  // Small action button
  const bw = Math.round(100 * vs), bh = Math.round(36 * vs);
  const bx = x + w - Math.round(60 * vs);
  createButton(scene, {
    x: bx, y: y + h / 2,
    w: bw, h: bh,
    label: btnLabel,
    colorTop: lighten(color, 0.15),
    colorBot: darken(color, 0.2),
    fontSize: `${Math.round(14 * vs)}px`,
    onPress,
  });
}

// ─────────────────────────────────────────────────────────────
// HP BAR — Boss / unit health with beveled frame
// ─────────────────────────────────────────────────────────────

export function drawHpBar(
  scene: Phaser.Scene,
  x: number, y: number,
  w: number, h: number,
  percent: number,
  fillColor: number,
): Phaser.GameObjects.Graphics {
  const r = h / 2;
  const g = scene.add.graphics();

  // Background track
  g.fillStyle(ACCENT.shadowPurple, 0.6);
  g.fillRoundedRect(x - 2, y + 2, w + 4, h, r);
  g.fillStyle(NEUTRAL.white, 0.08);
  g.fillRoundedRect(x, y, w, h, r);
  g.lineStyle(2, BORDER.base, 0.5);
  g.strokeRoundedRect(x, y, w, h, r);

  // Fill
  const fillW = w * Math.max(0, Math.min(1, percent));
  if (fillW > 4) {
    g.fillStyle(fillColor, 0.9);
    g.fillRoundedRect(x + 2, y + 2, fillW - 4, h - 4, r - 2);
    // Shine
    g.fillStyle(NEUTRAL.white, 0.18);
    g.fillRoundedRect(x + 4, y + 4, Math.max(fillW - 8, 0), (h - 8) * 0.45, { tl: r - 3, tr: r - 3, bl: 0, br: 0 });
  }

  return g;
}

// ─────────────────────────────────────────────────────────────
// OVERSHOOT TWEEN — The signature "pop" animation
// ─────────────────────────────────────────────────────────────

/**
 * Apply the Supercell "overshoot" pop-in to any game object.
 * Scales from 0% → ~110% → 100% using Back.easeOut
 */
export function popIn(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.GameObject,
  delay: number = 0,
  duration: number = ANIM.overshoot.duration,
): void {
  const t = target as Phaser.GameObjects.Components.Transform & Phaser.GameObjects.Components.Alpha;
  t.setScale(0);
  t.setAlpha(0);
  scene.tweens.add({
    targets: target,
    scale: 1,
    alpha: 1,
    duration,
    delay,
    ease: ANIM.overshoot.ease,
  });
}

// ─────────────────────────────────────────────────────────────
// LEVEL NODE — Map node with Royale styling
// ─────────────────────────────────────────────────────────────

export interface NodeStyle {
  state: 'current' | 'completed' | 'locked';
  color: number;
}

export function drawLevelNode(
  scene: Phaser.Scene,
  radius: number,
  style: NodeStyle,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  const { state, color } = style;

  if (state === 'locked') {
    // Dark locked node
    g.fillStyle(BG.panel, 1);
    g.fillCircle(0, 0, radius - 4);
    g.lineStyle(2, BORDER.subtle, 0.6);
    g.strokeCircle(0, 0, radius - 4);
    return g;
  }

  // Shadow underneath
  g.fillStyle(ACCENT.shadowPurple, 0.4);
  g.fillCircle(1, 3, radius);

  // Main fill
  const alpha = state === 'completed' ? 0.75 : 1;
  g.fillStyle(color, alpha);
  g.fillCircle(0, 0, radius);

  // Top hemisphere shine
  g.fillStyle(NEUTRAL.white, 0.22);
  g.fillEllipse(0, -radius * 0.2, radius * 1.3, radius * 0.8);

  // Border — bright for current, subtle for completed
  g.lineStyle(state === 'current' ? 3 : 2, lighten(color, 0.4), state === 'current' ? 0.6 : 0.3);
  g.strokeCircle(0, 0, radius);

  return g;
}
