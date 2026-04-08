// src/systems/InputHandler.ts
import Phaser from 'phaser';

export class InputHandler {
  /** Normalized X position: -1 (full left) to 1 (full right) */
  normalizedX: number = 0;
  offsetY: number = 0;

  private gameWidth: number;
  private gameHeight: number;
  private targetNormX: number = 0;
  private targetOffsetY: number = 0;
  private activePointerId: number | null = null;
  private joystickBaseX: number;
  private joystickBaseY: number;
  private joystickRadius: number = 88;
  private joystickAreaRadius: number = 140;
  private joystickContainer: Phaser.GameObjects.Container;
  private joystickBase: Phaser.GameObjects.Graphics;
  private joystickThumb: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.gameWidth = scene.scale.width;
    this.gameHeight = scene.scale.height;
    this.joystickBaseX = 120;
    this.joystickBaseY = this.gameHeight - 120;

    this.joystickBase = scene.add.graphics().setDepth(40).setScrollFactor(0);
    this.joystickThumb = scene.add.graphics().setDepth(41).setScrollFactor(0);
    this.joystickContainer = scene.add.container(0, 0, [this.joystickBase, this.joystickThumb]).setDepth(40);

    this.drawJoystick(0, 0, false);
    this.joystickContainer.setVisible(false);

    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.activePointerId !== null) return;
      this.activePointerId = pointer.id;
      this.joystickContainer.setVisible(true);
      this.joystickBaseX = Phaser.Math.Clamp(pointer.x, this.joystickRadius + 16, this.gameWidth - this.joystickRadius - 16);
      this.joystickBaseY = Phaser.Math.Clamp(pointer.y, this.joystickRadius + 16, this.gameHeight - this.joystickRadius - 16);
      const rawX = Phaser.Math.Clamp((pointer.x - this.joystickBaseX) / this.joystickRadius, -1, 1);
      const rawY = Phaser.Math.Clamp((pointer.y - this.joystickBaseY) / this.joystickRadius, -1, 1);
      this.targetNormX = Math.abs(rawX) < 0.14 ? 0 : rawX;
      this.targetOffsetY = Math.abs(rawY) < 0.14 ? 0 : rawY;
      this.drawJoystick(this.targetNormX, this.targetOffsetY, true);
    });

    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.activePointerId !== pointer.id) return;
      const rawX = Phaser.Math.Clamp((pointer.x - this.joystickBaseX) / this.joystickRadius, -1, 1);
      const rawY = Phaser.Math.Clamp((pointer.y - this.joystickBaseY) / this.joystickRadius, -1, 1);
      this.targetNormX = Math.abs(rawX) < 0.14 ? 0 : rawX;
      this.targetOffsetY = Math.abs(rawY) < 0.14 ? 0 : rawY;
      this.drawJoystick(this.targetNormX, this.targetOffsetY, true);
    });

    scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.activePointerId !== pointer.id) return;
      this.activePointerId = null;
      this.targetNormX = 0;
      this.targetOffsetY = 0;
      this.drawJoystick(0, 0, false);
      this.joystickContainer.setVisible(false);
    });
  }

  /** Call each frame to smoothly lerp toward joystick position */
  update(dt: number): void {
    if (this.activePointerId !== null) {
      this.normalizedX = this.targetNormX;
      this.offsetY = this.targetOffsetY * 200;
      return;
    }

    const speed = 18;
    this.normalizedX = Phaser.Math.Linear(this.normalizedX, 0, 1 - Math.exp(-speed * dt));
    this.offsetY = Phaser.Math.Linear(this.offsetY, 0, 1 - Math.exp(-speed * dt));
  }

  getNormalized(_halfWidth: number): number {
    return this.normalizedX;
  }

  /** Get vertical offset clamped to a limited range (-1 to 1) */
  getNormalizedY(range: number): number {
    return Phaser.Math.Clamp(this.offsetY / range, -1, 1);
  }

  destroy(): void {
    this.activePointerId = null;
    this.normalizedX = 0;
    this.targetNormX = 0;
    this.offsetY = 0;
    this.targetOffsetY = 0;
    this.drawJoystick(0, 0, false);
  }

  private drawJoystick(normX: number, normY: number, active: boolean): void {
    const radius = this.joystickRadius;
    const baseX = this.joystickBaseX;
    const baseY = this.joystickBaseY;
    const thumbX = baseX + normX * radius * 0.78;
    const thumbY = baseY + normY * radius * 0.78;

    this.joystickBase.clear();
    this.joystickBase.fillStyle(0x1f3c5f, active ? 0.32 : 0.24);
    this.joystickBase.fillCircle(baseX, baseY, radius + 8);
    this.joystickBase.lineStyle(2, 0x80c2ff, 0.45);
    this.joystickBase.strokeCircle(baseX, baseY, radius + 8);
    this.joystickBase.fillStyle(0x4c81c8, active ? 0.24 : 0.18);
    this.joystickBase.fillCircle(baseX, baseY, radius);
    this.joystickBase.lineStyle(3, 0xffffff, 0.10);
    this.joystickBase.strokeCircle(baseX, baseY, radius);

    this.joystickThumb.clear();
    this.joystickThumb.fillStyle(0xffffff, 0.85);
    this.joystickThumb.fillCircle(thumbX, thumbY, radius * 0.34);
    this.joystickThumb.fillStyle(0x4c81c8, 0.85);
    this.joystickThumb.fillCircle(thumbX, thumbY, radius * 0.22);
    if (active) {
      this.joystickThumb.lineStyle(2, 0x80c2ff, 0.8);
      this.joystickThumb.strokeCircle(thumbX, thumbY, radius * 0.34);
    }
  }
}
