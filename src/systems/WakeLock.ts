// src/systems/WakeLock.ts
// Keeps the screen awake using the Screen Wake Lock API.

let wakeLock: WakeLockSentinel | null = null;

async function request(): Promise<void> {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await (navigator as any).wakeLock.request('screen');
      wakeLock!.addEventListener('release', () => { wakeLock = null; });
    }
  } catch { /* permission denied or not supported */ }
}

function onVisibilityChange(): void {
  if (document.visibilityState === 'visible') {
    request();
  }
}

export const WakeLock = {
  async enable(): Promise<void> {
    await request();
    document.addEventListener('visibilitychange', onVisibilityChange);
  },

  disable(): void {
    document.removeEventListener('visibilitychange', onVisibilityChange);
    if (wakeLock) {
      wakeLock.release();
      wakeLock = null;
    }
  },
};
