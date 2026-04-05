// src/systems/InputHandler.ts
import Phaser from 'phaser';

export class InputHandler {
  offsetX: number = 0;
  offsetY: number = 0;
  private dragging: boolean = false;
  private startX: number = 0;
  private startY: number = 0;
  private baseOffsetX: number = 0;
  private baseOffsetY: number = 0;

  constructor(scene: Phaser.Scene) {
    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.dragging = true;
      this.startX = pointer.x;
      this.startY = pointer.y;
      this.baseOffsetX = this.offsetX;
      this.baseOffsetY = this.offsetY;
    });

    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.dragging) {
        this.offsetX = this.baseOffsetX + (pointer.x - this.startX);
        this.offsetY = this.baseOffsetY + (pointer.y - this.startY);
      }
    });

    scene.input.on('pointerup', () => {
      this.dragging = false;
    });
  }

  getNormalized(halfWidth: number): number {
    return Phaser.Math.Clamp(this.offsetX / halfWidth, -1, 1);
  }

  /** Get vertical offset clamped to a limited range (-1 to 1) */
  getNormalizedY(range: number): number {
    return Phaser.Math.Clamp(this.offsetY / range, -1, 1);
  }

  destroy(): void {
    this.dragging = false;
    this.offsetX = 0;
  }
}
