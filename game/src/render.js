// Everything the player sees. Slimes are drawn entirely in code — body,
// face and a little stage decoration — so the game ships zero image files.

import { BOX, STAGES, TARGET_SCORE, VIEW, WIN_HARVESTS } from './config.js';

// Fixed star specks for the night-sky backdrop (precomputed: no flicker).
const STARS = [];
{
  let seed = 42;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let i = 0; i < 90; i++) STARS.push({ x: rnd() * VIEW.width, y: rnd() * VIEW.height, r: rnd() * 1.6 + 0.4, p: rnd() * 6 });
}

export const BUTTONS = {
  winContinue: { x: 330, y: 402, w: 140, h: 46 },
  winRestart: { x: 490, y: 402, w: 140, h: 46 },
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawSlimeShape(ctx, stage, x, y, r, time, opts = {}) {
  const def = STAGES[stage];
  const squash = opts.squash || 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(opts.angle || 0);
  ctx.scale(1 + squash * 0.22, 1 - squash * 0.22);
  ctx.translate(-x, -y);

  const grad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.15, x, y, r * 1.05);
  grad.addColorStop(0, def.belly);
  grad.addColorStop(0.55, def.body);
  grad.addColorStop(1, def.body);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Belly shine.
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.34, y - r * 0.42, r * 0.2, r * 0.12, -0.6, 0, Math.PI * 2);
  ctx.fill();

  drawDecoration(ctx, stage, x, y, r, time);

  // Face. Eyes blink on a per-slime rhythm; pupils drift with movement.
  const blink = ((time + (opts.phase || 0)) % 3.4) < 0.12;
  const lookX = Math.max(-1, Math.min(1, (opts.vx || 0) / 160)) * r * 0.08;
  const eyeY = y - r * 0.08;
  const eyeDX = r * 0.36;
  const eyeR = Math.max(1.6, r * 0.13);
  ctx.fillStyle = '#22303f';
  for (const side of [-1, 1]) {
    const ex = x + side * eyeDX;
    if (blink) {
      ctx.fillRect(ex - eyeR, eyeY - 1, eyeR * 2, 2);
    } else {
      ctx.beginPath();
      ctx.arc(ex + lookX, eyeY, eyeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex + lookX + eyeR * 0.3, eyeY - eyeR * 0.3, eyeR * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22303f';
    }
  }
  // Mouth: a smile (the King gets an open grin).
  ctx.strokeStyle = '#22303f';
  ctx.lineWidth = Math.max(1.4, r * 0.06);
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (stage === STAGES.length - 1) {
    ctx.arc(x, y + r * 0.18, r * 0.3, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.fillStyle = '#7a4a21';
    ctx.fill();
  } else {
    ctx.arc(x, y + r * 0.1, r * 0.3, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
  }
  // Rosy cheeks on the small ones.
  if (stage <= 2) {
    ctx.fillStyle = 'rgba(255,110,150,0.4)';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(x + side * r * 0.58, y + r * 0.22, r * 0.14, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawDecoration(ctx, stage, x, y, r, time) {
  ctx.save();
  const topY = y - r * 0.92;
  if (stage === 1) {
    // Sprout: stem and two leaves.
    ctx.strokeStyle = '#2e8b3a';
    ctx.lineWidth = Math.max(1.5, r * 0.07);
    ctx.beginPath();
    ctx.moveTo(x, y - r * 0.8);
    ctx.quadraticCurveTo(x + r * 0.05, topY - r * 0.1, x, topY - r * 0.22);
    ctx.stroke();
    ctx.fillStyle = '#3fbf52';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(x + side * r * 0.18, topY - r * 0.2, r * 0.2, r * 0.1, side * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (stage === 2) {
    // Bloom: a five-petal flower.
    ctx.fillStyle = '#ff5fa8';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.arc(x + r * 0.3 + Math.cos(a) * r * 0.13, topY + Math.sin(a) * r * 0.13, r * 0.11, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffe066';
    ctx.beginPath();
    ctx.arc(x + r * 0.3, topY, r * 0.09, 0, Math.PI * 2);
    ctx.fill();
  } else if (stage === 3) {
    // Bolt: a lightning flash on the forehead.
    ctx.fillStyle = '#fff3bf';
    ctx.strokeStyle = '#e8a100';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x + r * 0.08, y - r * 1.06);
    ctx.lineTo(x - r * 0.16, y - r * 0.6);
    ctx.lineTo(x + r * 0.02, y - r * 0.6);
    ctx.lineTo(x - r * 0.1, y - r * 0.24);
    ctx.lineTo(x + r * 0.2, y - r * 0.66);
    ctx.lineTo(x + r * 0.02, y - r * 0.66);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (stage === 4) {
    // Ember: a flickering flame.
    const flick = Math.sin(time * 11 + x) * r * 0.05;
    ctx.fillStyle = '#ff6b35';
    ctx.beginPath();
    ctx.moveTo(x, topY - r * 0.42 + flick);
    ctx.quadraticCurveTo(x + r * 0.24, topY - r * 0.05, x + r * 0.12, topY + r * 0.14);
    ctx.quadraticCurveTo(x, topY + r * 0.2, x - r * 0.12, topY + r * 0.14);
    ctx.quadraticCurveTo(x - r * 0.24, topY - r * 0.05, x, topY - r * 0.42 + flick);
    ctx.fill();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.moveTo(x, topY - r * 0.16 + flick * 0.5);
    ctx.quadraticCurveTo(x + r * 0.11, topY + r * 0.04, x, topY + r * 0.14);
    ctx.quadraticCurveTo(x - r * 0.11, topY + r * 0.04, x, topY - r * 0.16 + flick * 0.5);
    ctx.fill();
  } else if (stage === 5) {
    // Frost: an ice crystal.
    ctx.fillStyle = '#dff8ff';
    ctx.strokeStyle = '#5ec8e6';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, topY - r * 0.3);
    ctx.lineTo(x + r * 0.17, topY + r * 0.05);
    ctx.lineTo(x, topY + r * 0.24);
    ctx.lineTo(x - r * 0.17, topY + r * 0.05);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (stage === 6) {
    // Star: a little star hat, plus sparkles.
    ctx.fillStyle = '#ffe066';
    ctx.beginPath();
    const cx = x + r * 0.1;
    const cy = topY - r * 0.08;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const rad = i % 2 === 0 ? r * 0.24 : r * 0.1;
      const px = cx + Math.cos(a) * rad;
      const py = cy + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  } else if (stage === 7) {
    // King: a crown with three points and jewels.
    ctx.fillStyle = '#ffd700';
    ctx.strokeStyle = '#c9930a';
    ctx.lineWidth = 1.5;
    const w = r * 0.78;
    const baseY = topY + r * 0.16;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, baseY);
    ctx.lineTo(x - w / 2, baseY - r * 0.3);
    ctx.lineTo(x - w / 4, baseY - r * 0.08);
    ctx.lineTo(x, baseY - r * 0.42);
    ctx.lineTo(x + w / 4, baseY - r * 0.08);
    ctx.lineTo(x + w / 2, baseY - r * 0.3);
    ctx.lineTo(x + w / 2, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ff5f8f';
    ctx.beginPath();
    ctx.arc(x, baseY - r * 0.1, r * 0.06, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPanel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(255,255,255,0.055)';
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawBox(ctx, world, time) {
  // Interior.
  const grad = ctx.createLinearGradient(0, BOX.top, 0, BOX.floor);
  grad.addColorStop(0, '#24382a');
  grad.addColorStop(1, '#31482c');
  ctx.fillStyle = grad;
  ctx.fillRect(BOX.left, BOX.top, BOX.right - BOX.left, BOX.floor - BOX.top);
  // Soil floor.
  ctx.fillStyle = '#5b4632';
  ctx.fillRect(BOX.left, BOX.floor - 14, BOX.right - BOX.left, 14);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  for (let i = 0; i < 26; i++) {
    const sx = BOX.left + ((i * 173) % (BOX.right - BOX.left - 12)) + 6;
    ctx.fillRect(sx, BOX.floor - 10 + ((i * 37) % 7), 3, 2);
  }
  // Wooden walls.
  ctx.fillStyle = '#8a5a33';
  ctx.fillRect(BOX.left - 10, BOX.top - 6, 10, BOX.floor - BOX.top + 20);
  ctx.fillRect(BOX.right, BOX.top - 6, 10, BOX.floor - BOX.top + 20);
  ctx.fillRect(BOX.left - 10, BOX.floor, BOX.right - BOX.left + 20, 12);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  for (const wx of [BOX.left - 10, BOX.right]) {
    for (let y = BOX.top + 40; y < BOX.floor; y += 64) {
      ctx.beginPath();
      ctx.moveTo(wx, y);
      ctx.lineTo(wx + 10, y);
      ctx.stroke();
    }
  }
  // Danger line.
  const danger = world.danger > 0;
  const flash = danger && Math.sin(time * 14) > 0;
  ctx.strokeStyle = flash ? '#ff4757' : 'rgba(255,71,87,0.55)';
  ctx.lineWidth = danger ? 3 : 2;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.moveTo(BOX.left, BOX.dangerY);
  ctx.lineTo(BOX.right, BOX.dangerY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = flash ? '#ff4757' : 'rgba(255,120,130,0.8)';
  ctx.font = '700 11px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('DANGER LINE', BOX.left + 6, BOX.dangerY - 7);
  if (danger) {
    ctx.fillStyle = 'rgba(255,71,87,0.13)';
    ctx.fillRect(BOX.left, BOX.top, BOX.right - BOX.left, BOX.dangerY - BOX.top);
  }
}

function drawHud(ctx, g) {
  const { world } = g;
  drawPanel(ctx, 16, 16, 256, 608);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffe066';
  ctx.font = '800 25px system-ui, sans-serif';
  ctx.fillText('SLIME', 36, 56);
  ctx.fillStyle = '#7be495';
  ctx.fillText('HARVEST', 36, 84);

  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.fillText('SCORE', 36, 126);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 40px system-ui, sans-serif';
  ctx.fillText(String(world.score), 36, 168);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.fillText(`BEST ${g.best}`, 36, 196);

  // Goal progress.
  const ratio = Math.min(1, world.score / TARGET_SCORE);
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  roundRect(ctx, 36, 214, 216, 12, 6);
  ctx.fill();
  ctx.fillStyle = ratio >= 1 ? '#ffd700' : '#7be495';
  if (ratio > 0) {
    roundRect(ctx, 36, 214, Math.max(12, 216 * ratio), 12, 6);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.fillText(`GOAL ${TARGET_SCORE} pts + ${WIN_HARVESTS} Bloom+ harvests`, 36, 244);

  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.fillText(`BIG HARVESTS ${world.bigHarvests}/${WIN_HARVESTS}    MERGES ${world.merges}`, 36, 276);
  if (world.combo > 1) {
    ctx.fillStyle = '#ff9ed2';
    ctx.font = '800 17px system-ui, sans-serif';
    ctx.fillText(`COMBO x${world.combo}`, 36, 304);
  }

  // Next drop preview.
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.fillText('NEXT DROP', 36, 344);
  drawSlimeShape(ctx, g.nextStage, 76, 392, STAGES[g.nextStage].radius * 1.15, g.time, {});
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 16px system-ui, sans-serif';
  ctx.fillText(STAGES[g.nextStage].name, 118, 398);

  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '600 13px system-ui, sans-serif';
  const lines = [
    'Move mouse / arrow keys to aim',
    'Click / SPACE to drop',
    '2 of a kind: merge & evolve',
    '3 of a kind touching: HARVEST!',
    'Stay under the danger line',
    'P pause · R restart',
  ];
  lines.forEach((line, i) => ctx.fillText(line, 36, 452 + i * 24));
}

function drawGuide(ctx, g) {
  drawPanel(ctx, 764, 16, 180, 608);
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.fillText('EVOLUTION', 782, 48);
  STAGES.forEach((def, i) => {
    const y = 92 + i * 62;
    drawSlimeShape(ctx, i, 806, y, Math.min(24, def.radius), g.time, { phase: i * 0.9 });
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 14px system-ui, sans-serif';
    ctx.fillText(def.name, 842, y - 2);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '600 11px system-ui, sans-serif';
    ctx.fillText(`harvest ${def.harvest}`, 842, y + 14);
    if (i < STAGES.length - 1) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font = '700 13px system-ui, sans-serif';
      ctx.fillText('↓', 800, y + 40);
    }
  });
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '600 11.5px system-ui, sans-serif';
  ctx.fillText('Kings never merge away.', 782, 592);
  ctx.fillText('Only a triple reaps them.', 782, 608);
}

function drawButton(ctx, rect, label, primary) {
  ctx.fillStyle = primary ? '#7be495' : 'rgba(255,255,255,0.14)';
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
  ctx.fill();
  ctx.fillStyle = primary ? '#12351c' : '#ffffff';
  ctx.font = '800 17px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 6);
  ctx.textAlign = 'left';
}

function drawCenterPanel(ctx, w, h) {
  ctx.fillStyle = 'rgba(8,12,24,0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  drawPanel(ctx, (VIEW.width - w) / 2, (VIEW.height - h) / 2, w, h);
  return { x: (VIEW.width - w) / 2, y: (VIEW.height - h) / 2 };
}

export function drawScene(ctx, g) {
  const { world, time } = g;
  const bg = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  bg.addColorStop(0, '#0d1530');
  bg.addColorStop(1, '#16283f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  for (const s of STARS) {
    ctx.globalAlpha = 0.35 + 0.3 * Math.sin(time * 1.4 + s.p);
    ctx.fillStyle = '#cfe4ff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  drawBox(ctx, world, time);
  drawHud(ctx, g);
  drawGuide(ctx, g);

  // Aim guide and the slime waiting to drop.
  if (g.state === 'play' && !g.paused) {
    const r = STAGES[g.dropStage].radius;
    const x = Math.max(BOX.left + r + 2, Math.min(BOX.right - r - 2, g.aimX));
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.setLineDash([4, 7]);
    ctx.beginPath();
    ctx.moveTo(x, BOX.top + r * 2 + 14);
    ctx.lineTo(x, BOX.floor);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = g.coolRatio >= 1 ? 0.95 : 0.35;
    drawSlimeShape(ctx, g.dropStage, x, BOX.top + r + 4, r, time, {});
    ctx.globalAlpha = 1;
  }

  for (const s of world.slimes) {
    drawSlimeShape(ctx, s.stage, s.x, s.y, s.r, time, { squash: s.squash, vx: s.vx, phase: s.id * 0.73, angle: s.angle || 0 });
  }
  for (const p of world.particles) {
    ctx.globalAlpha = Math.max(0, 1 - p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const t of world.texts) {
    ctx.globalAlpha = Math.max(0, 1 - t.life / t.maxLife);
    ctx.fillStyle = t.color;
    ctx.font = `800 ${t.size}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';

  if (g.state === 'title') {
    drawCenterPanel(ctx, 560, 430);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe066';
    ctx.font = '900 54px system-ui, sans-serif';
    ctx.fillText('SLIME HARVEST', 480, 190);
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 17px system-ui, sans-serif';
    ctx.fillText('Drop slimes. Two of a kind merge and evolve.', 480, 232);
    ctx.fillText('Three of a kind touching are HARVESTED for big points.', 480, 258);
    ctx.fillText(`Reach ${TARGET_SCORE} points and ${WIN_HARVESTS} Bloom-or-bigger harvests.`, 480, 284);
    const row = [0, 1, 2, 3, 4];
    row.forEach((stage, i) => {
      drawSlimeShape(ctx, stage, 330 + i * 76, 356, STAGES[stage].radius, time, { phase: i });
    });
    ctx.fillStyle = Math.sin(time * 4) > -0.2 ? '#7be495' : 'rgba(123,228,149,0.4)';
    ctx.font = '800 20px system-ui, sans-serif';
    ctx.fillText('Click or press SPACE to start', 480, 448);
    ctx.textAlign = 'left';
  }

  if (g.state === 'over') {
    drawCenterPanel(ctx, 480, 330);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff6b81';
    ctx.font = '900 44px system-ui, sans-serif';
    ctx.fillText('GAME OVER', 480, 252);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 22px system-ui, sans-serif';
    ctx.fillText(`Score ${world.score}   Best ${g.best}`, 480, 306);
    ctx.font = '600 16px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText(`${world.harvests} harvests · ${world.merges} merges`, 480, 338);
    ctx.fillStyle = Math.sin(time * 4) > -0.2 ? '#7be495' : 'rgba(123,228,149,0.4)';
    ctx.font = '800 19px system-ui, sans-serif';
    ctx.fillText('Click or press R to play again', 480, 398);
    ctx.textAlign = 'left';
  }

  if (g.state === 'win') {
    drawCenterPanel(ctx, 560, 320);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.font = '900 44px system-ui, sans-serif';
    ctx.fillText('YOU WIN!', 480, 246);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 20px system-ui, sans-serif';
    ctx.fillText(`Goal reached with ${world.score} points`, 480, 292);
    ctx.font = '600 15px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText('Keep going in endless mode, or start a fresh run.', 480, 322);
    ctx.textAlign = 'left';
    drawButton(ctx, BUTTONS.winContinue, 'CONTINUE', true);
    drawButton(ctx, BUTTONS.winRestart, 'RESTART', false);
  }

  if (g.paused && g.state === 'play') {
    ctx.fillStyle = 'rgba(8,12,24,0.55)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 40px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', 480, 330);
    ctx.font = '600 16px system-ui, sans-serif';
    ctx.fillText('Press P to resume', 480, 362);
    ctx.textAlign = 'left';
  }
}
