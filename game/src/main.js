// Slime Harvest — entry point. Owns the run's state machine
// (title -> play -> win/over), the dropper, sound triggers and the loop.

import { BOX, DROP_COOLDOWN, DROP_TABLE, DROP_TABLE_LATE, DROP_TABLE_MID, ESCALATE_LATE, ESCALATE_MID, TARGET_SCORE, VIEW, WIN_HARVESTS } from './config.js';
import { makeRandom, pickDropStage } from './random.js';
import { createWorld, dropSlime, floatText, stepWorld } from './world.js';
import { BUTTONS, drawScene } from './render.js';
import { attachInput } from './input.js';
import {
  ensureAudio, playClick, playDrop, playGameOver, playHarvest,
  playMerge, playRoyal, playWin, startBgm, stopBgm,
} from './audio.js';
import { setupShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') || '20261117') >>> 0;
const shotName = params.get('shot');
const random = makeRandom(seed);

const g = {
  state: 'title',
  world: createWorld(),
  time: 0,
  aimX: (BOX.left + BOX.right) / 2,
  dropStage: 0,
  nextStage: 1,
  cool: 0,
  coolRatio: 1,
  best: 0,
  paused: false,
  won: false,
  goalPinged: false,
  escPinged: 0,
  shotMode: Boolean(shotName),
};

// The sky escalates with the score: bigger drops, faster fill, real stakes.
function dropTableFor(score) {
  if (score >= ESCALATE_LATE) return DROP_TABLE_LATE;
  if (score >= ESCALATE_MID) return DROP_TABLE_MID;
  return DROP_TABLE;
}

try {
  g.best = Number(window.localStorage.getItem('slime-harvest-best') || 0) || 0;
} catch {
  g.best = 0;
}

// A small handle for automated playtests (and curious players in devtools).
window.__slimeHarvest = g;

function announce(text) {
  status.textContent = text;
}

function saveBest() {
  if (g.world.score > g.best) {
    g.best = g.world.score;
    try {
      window.localStorage.setItem('slime-harvest-best', String(g.best));
    } catch {
      // Private modes may refuse storage; the run itself is unaffected.
    }
  }
}

function startRun() {
  g.world = createWorld();
  g.dropStage = pickDropStage(random, DROP_TABLE);
  g.nextStage = pickDropStage(random, DROP_TABLE);
  g.cool = 0;
  g.won = false;
  g.goalPinged = false;
  g.escPinged = 0;
  g.paused = false;
  g.state = 'play';
  ensureAudio();
  startBgm();
  announce('Game started. Drop slimes, merge pairs, harvest triples.');
}

function gameOver() {
  g.state = 'over';
  saveBest();
  stopBgm();
  playGameOver();
  announce(`Game over. Score ${g.world.score}.`);
}

function doDrop() {
  if (g.state !== 'play' || g.paused || g.cool > 0) return;
  if (g.world.slimes.length >= 130) return;
  dropSlime(g.world, g.dropStage, g.aimX);
  playDrop();
  g.dropStage = g.nextStage;
  g.nextStage = pickDropStage(random, DROP_TABLE);
  g.cool = DROP_COOLDOWN;
}

function inRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function press(x, y) {
  ensureAudio();
  if (g.state === 'title') {
    playClick();
    startRun();
  } else if (g.state === 'over') {
    playClick();
    startRun();
  } else if (g.state === 'win') {
    if (y !== null && inRect(x, y, BUTTONS.winContinue)) {
      g.state = 'play';
      playClick();
    } else if (y !== null && inRect(x, y, BUTTONS.winRestart)) {
      playClick();
      startRun();
    } else if (y === null) {
      g.state = 'play';
    }
  } else {
    doDrop();
  }
}

attachInput(canvas, toView, {
  onAim(x) {
    g.aimX = x;
  },
  onAimKey(dir) {
    g.aimX = Math.max(BOX.left, Math.min(BOX.right, g.aimX + dir * 22));
  },
  onPress: press,
  onRestart() {
    if (g.state === 'play' || g.state === 'over') {
      playClick();
      startRun();
    }
  },
  onPause() {
    if (g.state === 'play') g.paused = !g.paused;
  },
});

// Letterbox transform: the 960x640 view centred in whatever window we get.
let viewScale = 1;
let viewOffX = 0;
let viewOffY = 0;

function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  viewScale = Math.min(canvas.width / VIEW.width, canvas.height / VIEW.height);
  viewOffX = (canvas.width - VIEW.width * viewScale) / 2;
  viewOffY = (canvas.height - VIEW.height * viewScale) / 2;
}

function toView(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const px = (clientX - rect.left) * (canvas.width / rect.width);
  const py = (clientY - rect.top) * (canvas.height / rect.height);
  return { x: (px - viewOffX) / viewScale, y: (py - viewOffY) / viewScale };
}

window.addEventListener('resize', resize);
resize();

function handleEvents() {
  for (const event of g.world.events) {
    if (event.type === 'merge') playMerge(event.stage);
    else if (event.type === 'harvest') {
      playHarvest();
      announce(`Harvest! Score ${g.world.score}.`);
    } else if (event.type === 'royal') {
      playRoyal();
      announce(`Royal harvest! Score ${g.world.score}.`);
    } else if (event.type === 'over' && !g.shotMode) {
      gameOver();
    }
  }
  g.world.events.length = 0;
}

if (g.shotMode) setupShot(g, shotName);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  g.time += dt;

  if (g.shotMode) {
    // Screenshot scenes are frozen as set up; faces still animate via time.
  } else if (g.state === 'play' && !g.paused) {
    g.cool = Math.max(0, g.cool - dt);
    stepWorld(g.world, dt);
    handleEvents();
    if (!g.won && g.world.score >= TARGET_SCORE && g.world.bigHarvests >= WIN_HARVESTS) {
      g.won = true;
      g.state = 'win';
      saveBest();
      playWin();
      announce(`You win with ${g.world.score} points. Continue endlessly or restart.`);
    }
    const escLevel = g.world.score >= ESCALATE_LATE ? 2 : g.world.score >= ESCALATE_MID ? 1 : 0;
    if (escLevel > g.escPinged) {
      g.escPinged = escLevel;
      floatText(g.world, (BOX.left + BOX.right) / 2, 300, 'BIGGER DROPS INCOMING!', '#ff9ed2', 23);
      announce('The drops are getting bigger.');
    }
    if (!g.goalPinged && g.world.score >= TARGET_SCORE && g.world.bigHarvests < WIN_HARVESTS) {
      // Points alone do not finish a run: say what is missing, once.
      g.goalPinged = true;
      floatText(g.world, (BOX.left + BOX.right) / 2, 300, `NEED ${WIN_HARVESTS - g.world.bigHarvests} MORE BIG HARVESTS!`, '#ffe066', 24);
      announce(`Score goal reached. Harvest Bloom or bigger ${WIN_HARVESTS - g.world.bigHarvests} more times to win.`);
    }
  } else if (g.state === 'title' || g.state === 'over') {
    // Let particles and faces keep breathing behind the panels.
    stepWorld(g.world, dt * 0.25);
    g.world.events.length = 0;
    g.world.danger = 0;
  }
  g.coolRatio = 1 - g.cool / DROP_COOLDOWN;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#0a0f22';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(viewScale, 0, 0, viewScale, viewOffX, viewOffY);
  drawScene(ctx, g);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
