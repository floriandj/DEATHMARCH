// src/systems/UIModal.ts
// Reusable "Bright Casual" modal. Slides in from the top with Elastic.easeOut
// over a semi-transparent dim overlay. Built on UIFactory primitives.

import Phaser from 'phaser';
import { UIFactory, UIPalette } from '@/systems/UIFactory';

export interface UIModalConfig {
  /** Modal panel width in px. Defaults to 80% of camera width, capped at 720. */
  width?: number;
  height?: number;
  fillColor?: number;
  borderColor?: number;
  /** Title displayed at the top of the modal. */
  title?: string;
  /** Optional subtitle line under the title. */
  subtitle?: string;
  /** Confirm-button label. Defaults to 'CONTINUE'. */
  confirmLabel?: string;
  confirmColor?: number;
  /** Set to true to omit the dim overlay (e.g. layered on another modal). */
  noOverlay?: boolean;
}

export class UIModal {
  private scene: Phaser.Scene;
  private overlay: Phaser.GameObjects.Rectangle | null = null;
  private container: Phaser.GameObjects.Container;
  private confirmCallback: () => void = () => {};

  /** Layer for additional content the caller wants to inject between title and button. */
  readonly content: Phaser.GameObjects.Container;

  /** Final settled Y of the modal panel (handy for laying out content relative to it). */
  readonly settledY: number;
  readonly width: number;
  readonly height: number;

  constructor(scene: Phaser.Scene, config: UIModalConfig = {}) {
    this.scene = scene;
    const camW = scene.cameras.main.width;
    const camH = scene.cameras.main.height;
    const w = config.width ?? Math.min(720, Math.round(camW * 0.86));
    const h = config.height ?? Math.min(720, Math.round(camH * 0.66));
    this.width = w;
    this.height = h;

    const settledY = Math.round(camH * 0.5);
    this.settledY = settledY;

    if (!config.noOverlay) {
      this.overlay = scene.add.rectangle(camW / 2, camH / 2, camW, camH, 0x000000, 0)
        .setScrollFactor(0)
        .setDepth(1000)
        .setInteractive(); // swallow input behind the modal
      scene.tweens.add({ targets: this.overlay, fillAlpha: 0.6, duration: 220, ease: 'Quad.easeOut' });
    }

    this.container = scene.add.container(camW / 2, -h);
    this.container.setScrollFactor(0).setDepth(1001);

    const panel = UIFactory.createPanel(scene, 0, 0, w, h, {
      fillColor: config.fillColor ?? UIPalette.panelDark,
      borderColor: config.borderColor ?? UIPalette.white,
      borderWidth: 5,
      cornerRadius: 28,
      shadowOffset: 10,
      shadowAlpha: 0.45,
      highlightAlpha: 0.10,
    });
    this.container.add(panel);

    if (config.title) {
      const title = scene.add.text(0, -h / 2 + 60, config.title, {
        fontSize: '44px',
        color: '#ffffff',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
        shadow: { offsetX: 0, offsetY: 3, color: '#000000', blur: 4, fill: true },
      }).setOrigin(0.5);
      this.container.add(title);
    }

    if (config.subtitle) {
      const subtitle = scene.add.text(0, -h / 2 + 110, config.subtitle, {
        fontSize: '24px',
        color: '#ffd866',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      this.container.add(subtitle);
    }

    this.content = scene.add.container(0, 0);
    this.container.add(this.content);

    const btnW = Math.min(w - 80, 360);
    const btn = UIFactory.createButton(
      scene,
      0,
      h / 2 - 70,
      btnW,
      80,
      config.confirmLabel ?? 'CONTINUE',
      () => {
        this.dismiss(() => this.confirmCallback());
      },
      {
        fillColor: config.confirmColor ?? UIPalette.gold,
        borderColor: UIPalette.white,
        cornerRadius: 26,
        fontSize: 30,
        fontColor: '#3a2400',
      },
    );
    this.container.add(btn);

    // Slide in from above with Elastic.easeOut.
    scene.tweens.add({
      targets: this.container,
      y: settledY,
      duration: 900,
      ease: 'Elastic.easeOut',
      easeParams: [1.05, 0.55],
    });
  }

  onConfirm(cb: () => void): this {
    this.confirmCallback = cb;
    return this;
  }

  dismiss(after?: () => void): void {
    if (this.overlay) {
      this.scene.tweens.add({ targets: this.overlay, fillAlpha: 0, duration: 220 });
    }
    this.scene.tweens.add({
      targets: this.container,
      y: -this.height,
      duration: 380,
      ease: 'Back.easeIn',
      onComplete: () => {
        this.container.destroy();
        if (this.overlay) this.overlay.destroy();
        if (after) after();
      },
    });
  }
}
