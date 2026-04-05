// src/systems/ObjectPool.ts
export interface Poolable {
  active: boolean;
}

export class ObjectPool<T extends Poolable> {
  private items: T[];
  private resetFn?: (item: T) => void;

  constructor(factory: () => T, size: number, resetFn?: (item: T) => void) {
    this.resetFn = resetFn;
    this.items = [];
    for (let i = 0; i < size; i++) {
      this.items.push(factory());
    }
  }

  acquire(): T | null {
    for (const item of this.items) {
      if (!item.active) {
        item.active = true;
        return item;
      }
    }
    return null;
  }

  release(item: T): void {
    item.active = false;
    if (this.resetFn) {
      this.resetFn(item);
    }
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
    let count = 0;
    for (const item of this.items) {
      if (item.active) count++;
    }
    return count;
  }
}
