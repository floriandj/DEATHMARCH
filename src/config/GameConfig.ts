export const GAME_WIDTH = 720;
// Dynamic height: use container height / constrained width so full viewport height is used
const _containerWidth = typeof window !== 'undefined' ? Math.min(window.innerWidth, 480) : 480;
const _aspectRatio = typeof window !== 'undefined' ? window.innerHeight / _containerWidth : 16 / 9;
export const GAME_HEIGHT = Math.round(GAME_WIDTH * _aspectRatio);

// Isometric tile dimensions
export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;

// Player army
export const STARTING_UNITS = 1;
export const MARCH_SPEED = 130; // game-units per second
export const UNIT_FIRE_RATE = 500; // ms between bullets per unit (slower but stronger)
export const BULLET_SPEED = 400; // pixels per second
export const BULLET_DAMAGE = 3;
export const BULLET_POOL_SIZE = 3000;
export const BULLET_TOP_CULL_MARGIN = 300; // bullets despawn this many px below the top of the visible screen

// Army formation
export const FORMATION_SPACING = 30; // pixels between units in formation

// Army movement (shared between GameScene and BossScene)
export const ARMY_INPUT_Y_RANGE = 200; // drag range for Y input normalization (lower = more responsive)
export const ARMY_START_WORLD_Y = 120; // initial world offset so the army starts higher on screen
export const ARMY_SCREEN_BOTTOM_OFFSET = 460; // pixels from bottom of screen where the army is pinned
export const ARMY_Y_OFFSET_FORWARD_MAX = 420; // max pixels the army can nudge toward the front
export const ARMY_Y_OFFSET_BACK_MAX = 120; // max pixels the army can nudge toward the back
export const ARMY_LATERAL_SPEED = 480; // pixels per second for keyboard X movement
export const ARMY_FOLLOW_STRENGTH = 10; // exponential lerp strength for finger-follow (higher = snappier)
export const MAX_UNITS = 200; // unit count cap; excess units from gates/perks convert to +1 gold each
export const ARMY_VERTICAL_SPEED = 360; // pixels per second for joystick Y movement

// Gates
export const GATE_INTERVAL = 800; // meters between gate pairs
export const GATE_WIDTH = 280; // pixels wide per gate side
export const GATE_GAP = 16; // pixels between left and right gate

// Battlefield
export const FIELD_WIDTH = 700; // usable width in game coords
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

// SVGs render at 4x their viewBox pixel size for sharp display
export const SVG_RENDER_SCALE = 4;

// Global sprite scale multiplier for all game entities (units, enemies, bosses, bullets)
export const ENTITY_SCALE = 2;

