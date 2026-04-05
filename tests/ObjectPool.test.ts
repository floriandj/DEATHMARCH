// tests/ObjectPool.test.ts
import { describe, it, expect, vi } from 'vitest';
import { ObjectPool } from '../src/systems/ObjectPool';

describe('ObjectPool', () => {
  it('creates items up to pool size using factory', () => {
    const factory = vi.fn(() => ({ active: false, value: 0 }));
    const pool = new ObjectPool(factory, 5);
    expect(factory).toHaveBeenCalledTimes(5);
  });

  it('acquires an inactive item from the pool', () => {
    const pool = new ObjectPool(() => ({ active: false }), 3);
    const item = pool.acquire();
    expect(item).not.toBeNull();
    expect(item!.active).toBe(true);
  });

  it('returns null when all items are active', () => {
    const pool = new ObjectPool(() => ({ active: false }), 2);
    pool.acquire();
    pool.acquire();
    const third = pool.acquire();
    expect(third).toBeNull();
  });

  it('releases an item back to the pool', () => {
    const pool = new ObjectPool(() => ({ active: false }), 1);
    const item = pool.acquire();
    expect(item).not.toBeNull();
    pool.release(item!);
    expect(item!.active).toBe(false);
    const reacquired = pool.acquire();
    expect(reacquired).not.toBeNull();
  });

  it('calls reset callback on release if provided', () => {
    const reset = vi.fn();
    const pool = new ObjectPool(() => ({ active: false }), 1, reset);
    const item = pool.acquire()!;
    pool.release(item);
    expect(reset).toHaveBeenCalledWith(item);
  });

  it('iterates over active items with forEach', () => {
    const pool = new ObjectPool(() => ({ active: false, id: 0 }), 5);
    const a = pool.acquire()!;
    a.id = 1;
    const b = pool.acquire()!;
    b.id = 2;
    const seen: number[] = [];
    pool.forEach((item) => seen.push(item.id));
    expect(seen).toEqual([1, 2]);
  });

  it('reports active count', () => {
    const pool = new ObjectPool(() => ({ active: false }), 3);
    expect(pool.activeCount).toBe(0);
    pool.acquire();
    expect(pool.activeCount).toBe(1);
    pool.acquire();
    expect(pool.activeCount).toBe(2);
  });

  it('releaseAll deactivates everything', () => {
    const pool = new ObjectPool(() => ({ active: false }), 3);
    pool.acquire();
    pool.acquire();
    pool.acquire();
    expect(pool.activeCount).toBe(3);
    pool.releaseAll();
    expect(pool.activeCount).toBe(0);
  });
});
