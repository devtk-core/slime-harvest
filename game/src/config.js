// Slime Harvest — tuning and the slime family tree.
// Every stage is drawn in code (render.js); there are no image files at all.

export const VIEW = { width: 960, height: 640 };

// The farm box the slimes fall into, in view coordinates.
export const BOX = { left: 296, right: 744, top: 84, floor: 612, dangerY: 176 };

export const GRAVITY = 2300;          // px per second^2
export const DROP_COOLDOWN = 0.55;    // seconds between drops
export const MERGE_GRACE = 0.3;       // a fresh slime cannot merge for this long
export const DANGER_LIMIT = 2.0;      // seconds above the line before game over
export const TARGET_SCORE = 3000;     // reaching it wins the run

// stage: name, radius, body colour, belly colour, points when it merges away,
// points when it is harvested (per slime).
export const STAGES = [
  { name: 'Droplet', radius: 15, body: '#63b3ff', belly: '#cfe9ff', merge: 10,  harvest: 30 },
  { name: 'Sprout',  radius: 21, body: '#69d97c', belly: '#dcffd9', merge: 20,  harvest: 60 },
  { name: 'Bloom',   radius: 28, body: '#ff9ed2', belly: '#ffe3f3', merge: 40,  harvest: 120 },
  { name: 'Bolt',    radius: 36, body: '#ffd94d', belly: '#fff3bf', merge: 80,  harvest: 240 },
  { name: 'Ember',   radius: 45, body: '#ff8a5c', belly: '#ffe0cc', merge: 160, harvest: 480 },
  { name: 'Frost',   radius: 55, body: '#8fe3ff', belly: '#e6fbff', merge: 320, harvest: 960 },
  { name: 'Star',    radius: 66, body: '#b79cff', belly: '#ece5ff', merge: 640, harvest: 1920 },
  { name: 'King',    radius: 79, body: '#ffc93c', belly: '#fff0b3', merge: 1280, harvest: 3840 },
];

// What the dropper can hand you: small slimes only, the big ones are earned.
export const DROP_TABLE = [
  { stage: 0, weight: 50 },
  { stage: 1, weight: 32 },
  { stage: 2, weight: 18 },
];
