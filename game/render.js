// Meridian Heist — all canvas drawing: rooms, vision cones, HUD and screens.
import { VIEW_W, VIEW_H } from "./engine.js";

const GOLD = "#f5c542";
const DANGER = "#ff4d4d";
const SAFE = "#39d98a";
const INK = "#0d1220";

function conePath(ctx, x, y, dir, range, half) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, dir - half, dir + half);
  ctx.closePath();
}

function drawCone(ctx, x, y, dir, range, half, hot) {
  conePath(ctx, x, y, dir, range, half);
  ctx.fillStyle = hot ? "rgba(255,77,77,0.30)" : "rgba(255,210,63,0.20)";
  ctx.fill();
  ctx.strokeStyle = hot ? "rgba(255,77,77,0.55)" : "rgba(255,210,63,0.35)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawGuard(ctx, g, hot) {
  drawCone(ctx, g.x, g.y, g.dir, 150, 0.62, hot);
  ctx.beginPath();
  ctx.arc(g.x, g.y, 12, 0, Math.PI * 2);
  ctx.fillStyle = g.mode === "chase" ? DANGER : "#e8ecf4";
  ctx.fill();
  ctx.strokeStyle = "#1c2436";
  ctx.lineWidth = 2;
  ctx.stroke();
  // visor
  ctx.beginPath();
  ctx.arc(g.x + Math.cos(g.dir) * 5, g.y + Math.sin(g.dir) * 5, 4, 0, Math.PI * 2);
  ctx.fillStyle = hot ? DANGER : "#2b6cb0";
  ctx.fill();
  if (g.mode === "lure") {
    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("?", g.x, g.y - 20);
  }
}

function drawCamera(ctx, c) {
  const dir = c.base + Math.sin(c.t * c.speed * 60) * c.sweep;
  if (c.disabled <= 0) drawCone(ctx, c.x, c.y, dir, c.range, 0.5, false);
  ctx.beginPath();
  ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
  ctx.fillStyle = c.disabled > 0 ? "#5a6b8a" : DANGER;
  ctx.fill();
  ctx.strokeStyle = "#0d1220";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(c.x, c.y);
  ctx.lineTo(c.x + Math.cos(dir) * 16, c.y + Math.sin(dir) * 16);
  ctx.strokeStyle = c.disabled > 0 ? "#5a6b8a" : "#ff8a8a";
  ctx.lineWidth = 3;
  ctx.stroke();
  if (c.disabled > 0) {
    ctx.fillStyle = "#fff";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("OFF", c.x, c.y - 14);
  }
}

function drawLoot(ctx, l) {
  if (l.taken) return;
  ctx.save();
  ctx.translate(l.x, l.y);
  if (l.kind === "gem") {
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = "#7ee7ff";
    ctx.fillRect(-9, -9, 18, 18);
    ctx.strokeStyle = "#0d6e8a";
    ctx.lineWidth = 2;
    ctx.strokeRect(-9, -9, 18, 18);
  } else if (l.kind === "gold") {
    ctx.fillStyle = GOLD;
    ctx.fillRect(-11, -7, 22, 14);
    ctx.strokeStyle = "#8a6d00";
    ctx.lineWidth = 2;
    ctx.strokeRect(-11, -7, 22, 14);
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fillStyle = GOLD;
    ctx.fill();
    ctx.strokeStyle = "#8a6d00";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
  if (l.required) {
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(l.label, l.x, l.y + 26);
  }
}

function drawHud(ctx, g) {
  const taken = g.loot.filter((l) => l.taken).length;
  const required = g.loot.filter((l) => l.required);
  const reqTaken = required.filter((l) => l.taken).length;
  ctx.fillStyle = "rgba(10,14,26,0.92)";
  ctx.fillRect(0, 0, VIEW_W, 52);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 15px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(g.def.name, 14, 22);
  ctx.font = "13px sans-serif";
  ctx.fillStyle = "#aab4c8";
  ctx.fillText("WASD move · Shift sneak · 1 coin · 2 hack · 3 smoke · P pause · M mute", 14, 42);

  // Alarm meter.
  const ax = 520, ay = 18, aw = 130, ah = 12;
  ctx.fillStyle = "#fff";
  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("ALARM " + Math.round(g.alarm) + "%", ax, ay - 4);
  ctx.fillStyle = "#222c44";
  ctx.fillRect(ax, ay, aw, ah);
  ctx.fillStyle = g.alarm > 66 ? DANGER : g.alarm > 33 ? "#ffb020" : SAFE;
  ctx.fillRect(ax, ay, aw * (g.alarm / 100), ah);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1;
  ctx.strokeRect(ax, ay, aw, ah);

  // Suspicion meter.
  const sx = 672, sy = 18, sw = 110, sh = 12;
  ctx.fillStyle = "#fff";
  ctx.font = "bold 12px sans-serif";
  ctx.fillText("SEEN " + Math.round(g.suspicion) + "%", sx, sy - 4);
  ctx.fillStyle = "#222c44";
  ctx.fillRect(sx, sy, sw, sh);
  ctx.fillStyle = g.suspicion > 66 ? DANGER : "#ffd23f";
  ctx.fillRect(sx, sy, sw * (g.suspicion / 100), sh);
  ctx.strokeStyle = "#fff";
  ctx.strokeRect(sx, sy, sw, sh);

  // Loot + gadgets.
  ctx.textAlign = "right";
  ctx.fillStyle = "#fff";
  ctx.font = "bold 14px sans-serif";
  ctx.fillText("LOOT " + reqTaken + "/" + required.length + "  ·  bonus " + (taken - reqTaken), 950, 22);
  ctx.font = "13px sans-serif";
  ctx.fillStyle = "#ffd23f";
  ctx.fillText("coin x" + g.gadgets.coin + "  ·  hack x" + g.gadgets.hack + "  ·  smoke x" + g.gadgets.smoke, 950, 42);
  ctx.textAlign = "left";
}

function drawRoom(ctx, g) {
  // Floor: checker of deep blue-grey tiles.
  ctx.fillStyle = "#1a2236";
  ctx.fillRect(0, 52, VIEW_W, VIEW_H - 52);
  ctx.fillStyle = "#1e2740";
  for (let y = 52; y < VIEW_H; y += 48) {
    for (let x = ((y / 48) % 2) * 48; x < VIEW_W; x += 96) {
      ctx.fillRect(x, y, 48, 48);
    }
  }
  // Walls.
  for (const [x, y, w, h] of g.def.walls) {
    ctx.fillStyle = "#3d4a68";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "#55648c";
    ctx.fillRect(x, y, w, 4);
  }
  // Exit.
  const e = g.def.exit;
  const open = g.loot.filter((l) => l.required).every((l) => l.taken);
  ctx.fillStyle = open ? SAFE : "#5a6b8a";
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.strokeRect(e.x, e.y, e.w, e.h);
  ctx.fillStyle = "#0d1220";
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(open ? "EXIT" : "LOCKED", e.x + e.w / 2, e.y + e.h / 2 + 5);
  // Coins on the floor.
  for (const c of g.coins) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = GOLD;
    ctx.fill();
  }
  // Smoke clouds.
  for (const s of g.smokes) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, 70, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(200,205,220,0.35)";
    ctx.fill();
  }
}

function drawPlayer(ctx, g) {
  const p = g.player;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
  ctx.fillStyle = p.sneaking ? "#8a93b8" : "#2f3542";
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // facing tick
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x + p.fx * 16, p.y + p.fy * 16);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(p.sneaking ? "sneaking" : "YOU", p.x, p.y - 18);
}

function overlay(ctx, title, lines, hint) {
  ctx.fillStyle = "rgba(8,11,22,0.82)";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.font = "bold 42px sans-serif";
  ctx.fillText(title, VIEW_W / 2, 190);
  ctx.font = "17px sans-serif";
  ctx.fillStyle = "#c7d0e4";
  lines.forEach((ln, i) => ctx.fillText(ln, VIEW_W / 2, 240 + i * 28));
  ctx.font = "bold 16px sans-serif";
  ctx.fillStyle = GOLD;
  ctx.fillText(hint, VIEW_W / 2, 240 + lines.length * 28 + 46);
  ctx.textAlign = "left";
}

export function drawGame(g) {
  const ctx = g.ctx;
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  if (g.state === "title") {
    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = GOLD;
    ctx.textAlign = "center";
    ctx.font = "bold 58px sans-serif";
    ctx.fillText("MERIDIAN HEIST", VIEW_W / 2, 210);
    ctx.fillStyle = "#c7d0e4";
    ctx.font = "19px sans-serif";
    ctx.fillText("Three jobs. One crew. No alarms if you play it quiet.", VIEW_W / 2, 260);
    ctx.fillText("Museum · Bank Vault · Rooftop Penthouse", VIEW_W / 2, 292);
    ctx.fillStyle = "#fff";
    ctx.font = "16px sans-serif";
    ctx.fillText("WASD / arrows to move · Shift to sneak · 1 coin lure · 2 camera hack · 3 smoke", VIEW_W / 2, 360);
    ctx.fillStyle = GOLD;
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("Press ENTER to plan the job", VIEW_W / 2, 430);
    ctx.textAlign = "left";
    return;
  }
  if (g.state === "brief") {
    overlay(ctx, g.def.name, [g.def.brief, "Gadgets this job: coin ×" + g.gadgets.coin + " · hack ×" + g.gadgets.hack + " · smoke ×" + g.gadgets.smoke], "Press ENTER to start");
    return;
  }
  drawRoom(ctx, g);
  const hot = g.suspicion > 60;
  for (const c of g.cameras) drawCamera(ctx, c);
  for (const l of g.loot) drawLoot(ctx, l);
  for (const gd of g.guards) drawGuard(ctx, gd, hot || gd.mode === "chase");
  drawPlayer(ctx, g);
  drawHud(ctx, g);
  if (g.alertFlash > 0 && g.alertFlash % 10 < 5) {
    ctx.fillStyle = "rgba(255,40,40,0.18)";
    ctx.fillRect(0, 52, VIEW_W, VIEW_H - 52);
  }
  if (g.state === "pause") {
    overlay(ctx, "PAUSED", ["Take a breath. The guards keep their rounds.", "P to resume"], "P to resume");
  } else if (g.state === "complete") {
    overlay(ctx, "JOB DONE", ["Clean lift. The crew slips out before the count.", "Loot so far: " + g.totalLoot + " pieces"], "Press ENTER for the next job");
  } else if (g.state === "over") {
    overlay(ctx, "CAUGHT", [g.caughtBy === "alarm" ? "The alarm hit 100% and the building locked down." : "A guard grabbed you in the open.", "Fair cop — the patrols run the same rounds every time."], "Press R to retry this job");
  } else if (g.state === "win") {
    overlay(ctx, "THE GETAWAY", ["All three jobs clean. " + g.totalLoot + " pieces lifted.", "The Meridian crew vanishes into the night."], "Press ENTER to run it again");
  }
}
