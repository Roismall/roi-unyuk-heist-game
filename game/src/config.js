// config.js — constants, palette and the three level layouts for Meridian Heist.
// Every level fits in one 1280x800 frame: the whole room, its guards, its
// cameras, its loot and the exit are always visible at once.

export const WORLD_W = 1280;
export const WORLD_H = 800;
export const WALL = 16; // outer wall thickness
export const HUD_H = 52; // top HUD bar height (screen space, above the world)
export const HINT_H = 26; // bottom control-hint bar height (screen space)

export const PALETTE = {
  floorA: '#1c2436',
  floorB: '#202a40',
  floorLine: '#2a3550',
  carpet: '#5a1f2b',
  wall: '#39415a',
  wallTop: '#5b6a8c',
  coverWood: '#6b4f2a',
  coverMetal: '#3d5a66',
  coverCase: '#274b5e',
  player: '#19c2a6',
  playerDark: '#0e7a6a',
  guard: '#e8b13c',
  guardDark: '#8a6a1d',
  conePatrol: 'rgba(232, 177, 60, 0.20)',
  coneSuspicious: 'rgba(255, 140, 40, 0.28)',
  coneChase: 'rgba(255, 60, 60, 0.32)',
  coneCamera: 'rgba(255, 70, 110, 0.22)',
  coneCameraOff: 'rgba(120, 130, 150, 0.10)',
  lootGold: '#ffd94a',
  lootGem: '#59e6ff',
  exitOk: '#2ee66b',
  exitLocked: '#e5484d',
  hudBg: '#0d1220',
  text: '#e8ecf4',
  textDim: '#9aa7bd',
};

export const TUNE = {
  playerSpeed: 205,
  sneakSpeed: 105,
  guardSpeed: 58,
  guardChaseSpeed: 148,
  guardVisionRange: 185,
  guardVisionHalfAngle: 0.61, // ~35 degrees
  cameraRange: 235,
  cameraHalfAngle: 0.49, // ~28 degrees
  detectRate: 1.15, // suspicion per second at point blank
  detectFalloff: 0.45, // suspicion rate multiplier at max range
  suspicionDecay: 0.35,
  alarmRiseChase: 13,
  alarmRiseSuspicious: 4,
  alarmRiseCamera: 11,
  alarmDecay: 3.2,
  alarmLockdownAt: 100,
  lockdownSeconds: 10,
  coinRange: 340,
  coinLureRadius: 150,
  hackRange: 230,
  hackDisableSeconds: 8,
  safeCrackSeconds: 3.0,
  catchRadius: 24,
  lootRadius: 34,
  startLives: 3,
  startCoins: 3,
  startHacks: 2,
};

// A wall/furniture rect: { x, y, w, h }. Blocks movement and line of sight.
// A guard: { waypoints: [[x, y], ...], speed }.
// A camera: { x, y, angle, sweep, speed, range } — angle is the centre of its
// sweep in radians, sweep is how far it swings each way, speed is rad/sec.
// A loot: { x, y, kind: 'painting' | 'gold' | 'safe' | 'diamond', required, value }.
// The exit: { x, y, w, h, label }.

export const LEVELS = [
  {
    name: 'LEVEL 1 — THE MERIDIAN GALLERY',
    brief: 'Lift all three paintings, then slip back out the service door.',
    walls: [
      { x: 430, y: 16, w: 18, h: 520 },
      { x: 430, y: 664, w: 18, h: 120 },
      { x: 448, y: 470, w: 500, h: 18 },
      { x: 1072, y: 470, w: 192, h: 18 },
    ],
    furniture: [
      { x: 560, y: 120, w: 120, h: 48, kind: 'case' },
      { x: 760, y: 120, w: 120, h: 48, kind: 'case' },
      { x: 960, y: 120, w: 120, h: 48, kind: 'case' },
      { x: 560, y: 360, w: 120, h: 48, kind: 'case' },
      { x: 960, y: 360, w: 120, h: 48, kind: 'case' },
      { x: 120, y: 120, w: 90, h: 90, kind: 'crate' },
      { x: 260, y: 300, w: 70, h: 70, kind: 'crate' },
      { x: 120, y: 480, w: 90, h: 60, kind: 'crate' },
      { x: 600, y: 600, w: 160, h: 60, kind: 'desk' },
      { x: 1000, y: 600, w: 160, h: 60, kind: 'desk' },
    ],
    loot: [
      { x: 620, y: 44, kind: 'painting', required: true, value: 300 },
      { x: 820, y: 44, kind: 'painting', required: true, value: 300 },
      { x: 1020, y: 44, kind: 'painting', required: true, value: 300 },
      { x: 1150, y: 700, kind: 'gold', required: false, value: 150 },
    ],
    guards: [
      { waypoints: [[520, 240], [1180, 240], [1180, 420], [520, 420]], speed: 56 },
      { waypoints: [[560, 700], [1180, 700], [1180, 560], [560, 560]], speed: 50 },
    ],
    cameras: [
      { x: 700, y: 18, angle: Math.PI / 2, sweep: 0.9, speed: 0.45, range: 235 },
      { x: 1262, y: 560, angle: Math.PI, sweep: 0.8, speed: 0.55, range: 225 },
    ],
    exit: { x: 24, y: 700, w: 72, h: 76, label: 'EXIT' },
    playerStart: { x: 70, y: 740 },
  },
  {
    name: 'LEVEL 2 — THE VAULT FLOOR',
    brief: 'Crack the vault safe — hold E beside it — and lift the gold bars.',
    walls: [
      { x: 430, y: 16, w: 18, h: 500 },
      { x: 430, y: 620, w: 18, h: 164 },
      { x: 448, y: 400, w: 420, h: 18 },
      { x: 992, y: 400, w: 272, h: 18 },
      { x: 850, y: 16, w: 18, h: 240 },
    ],
    furniture: [
      { x: 1100, y: 660, w: 100, h: 90, kind: 'safe' },
      { x: 560, y: 120, w: 120, h: 48, kind: 'case' },
      { x: 700, y: 260, w: 120, h: 48, kind: 'case' },
      { x: 1000, y: 120, w: 120, h: 48, kind: 'case' },
      { x: 560, y: 560, w: 140, h: 56, kind: 'desk' },
      { x: 900, y: 620, w: 140, h: 56, kind: 'desk' },
      { x: 120, y: 120, w: 90, h: 90, kind: 'crate' },
      { x: 280, y: 420, w: 70, h: 70, kind: 'crate' },
      { x: 120, y: 560, w: 90, h: 60, kind: 'crate' },
    ],
    loot: [
      { x: 620, y: 44, kind: 'gold', required: true, value: 250 },
      { x: 1020, y: 44, kind: 'gold', required: true, value: 250 },
      { x: 1150, y: 640, kind: 'safe', required: true, value: 600 },
      { x: 200, y: 120, kind: 'painting', required: false, value: 200 },
    ],
    guards: [
      { waypoints: [[520, 200], [1180, 200], [1180, 340], [520, 340]], speed: 60 },
      { waypoints: [[560, 700], [1180, 700], [1180, 480], [560, 480]], speed: 54 },
      { waypoints: [[220, 120], [220, 700], [360, 700], [360, 120]], speed: 52 },
    ],
    cameras: [
      { x: 640, y: 18, angle: Math.PI / 2, sweep: 0.85, speed: 0.5, range: 240 },
      { x: 1262, y: 480, angle: Math.PI, sweep: 0.75, speed: 0.6, range: 230 },
      { x: 18, y: 400, angle: 0, sweep: 0.7, speed: 0.45, range: 220 },
    ],
    exit: { x: 24, y: 700, w: 72, h: 76, label: 'EXIT' },
    playerStart: { x: 70, y: 740 },
  },
  {
    name: 'LEVEL 3 — ROOFTOP GETAWAY',
    brief: 'Take the Meridian Diamond and reach the helipad. Do not get seen.',
    walls: [
      { x: 120, y: 120, w: 220, h: 140 },
    ],
    furniture: [
      { x: 560, y: 300, w: 160, h: 160, kind: 'glasscase' },
      { x: 200, y: 520, w: 130, h: 70, kind: 'planter' },
      { x: 480, y: 620, w: 130, h: 70, kind: 'planter' },
      { x: 880, y: 620, w: 130, h: 70, kind: 'planter' },
      { x: 980, y: 200, w: 110, h: 70, kind: 'ac' },
      { x: 180, y: 300, w: 110, h: 70, kind: 'ac' },
      { x: 760, y: 120, w: 130, h: 60, kind: 'planter' },
    ],
    loot: [
      { x: 640, y: 380, kind: 'diamond', required: true, value: 1000 },
      { x: 260, y: 680, kind: 'gold', required: false, value: 200 },
      { x: 1080, y: 680, kind: 'gold', required: false, value: 200 },
    ],
    guards: [
      { waypoints: [[460, 240], [820, 240], [820, 520], [460, 520]], speed: 66 },
      { waypoints: [[180, 420], [420, 680], [1100, 680], [1100, 420]], speed: 62 },
      { waypoints: [[900, 120], [1180, 120], [1180, 300], [900, 300]], speed: 58 },
    ],
    cameras: [
      { x: 18, y: 18, angle: Math.PI / 4, sweep: 0.7, speed: 0.5, range: 250 },
      { x: 1262, y: 18, angle: (3 * Math.PI) / 4, sweep: 0.7, speed: 0.55, range: 250 },
      { x: 18, y: 782, angle: -Math.PI / 4, sweep: 0.7, speed: 0.6, range: 250 },
      { x: 1262, y: 782, angle: (-3 * Math.PI) / 4, sweep: 0.7, speed: 0.5, range: 250 },
    ],
    exit: { x: 1120, y: 60, w: 120, h: 120, label: 'HELIPAD' },
    playerStart: { x: 70, y: 740 },
  },
];
