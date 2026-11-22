// shots.js — deterministic staging for the screenshots. Each shot sets up a
// real game state (a level, a thief, guards mid-patrol, cameras mid-sweep)
// and then freezes the simulation, so the screenshot is a stable render of
// the game's own code. ?shot=title | play | alarm | win

export function applyShot(game, name) {
  if (!name) return false;
  game.shotMode = true;

  if (name === 'title') {
    game.screen = 'title';
    return true;
  }

  if (name === 'play') {
    // Level 1 mid-heist: the thief is crossing the gallery, one painting
    // already lifted, a guard's cone sweeping toward them, alarm at 35%.
    game.loadLevel(0);
    game.screen = 'play';
    game.player.x = 700;
    game.player.y = 250;
    game.player.heading = Math.PI / 2;
    game.level.loot[0].taken = true;
    game.score = 300;
    game.level.alarm = 35;
    game.level.time = 42;
    const g = game.level.guards[0];
    g.x = 900;
    g.y = 240;
    g.heading = Math.PI;
    g.suspicion = 0.55;
    g.state = 'patrol';
    const g2 = game.level.guards[1];
    g2.x = 800;
    g2.y = 640;
    g2.heading = -Math.PI / 2;
    game.level.cameras[0].phase = 0.6;
    game.level.cameras[1].phase = -0.4;
    game.message = 'Loot secured! +300 points.';
    game.messageTimer = 99;
    return true;
  }

  if (name === 'alarm') {
    // Level 2 at the edge: alarm 78%, a guard chasing, a camera locked on.
    game.loadLevel(1);
    game.screen = 'play';
    game.player.x = 640;
    game.player.y = 300;
    game.player.heading = -Math.PI / 2;
    game.level.loot[0].taken = true;
    game.level.loot[1].taken = true;
    game.score = 1100;
    game.level.alarm = 78;
    game.level.time = 96;
    game.coins = 1;
    game.hacks = 1;
    const g = game.level.guards[0];
    g.x = 700;
    g.y = 330;
    g.heading = Math.atan2(game.player.y - g.y, game.player.x - g.x);
    g.state = 'chase';
    g.suspicion = 1;
    g.lastSeen = { x: game.player.x, y: game.player.y };
    const g2 = game.level.guards[1];
    g2.x = 1000;
    g2.y = 600;
    g2.heading = Math.PI;
    g2.suspicion = 0.4;
    game.level.cameras[0].phase = 0;
    game.level.cameras[0].seesPlayer = true;
    game.level.cameras[1].phase = 0.5;
    game.message = 'SPOTTED! Run — break line of sight!';
    game.messageTimer = 99;
    return true;
  }

  if (name === 'win') {
    // The getaway: level 3 cleared, the diamond gone, final score on screen.
    game.loadLevel(2);
    game.screen = 'win';
    game.score = 4850;
    game.level.loot[0].taken = true;
    game.level.loot[1].taken = true;
    game.player.x = 1160;
    game.player.y = 120;
    return true;
  }

  return false;
}
