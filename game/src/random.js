// A tiny seeded random source, so a run — and a screenshot — can be replayed
// exactly. Mulberry32: small, fast, and good enough for slime rain.

export function makeRandom(seed) {
  let state = (seed >>> 0) || 1;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pick a drop stage from the weighted table in config.js.
export function pickDropStage(random, table) {
  let total = 0;
  for (const row of table) total += row.weight;
  let roll = random() * total;
  for (const row of table) {
    roll -= row.weight;
    if (roll <= 0) return row.stage;
  }
  return table[table.length - 1].stage;
}
