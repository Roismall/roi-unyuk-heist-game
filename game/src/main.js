// main.js — bootstrap for Meridian Heist: canvas, input, sound, game state,
// renderer and the frame loop. Also exposes window.__game for play-testing
// and stages ?shot= screenshots deterministically.

import { WORLD_W, WORLD_H, HUD_H, HINT_H } from './config.js';
import { Game } from './game.js';
import { Renderer } from './render.js';
import { Input } from './input.js';
import { SoundEngine } from './audio.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
canvas.width = WORLD_W;
canvas.height = HUD_H + WORLD_H + HINT_H;

const sound = new SoundEngine();
const input = new Input(canvas, HUD_H);
const game = new Game(sound);
const renderer = new Renderer(canvas);

window.__game = game;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  applyShot(game, shot);
  // A staged shot renders once, frozen, and signals the screenshot tool.
  renderer.draw(game, 1.2);
  window.__shotReady = true;
}

let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  // Audio needs a user gesture first; unlock it on the first input.
  if (input.pressed.size > 0 || input.mouse.clicked) sound.ensure();

  // Unpause lives here because the game update early-returns while paused.
  if (game.paused && input.wasPressed('p')) game.paused = false;

  game.update(dt, input);
  renderer.draw(game, now / 1000);
  input.consumePressed();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
