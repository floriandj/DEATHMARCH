// src/systems/InputHandler.ts
import Phaser from 'phaser';

export class InputHandler {
  /** Normalized X position: -1 (left edge) to 1 (right edge) */
  normalizedX: number = 0;

  offsetY: number = 0;
  private dragging: boolean = false;
  private startY: number = 0;
  private baseOffsetY: number = 0;
  private gameWidth: number;
  private targetNormX: number = 0;

  constructor(scene: Phaser.Scene) {
    this.gameWidth = scene.scale.width;

    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.dragging = true;
      this.targetNormX = Phaser.Math.Clamp((pointer.x / this.gameWidth) * 2 - 1, -1, 1);
      this.startY = pointer.y;
      this.baseOffsetY = this.offsetY;
    });

    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.dragging) {
        this.targetNormX = Phaser.Math.Clamp((pointer.x / this.gameWidth) * 2 - 1, -1, 1);
        this.offsetY = this.baseOffsetY + (pointer.y - this.startY);
      }
    });

    scene.input.on('pointerup', () => {
      this.dragging = false;
    });
  }

  /** Call each frame to smoothly lerp toward finger position */
  update(dt: number): void {
    const speed = 8; // lerp speed factor
    this.normalizedX = Phaser.Math.Linear(this.normalizedX, this.targetNormX, 1 - Math.exp(-speed * dt));
  }

  getNormalized(_halfWidth: number): number {
    return this.normalizedX;
  }

  /** Get vertical offset clamped to a limited range (-1 to 1) */
  getNormalizedY(range: number): number {
    return Phaser.Math.Clamp(this.offsetY / range, -1, 1);
  }

  destroy(): void {
    this.dragging = false;
    this.normalizedX = 0;
    this.targetNormX = 0;
    this.offsetY = 0;
  }
}
