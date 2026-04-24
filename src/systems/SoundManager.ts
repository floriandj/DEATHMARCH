// src/systems/SoundManager.ts
// Procedural sound effects using Web Audio API — no audio files needed.
// Singleton: call SoundManager.init() once, then SoundManager.play('shoot').

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let muted = false;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.35;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  return ctx;
}

function out(): GainNode {
  return masterGain!;
}

// ---------------------------------------------------------------------------
// Low-level audio helpers
// ---------------------------------------------------------------------------

function osc(
  type: OscillatorType, freq: number, duration: number,
  volume: number, dest: AudioNode, startTime: number,
  freqEnd?: number,
): void {
  const c = getCtx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, startTime);
  if (freqEnd !== undefined) {
    o.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 20), startTime + duration);
  }
  g.gain.setValueAtTime(volume, startTime);
  g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  o.connect(g).connect(dest);
  o.start(startTime);
  o.stop(startTime + duration);
}

function noise(duration: number, volume: number, dest: AudioNode, startTime: number, highpass?: number): void {
  const c = getCtx();
  const bufferSize = Math.ceil(c.sampleRate * duration);
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const g = c.createGain();
  g.gain.setValueAtTime(volume, startTime);
  g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  if (highpass) {
    const hp = c.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = highpass;
    src.connect(hp).connect(g).connect(dest);
  } else {
    src.connect(g).connect(dest);
  }
  src.start(startTime);
  src.stop(startTime + duration);
}

// ---------------------------------------------------------------------------
// Sound definitions
// ---------------------------------------------------------------------------

const sounds: Record<string, () => void> = {
  // Generic fallback shoot
  shoot: () => {
    const c = getCtx();
    const t = c.currentTime;
    osc('square', 800, 0.06, 0.15, out(), t, 200);
    noise(0.03, 0.08, out(), t, 4000);
  },

  // ── Per-weapon shoot sounds ──
  shoot_pistol: () => {
    const c = getCtx();
    const t = c.currentTime;
    osc('square', 900, 0.06, 0.14, out(), t, 250);
    noise(0.04, 0.07, out(), t, 5000);
  },
  shoot_smg: () => {
    const c = getCtx();
    const t = c.currentTime;
    osc('square', 1100, 0.04, 0.1, out(), t, 400);
    noise(0.025, 0.06, out(), t, 6000);
  },
  shoot_ar: () => {
    const c = getCtx();
    const t = c.currentTime;
    osc('square', 700, 0.05, 0.13, out(), t, 200);
    noise(0.04, 0.08, out(), t, 4000);
    osc('sawtooth', 350, 0.03, 0.04, out(), t, 150);
  },
  shoot_lmg: () => {
    const c = getCtx();
    const t = c.currentTime;
    osc('sawtooth', 500, 0.06, 0.14, out(), t, 150);
    noise(0.05, 0.1, out(), t, 3000);
  },
  shoot_minigun: () => {
    const c = getCtx();
    const t = c.currentTime;
    osc('sawtooth', 600, 0.03, 0.08, out(), t, 300);
    noise(0.03, 0.06, out(), t, 5000);
  },
  shoot_cryo: () => {
    const c = getCtx();
    const t = c.currentTime;
    osc('sine', 1400, 0.07, 0.1, out(), t, 800);
    osc('triangle', 2000, 0.04, 0.05, out(), t, 1200);
  },
  shoot_railgun: () => {
    const c = getCtx();
    const t = c.currentTime;
    osc('sawtooth', 200, 0.12, 0.18, out(), t, 1500);
    noise(0.06, 0.08, out(), t, 8000);
  },
  shoot_flamer: () => {
    const c = getCtx();
    const t = c.currentTime;
    // Longer hiss + low rumble for whoosh feel
    noise(0.14, 0.14, out(), t, 1200);
    noise(0.10, 0.08, out(), t + 0.02, 3500);
    osc('sawtooth', 140, 0.12, 0.08, out(), t, 60);
    osc('triangle', 220, 0.08, 0.05, out(), t + 0.03, 100);
  },
  shoot_plasma: () => {
    const c = getCtx();
    const t = c.currentTime;
    // Wubby bounce — two staggered sweeps that feel plasma-y
    osc('sine', 700, 0.10, 0.14, out(), t, 1400);
    osc('triangle', 1050, 0.08, 0.07, out(), t + 0.02, 1800);
    osc('sine', 380, 0.06, 0.06, out(), t + 0.05, 200);
  },
  shoot_voidbeam: () => {
    const c = getCtx();
    const t = c.currentTime;
    // Sub-bass whump + dark shimmer
    osc('sine', 60, 0.15, 0.20, out(), t, 30);
    osc('sine', 280, 0.12, 0.13, out(), t, 1600);
    osc('square', 140, 0.10, 0.06, out(), t, 500);
    osc('triangle', 520, 0.08, 0.05, out(), t + 0.03, 900);
    noise(0.08, 0.05, out(), t + 0.02, 9000);
  },
  shoot_godslayer: () => {
    const c = getCtx();
    const t = c.currentTime;
    // Thunderous boom + holy chord on top
    osc('sawtooth', 180, 0.18, 0.22, out(), t, 2600);
    osc('sine', 90, 0.15, 0.14, out(), t, 300);
    osc('sine', 440, 0.22, 0.10, out(), t + 0.04);
    osc('sine', 554, 0.22, 0.09, out(), t + 0.06);
    osc('sine', 659, 0.22, 0.09, out(), t + 0.08);
    noise(0.12, 0.10, out(), t, 5000);
  },

  enemy_hit: () => {
    const c = getCtx();
    const t = c.currentTime;
    osc('square', 300, 0.08, 0.12, out(), t, 100);
  },

  enemy_death: () => {
    const c = getCtx();
    const t = c.currentTime;
    osc('square', 400, 0.1, 0.15, out(), t, 80);
    noise(0.15, 0.12, out(), t + 0.02, 2000);
    osc('sawtooth', 200, 0.12, 0.08, out(), t + 0.05, 50);
  },

  unit_death: () => {
    const c = getCtx();
    const t = c.currentTime;
    osc('sine', 500, 0.15, 0.12, out(), t, 150);
    osc('sine', 350, 0.12, 0.08, out(), t + 0.05, 100);
  },

  gate_positive: () => {
    const c = getCtx();
    const t = c.currentTime;
    osc('sine', 400, 0.1, 0.18, out(), t);
    osc('sine', 600, 0.1, 0.18, out(), t + 0.08);
    osc('sine', 800, 0.15, 0.15, out(), t + 0.16);
  },

  gate_negative: () => {
    const c = getCtx();
    const t = c.currentTime;
    osc('sine', 400, 0.12, 0.15, out(), t, 200);
    osc('sine', 250, 0.15, 0.12, out(), t + 0.08, 150);
  },

  weapon_upgrade: () => {
    const c = getCtx();
    const t = c.currentTime;
    osc('sine', 500, 0.08, 0.2, out(), t);
    osc('sine', 700, 0.08, 0.2, out(), t + 0.07);
    osc('sine', 900, 0.08, 0.2, out(), t + 0.14);
    osc('sine', 1200, 0.2, 0.18, out(), t + 0.21);
  },

  boss_rocket_launch: () => {
    const c = getCtx();
    const t = c.currentTime;
    osc('sawtooth', 100, 0.2, 0.18, out(), t, 500);
    noise(0.15, 0.12, out(), t, 2000);
    osc('sine', 200, 0.15, 0.08, out(), t + 0.05, 600);
  },

  boss_rocket_explode: () => {
    const c = getCtx();
    const t = c.currentTime;
    osc('sine', 80, 0.3, 0.25, out(), t, 25);
    noise(0.25, 0.2, out(), t, 600);
    osc('square', 100, 0.15, 0.1, out(), t + 0.05, 40);
  },

  boss_barrage: () => {
    const c = getCtx();
    const t = c.currentTime;
    osc('square', 500, 0.04, 0.1, out(), t, 200);
    noise(0.03, 0.06, out(), t, 4000);
  },

  stun_hit: () => {
    const c = getCtx();
    const t = c.currentTime;
    osc('sine', 1200, 0.08, 0.12, out(), t, 400);
    osc('triangle', 800, 0.1, 0.06, out(), t + 0.03, 300);
  },

  boss_hit: () => {
    const c = getCtx();
    const t = c.currentTime;
    osc('square', 200, 0.06, 0.12, out(), t, 100);
    noise(0.04, 0.06, out(), t, 3000);
  },

  boss_slam: () => {
    const c = getCtx();
    const t = c.currentTime;
    osc('sine', 80, 0.4, 0.3, out(), t, 30);
    noise(0.3, 0.2, out(), t, 500);
    osc('square', 60, 0.2, 0.15, out(), t + 0.1, 25);
  },

  boss_charge: () => {
    const c = getCtx();
    const t = c.currentTime;
    osc('sawtooth', 150, 0.3, 0.15, out(), t, 400);
    noise(0.2, 0.1, out(), t, 2000);
  },

  boss_death: () => {
    const c = getCtx();
    const t = c.currentTime;
    // Multi-layered explosion
    osc('sine', 120, 0.6, 0.25, out(), t, 30);
    noise(0.5, 0.2, out(), t, 800);
    osc('square', 200, 0.3, 0.15, out(), t + 0.1, 40);
    noise(0.4, 0.15, out(), t + 0.2, 1200);
    osc('sine', 80, 0.5, 0.2, out(), t + 0.3, 20);
    // Victory chime on top
    osc('sine', 600, 0.15, 0.12, out(), t + 0.5);
    osc('sine', 800, 0.15, 0.12, out(), t + 0.6);
    osc('sine', 1000, 0.3, 0.15, out(), t + 0.7);
  },

  boss_enrage: () => {
    const c = getCtx();
    const t = c.currentTime;
    osc('sawtooth', 100, 0.5, 0.2, out(), t, 300);
    osc('square', 150, 0.4, 0.15, out(), t + 0.1, 400);
    noise(0.3, 0.15, out(), t, 1000);
  },

  victory: () => {
    const c = getCtx();
    const t = c.currentTime;
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((f, i) => {
      osc('sine', f, 0.2, 0.2, out(), t + i * 0.12);
      osc('triangle', f, 0.25, 0.08, out(), t + i * 0.12);
    });
  },

  defeat: () => {
    const c = getCtx();
    const t = c.currentTime;
    osc('sine', 400, 0.2, 0.18, out(), t, 300);
    osc('sine', 300, 0.2, 0.18, out(), t + 0.2, 200);
    osc('sine', 200, 0.4, 0.15, out(), t + 0.4, 100);
  },

  button_click: () => {
    const c = getCtx();
    const t = c.currentTime;
    osc('sine', 600, 0.05, 0.1, out(), t);
    osc('sine', 900, 0.06, 0.08, out(), t + 0.03);
  },

  gold_pickup: () => {
    const c = getCtx();
    const t = c.currentTime;
    osc('sine', 1000, 0.06, 0.12, out(), t);
    osc('sine', 1400, 0.08, 0.1, out(), t + 0.04);
  },

  gold_pouch: () => {
    const c = getCtx();
    const t = c.currentTime;
    osc('sine', 800, 0.06, 0.15, out(), t);
    osc('sine', 1100, 0.06, 0.15, out(), t + 0.05);
    osc('sine', 1500, 0.1, 0.12, out(), t + 0.1);
  },

  shop_buy: () => {
    const c = getCtx();
    const t = c.currentTime;
    osc('sine', 600, 0.08, 0.15, out(), t);
    osc('sine', 900, 0.08, 0.15, out(), t + 0.06);
    osc('sine', 1200, 0.12, 0.18, out(), t + 0.12);
    osc('triangle', 600, 0.15, 0.06, out(), t + 0.12);
  },

  shield_absorb: () => {
    const c = getCtx();
    const t = c.currentTime;
    osc('sine', 500, 0.15, 0.15, out(), t, 1000);
    osc('triangle', 800, 0.1, 0.08, out(), t + 0.05, 1200);
  },

  level_start: () => {
    const c = getCtx();
    const t = c.currentTime;
    osc('sine', 400, 0.1, 0.15, out(), t);
    osc('sine', 500, 0.1, 0.15, out(), t + 0.1);
    osc('sine', 650, 0.15, 0.18, out(), t + 0.2);
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const SoundManager = {
  /** Call once on first user interaction to unlock audio context */
  init(): void {
    getCtx();
    const saved = localStorage.getItem('deathmarch-muted');
    muted = saved === 'true';
  },

  play(name: string): void {
    if (muted) return;
    const fn = sounds[name];
    if (fn) {
      try { fn(); } catch { /* ignore audio errors */ }
    }
  },

  get isMuted(): boolean {
    return muted;
  },

  toggleMute(): boolean {
    muted = !muted;
    localStorage.setItem('deathmarch-muted', String(muted));
    return muted;
  },
};
