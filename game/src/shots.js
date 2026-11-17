// Deterministic scenes for the screenshots in shots.json.
// Each scene is built from the seeded random source and settled physics, so
// re-running the same URL always produces the same picture.

import { BOX, STAGES } from './config.js';
import { burst, settle, spawnSlime } from './world.js';

// Lay a row of slimes along the floor, left to right.
function placeRow(world, stages, lift = 0, xOffset = 0) {
  let x = BOX.left + 26 + xOffset;
  for (const stage of stages) {
    const r = STAGES[stage].radius;
    x += r;
    spawnSlime(world, stage, x, BOX.floor - r - lift);
    x += r + 4;
  }
}

export function setupShot(g, name) {
  const world = g.world;
  if (name === 'start') {
    g.state = 'title';
    return;
  }
  if (name === 'play') {
    placeRow(world, [2, 1, 0, 3, 1, 2, 0]);
    placeRow(world, [1, 4, 0, 2], 74);
    placeRow(world, [0, 1], 150);
    settle(world, 1.8);
    world.score = 1240;
    world.harvests = 3;
    world.merges = 11;
    world.combo = 2;
    world.comboTimer = 3;
    g.dropStage = 1;
    g.nextStage = 0;
    g.aimX = 520;
    g.state = 'play';
    return;
  }
  if (name === 'harvest') {
    // A small pile on the left, kept clear of the trio in the middle.
    spawnSlime(world, 2, 348, BOX.floor - STAGES[2].radius);
    spawnSlime(world, 0, 398, BOX.floor - STAGES[0].radius);
    spawnSlime(world, 1, 372, BOX.floor - STAGES[1].radius - 52);
    // Three Embers side by side, already past their merge grace: the short
    // settle lets the harvest rule fire for real, so the burst and the
    // banner in the picture are the game's own.
    const cy = BOX.floor - STAGES[4].radius;
    for (const x of [478, 570, 662]) {
      const ember = spawnSlime(world, 4, x, cy);
      ember.age = 2;
    }
    world.score = 1200;
    world.harvests = 3;
    world.merges = 14;
    settle(world, 0.12);
    burst(world, 570, cy - 30, '#ffd166', 10, 170);
    g.dropStage = 2;
    g.nextStage = 1;
    g.aimX = 430;
    g.state = 'play';
    return;
  }
  if (name === 'end') {
    placeRow(world, [3, 2, 4, 1, 3, 0]);
    placeRow(world, [2, 5, 2, 3], 84);
    placeRow(world, [1, 3, 2, 1], 168);
    placeRow(world, [2, 1, 0], 244);
    settle(world, 1.4);
    world.score = 2870;
    world.harvests = 6;
    world.merges = 23;
    g.best = 5120;
    g.state = 'over';
    return;
  }
  g.state = 'title';
}
