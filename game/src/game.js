// game.js — the heist itself: the state machine, the thief, the guards and
// their suspicion, the sweeping cameras, the alarm meter, the loot and the
// gadgets (coins to throw, hacks to kill a camera). One update per frame.

import { TUNE, WORLD_W, WORLD_H, WALL, LEVELS } from './config.js';
import { buildLevel, sightBlockers, solidRects, requiredLootLeft, lootCollected } from './levels.js';
import { insideCone, pushCircleOutOfRect } from './vision.js';

export const SCREENS = ['title', 'brief', 'play', 'caught', 'levelclear', 'win', 'gameover'];

export class Game {
  constructor(sound) {
    this.sound = sound;
    this.screen = 'title';
    this.levelIndex = 0;
    this.level = buildLevel(0);
    this.blockers = sightBlockers(this.level.def);
    this.solids = solidRects(this.level.def);
    this.player = this.freshPlayer();
    this.lives = TUNE.startLives;
    this.coins = TUNE.startCoins;
    this.hacks = TUNE.startHacks;
    this.score = 0;
    this.totalTime = 0;
    this.message = '';
    this.messageTimer = 0;
    this.caughtTimer = 0;
    this.clearTimer = 0;
    this.coinFlight = null;
    this.beepTimer = 0;
    this.stepTimer = 0;
    this.crackTimer = 0;
    this.paused = false;
    this.shotMode = false; // staged for screenshots: no simulation
  }

  freshPlayer() {
    const s = this.level.def.playerStart;
    return { x: s.x, y: s.y, r: 13, heading: -Math.PI / 2, moving: false, sneaking: false };
  }

  loadLevel(index) {
    this.levelIndex = index;
    this.level = buildLevel(index);
    this.blockers = sightBlockers(this.level.def);
    this.solids = solidRects(this.level.def);
    this.player = this.freshPlayer();
    this.coins = TUNE.startCoins;
    this.hacks = TUNE.startHacks;
    this.coinFlight = null;
    this.crackTimer = 0;
    this.message = this.level.def.brief;
    this.messageTimer = 4;
    this.screen = 'brief';
  }

  startRun() {
    this.score = 0;
    this.totalTime = 0;
    this.lives = TUNE.startLives;
    this.loadLevel(0);
  }

  restartLevelAfterCaught() {
    this.lives -= 1;
    this.score = Math.max(0, this.score - 100);
    if (this.lives <= 0) {
      this.screen = 'gameover';
      this.sound.stopAlarm();
      this.sound.caught();
      return;
    }
    this.loadLevel(this.levelIndex);
    this.screen = 'caught';
    this.caughtTimer = 2.2;
    this.sound.stopAlarm();
    this.sound.caught();
  }

  // --- helpers ------------------------------------------------------------

  moveCircle(entity, dx, dy) {
    let nx = entity.x + dx;
    let ny = entity.y + dy;
    nx = Math.max(WALL + entity.r, Math.min(WORLD_W - WALL - entity.r, nx));
    ny = Math.max(WALL + entity.r, Math.min(WORLD_H - WALL - entity.r, ny));
    for (const r of this.solids) {
      const fixed = pushCircleOutOfRect(nx, ny, entity.r, r);
      nx = fixed.x;
      ny = fixed.y;
    }
    entity.x = nx;
    entity.y = ny;
  }

  nearestCamera(maxDist) {
    let best = null;
    let bestD = maxDist;
    for (const cam of this.level.cameras) {
      const d = Math.hypot(cam.x - this.player.x, cam.y - this.player.y);
      if (d < bestD) {
        bestD = d;
        best = cam;
      }
    }
    return best;
  }

  nearestSafe() {
    for (const l of this.level.loot) {
      if (l.kind === 'safe' && !l.taken) {
        const d = Math.hypot(l.x - this.player.x, l.y - this.player.y);
        if (d < 70) return l;
      }
    }
    return null;
  }

  guardSeesPlayer(guard) {
    const sneaking = this.player.sneaking;
    const range = TUNE.guardVisionRange * (sneaking ? 0.82 : 1);
    return insideCone(
      guard, guard.heading, range, TUNE.guardVisionHalfAngle, this.player, this.blockers,
    );
  }

  cameraSeesPlayer(cam) {
    if (cam.disabledTimer > 0) return false;
    const angle = cam.baseAngle + Math.sin(cam.phase) * cam.sweep;
    return insideCone(cam, angle, cam.range, TUNE.cameraHalfAngle, this.player, this.blockers);
  }

  // --- main update ----------------------------------------------------------

  update(dt, input) {
    if (this.screen === 'title') {
      if (input.wasPressed('enter') || input.mouse.clicked) this.startRun();
      return;
    }
    if (this.screen === 'brief') {
      if (input.wasPressed('enter') || input.mouse.clicked) this.screen = 'play';
      return;
    }
    if (this.screen === 'caught') {
      this.caughtTimer -= dt;
      if (this.caughtTimer <= 0) this.screen = 'play';
      return;
    }
    if (this.screen === 'levelclear') {
      this.clearTimer -= dt;
      if (this.clearTimer <= 0) {
        if (this.levelIndex + 1 < LEVELS.length) this.loadLevel(this.levelIndex + 1);
        else {
          this.screen = 'win';
          this.score += this.lives * 250;
          this.sound.winFanfare();
        }
      }
      return;
    }
    if (this.screen === 'win' || this.screen === 'gameover') {
      if (input.wasPressed('enter') || input.wasPressed('r')) this.startRun();
      return;
    }
    if (this.screen !== 'play' || this.paused || this.shotMode) return;

    if (input.wasPressed('p')) {
      this.paused = true;
      return;
    }
    if (input.wasPressed('m')) this.sound.setMuted(!this.sound.muted);
    if (input.wasPressed('r')) {
      this.loadLevel(this.levelIndex);
      this.screen = 'play';
      return;
    }

    this.level.time += dt;
    this.totalTime += dt;
    if (this.messageTimer > 0) this.messageTimer -= dt;

    this.updatePlayer(dt, input);
    this.updateGuards(dt);
    this.updateCameras(dt);
    this.updateAlarm(dt);
    this.updateLoot(dt, input);
    this.updateExit();

    if (this.level.lockdownTimer > 0) {
      this.level.lockdownTimer -= dt;
      if (this.level.lockdownTimer <= 0) {
        this.level.lockdown = false;
        this.level.alarm = 55;
        this.message = 'Lockdown lifted — stay out of sight.';
        this.messageTimer = 3;
      }
    }
  }

  updatePlayer(dt, input) {
    const p = this.player;
    const mv = input.moveVector();
    p.sneaking = input.sneaking;
    p.moving = mv.x !== 0 || mv.y !== 0;
    const speed = p.sneaking ? TUNE.sneakSpeed : TUNE.playerSpeed;
    if (p.moving) {
      p.heading = Math.atan2(mv.y, mv.x);
      this.moveCircle(p, mv.x * speed * dt, mv.y * speed * dt);
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        this.sound.footstep(p.sneaking);
        this.stepTimer = p.sneaking ? 0.55 : 0.34;
      }
    }

    // Throw a coin where the mouse clicked: guards go and look at the clink.
    if (input.mouse.clicked && this.coins > 0 && !this.coinFlight) {
      const tx = input.mouse.clickX;
      const ty = input.mouse.clickY;
      const d = Math.hypot(tx - p.x, ty - p.y);
      if (d > 12 && d <= TUNE.coinRange) {
        this.coins -= 1;
        this.coinFlight = { x: p.x, y: p.y, tx, ty, t: 0, dur: 0.35 };
        this.sound.coinThrow();
      }
    }

    // Hack the nearest live camera.
    if (input.wasPressed('e') && this.hacks > 0) {
      const cam = this.nearestCamera(TUNE.hackRange);
      if (cam && cam.disabledTimer <= 0) {
        cam.disabledTimer = TUNE.hackDisableSeconds;
        this.hacks -= 1;
        this.sound.hack();
        this.message = 'Camera disabled for 8 seconds.';
        this.messageTimer = 2.5;
      }
    }

    if (this.coinFlight) {
      const c = this.coinFlight;
      c.t += dt;
      const k = Math.min(1, c.t / c.dur);
      c.x = c.x + (c.tx - c.x) * k;
      c.y = c.y + (c.ty - c.y) * k;
      if (k >= 1) {
        this.level.coins.push({ x: c.tx, y: c.ty, ttl: 6 });
        this.coinFlight = null;
        this.sound.coinLand();
        for (const g of this.level.guards) {
          if (g.state !== 'chase' && Math.hypot(g.x - c.tx, g.y - c.ty) < TUNE.coinLureRadius + 160) {
            g.state = 'investigate';
            g.lastSeen = { x: c.tx, y: c.ty };
            g.investigateTimer = 0;
          }
        }
      }
    }
    for (const coin of this.level.coins) coin.ttl -= dt;
    this.level.coins = this.level.coins.filter((c) => c.ttl > 0);
  }

  updateGuards(dt) {
    const p = this.player;
    for (const g of this.level.guards) {
      const sees = this.guardSeesPlayer(g);
      if (sees) {
        const dist = Math.hypot(p.x - g.x, p.y - g.y);
        const closeness = 1 - dist / (TUNE.guardVisionRange + 40);
        const rate = TUNE.detectRate * (TUNE.detectFalloff + (1 - TUNE.detectFalloff) * Math.max(0, closeness)) * (p.sneaking ? 0.45 : 1);
        const before = g.suspicion;
        g.suspicion = Math.min(1, g.suspicion + rate * dt);
        if (before < 0.35 && g.suspicion >= 0.35) this.sound.spotted();
        g.lastSeen = { x: p.x, y: p.y };
        g.loseSightTimer = 0;
        if (g.suspicion >= 1 && g.state !== 'chase') {
          g.state = 'chase';
          this.message = 'SPOTTED! Run — break line of sight!';
          this.messageTimer = 2.5;
        }
      } else {
        g.suspicion = Math.max(0, g.suspicion - TUNE.suspicionDecay * dt);
        if (g.state === 'chase') {
          g.loseSightTimer += dt;
          if (g.loseSightTimer > 3) {
            g.state = 'investigate';
            g.investigateTimer = 0;
          }
        }
      }

      if (g.state === 'patrol') {
        const target = g.waypoints[g.targetIndex];
        this.walkGuardToward(g, target[0], target[1], g.speed, dt);
        if (Math.hypot(target[0] - g.x, target[1] - g.y) < 8) {
          g.targetIndex = (g.targetIndex + 1) % g.waypoints.length;
          g.pauseTimer = 0.6;
        }
        if (g.suspicion >= 0.35) {
          // Suspicious: turn and stare at where the thief might be.
          g.heading = Math.atan2(p.y - g.y, p.x - g.x);
        }
      } else if (g.state === 'chase') {
        const tx = g.lastSeen ? g.lastSeen.x : p.x;
        const ty = g.lastSeen ? g.lastSeen.y : p.y;
        this.walkGuardToward(g, tx, ty, TUNE.guardChaseSpeed, dt);
        if (Math.hypot(p.x - g.x, p.y - g.y) < TUNE.catchRadius) {
          this.restartLevelAfterCaught();
          return;
        }
      } else if (g.state === 'investigate') {
        const dest = g.lastSeen;
        if (dest && Math.hypot(dest.x - g.x, dest.y - g.y) > 10) {
          this.walkGuardToward(g, dest.x, dest.y, g.speed * 1.25, dt);
        } else {
          g.investigateTimer += dt;
          g.heading += dt * 1.8; // look around
          if (g.investigateTimer > 2.6) {
            g.state = 'return';
            g.lastSeen = null;
          }
        }
      } else if (g.state === 'return') {
        // Walk back to the nearest patrol waypoint, then resume the route.
        let best = 0;
        let bestD = Infinity;
        g.waypoints.forEach((w, i) => {
          const d = Math.hypot(w[0] - g.x, w[1] - g.y);
          if (d < bestD) {
            bestD = d;
            best = i;
          }
        });
        const w = g.waypoints[best];
        this.walkGuardToward(g, w[0], w[1], g.speed, dt);
        if (bestD < 10) {
          g.targetIndex = (best + 1) % g.waypoints.length;
          g.state = 'patrol';
        }
      }
    }
  }

  walkGuardToward(g, tx, ty, speed, dt) {
    if (g.pauseTimer > 0) {
      g.pauseTimer -= dt;
      return;
    }
    const dx = tx - g.x;
    const dy = ty - g.y;
    const d = Math.hypot(dx, dy);
    if (d < 1) return;
    const step = Math.min(d, speed * dt);
    const nx = g.x + (dx / d) * step;
    const ny = g.y + (dy / d) * step;
    const before = { x: g.x, y: g.y };
    this.moveCircle(g, nx - g.x, ny - g.y);
    const moved = Math.hypot(g.x - before.x, g.y - before.y);
    if (moved > 0.1) g.heading = Math.atan2(g.y - before.y, g.x - before.x);
    else g.heading = Math.atan2(dy, dx);
  }

  updateCameras(dt) {
    for (const cam of this.level.cameras) {
      cam.phase += cam.speed * dt;
      if (cam.disabledTimer > 0) cam.disabledTimer -= dt;
      const wasSeeing = cam.seesPlayer;
      cam.seesPlayer = this.cameraSeesPlayer(cam);
      if (cam.seesPlayer && !wasSeeing) {
        this.sound.cameraBeep();
        this.message = 'Camera on you — break its line of sight!';
        this.messageTimer = 2;
      }
    }
    if (this.level.cameras.some((c) => c.seesPlayer)) {
      this.beepTimer -= dt;
      if (this.beepTimer <= 0) {
        this.sound.cameraBeep();
        this.beepTimer = 0.6;
      }
    }
  }

  updateAlarm(dt) {
    const lvl = this.level;
    const anyChase = lvl.guards.some((g) => g.state === 'chase');
    const anySuspicious = lvl.guards.some((g) => g.suspicion >= 0.35 && g.state !== 'chase');
    const anyCamera = lvl.cameras.some((c) => c.seesPlayer);
    if (lvl.lockdown) {
      lvl.alarm = 100;
      this.sound.startAlarm();
      return;
    }
    let rise = 0;
    if (anyChase) rise += TUNE.alarmRiseChase;
    else if (anySuspicious) rise += TUNE.alarmRiseSuspicious;
    if (anyCamera) rise += TUNE.alarmRiseCamera;
    if (rise > 0) lvl.alarm = Math.min(100, lvl.alarm + rise * dt);
    else lvl.alarm = Math.max(0, lvl.alarm - TUNE.alarmDecay * dt);

    if (lvl.alarm >= 30) this.sound.startAlarm();
    else this.sound.stopAlarm();

    if (lvl.alarm >= TUNE.alarmLockdownAt) {
      lvl.lockdown = true;
      lvl.lockdownTimer = TUNE.lockdownSeconds;
      for (const g of lvl.guards) {
        g.state = 'chase';
        g.lastSeen = { x: this.player.x, y: this.player.y };
      }
      this.message = 'LOCKDOWN! Every guard is coming for you!';
      this.messageTimer = 3;
    }
  }

  updateLoot(dt, input) {
    const p = this.player;
    for (const l of this.level.loot) {
      if (l.taken) continue;
      const d = Math.hypot(l.x - p.x, l.y - p.y);
      if (l.kind === 'safe') {
        if (d < 70 && input.keys.has('e')) {
          const before = l.crackProgress;
          l.crackProgress += dt / TUNE.safeCrackSeconds;
          this.crackTimer -= dt;
          if (this.crackTimer <= 0) {
            this.sound.crackTick();
            this.crackTimer = 0.28;
          }
          if (before < 1 && l.crackProgress >= 1) {
            l.taken = true;
            this.score += l.value;
            this.sound.safeOpen();
            this.message = `Vault cracked! +${l.value} points.`;
            this.messageTimer = 3;
          }
        } else {
          l.crackProgress = Math.max(0, l.crackProgress - dt * 0.5);
        }
        continue;
      }
      if (d < TUNE.lootRadius) {
        l.taken = true;
        this.score += l.value;
        this.sound.pickup();
        this.message = `Loot secured! +${l.value} points.`;
        this.messageTimer = 2.5;
      }
    }
    if (requiredLootLeft(this.level) === 0 && !this.level.exitOpen) {
      this.level.exitOpen = true;
      this.message = 'All required loot grabbed — get to the exit!';
      this.messageTimer = 3.5;
      this.sound.levelClear();
    }
  }

  updateExit() {
    if (!this.level.exitOpen) return;
    const e = this.level.def.exit;
    const p = this.player;
    if (p.x > e.x && p.x < e.x + e.w && p.y > e.y && p.y < e.y + e.h) {
      const timeBonus = Math.max(0, Math.round(600 - this.level.time * 5));
      this.score += 500 + timeBonus;
      this.sound.stopAlarm();
      this.sound.levelClear();
      this.screen = 'levelclear';
      this.clearTimer = 2.4;
    }
  }

  // Readable snapshot for the HUD and for tests.
  hud() {
    return {
      levelName: this.level.def.name,
      levelIndex: this.levelIndex,
      lootGot: lootCollected(this.level),
      lootTotal: this.level.loot.length,
      requiredLeft: requiredLootLeft(this.level),
      alarm: Math.round(this.level.alarm),
      lockdown: this.level.lockdown,
      lives: this.lives,
      coins: this.coins,
      hacks: this.hacks,
      score: this.score,
      time: Math.floor(this.level.time),
      exitOpen: this.level.exitOpen,
    };
  }
}
