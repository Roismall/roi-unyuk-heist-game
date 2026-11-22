// levels.js — turns a level definition from config.js into live runtime
// state: guards with patrol state, cameras with sweep phase, loot with
// collected flags, and the full list of sight-blocking rectangles.

import { LEVELS, WALL } from './config.js';

// Every wall and furniture rect blocks sight; the outer border does too.
export function sightBlockers(level) {
  const blockers = [...level.walls, ...level.furniture];
  blockers.push({ x: 0, y: 0, w: 1280, h: WALL });
  blockers.push({ x: 0, y: 800 - WALL, w: 1280, h: WALL });
  blockers.push({ x: 0, y: 0, w: WALL, h: 800 });
  blockers.push({ x: 1280 - WALL, y: 0, w: WALL, h: 800 });
  return blockers;
}

// All solid rects the player and guards collide with.
export function solidRects(level) {
  return sightBlockers(level);
}

export function buildLevel(index) {
  const def = LEVELS[index];
  return {
    def,
    index,
    guards: def.guards.map((g) => ({
      waypoints: g.waypoints,
      speed: g.speed,
      x: g.waypoints[0][0],
      y: g.waypoints[0][1],
      r: 13,
      heading: 0,
      targetIndex: 1,
      // patrol | suspicious | chase | investigate | return
      state: 'patrol',
      suspicion: 0,
      lastSeen: null,
      loseSightTimer: 0,
      investigateTimer: 0,
      pauseTimer: 0,
    })),
    cameras: def.cameras.map((c) => ({
      x: c.x,
      y: c.y,
      baseAngle: c.angle,
      sweep: c.sweep,
      speed: c.speed,
      range: c.range,
      phase: Math.random() * Math.PI * 2,
      disabledTimer: 0,
      seesPlayer: false,
    })),
    loot: def.loot.map((l) => ({
      x: l.x,
      y: l.y,
      kind: l.kind,
      required: l.required,
      value: l.value,
      taken: false,
      crackProgress: 0,
    })),
    coins: [],
    alarm: 0,
    lockdownTimer: 0,
    lockdown: false,
    exitOpen: false,
    time: 0,
  };
}

export function requiredLootLeft(level) {
  return level.loot.filter((l) => l.required && !l.taken).length;
}

export function lootCollected(level) {
  return level.loot.filter((l) => l.taken).length;
}
