// src/systems/UIFactory.ts
// "Bright Casual" procedural UI factory. Components drawn entirely with
// Phaser.GameObjects.Graphics so they stay crisp at any DPR, no atlas churn.
//
// Style primitives:
//   - vibrant fill color
//   - thick white border (4px default)
//   - heavy drop shadow for depth
//   - glossy white-alpha highlight on the upper portion (fakes a gradient)
//   - generous corner radius (or fully-rounded pill)

import Phaser from 'phaser';

export const UIPalette = {
  gold: 0xffcc00,
  coral: 0xff5e5e,
  sky: 0x5de2ff,
  white: 0xffffff,
  shadow: 0x000000,

  /** Deep navy used as the modal/overlay backdrop. */
  panelDark: 0x1a2440,

  /** Soft text/label color for dark panels. */
  textOnDark: 0xffffff,

  /** Accent tint for "danger" / negative states. */
  danger: 0xff3b6b,
} as const;

/**
 * Centralized text style presets. Use these everywhere instead of inlining
 * fontSize/color/stroke/shadow on each `add.text` so the look stays cohesive.
 * Sizes are tweakable per use-site via `{ ...UIText.x, fontSize: '24px' }`.
 */
const FONT = 'Arial, Helvetica, sans-serif';
const SHADOW_DROP: Phaser.Types.GameObjects.Text.TextShadow = {
  offsetX: 0, offsetY: 2, color: '#000000', blur: 3, fill: true, stroke: false,
};

export const UIText = {
  /** Big banner / modal title. White on any panel. */
  title: {
    fontSize: '40px',
    color: '#ffffff',
    fontFamily: FONT,
    fontStyle: 'bold',
    stroke: '#000000',
    strokeThickness: 4,
    shadow: { offsetX: 0, offsetY: 3, color: '#000000', blur: 5, fill: true },
  } as Phaser.Types.GameObjects.Text.TextStyle,

  /** Sub-title / accent strap line. Gold over dark. */
  subtitle: {
    fontSize: '22px',
    color: '#ffd866',
    fontFamily: FONT,
    fontStyle: 'bold',
    stroke: '#000000',
    strokeThickness: 3,
  } as Phaser.Types.GameObjects.Text.TextStyle,

  /** Stat / number value displayed inside a bright (sky / panel) pill. */
  pillValueLight: {
    fontSize: '24px',
    color: '#ffffff',
    fontFamily: FONT,
    fontStyle: 'bold',
    stroke: '#1a3a55',
    strokeThickness: 3,
    shadow: SHADOW_DROP,
  } as Phaser.Types.GameObjects.Text.TextStyle,

  /** Stat / number value on a gold pill. Dark text + white halo for contrast. */
  pillValueGold: {
    fontSize: '24px',
    color: '#3a2400',
    fontFamily: FONT,
    fontStyle: 'bold',
    stroke: '#ffffff',
    strokeThickness: 3,
  } as Phaser.Types.GameObjects.Text.TextStyle,

  /** Standard body / label text on a dark panel. */
  body: {
    fontSize: '18px',
    color: '#ffffff',
    fontFamily: FONT,
    fontStyle: 'bold',
    stroke: '#000000',
    strokeThickness: 3,
    shadow: SHADOW_DROP,
  } as Phaser.Types.GameObjects.Text.TextStyle,

  /** Secondary / muted label (descriptions, footnotes). */
  muted: {
    fontSize: '16px',
    color: '#a8d4f0',
    fontFamily: FONT,
    stroke: '#000000',
    strokeThickness: 2,
  } as Phaser.Types.GameObjects.Text.TextStyle,

  /** CTA / button label baseline (override fontSize per button). */
  buttonLight: {
    color: '#ffffff',
    fontFamily: FONT,
    fontStyle: 'bold',
    stroke: '#000000',
    strokeThickness: 3,
    shadow: SHADOW_DROP,
  } as Phaser.Types.GameObjects.Text.TextStyle,

  buttonGold: {
    color: '#3a2400',
    fontFamily: FONT,
    fontStyle: 'bold',
    stroke: '#ffffff',
    strokeThickness: 3,
  } as Phaser.Types.GameObjects.Text.TextStyle,
} as const;

export interface PanelOptions {
  fillColor?: number;
  borderColor?: number;
  borderWidth?: number;
  cornerRadius?: number;
  shadowOffset?: number;
  shadowAlpha?: number;
  highlightAlpha?: number;
  /** If true, draw a fully-rounded "pill" (radius = h/2). Overrides cornerRadius. */
  pill?: boolean;
}

export interface ButtonOptions extends PanelOptions {
  label?: string;
  fontSize?: number;
  fontColor?: string;
  fontFamily?: string;
  iconUnicode?: string;
  /** Idle ease for the squish-back tween. Default Back.easeOut (snappy). */
  releaseEase?: string;
}

export interface ModalAddons {
  pulseIcon?: boolean;
}

/**
 * Container with: shadow, fill panel, optional gloss highlight, white border.
 * Origin is the container center; child graphics use centered coordinates.
 */
function buildPanelGraphics(
  scene: Phaser.Scene,
  w: number,
  h: number,
  opts: PanelOptions,
): Phaser.GameObjects.Graphics[] {
  const fill = opts.fillColor ?? UIPalette.sky;
  const border = opts.borderColor ?? UIPalette.white;
  const borderWidth = opts.borderWidth ?? 4;
  const radius = opts.pill ? h / 2 : (opts.cornerRadius ?? 18);
  const shadowOffset = opts.shadowOffset ?? 6;
  const shadowAlpha = opts.shadowAlpha ?? 0.35;
  const highlightAlpha = opts.highlightAlpha ?? 0.28;

  const shadow = scene.add.graphics();
  shadow.fillStyle(UIPalette.shadow, shadowAlpha);
  shadow.fillRoundedRect(-w / 2, -h / 2 + shadowOffset, w, h, radius);

  const body = scene.add.graphics();
  // Solid fill
  body.fillStyle(fill, 1);
  body.fillRoundedRect(-w / 2, -h / 2, w, h, radius);
  // Glossy highlight on the upper portion to fake a gradient
  body.fillStyle(UIPalette.white, highlightAlpha);
  body.fillRoundedRect(
    -w / 2 + borderWidth + 2,
    -h / 2 + borderWidth + 2,
    w - (borderWidth + 2) * 2,
    h * 0.45,
    Math.max(2, radius - borderWidth - 2),
  );
  // Thick border last so it sits on top
  body.lineStyle(borderWidth, border, 1);
  body.strokeRoundedRect(-w / 2, -h / 2, w, h, radius);

  return [shadow, body];
}

export class UIFactory {
  /** Generic rounded panel (use for cards, modal bodies, tooltips). */
  static createPanel(
    scene: Phaser.Scene,
    x: number,
    y: number,
    w: number,
    h: number,
    opts: PanelOptions = {},
  ): Phaser.GameObjects.Container {
    const c = scene.add.container(x, y);
    const parts = buildPanelGraphics(scene, w, h, opts);
    c.add(parts);
    return c;
  }

  /** Fully-rounded pill (handy for HUD score chips). */
  static createPill(
    scene: Phaser.Scene,
    x: number,
    y: number,
    w: number,
    h: number,
    opts: PanelOptions = {},
  ): Phaser.GameObjects.Container {
    return UIFactory.createPanel(scene, x, y, w, h, { ...opts, pill: true });
  }

  /**
   * "Squishy" button. Scales to 0.95 on pointerdown and snaps back with
   * Back.easeOut. Shadow flattens on press for a tactile feel.
   */
  static createButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    onClick: () => void,
    opts: ButtonOptions = {},
  ): Phaser.GameObjects.Container {
    const c = scene.add.container(x, y);
    const parts = buildPanelGraphics(scene, w, h, opts);
    c.add(parts);

    const text = scene.add.text(0, 0, label, {
      fontSize: `${opts.fontSize ?? 28}px`,
      color: opts.fontColor ?? '#ffffff',
      fontFamily: opts.fontFamily ?? 'Arial, Helvetica, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
      shadow: { offsetX: 1, offsetY: 2, color: '#000000', blur: 2, fill: true },
    }).setOrigin(0.5);
    c.add(text);

    const hit = scene.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true });
    c.add(hit);

    const releaseEase = opts.releaseEase ?? 'Back.easeOut';
    const shadow = parts[0];

    hit.on('pointerdown', () => {
      scene.tweens.killTweensOf(c);
      scene.tweens.add({
        targets: c,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 70,
        ease: 'Quad.easeOut',
      });
      // Pull the shadow in for a "press" effect.
      scene.tweens.killTweensOf(shadow);
      scene.tweens.add({
        targets: shadow,
        y: -2,
        duration: 70,
        ease: 'Quad.easeOut',
      });
    });

    const releaseSnap = (fire: boolean) => {
      scene.tweens.killTweensOf(c);
      scene.tweens.add({
        targets: c,
        scaleX: 1,
        scaleY: 1,
        duration: 220,
        ease: releaseEase,
      });
      scene.tweens.killTweensOf(shadow);
      scene.tweens.add({
        targets: shadow,
        y: 0,
        duration: 220,
        ease: releaseEase,
      });
      if (fire) onClick();
    };

    hit.on('pointerup', () => releaseSnap(true));
    hit.on('pointerout', () => releaseSnap(false));

    return c;
  }

  /**
   * Wraps a child object in a soft pulsing scale tween. Useful for the "Add"
   * icon on the score pill — draws the eye without being annoying.
   */
  static pulse(
    scene: Phaser.Scene,
    target: Phaser.GameObjects.GameObject,
    options: { from?: number; to?: number; duration?: number } = {},
  ): Phaser.Tweens.Tween {
    return scene.tweens.add({
      targets: target,
      scaleX: { from: options.from ?? 0.92, to: options.to ?? 1.08 },
      scaleY: { from: options.from ?? 0.92, to: options.to ?? 1.08 },
      duration: options.duration ?? 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Procedural icon: a coral circle with a thick white "+" on top. Returns
   * a container so it can be transformed/pulsed as a unit.
   */
  static createPlusIcon(scene: Phaser.Scene, x: number, y: number, size: number = 36): Phaser.GameObjects.Container {
    const c = scene.add.container(x, y);

    const shadow = scene.add.graphics();
    shadow.fillStyle(UIPalette.shadow, 0.35);
    shadow.fillCircle(0, 4, size / 2);
    c.add(shadow);

    const body = scene.add.graphics();
    body.fillStyle(UIPalette.coral, 1);
    body.fillCircle(0, 0, size / 2);
    body.fillStyle(UIPalette.white, 0.25);
    body.fillCircle(0, -size * 0.18, size * 0.32);
    body.lineStyle(3, UIPalette.white, 1);
    body.strokeCircle(0, 0, size / 2);

    // Plus glyph (vertical + horizontal bar).
    const armLen = size * 0.42;
    const armThick = size * 0.18;
    body.fillStyle(UIPalette.white, 1);
    body.fillRoundedRect(-armThick / 2, -armLen / 2, armThick, armLen, armThick / 2);
    body.fillRoundedRect(-armLen / 2, -armThick / 2, armLen, armThick, armThick / 2);
    c.add(body);

    return c;
  }

  /**
   * Procedural coin icon: gold circle, white border, "$" or just gloss.
   */
  static createCoinIcon(scene: Phaser.Scene, x: number, y: number, size: number = 36): Phaser.GameObjects.Container {
    const c = scene.add.container(x, y);

    const shadow = scene.add.graphics();
    shadow.fillStyle(UIPalette.shadow, 0.35);
    shadow.fillCircle(0, 4, size / 2);
    c.add(shadow);

    const body = scene.add.graphics();
    body.fillStyle(UIPalette.gold, 1);
    body.fillCircle(0, 0, size / 2);
    body.fillStyle(0xffe066, 1);
    body.fillCircle(0, -size * 0.10, size * 0.36);
    body.lineStyle(3, UIPalette.white, 1);
    body.strokeCircle(0, 0, size / 2);
    // Center mark — small white dot.
    body.fillStyle(UIPalette.white, 0.85);
    body.fillCircle(0, 0, size * 0.10);
    c.add(body);

    return c;
  }
}
