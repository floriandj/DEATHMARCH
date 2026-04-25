// src/systems/ObjectPool.ts
export interface Poolable {
  active: boolean;
}

export class ObjectPool<T extends Poolable> {
  private items: T[];
  private freeStack: T[];
  private resetFn?: (item: T) => void;

  constructor(factory: () => T, size: number, resetFn?: (item: T) => void) {
    this.resetFn = resetFn;
    this.items = [];
    this.freeStack = [];
    for (let i = 0; i < size; i++) {
      this.items.push(factory());
    }
    // Seed in reverse so the first acquire() returns items[0] (preserves
    // the natural ordering that callers/tests rely on for forEach).
    for (let i = this.items.length - 1; i >= 0; i--) {
      this.freeStack.push(this.items[i]);
    }
  }

  acquire(): T | null {
    const item = this.freeStack.pop();
    if (!item) return null;
    item.active = true;
    return item;
  }

  release(item: T): void {
    if (!item.active) return;
    item.active = false;
    if (this.resetFn) {
      this.resetFn(item);
    }
    this.freeStack.push(item);
  }

  releaseAll(): void {
    for (const item of this.items) {
      if (item.active) {
        this.release(item);
      }
    }
  }

  forEach(callback: (item: T) => void): void {
    for (const item of this.items) {
      if (item.active) {
        callback(item);
      }
    }
  }

  get activeCount(): number {
    return this.items.length - this.freeStack.length;
  }
}
