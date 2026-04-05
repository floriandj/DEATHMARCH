export const GAME_WIDTH = 720;
export const GAME_HEIGHT = 1280;

// Isometric tile dimensions
export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;

// Player army
export const STARTING_UNITS = 1;
export const MARCH_SPEED = 100; // game-units per second
export const UNIT_FIRE_RATE = 200; // ms between bullets per unit (rapid stream)
export const BULLET_SPEED = 400; // pixels per second
export const BULLET_DAMAGE = 1;
export const BULLET_POOL_SIZE = 600;

// Army formation
export const FORMATION_SPACING = 30; // pixels between units in formation

// Gates
export const GATE_INTERVAL = 500; // meters between gate pairs
export const GATE_WIDTH = 120; // pixels wide per gate side
export const GATE_GAP = 40; // pixels between left and right gate

// Battlefield
export const FIELD_WIDTH = 600; // usable width in game coords
export const SPAWN_AHEAD_DISTANCE = 800; // how far ahead enemies spawn

// Boss
export const BOSS_TRIGGER_DISTANCE = 3000;
export const BOSS_HP = 500;
export const BOSS_VULNERABLE_DURATION = 5000; // ms
export const BOSS_SLAM_DURATION = 3000;
export const BOSS_SLAM_WARNING = 1500; // ms before slam hits
export const BOSS_CHARGE_DURATION = 4000;
export const BOSS_ENRAGE_THRESHOLD = 0.2; // 20% HP
export const BOSS_ENRAGE_WARNING = 800; // ms (reduced from 1500)
export const BOSS_DAMAGE_REDUCTION_SLAM = 0.5;

// Scoring
export const SCORE_PER_METER = 1;
export const SCORE_PER_GOBLIN_KILL = 10;
export const SCORE_PER_ORC_KILL = 30;
export const SCORE_PER_TROLL_KILL = 50;
export const SCORE_PER_DEMON_KILL = 40;
export const SCORE_BOSS_KILL = 5000;
export const SCORE_PER_SURVIVING_UNIT = 100;

// Enemy pool
export const ENEMY_POOL_SIZE = 100;
