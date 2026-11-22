# Meridian Heist

A complete, original top-down stealth heist game that plays offline in a
desktop browser from its own files. No network requests, no external
assets — every sprite, sound and level is drawn or synthesised in code.

[![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/c/best-heist-game-20261122-0559)

## Play

Open `game/index.html` in a desktop browser (or run `node serve.ts` and
open http://localhost:8080).

- **3 floors**: The Meridian Gallery, The Vault Floor, The Rooftop Getaway.
- **Guards with vision cones** patrol set routes. Get seen and their
  suspicion rises — at full they chase you, and if one grabs you, you
  lose a life and the floor resets.
- **Security cameras** sweep their cones across the rooms. Get caught in
  one and the alarm climbs. Hack a camera with `E` (2 charges per floor)
  to kill it for 8 seconds.
- **Alarm meter**: rises while any guard or camera sees you, falls while
  you stay hidden. At 100% the building locks down and every guard
  converges on you.
- **Loot**: paintings, gold bars, a crackable vault safe (hold `E` beside
  it) and the Meridian Diamond. Required loot opens the exit.
- **Gadgets**: throw coins with a mouse click to lure guards away;
  `Shift` sneaks — slower, harder to spot.
- Sounds are synthesised with WebAudio (mutable with `M`). Best run is
  scored on loot, time bonus and remaining lives.

## Layout

- `main.ts` — Node 22 entry point; copies `game/` and `screenshots/` to
  `out/` and writes `dossier.json` with the vendored make.fun library.
- `game/index.html` — canvas shell, loads the game modules.
- `game/src/config.js` — palette, tuning and the three level layouts.
- `game/src/vision.js` — cone and line-of-sight geometry.
- `game/src/levels.js` — level definitions turned into live state.
- `game/src/game.js` — state machine: thief, guards, cameras, alarm, loot.
- `game/src/render.js` — all canvas drawing, HUD and screens.
- `game/src/input.js` — keyboard and mouse.
- `game/src/audio.js` — WebAudio synth for every sound.
- `game/src/shots.js` — deterministic staging for the screenshots.
- `screenshots/` — real renders of the game in play.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

## License

MIT — see `LICENSE`.
