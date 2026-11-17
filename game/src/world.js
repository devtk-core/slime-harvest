// The farm's physics and rules: circles fall, bounce, merge and get harvested.
// Deliberately small — gravity, circle collisions, and two rules on top:
//   two of a kind touching -> they merge and evolve into the next stage
//   three of a kind touching -> HARVEST: they vanish in a burst of points
// The harvest rule is the heart of the game: it clears space, so a run can
// breathe instead of only ever filling up.

import { BOX, DANGER_LIMIT, GRAVITY, MERGE_GRACE, STAGES } from './config.js';

let nextId = 1;

export function createWorld() {
  return {
    slimes: [],
    particles: [],
    texts: [],
    events: [],
    score: 0,
    combo: 0,
    comboTimer: 0,
    harvests: 0,
    merges: 0,
    danger: 0,
    time: 0,
  };
}

export function spawnSlime(world, stage, x, y, vx = 0, vy = 0) {
  const def = STAGES[stage];
  const slime = {
    id: nextId++,
    stage,
    x, y, vx, vy,
    r: def.radius,
    age: 0,
    squash: 0,
    angle: 0,
    angVel: 0,
    dead: false,
  };
  world.slimes.push(slime);
  return slime;
}

export function dropSlime(world, stage, x) {
  const r = STAGES[stage].radius;
  const clampedX = Math.max(BOX.left + r + 2, Math.min(BOX.right - r - 2, x));
  const slime = spawnSlime(world, stage, clampedX, BOX.top + r + 6);
  burst(world, clampedX, BOX.top + 10, '#ffffff', 5, 60);
  return slime;
}

export function burst(world, x, y, color, count, speed) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const v = speed * (0.3 + Math.random() * 0.9);
    world.particles.push({
      x, y,
      vx: Math.cos(angle) * v,
      vy: Math.sin(angle) * v - 40,
      life: 0,
      maxLife: 0.45 + Math.random() * 0.4,
      color,
      size: 2 + Math.random() * 3.5,
    });
  }
}

export function floatText(world, x, y, text, color, size = 22) {
  world.texts.push({ x, y, text, color, size, life: 0, maxLife: 1.15 });
}

function stepPhysics(world, h) {
  const slimes = world.slimes;
  for (const s of slimes) {
    s.vy += GRAVITY * h;
    s.x += s.vx * h;
    s.y += s.vy * h;
    s.angVel = Math.max(-14, Math.min(14, s.angVel));
    s.angle += s.angVel * h;
    if (s.x - s.r < BOX.left) { s.x = BOX.left + s.r; s.vx = Math.abs(s.vx) * 0.35; }
    if (s.x + s.r > BOX.right) { s.x = BOX.right - s.r; s.vx = -Math.abs(s.vx) * 0.35; }
    if (s.y + s.r > BOX.floor) {
      s.y = BOX.floor - s.r;
      if (Math.abs(s.vy) > 90) { s.vy = -s.vy * 0.22; s.squash = Math.min(1, Math.abs(s.vy) / 900); }
      else s.vy = 0;
      // Rolling: keep most of the sideways speed and spin to match it, so a
      // slime trundles along the soil instead of stopping dead.
      s.vx *= 0.995;
      const rolling = s.vx / s.r;
      s.angVel += (rolling - s.angVel) * 0.4;
    } else {
      s.angVel *= 0.999;
    }
    if (s.y - s.r < BOX.top) { s.y = BOX.top + s.r; s.vy = Math.abs(s.vy) * 0.3; }
  }
  // Circle against circle: push apart, then trade a little momentum.
  for (let i = 0; i < slimes.length; i++) {
    const a = slimes[i];
    for (let j = i + 1; j < slimes.length; j++) {
      const b = slimes[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const minDist = a.r + b.r;
      const d2 = dx * dx + dy * dy;
      if (d2 >= minDist * minDist || d2 === 0) continue;
      const dist = Math.sqrt(d2);
      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = minDist - dist;
      const totalMass = a.r * a.r + b.r * b.r;
      const aShare = (b.r * b.r) / totalMass;
      const bShare = (a.r * a.r) / totalMass;
      a.x -= nx * overlap * aShare;
      a.y -= ny * overlap * aShare;
      b.x += nx * overlap * bShare;
      b.y += ny * overlap * bShare;
      const rvx = b.vx - a.vx;
      const rvy = b.vy - a.vy;
      const rel = rvx * nx + rvy * ny;
      if (rel < 0) {
        const impulse = -(1 + 0.16) * rel / 2;
        a.vx -= impulse * nx * aShare * 2;
        a.vy -= impulse * ny * aShare * 2;
        b.vx += impulse * nx * bShare * 2;
        b.vy += impulse * ny * bShare * 2;
        // A glancing blow sets them spinning a little. (Applied every
        // substep while in contact, so this must stay tiny.)
        const tangential = rvx * -ny + rvy * nx;
        a.angVel -= (tangential * 0.02) / Math.max(12, a.r);
        b.angVel -= (tangential * 0.02) / Math.max(12, b.r);
      }
    }
  }
}

// Same-stage slimes in contact, as an adjacency map id -> [ids].
function contactGroups(world) {
  const slimes = world.slimes;
  const near = new Map();
  const pairs = [];
  for (let i = 0; i < slimes.length; i++) {
    const a = slimes[i];
    if (a.age < MERGE_GRACE) continue;
    for (let j = i + 1; j < slimes.length; j++) {
      const b = slimes[j];
      if (b.age < MERGE_GRACE || b.stage !== a.stage) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const reach = a.r + b.r + 3;
      if (dx * dx + dy * dy < reach * reach) {
        pairs.push([a, b]);
        if (!near.has(a.id)) near.set(a.id, []);
        if (!near.has(b.id)) near.set(b.id, []);
        near.get(a.id).push(b.id);
        near.get(b.id).push(a.id);
      }
    }
  }
  return { near, pairs };
}

function resolveRules(world) {
  const byId = new Map(world.slimes.map((s) => [s.id, s]));
  const { near, pairs } = contactGroups(world);
  const used = new Set();

  // Harvest first: any connected cluster of 3+ of a kind is reaped whole.
  const visited = new Set();
  for (const start of world.slimes) {
    if (visited.has(start.id) || !near.has(start.id)) continue;
    const cluster = [];
    const queue = [start.id];
    visited.add(start.id);
    while (queue.length) {
      const id = queue.pop();
      cluster.push(byId.get(id));
      for (const other of near.get(id) || []) {
        if (!visited.has(other)) { visited.add(other); queue.push(other); }
      }
    }
    if (cluster.length >= 3) {
      const stage = start.stage;
      world.combo = world.comboTimer > 0 ? world.combo + 1 : 1;
      world.comboTimer = 4;
      const points = Math.round(STAGES[stage].harvest * cluster.length * world.combo);
      world.score += points;
      world.harvests += 1;
      const cx = cluster.reduce((sum, s) => sum + s.x, 0) / cluster.length;
      const cy = cluster.reduce((sum, s) => sum + s.y, 0) / cluster.length;
      for (const s of cluster) {
        s.dead = true;
        used.add(s.id);
        burst(world, s.x, s.y, STAGES[stage].body, 7, 150);
      }
      floatText(world, cx, cy - 10, `HARVEST! +${points}`, '#ffe066', 26);
      if (world.combo > 1) floatText(world, cx, cy + 20, `COMBO x${world.combo}`, '#ff9ed2', 19);
      world.events.push({ type: stage === STAGES.length - 1 ? 'royal' : 'harvest', x: cx, y: cy });
    }
  }

  // Then pairs: two of a kind merge and evolve (two Kings crown out instead).
  for (const [a, b] of pairs) {
    if (a.dead || b.dead || used.has(a.id) || used.has(b.id)) continue;
    used.add(a.id);
    used.add(b.id);
    a.dead = true;
    b.dead = true;
    const mx = (a.x * a.r + b.x * b.r) / (a.r + b.r);
    const my = (a.y * a.r + b.y * b.r) / (a.r + b.r);
    if (a.stage >= STAGES.length - 1) {
      const points = STAGES[a.stage].harvest * 2;
      world.score += points;
      burst(world, mx, my, '#ffd700', 34, 260);
      floatText(world, mx, my - 16, `ROYAL HARVEST! +${points}`, '#ffd700', 27);
      world.harvests += 1;
      world.events.push({ type: 'royal', x: mx, y: my });
      continue;
    }
    const born = spawnSlime(world, a.stage + 1, mx, my, (a.vx + b.vx) / 2, Math.min(a.vy, b.vy, -60));
    born.age = MERGE_GRACE * 0.6;
    born.squash = 0.7;
    const points = STAGES[a.stage + 1].merge;
    world.score += points;
    world.merges += 1;
    burst(world, mx, my, STAGES[a.stage + 1].body, 9, 130);
    floatText(world, mx, my - born.r - 6, `+${points}`, '#ffffff', 17);
    world.events.push({ type: 'merge', stage: a.stage + 1, x: mx, y: my });
  }

  if (used.size) world.slimes = world.slimes.filter((s) => !s.dead);
}

export function stepWorld(world, dt) {
  world.time += dt;
  const sub = 2;
  const h = dt / sub;
  for (let i = 0; i < sub; i++) stepPhysics(world, h);
  for (const s of world.slimes) {
    s.age += dt;
    s.squash = Math.max(0, s.squash - dt * 5);
    s.vx *= 0.999;
    if (s.angle === undefined) { s.angle = 0; s.angVel = 0; }
    // Once a slime settles, it rights itself: faces end up readable again.
    const speed = Math.hypot(s.vx, s.vy);
    if (speed < 30 && Math.abs(s.angVel) < 0.8) {
      const upright = Math.round(s.angle / (Math.PI * 2)) * Math.PI * 2;
      s.angle += (upright - s.angle) * Math.min(1, dt * 7);
      s.angVel *= 0.75;
    }
  }
  resolveRules(world);

  if (world.comboTimer > 0) {
    world.comboTimer -= dt;
    if (world.comboTimer <= 0) world.combo = 0;
  }

  // Danger: a settled slime poking over the line starts the countdown.
  let overLine = false;
  for (const s of world.slimes) {
    const speed = Math.hypot(s.vx, s.vy);
    if (s.age > 1 && speed < 60 && s.y - s.r < BOX.dangerY) { overLine = true; break; }
  }
  if (overLine) {
    world.danger += dt;
    if (world.danger >= DANGER_LIMIT) world.events.push({ type: 'over' });
  } else {
    world.danger = Math.max(0, world.danger - dt * 1.6);
  }

  for (const p of world.particles) {
    p.life += dt;
    p.vy += 500 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
  world.particles = world.particles.filter((p) => p.life < p.maxLife);
  for (const t of world.texts) {
    t.life += dt;
    t.y -= 34 * dt;
  }
  world.texts = world.texts.filter((t) => t.life < t.maxLife);
}

// Run the world forward with no input, so screenshot scenes can settle.
export function settle(world, seconds) {
  const step = 1 / 60;
  for (let t = 0; t < seconds; t += step) stepWorld(world, step);
  world.events.length = 0;
  world.danger = 0;
}
