// Slime Harvest — tuning and the slime family tree.
// Every stage is drawn in code (render.js); there are no image files at all.

export const VIEW = { width: 960, height: 640 };

// The farm box the slimes fall into, in view coordinates. Kept narrow on
// purpose: merging nearly conserves volume, so a wide box takes forever
// to fill and thoughtless dropping would never lose.
export const BOX = { left: 316, right: 724, top: 84, floor: 612, dangerY: 300 };

export const GRAVITY = 2300;          // px per second^2
export const DROP_COOLDOWN = 0.55;    // seconds between drops
export const MERGE_GRACE = 0.3;       // a fresh slime cannot merge for this long
export const DANGER_LIMIT = 1.0;      // seconds above the line before game over
export const TARGET_SCORE = 3000;     // score needed to win...
export const WIN_HARVESTS = 4;        // ...and this many BIG harvests
export const BIG_HARVEST_STAGE = 2;   // "big" = Bloom or larger. Luck
                                      // triples the small fry all day, so
                                      // the win only counts harvests the
                                      // player had to build toward.
                                      // alone cannot win: the harvest is
                                      // the game's signature play, so the
                                      // win asks for it by name.
// stage: name, radius, body colour, belly colour, points when a merge
// creates this stage, points when it is harvested (per slime). Harvests
// pay far more than merges on purpose: setting up a triple is the skill.
export const STAGES = [
  { name: 'Droplet', radius: 15, body: '#63b3ff', belly: '#cfe9ff', merge: 10,  harvest: 45 },
  { name: 'Sprout',  radius: 21, body: '#69d97c', belly: '#dcffd9', merge: 20,  harvest: 90 },
  { name: 'Bloom',   radius: 28, body: '#ff9ed2', belly: '#ffe3f3', merge: 40,  harvest: 180 },
  { name: 'Bolt',    radius: 36, body: '#ffd94d', belly: '#fff3bf', merge: 80,  harvest: 360 },
  { name: 'Ember',   radius: 45, body: '#ff8a5c', belly: '#ffe0cc', merge: 120, harvest: 720 },
  { name: 'Frost',   radius: 55, body: '#8fe3ff', belly: '#e6fbff', merge: 180, harvest: 1440 },
  { name: 'Star',    radius: 66, body: '#b79cff', belly: '#ece5ff', merge: 300, harvest: 2880 },
  { name: 'King',    radius: 79, body: '#ffc93c', belly: '#fff0b3', merge: 500, harvest: 5760 },
];

// What the dropper can hand you: small slimes only at first, the big ones
// are earned. As the score climbs the sky answers with bigger slimes, so
// a run coasting on luck fills its box faster and faster — the challenge
// grows with the player instead of staying flat.
export const DROP_TABLE = [
  { stage: 0, weight: 34 },
  { stage: 1, weight: 28 },
  { stage: 2, weight: 22 },
  { stage: 3, weight: 16 },
];
export const DROP_TABLE_MID = [
  { stage: 0, weight: 24 },
  { stage: 1, weight: 26 },
  { stage: 2, weight: 24 },
  { stage: 3, weight: 16 },
  { stage: 4, weight: 10 },
];
export const DROP_TABLE_LATE = [
  { stage: 0, weight: 14 },
  { stage: 1, weight: 20 },
  { stage: 2, weight: 24 },
  { stage: 3, weight: 22 },
  { stage: 4, weight: 20 },
];
export const ESCALATE_MID = 1200;
export const ESCALATE_LATE = 2200;
