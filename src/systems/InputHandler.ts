// src/systems/InputHandler.ts
import Phaser from 'phaser';

export class InputHandler {
  offsetX: number = 0;
  private dragging: boolean = false;
  private startX: number = 0;
  private baseOffsetX: number = 0;

  constructor(scene: Phaser.Scene) {
    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.dragging = true;
      this.startX = pointer.x;
      this.baseOffsetX = this.offsetX; // remember current position
    });

    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.dragging) {
        this.offsetX = this.baseOffsetX + (pointer.x - this.startX);
      }
    });

    scene.input.on('pointerup', () => {
      this.dragging = false;
    });
  }

  getNormalized(halfWidth: number): number {
    return Phaser.Math.Clamp(this.offsetX / halfWidth, -1, 1);
  }

  destroy(): void {
    this.dragging = false;
    this.offsetX = 0;
  }
}
