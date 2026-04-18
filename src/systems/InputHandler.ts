// src/systems/InputHandler.ts
import Phaser from 'phaser';

export class InputHandler {
  /** Normalized X for keyboard steering: -1 (left) to 1 (right). 0 when no key held. */
  normalizedX: number = 0;

  private activePointers: Set<number> = new Set();
  private pointerScreenX: number = 0;

  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
  private keyA: Phaser.Input.Keyboard.Key | undefined;
  private keyD: Phaser.Input.Keyboard.Key | undefined;

  constructor(scene: Phaser.Scene) {
    // Make sure multi-touch pointers are available (Phaser defaults to 1)
    scene.input.addPointer(2);

    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.activePointers.add(pointer.id);
      this.pointerScreenX = pointer.x;
    });

    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown) return;
      this.activePointers.add(pointer.id); // self-heal if down was missed
      this.pointerScreenX = pointer.x;
    });

    scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      this.activePointers.delete(pointer.id);
    });

    scene.input.on('pointerupoutside', (pointer: Phaser.Input.Pointer) => {
      this.activePointers.delete(pointer.id);
    });

    // Keyboard controls (left/right arrows + A/D)
    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.keyA = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyD = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    }
  }

  /** Call each frame — currently only refreshes keyboard-derived normalizedX. */
  update(_dt: number): void {
    this.normalizedX = this.getKeyboardX();
  }

  /** Screen X of the active pointer, or null when no pointer is down. */
  getPointerScreenX(): number | null {
    return this.activePointers.size === 0 ? null : this.pointerScreenX;
  }

  private getKeyboardX(): number {
    const left = (this.cursors?.left?.isDown ?? false) || (this.keyA?.isDown ?? false);
    const right = (this.cursors?.right?.isDown ?? false) || (this.keyD?.isDown ?? false);
    if (left && right) return 0;
    if (left) return -1;
    if (right) return 1;
    return 0;
  }

  getNormalized(_halfWidth: number): number {
    return this.normalizedX;
  }

  destroy(): void {
    this.activePointers.clear();
    this.normalizedX = 0;
  }
}
