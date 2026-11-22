// Meridian Heist — game state, input, movement, patrols and detection.
// Owns the rules: sneak, gadgets, suspicion, alarm, loot and exits.
import { LEVELS } from "./levels.js";
import { SoundFX } from "./audio.js";
import { drawGame } from "./render.js";

export const VIEW_W = 960;
export const VIEW_H = 600;

const PLAYER_R = 11;
const WALK_SPEED = 2.7;
const SNEAK_SPEED = 1.5;
const CONE_HALF = 0.62; // radians, half-angle of a vision cone

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

// Segment (x1,y1)-(x2,y2) vs axis-aligned rect [x,y,w,h].
function segHitsRect(x1, y1, x2, y2, r) {
  const [rx, ry, rw, rh] = r;
  if (x1 >= rx && x1 <= rx + rw && y1 >= ry && y1 <= ry + rh) return true;
  if (x2 >= rx && x2 <= rx + rw && y2 >= ry && y2 <= ry + rh) return true;
  const edges = [
    [rx, ry, rx + rw, ry], [rx + rw, ry, rx + rw, ry + rh],
    [rx + rw, ry + rh, rx, ry + rh], [rx, ry + rh, rx, ry],
  ];
  for (const [ex1, ey1, ex2, ey2] of edges) {
    const d = (x2 - x1) * (ey2 - ey1) - (y2 - y1) * (ex2 - ex1);
    if (Math.abs(d) < 1e-9) continue;
    const t = ((ex1 - x1) * (ey2 - ey1) - (ey1 - y1) * (ex2 - ex1)) / d;
    const u = ((ex1 - x1) * (y2 - y1) - (ey1 - y1) * (x2 - x1)) / d;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return true;
  }
  return false;
}

function losClear(x1, y1, x2, y2, walls) {
  for (const w of walls) if (segHitsRect(x1, y1, x2, y2, w)) return false;
  return true;
}

function circleHitsWalls(x, y, r, walls) {
  for (const [wx, wy, ww, wh] of walls) {
    const cx = clamp(x, wx, wx + ww);
    const cy = clamp(y, wy, wy + wh);
    if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < r * r) return true;
  }
  return false;
}

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.sfx = new SoundFX();
    this.state = "title"; // title | brief | play | pause | complete | over | win
    this.levelIndex = 0;
    this.keys = {};
    this.shot = null; // frozen staged scene for screenshots
    this.totalLoot = 0;
    this.startTime = 0;
    this.elapsed = 0;
    this.loadLevel(0);
    this.bindInput();
  }

  loadLevel(i) {
    const def = LEVELS[i];
    this.levelIndex = i;
    this.def = def;
    this.player = { x: def.start.x, y: def.start.y, fx: 1, fy: 0, sneaking: false };
    this.guards = def.guards.map((g) => ({
      path: g.path, speed: g.speed, wp: 0,
      x: g.path[0][0], y: g.path[0][1], dir: 0,
      mode: "patrol", timer: 0, tx: 0, ty: 0,
    }));
    this.cameras = def.cameras.map((c) => ({ ...c, t: Math.random() * 6, disabled: 0 }));
    this.loot = def.loot.map((l) => ({ ...l, taken: false }));
    this.gadgets = { ...def.gadgets };
    this.suspicion = 0;
    this.alarm = 0;
    this.coins = [];
    this.smokes = [];
    this.hackTimer = 0;
    this.caughtBy = null;
    this.alertFlash = 0;
  }

  bindInput() {
    window.addEventListener("keydown", (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
      this.sfx.ensure();
      this.keys[e.key.toLowerCase()] = true;
      this.onKey(e.key.toLowerCase());
    });
    window.addEventListener("keyup", (e) => { this.keys[e.key.toLowerCase()] = false; });
    this.canvas.addEventListener("click", () => {
      this.sfx.ensure();
      this.onKey("enter");
    });
  }

  onKey(k) {
    if (this.shot) return;
    if (k === "m") { this.sfx.muted = !this.sfx.muted; return; }
    if (this.state === "title" && (k === "enter" || k === " ")) {
      this.state = "brief"; this.sfx.click(); return;
    }
    if (this.state === "brief" && (k === "enter" || k === " ")) {
      this.state = "play"; this.startTime = performance.now(); this.sfx.click(); return;
    }
    if (this.state === "play" && (k === "p" || k === "escape")) { this.state = "pause"; return; }
    if (this.state === "pause" && (k === "p" || k === "escape" || k === "enter")) { this.state = "play"; return; }
    if (this.state === "complete" && (k === "enter" || k === " ")) {
      if (this.levelIndex + 1 >= LEVELS.length) { this.state = "win"; }
      else { this.loadLevel(this.levelIndex + 1); this.state = "brief"; }
      this.sfx.click(); return;
    }
    if ((this.state === "over" || this.state === "win") && (k === "r" || k === "enter" || k === " ")) {
      this.totalLoot = 0;
      this.loadLevel(this.state === "win" ? 0 : this.levelIndex);
      this.state = "brief"; this.sfx.click(); return;
    }
    if (this.state === "play") {
      if (k === "1") this.throwCoin();
      if (k === "2") this.hackCameras();
      if (k === "3") this.dropSmoke();
    }
  }

  throwCoin() {
    if (this.gadgets.coin <= 0) return;
    this.gadgets.coin--;
    const cx = this.player.x + this.player.fx * 70;
    const cy = this.player.y + this.player.fy * 70;
    this.coins.push({ x: clamp(cx, 24, 936), y: clamp(cy, 24, 576), t: 240 });
    this.sfx.coin();
    let best = null, bd = 240;
    for (const g of this.guards) {
      const d = dist(g.x, g.y, cx, cy);
      if (d < bd) { bd = d; best = g; }
    }
    if (best) { best.mode = "lure"; best.tx = cx; best.ty = cy; best.timer = 240; }
  }

  hackCameras() {
    if (this.gadgets.hack <= 0) return;
    this.gadgets.hack--;
    this.hackTimer = 360;
    for (const c of this.cameras) c.disabled = 360;
    this.sfx.gadget();
  }

  dropSmoke() {
    if (this.gadgets.smoke <= 0) return;
    this.gadgets.smoke--;
    this.smokes.push({ x: this.player.x, y: this.player.y, t: 300 });
    this.sfx.gadget();
  }

  inSmoke(x, y) {
    return this.smokes.some((s) => dist(x, y, s.x, s.y) < 70);
  }

  movePlayer() {
    const p = this.player;
    let dx = 0, dy = 0;
    if (this.keys["w"] || this.keys["arrowup"]) dy -= 1;
    if (this.keys["s"] || this.keys["arrowdown"]) dy += 1;
    if (this.keys["a"] || this.keys["arrowleft"]) dx -= 1;
    if (this.keys["d"] || this.keys["arrowright"]) dx += 1;
    if (!dx && !dy) return;
    const len = Math.hypot(dx, dy);
    dx /= len; dy /= len;
    p.fx = dx; p.fy = dy;
    p.sneaking = !!(this.keys["shift"]);
    const sp = p.sneaking ? SNEAK_SPEED : WALK_SPEED;
    const nx = p.x + dx * sp;
    if (!circleHitsWalls(nx, p.y, PLAYER_R, this.def.walls)) p.x = nx;
    const ny = p.y + dy * sp;
    if (!circleHitsWalls(p.x, ny, PLAYER_R, this.def.walls)) p.y = ny;
  }

  updateGuards() {
    for (const g of this.guards) {
      if (g.mode === "chase" || g.mode === "lure") {
        const tx = g.mode === "chase" ? this.player.x : g.tx;
        const ty = g.mode === "chase" ? this.player.y : g.ty;
        const d = dist(g.x, g.y, tx, ty);
        if (d > 4) {
          const sp = g.speed * 1.7;
          g.dir = Math.atan2(ty - g.y, tx - g.x);
          const nx = g.x + Math.cos(g.dir) * sp;
          const ny = g.y + Math.sin(g.dir) * sp;
          if (!circleHitsWalls(nx, g.y, 10, this.def.walls)) g.x = nx;
          if (!circleHitsWalls(g.x, ny, 10, this.def.walls)) g.y = ny;
        }
        g.timer--;
        if (g.timer <= 0) g.mode = "patrol";
        if (g.mode === "chase" && dist(g.x, g.y, this.player.x, this.player.y) < 24) {
          this.getCaught("guard");
        }
        continue;
      }
      const target = g.path[g.wp];
      const d = dist(g.x, g.y, target[0], target[1]);
      if (d < 4) {
        g.wp = (g.wp + 1) % g.path.length;
        continue;
      }
      g.dir = Math.atan2(target[1] - g.y, target[0] - g.x);
      const nx = g.x + Math.cos(g.dir) * g.speed;
      const ny = g.y + Math.sin(g.dir) * g.speed;
      if (!circleHitsWalls(nx, g.y, 10, this.def.walls)) g.x = nx;
      if (!circleHitsWalls(g.x, ny, 10, this.def.walls)) g.y = ny;
    }
  }

  // Returns true when any watcher can see the player this frame.
  sense() {
    const p = this.player;
    if (this.inSmoke(p.x, p.y)) return false;
    let seen = false;
    const seenBy = (wx, wy, dir, range, rate) => {
      const d = dist(wx, wy, p.x, p.y);
      if (d > range) return;
      const ang = Math.atan2(p.y - wy, p.x - wx);
      if (angleDiff(ang, dir) > CONE_HALF) return;
      if (!losClear(wx, wy, p.x, p.y, this.def.walls)) return;
      const close = clamp(1.6 - d / range, 0.5, 1.6);
      const sneak = p.sneaking ? 0.45 : 1;
      this.suspicion = clamp(this.suspicion + rate * close * sneak, 0, 100);
      seen = true;
    };
    for (const g of this.guards) {
      if (g.mode === "lure") continue;
      seenBy(g.x, g.y, g.dir, 150, 0.85);
    }
    for (const c of this.cameras) {
      if (c.disabled > 0) continue;
      const dir = c.base + Math.sin(c.t * c.speed * 60) * c.sweep;
      seenBy(c.x, c.y, dir, c.range, 0.7);
    }
    return seen;
  }

  getCaught(by) {
    if (this.state !== "play") return;
    this.state = "over";
    this.caughtBy = by;
    this.sfx.caught();
  }

  update() {
    if (this.state !== "play" || this.shot) return;
    this.elapsed = performance.now() - this.startTime;
    this.movePlayer();
    this.updateGuards();
    for (const c of this.cameras) {
      c.t++;
      if (c.disabled > 0) c.disabled--;
    }
    if (this.hackTimer > 0) this.hackTimer--;
    for (const s of this.smokes) s.t--;
    this.smokes = this.smokes.filter((s) => s.t > 0);
    for (const c of this.coins) c.t--;
    this.coins = this.coins.filter((c) => c.t > 0);

    const seen = this.sense();
    if (!seen) this.suspicion = clamp(this.suspicion - 0.3, 0, 100);
    if (this.suspicion >= 100) {
      this.suspicion = 55;
      this.alarm = clamp(this.alarm + 30, 0, 100);
      this.alertFlash = 30;
      this.sfx.spotted();
      let best = null, bd = 1e9;
      for (const g of this.guards) {
        const d = dist(g.x, g.y, this.player.x, this.player.y);
        if (d < bd) { bd = d; best = g; }
      }
      if (best) { best.mode = "chase"; best.timer = 180; }
      if (this.alarm >= 100) this.getCaught("alarm");
    }
    if (this.alertFlash > 0) this.alertFlash--;
    if (!seen && this.alarm > 0) this.alarm = clamp(this.alarm - 0.02, 0, 100);

    // Loot pickup.
    for (const l of this.loot) {
      if (!l.taken && dist(l.x, l.y, this.player.x, this.player.y) < 26) {
        l.taken = true;
        this.totalLoot++;
        this.sfx.pickup();
      }
    }
    // Exit.
    const e = this.def.exit;
    const requiredDone = this.loot.filter((l) => l.required).every((l) => l.taken);
    if (requiredDone && this.player.x > e.x - 6 && this.player.x < e.x + e.w + 6 &&
        this.player.y > e.y - 6 && this.player.y < e.h + e.y + 6) {
      this.state = "complete";
      this.sfx.levelClear();
      if (this.levelIndex + 1 >= LEVELS.length) this.sfx.win();
    }
  }

  // Frozen staged scene for screenshots: shot=play | shot=alarm | shot=title | shot=win
  stageShot(kind) {
    this.shot = kind;
    if (kind === "title") { this.state = "title"; return; }
    if (kind === "win") { this.state = "win"; this.totalLoot = 14; return; }
    this.loadLevel(kind === "alarm" ? 1 : 0);
    this.state = "play";
    if (kind === "play") {
      this.player.x = 470; this.player.y = 330;
      this.player.fx = 1; this.player.fy = 0;
      this.guards[0].x = 560; this.guards[0].y = 240; this.guards[0].dir = Math.PI;
      this.guards[1].x = 700; this.guards[1].y = 470; this.guards[1].dir = -Math.PI / 2;
      this.cameras[0].t = 40;
      this.loot[0].taken = true;
      this.suspicion = 34;
      this.alarm = 42;
    } else if (kind === "alarm") {
      this.player.x = 400; this.player.y = 300;
      this.guards[0].x = 440; this.guards[0].y = 300; this.guards[0].dir = Math.PI;
      this.guards[0].mode = "chase"; this.guards[0].timer = 120;
      this.guards[1].x = 620; this.guards[1].y = 500; this.guards[1].dir = -Math.PI / 2;
      this.guards[2].x = 620; this.guards[2].y = 90; this.guards[2].dir = Math.PI / 2;
      this.cameras[0].t = 20;
      this.loot[0].taken = true; this.loot[1].taken = true;
      this.suspicion = 92;
      this.alarm = 82;
      this.alertFlash = 20;
    }
  }

  frame() {
    this.update();
    drawGame(this);
    requestAnimationFrame(() => this.frame());
  }

  start() {
    const params = new URLSearchParams(window.location.search);
    const shot = params.get("shot");
    if (shot) this.stageShot(shot);
    this.frame();
  }
}
