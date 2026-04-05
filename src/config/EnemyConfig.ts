export type EnemyType = 'goblin' | 'orc' | 'troll' | 'demon';

export interface EnemyStats {
  type: EnemyType;
  hp: number;
  speed: number; // pixels per second
  size: number; // sprite radius in pixels
  contactDamage: number; // units killed on contact
  splashRadius: number; // 0 = no splash
  splashDamage: number; // extra units killed by splash
  color: number; // hex color for placeholder
  appearsAtDistance: number;
  scoreValue: number;
}

export const ENEMY_STATS: Record<EnemyType, EnemyStats> = {
  goblin: {
    type: 'goblin',
    hp: 1,
    speed: 120,
    size: 12,
    contactDamage: 1,
    splashRadius: 0,
    splashDamage: 0,
    color: 0xff6b6b,
    appearsAtDistance: 0,
    scoreValue: 10,
  },
  orc: {
    type: 'orc',
    hp: 3,
    speed: 80,
    size: 16,
    contactDamage: 2,
    splashRadius: 0,
    splashDamage: 0,
    color: 0xe64980,
    appearsAtDistance: 300,
    scoreValue: 30,
  },
  troll: {
    type: 'troll',
    hp: 8,
    speed: 50,
    size: 22,
    contactDamage: 3,
    splashRadius: 0,
    splashDamage: 0,
    color: 0xbe4bdb,
    appearsAtDistance: 600,
    scoreValue: 50,
  },
  demon: {
    type: 'demon',
    hp: 5,
    speed: 160,
    size: 16,
    contactDamage: 2,
    splashRadius: 50,
    splashDamage: 1,
    color: 0xffd43b,
    appearsAtDistance: 900,
    scoreValue: 40,
  },
};

/** Returns which enemy types are available at a given distance */
export function getAvailableTypes(distance: number): EnemyType[] {
  return (Object.values(ENEMY_STATS) as EnemyStats[])
    .filter((s) => distance >= s.appearsAtDistance)
    .map((s) => s.type);
}

/**
 * Returns a weighted random enemy type for the given distance.
 * Later types get higher weight as distance increases.
 */
export function pickEnemyType(distance: number): EnemyType {
  const available = getAvailableTypes(distance);
  if (available.length === 1) return available[0];

  // Weight newer types more heavily
  const weights = available.map((type) => {
    const stats = ENEMY_STATS[type];
    const distancePastIntro = distance - stats.appearsAtDistance;
    return Math.max(1, Math.floor(distancePastIntro / 100));
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;

  for (let i = 0; i < available.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return available[i];
  }

  return available[available.length - 1];
}
