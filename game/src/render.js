// render.js — everything the player sees: the museum floor, the walls, the
// vision cones, the guards and cameras, the loot, the thief, the HUD with
// its alarm meter, and the title / caught / win screens. All drawn in code.

import { WORLD_W, WORLD_H, WALL, PALETTE, TUNE, HUD_H, HINT_H } from './config.js';

const CANVAS_H = HUD_H + WORLD_H + HINT_H;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  draw(game, time) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, WORLD_W, CANVAS_H);
    // The world lives below the HUD bar: translate once for all world drawing.
    ctx.save();
    ctx.translate(0, HUD_H);
    this.drawFloor(game);
    this.drawExit(game, time);
    this.drawCones(game);
    this.drawLoot(game, time);
    this.drawCoins(game);
    this.drawWallsAndFurniture(game);
    this.drawCameras(game);
    this.drawGuards(game);
    this.drawPlayer(game, time);
    ctx.restore();
    this.drawHud(game);
    this.drawMessage(game);
    this.drawScreen(game, time);
  }

  // --- the room -------------------------------------------------------------

  drawFloor(game) {
    const ctx = this.ctx;
    ctx.fillStyle = PALETTE.floorA;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    // Tile grid.
    ctx.strokeStyle = PALETTE.floorLine;
    ctx.lineWidth = 1;
    for (let x = 0; x <= WORLD_W; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, WORLD_H);
      ctx.stroke();
    }
    for (let y = 0; y <= WORLD_H; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WORLD_W, y);
      ctx.stroke();
    }
    // Carpet runner down the gallery hall (level 1) and the vault floor.
    if (game.levelIndex < 2) {
      ctx.fillStyle = PALETTE.carpet;
      ctx.fillRect(480, 200, 760, 220);
      ctx.strokeStyle = '#7a2c3a';
      ctx.lineWidth = 3;
      ctx.strokeRect(480, 200, 760, 220);
    }
    // Rooftop: pale edge lines and a helipad circle guide.
    if (game.levelIndex === 2) {
      ctx.strokeStyle = '#3a4a66';
      ctx.lineWidth = 4;
      ctx.strokeRect(24, 24, WORLD_W - 48, WORLD_H - 48);
    }
  }

  drawExit(game, time) {
    const ctx = this.ctx;
    const e = game.level.def.exit;
    const open = game.level.exitOpen;
    const pulse = open ? 0.55 + 0.35 * Math.sin(time * 5) : 0.25;
    ctx.fillStyle = open
      ? `rgba(46, 230, 107, ${pulse})`
      : `rgba(229, 72, 77, ${pulse})`;
    ctx.fillRect(e.x, e.y, e.w, e.h);
    ctx.strokeStyle = open ? PALETTE.exitOk : PALETTE.exitLocked;
    ctx.lineWidth = 3;
    ctx.strokeRect(e.x, e.y, e.w, e.h);
    ctx.fillStyle = open ? '#b8ffcf' : '#ffb3b5';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.label, e.x + e.w / 2, e.y + e.h / 2 - 8);
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText(open ? 'GO!' : 'LOCKED', e.x + e.w / 2, e.y + e.h / 2 + 12);
  }

  drawCone(origin, heading, range, halfAngle, fill) {
    const ctx = this.ctx;
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.arc(origin.x, origin.y, range, heading - halfAngle, heading + halfAngle);
    ctx.closePath();
    ctx.fill();
  }

  drawCones(game) {
    for (const cam of game.level.cameras) {
      const angle = cam.baseAngle + Math.sin(cam.phase) * cam.sweep;
      const fill = cam.disabledTimer > 0
        ? PALETTE.coneCameraOff
        : cam.seesPlayer ? PALETTE.coneChase : PALETTE.coneCamera;
      this.drawCone(cam, angle, cam.range, TUNE.cameraHalfAngle, fill);
    }
    for (const g of game.level.guards) {
      let fill = PALETTE.conePatrol;
      if (g.state === 'chase') fill = PALETTE.coneChase;
      else if (g.suspicion >= 0.35 || g.state === 'investigate') fill = PALETTE.coneSuspicious;
      this.drawCone(g, g.heading, TUNE.guardVisionRange, TUNE.guardVisionHalfAngle, fill);
    }
  }

  drawLoot(game, time) {
    const ctx = this.ctx;
    for (const l of game.level.loot) {
      if (l.taken) continue;
      const bob = Math.sin(time * 3 + l.x) * 2;
      if (l.kind === 'painting') {
        ctx.fillStyle = '#8a6a1d';
        ctx.fillRect(l.x - 34, l.y - 16, 68, 44);
        ctx.fillStyle = '#2b4a6b';
        ctx.fillRect(l.x - 28, l.y - 10, 56, 32);
        ctx.fillStyle = '#ffd94a';
        ctx.beginPath();
        ctx.arc(l.x, l.y + 6, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#7ec8e3';
        ctx.fillRect(l.x - 28, l.y - 10, 56, 12);
      } else if (l.kind === 'gold') {
        ctx.fillStyle = '#8a6a1d';
        ctx.fillRect(l.x - 18, l.y - 8 + bob, 36, 16);
        ctx.fillStyle = PALETTE.lootGold;
        ctx.fillRect(l.x - 15, l.y - 11 + bob, 30, 10);
        ctx.fillStyle = '#fff3b0';
        ctx.fillRect(l.x - 15, l.y - 11 + bob, 30, 3);
      } else if (l.kind === 'safe') {
        ctx.fillStyle = '#5a6274';
        ctx.fillRect(l.x - 26, l.y - 22, 52, 44);
        ctx.fillStyle = '#2e3442';
        ctx.fillRect(l.x - 20, l.y - 16, 40, 32);
        ctx.strokeStyle = PALETTE.lootGold;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(l.x, l.y, 9, 0, Math.PI * 2);
        ctx.stroke();
        if (l.crackProgress > 0) {
          ctx.strokeStyle = '#2ee66b';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(l.x, l.y, 20, -Math.PI / 2, -Math.PI / 2 + l.crackProgress * Math.PI * 2);
          ctx.stroke();
        }
      } else if (l.kind === 'diamond') {
        ctx.save();
        ctx.translate(l.x, l.y + bob);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = PALETTE.lootGem;
        ctx.fillRect(-13, -13, 26, 26);
        ctx.fillStyle = '#d8fbff';
        ctx.fillRect(-7, -7, 14, 14);
        ctx.restore();
        ctx.fillStyle = 'rgba(89, 230, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(l.x, l.y + bob, 26 + Math.sin(time * 4) * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      // Required loot gets a gold diamond marker so the goal is obvious.
      if (l.required) {
        ctx.fillStyle = PALETTE.lootGold;
        ctx.save();
        ctx.translate(l.x, l.y - 30 + bob);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-5, -5, 10, 10);
        ctx.restore();
      }
    }
  }

  drawCoins(game) {
    const ctx = this.ctx;
    ctx.fillStyle = PALETTE.lootGold;
    for (const c of game.level.coins) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8a6a1d';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    if (game.coinFlight) {
      ctx.beginPath();
      ctx.arc(game.coinFlight.x, game.coinFlight.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawWallsAndFurniture(game) {
    const ctx = this.ctx;
    // Outer border.
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(0, 0, WORLD_W, WALL);
    ctx.fillRect(0, WORLD_H - WALL, WORLD_W, WALL);
    ctx.fillRect(0, 0, WALL, WORLD_H);
    ctx.fillRect(WORLD_W - WALL, 0, WALL, WORLD_H);
    ctx.fillStyle = PALETTE.wallTop;
    ctx.fillRect(0, 0, WORLD_W, 4);
    ctx.fillRect(0, WORLD_H - 4, WORLD_W, 4);
    ctx.fillRect(0, 0, 4, WORLD_H);
    ctx.fillRect(WORLD_W - 4, 0, 4, WORLD_H);
    // Interior walls.
    for (const w of game.level.def.walls) {
      ctx.fillStyle = PALETTE.wall;
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = PALETTE.wallTop;
      ctx.fillRect(w.x, w.y, w.w, 3);
    }
    // Furniture: cover the thief can hide behind.
    for (const f of game.level.def.furniture) {
      if (f.kind === 'case' || f.kind === 'glasscase') {
        ctx.fillStyle = PALETTE.coverCase;
        ctx.fillRect(f.x, f.y, f.w, f.h);
        ctx.fillStyle = 'rgba(140, 200, 230, 0.35)';
        ctx.fillRect(f.x + 4, f.y + 4, f.w - 8, f.h - 8);
      } else if (f.kind === 'crate') {
        ctx.fillStyle = PALETTE.coverWood;
        ctx.fillRect(f.x, f.y, f.w, f.h);
        ctx.strokeStyle = '#4a3517';
        ctx.lineWidth = 2;
        ctx.strokeRect(f.x + 3, f.y + 3, f.w - 6, f.h - 6);
        ctx.beginPath();
        ctx.moveTo(f.x, f.y);
        ctx.lineTo(f.x + f.w, f.y + f.h);
        ctx.moveTo(f.x + f.w, f.y);
        ctx.lineTo(f.x, f.y + f.h);
        ctx.stroke();
      } else if (f.kind === 'desk') {
        ctx.fillStyle = '#4a3a28';
        ctx.fillRect(f.x, f.y, f.w, f.h);
        ctx.fillStyle = '#6b5636';
        ctx.fillRect(f.x + 6, f.y + 6, f.w - 12, f.h - 12);
      } else if (f.kind === 'safe') {
        ctx.fillStyle = '#5a6274';
        ctx.fillRect(f.x, f.y, f.w, f.h);
        ctx.fillStyle = '#2e3442';
        ctx.fillRect(f.x + 8, f.y + 8, f.w - 16, f.h - 16);
      } else if (f.kind === 'planter') {
        ctx.fillStyle = '#2c4a34';
        ctx.fillRect(f.x, f.y, f.w, f.h);
        ctx.fillStyle = '#3f7a4e';
        for (let i = 0; i < 4; i += 1) {
          ctx.beginPath();
          ctx.arc(f.x + 16 + i * ((f.w - 32) / 3), f.y + f.h / 2, 10, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (f.kind === 'ac') {
        ctx.fillStyle = '#4a5568';
        ctx.fillRect(f.x, f.y, f.w, f.h);
        ctx.strokeStyle = '#2e3442';
        ctx.lineWidth = 2;
        for (let i = 1; i < 4; i += 1) {
          ctx.beginPath();
          ctx.moveTo(f.x + 8, f.y + (i * f.h) / 4);
          ctx.lineTo(f.x + f.w - 8, f.y + (i * f.h) / 4);
          ctx.stroke();
        }
      }
    }
  }

  drawCameras(game) {
    const ctx = this.ctx;
    for (const cam of game.level.cameras) {
      const angle = cam.baseAngle + Math.sin(cam.phase) * cam.sweep;
      const disabled = cam.disabledTimer > 0;
      ctx.fillStyle = disabled ? '#5a6274' : '#c22e4a';
      ctx.beginPath();
      ctx.arc(cam.x, cam.y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = disabled ? '#9aa7bd' : '#ff5c7a';
      ctx.beginPath();
      ctx.arc(cam.x + Math.cos(angle) * 5, cam.y + Math.sin(angle) * 5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = disabled ? '#9aa7bd' : '#ffd94a';
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(disabled ? 'OFF' : 'CAM', cam.x, cam.y + 22);
    }
  }

  drawGuards(game) {
    const ctx = this.ctx;
    for (const g of game.level.guards) {
      // Body.
      ctx.fillStyle = PALETTE.guardDark;
      ctx.beginPath();
      ctx.arc(g.x, g.y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.guard;
      ctx.beginPath();
      ctx.arc(g.x, g.y, 11, 0, Math.PI * 2);
      ctx.fill();
      // Facing nose and cap brim.
      ctx.strokeStyle = '#3a2c08';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(g.x, g.y);
      ctx.lineTo(g.x + Math.cos(g.heading) * 14, g.y + Math.sin(g.heading) * 14);
      ctx.stroke();
      ctx.fillStyle = '#3a2c08';
      ctx.beginPath();
      ctx.arc(g.x - Math.cos(g.heading) * 3, g.y - Math.sin(g.heading) * 3, 5, 0, Math.PI * 2);
      ctx.fill();
      // Suspicion bar over the head.
      if (g.suspicion > 0.05) {
        const w = 30;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(g.x - w / 2, g.y - 28, w, 5);
        ctx.fillStyle = g.suspicion >= 1 ? '#ff3c3c' : '#ffb02e';
        ctx.fillRect(g.x - w / 2, g.y - 28, w * g.suspicion, 5);
      }
      if (g.state === 'chase') {
        ctx.fillStyle = '#ff3c3c';
        ctx.font = 'bold 18px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', g.x, g.y - 34);
      } else if (g.suspicion >= 0.35 || g.state === 'investigate') {
        ctx.fillStyle = '#ffb02e';
        ctx.font = 'bold 18px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('?', g.x, g.y - 34);
      }
    }
  }

  drawPlayer(game, time) {
    const ctx = this.ctx;
    const p = game.player;
    const bob = p.moving ? Math.sin(time * 12) * 1.5 : 0;
    // Sneak: smaller, dimmer silhouette.
    const alpha = p.sneaking ? 0.85 : 1;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = PALETTE.playerDark;
    ctx.beginPath();
    ctx.arc(p.x, p.y + bob, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.player;
    ctx.beginPath();
    ctx.arc(p.x, p.y + bob, 11, 0, Math.PI * 2);
    ctx.fill();
    // Hood point and mask.
    ctx.strokeStyle = '#062b25';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y + bob);
    ctx.lineTo(p.x + Math.cos(p.heading) * 15, p.y + bob + Math.sin(p.heading) * 15);
    ctx.stroke();
    ctx.fillStyle = '#062b25';
    ctx.beginPath();
    ctx.arc(p.x + Math.cos(p.heading) * 4, p.y + bob + Math.sin(p.heading) * 4, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#e8ecf4';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('THIEF', p.x, p.y - 20 + bob);
  }

  // --- HUD ------------------------------------------------------------------

  drawHeart(x, y, size, filled) {
    const ctx = this.ctx;
    ctx.fillStyle = filled ? '#ff4d6d' : 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.35);
    ctx.bezierCurveTo(x - size, y - size * 0.4, x - size * 0.4, y - size, x, y - size * 0.3);
    ctx.bezierCurveTo(x + size * 0.4, y - size, x + size, y - size * 0.4, x, y + size * 0.35);
    ctx.fill();
  }

  drawHud(game) {
    const ctx = this.ctx;
    const h = game.hud();
    ctx.fillStyle = PALETTE.hudBg;
    ctx.fillRect(0, 0, WORLD_W, HUD_H);
    ctx.fillStyle = '#2a3550';
    ctx.fillRect(0, HUD_H - 2, WORLD_W, 2);

    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText('MERIDIAN HEIST', 16, HUD_H / 2 - 9);
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(h.levelName, 16, HUD_H / 2 + 11);

    // Loot counter.
    let x = 330;
    ctx.fillStyle = PALETTE.lootGold;
    ctx.save();
    ctx.translate(x + 6, HUD_H / 2);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText(`LOOT ${h.lootGot}/${h.lootTotal}`, x + 16, HUD_H / 2);
    if (h.requiredLeft > 0) {
      ctx.fillStyle = PALETTE.textDim;
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText(`(${h.requiredLeft} required left)`, x + 108, HUD_H / 2);
    }

    // Alarm meter — the big one, centre stage.
    x = 560;
    ctx.fillStyle = h.lockdown ? '#ff3c3c' : PALETTE.text;
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText('ALARM', x, HUD_H / 2);
    const barX = x + 62;
    const barW = 220;
    ctx.fillStyle = '#1a2233';
    ctx.fillRect(barX, HUD_H / 2 - 9, barW, 18);
    const frac = h.alarm / 100;
    ctx.fillStyle = h.alarm >= 70 ? '#ff3c3c' : h.alarm >= 30 ? '#ffb02e' : '#2ee66b';
    ctx.fillRect(barX, HUD_H / 2 - 9, barW * frac, 18);
    ctx.strokeStyle = '#4a5878';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, HUD_H / 2 - 9, barW, 18);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(h.lockdown ? 'LOCKDOWN!' : `${h.alarm}%`, barX + barW / 2, HUD_H / 2);
    ctx.textAlign = 'left';

    // Lives, coins, hacks.
    x = 890;
    for (let i = 0; i < 3; i += 1) this.drawHeart(x + i * 22, HUD_H / 2 - 2, 8, i < h.lives);
    x = 965;
    ctx.fillStyle = PALETTE.lootGold;
    ctx.beginPath();
    ctx.arc(x, HUD_H / 2, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText(`x${h.coins}`, x + 11, HUD_H / 2);
    x = 1020;
    ctx.fillStyle = '#59e6ff';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText(`HACK x${h.hacks}`, x, HUD_H / 2);

    // Score and time, right aligned.
    ctx.textAlign = 'right';
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText(`SCORE ${h.score}`, WORLD_W - 16, HUD_H / 2 - 9);
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '12px system-ui, sans-serif';
    const mm = String(Math.floor(h.time / 60)).padStart(2, '0');
    const ss = String(h.time % 60).padStart(2, '0');
    ctx.fillText(`${mm}:${ss}`, WORLD_W - 16, HUD_H / 2 + 11);
    ctx.textAlign = 'left';

    // Control hints along the bottom.
    ctx.fillStyle = 'rgba(13, 18, 32, 0.85)';
    ctx.fillRect(0, CANVAS_H - HINT_H, WORLD_W, HINT_H);
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      'WASD / ARROWS move   ·   SHIFT sneak   ·   CLICK throw a coin   ·   E hack a camera / crack the safe   ·   M mute   ·   P pause',
      WORLD_W / 2,
      CANVAS_H - HINT_H / 2,
    );
    ctx.textAlign = 'left';
  }

  drawMessage(game) {
    if (game.messageTimer <= 0 || !game.message) return;
    const ctx = this.ctx;
    ctx.font = 'bold 17px system-ui, sans-serif';
    const w = ctx.measureText(game.message).width + 36;
    // Bottom banner, above the hint bar, so it never covers the top wall.
    const y = CANVAS_H - HINT_H - 44;
    ctx.fillStyle = 'rgba(13, 18, 32, 0.88)';
    ctx.fillRect((WORLD_W - w) / 2, y, w, 34);
    ctx.strokeStyle = '#4a5878';
    ctx.lineWidth = 1;
    ctx.strokeRect((WORLD_W - w) / 2, y, w, 34);
    ctx.fillStyle = PALETTE.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(game.message, WORLD_W / 2, y + 17);
    ctx.textAlign = 'left';
  }

  // --- screens --------------------------------------------------------------

  overlay(alpha) {
    const ctx = this.ctx;
    ctx.fillStyle = `rgba(8, 11, 20, ${alpha})`;
    ctx.fillRect(0, 0, WORLD_W, CANVAS_H);
  }

  centerText(lines, y0, gap) {
    const ctx = this.ctx;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    lines.forEach((line, i) => {
      ctx.font = line.font;
      ctx.fillStyle = line.color;
      ctx.fillText(line.text, WORLD_W / 2, y0 + i * gap);
    });
    ctx.textAlign = 'left';
  }

  drawScreen(game, time) {
    const ctx = this.ctx;
    const s = game.screen;
    if (s === 'play' || s === 'brief') {
      if (s === 'brief') {
        this.overlay(0.55);
        this.centerText([
          { text: game.level.def.name, font: 'bold 34px system-ui, sans-serif', color: '#ffd94a' },
          { text: game.level.def.brief, font: '18px system-ui, sans-serif', color: '#e8ecf4' },
          { text: 'Press ENTER or CLICK to begin the heist', font: 'bold 16px system-ui, sans-serif', color: '#59e6ff' },
        ], 320, 52);
      }
      if (game.paused) {
        this.overlay(0.6);
        this.centerText([
          { text: 'PAUSED', font: 'bold 40px system-ui, sans-serif', color: '#e8ecf4' },
          { text: 'Press P to keep stealing', font: '16px system-ui, sans-serif', color: '#9aa7bd' },
        ], 360, 48);
      }
      return;
    }
    if (s === 'title') {
      this.overlay(0.72);
      // Big title with a gold diamond.
      ctx.save();
      ctx.translate(WORLD_W / 2, 180);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = PALETTE.lootGem;
      ctx.fillRect(-22, -22, 44, 44);
      ctx.fillStyle = '#d8fbff';
      ctx.fillRect(-11, -11, 22, 22);
      ctx.restore();
      this.centerText([
        { text: 'MERIDIAN HEIST', font: 'bold 64px system-ui, sans-serif', color: '#ffd94a' },
        { text: 'Three floors. One diamond. Do not get seen.', font: '20px system-ui, sans-serif', color: '#e8ecf4' },
        { text: 'Sneak past the guards and their vision cones. Dodge the sweeping', font: '16px system-ui, sans-serif', color: '#9aa7bd' },
        { text: 'security cameras. Grab the loot, watch the ALARM meter, and get out.', font: '16px system-ui, sans-serif', color: '#9aa7bd' },
        { text: 'WASD move · SHIFT sneak · CLICK throw a coin · E hack a camera', font: 'bold 16px system-ui, sans-serif', color: '#59e6ff' },
        { text: 'Press ENTER or CLICK to start the heist', font: 'bold 18px system-ui, sans-serif', color: '#2ee66b' },
      ], 260, 44);
      return;
    }
    if (s === 'caught') {
      this.overlay(0.6);
      this.centerText([
        { text: 'CAUGHT!', font: 'bold 56px system-ui, sans-serif', color: '#ff3c3c' },
        { text: `A guard grabbed you. ${game.lives} ${game.lives === 1 ? 'life' : 'lives'} left.`, font: '20px system-ui, sans-serif', color: '#e8ecf4' },
        { text: 'The floor resets — try a quieter route.', font: '16px system-ui, sans-serif', color: '#9aa7bd' },
      ], 330, 48);
      return;
    }
    if (s === 'levelclear') {
      this.overlay(0.45);
      this.centerText([
        { text: 'CLEAN GETAWAY!', font: 'bold 52px system-ui, sans-serif', color: '#2ee66b' },
        { text: `Floor cleared — score ${game.score}`, font: '22px system-ui, sans-serif', color: '#e8ecf4' },
        { text: 'Next floor loading…', font: '16px system-ui, sans-serif', color: '#9aa7bd' },
      ], 340, 50);
      return;
    }
    if (s === 'win') {
      this.overlay(0.78);
      this.centerText([
        { text: 'THE MERIDIAN DIAMOND IS YOURS', font: 'bold 44px system-ui, sans-serif', color: '#ffd94a' },
        { text: 'Three floors, no alarms that mattered, one perfect getaway.', font: '20px system-ui, sans-serif', color: '#e8ecf4' },
        { text: `FINAL SCORE ${game.score}`, font: 'bold 30px system-ui, sans-serif', color: '#59e6ff' },
        { text: 'Press ENTER to run it back', font: '16px system-ui, sans-serif', color: '#9aa7bd' },
      ], 300, 52);
      return;
    }
    if (s === 'gameover') {
      this.overlay(0.78);
      this.centerText([
        { text: 'THE CREW GOT MADE', font: 'bold 52px system-ui, sans-serif', color: '#ff3c3c' },
        { text: 'Out of lives. The Meridian keeps its diamond — this time.', font: '20px system-ui, sans-serif', color: '#e8ecf4' },
        { text: `Score ${game.score} — press ENTER to try again`, font: '16px system-ui, sans-serif', color: '#9aa7bd' },
      ], 330, 50);
    }
  }
}
