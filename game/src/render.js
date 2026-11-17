// DEEPHOOK render: bright lagoon, dense HUD, fish, towers, screens.
'use strict';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = 1280, H = 720;

function rr(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(str, x, y, size, color, align, weight) {
  ctx.fillStyle = color || '#083344';
  ctx.font = (weight || 'bold') + ' ' + size + 'px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function drawBackground(t) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#8ff0e4');
  g.addColorStop(0.55, '#5fd8d2');
  g.addColorStop(1, '#3ec6c0');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // Sun rays from top-left.
  ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 5; i++) {
    const x0 = 80 + i * 240;
    ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0 + 90, 0); ctx.lineTo(x0 + 260, H); ctx.lineTo(x0 + 60, H); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  // Sandy floor.
  ctx.fillStyle = '#ffe9b8'; ctx.fillRect(0, 620, W, 100);
  ctx.fillStyle = '#f7d68f';
  for (let i = 0; i < 40; i++) {
    const x = (i * 137) % W, y = 630 + ((i * 53) % 80);
    ctx.beginPath(); ctx.ellipse(x, y, 26, 7, 0, 0, 6.29); ctx.fill();
  }
  // Coral clusters.
  const corals = [[60, 640, '#ff7b9c'], [1210, 645, '#ff9f68'], [340, 660, '#c77dff'], [900, 655, '#ff7b9c'], [150, 120, '#ffb703']];
  for (const [x, y, c] of corals) {
    ctx.fillStyle = c;
    for (let k = -2; k <= 2; k++) {
      ctx.beginPath(); ctx.ellipse(x + k * 12, y - Math.abs(k) * -6 - 14, 7, 20 - Math.abs(k) * 3, k * 0.25, 0, 6.29); ctx.fill();
    }
  }
  // The current path: pale foam ribbon.
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 34; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath();
  PATH.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 2; ctx.setLineDash([10, 14]);
  ctx.beginPath();
  PATH.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
  ctx.stroke(); ctx.setLineDash([]);
  // Bubbles.
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  for (const b of G.bubbles) { ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.29); ctx.fill(); }
}

function drawHeart() {
  const pulse = 1 + Math.sin(G.time * 3) * 0.06;
  ctx.save(); ctx.translate(HEART.x, HEART.y); ctx.scale(pulse, pulse);
  ctx.fillStyle = '#ff5d8f';
  ctx.beginPath();
  ctx.moveTo(0, 26);
  ctx.bezierCurveTo(-34, 0, -30, -28, 0, -12);
  ctx.bezierCurveTo(30, -28, 34, 0, 0, 26);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-10, -8, 5, 0, 6.29); ctx.fill();
  ctx.restore();
  text('REEF HEART', HEART.x, HEART.y + 52, 12, '#7c2d12', 'center');
  // Lives pips around the heart.
  for (let i = 0; i < G.maxLives; i++) {
    ctx.fillStyle = i < G.lives ? '#ff5d8f' : 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.arc(HEART.x - 60 + i * 6.4, HEART.y + 68, 2.6, 0, 6.29); ctx.fill();
  }
}

function drawBoat() {
  ctx.save(); ctx.translate(BOAT.x, BOAT.y + Math.sin(G.time * 2) * 2);
  ctx.fillStyle = '#b45309';
  ctx.beginPath(); ctx.moveTo(-34, 0); ctx.lineTo(34, 0); ctx.lineTo(24, 16); ctx.lineTo(-24, 16); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff7d6'; ctx.fillRect(-2, -26, 4, 28);
  ctx.fillStyle = '#ff5d8f';
  ctx.beginPath(); ctx.moveTo(2, -26); ctx.lineTo(26, -16); ctx.lineTo(2, -8); ctx.closePath(); ctx.fill();
  text('YOU', 0, 30, 11, '#7c2d12', 'center');
  ctx.restore();
}

function drawFish(f) {
  const s = f.size;
  const flip = f.x > (f.wp < PATH.length ? PATH[f.wp].x : f.x) ? 1 : 1;
  ctx.save(); ctx.translate(f.x, f.y);
  if (f.type === 'jelly') {
    ctx.fillStyle = f.color;
    ctx.beginPath(); ctx.arc(0, 0, s * 0.9, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = f.color; ctx.lineWidth = 2;
    for (let k = -2; k <= 2; k++) {
      ctx.beginPath(); ctx.moveTo(k * 6, s * 0.7);
      ctx.quadraticCurveTo(k * 8, s * 1.2 + Math.sin(G.time * 5 + k) * 4, k * 5, s * 1.6); ctx.stroke();
    }
  } else if (f.type === 'eel') {
    ctx.strokeStyle = f.color; ctx.lineWidth = s * 0.7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-s, 0);
    ctx.quadraticCurveTo(0, Math.sin(G.time * 6 + f.wob) * 10, s, 0); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s * 0.7, -3, 3, 0, 6.29); ctx.fill();
  } else {
    // Body.
    ctx.fillStyle = f.color;
    ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.55, 0, 0, 6.29); ctx.fill();
    // Tail.
    ctx.beginPath(); ctx.moveTo(-s * 0.8, 0); ctx.lineTo(-s * 1.5, -s * 0.5); ctx.lineTo(-s * 1.5, s * 0.5); ctx.closePath(); ctx.fill();
    // Fin, eye.
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.moveTo(-s * 0.2, -s * 0.5); ctx.lineTo(s * 0.2, -s * 0.5); ctx.lineTo(0, -s * 0.9); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s * 0.55, -s * 0.15, s * 0.16, 0, 6.29); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(s * 0.6, -s * 0.15, s * 0.07, 0, 6.29); ctx.fill();
    if (f.type === 'maw') {
      // Kraken crown + jaws, scaled to the maw's size.
      ctx.fillStyle = '#2d0a5e';
      for (let k = -2; k <= 2; k++) {
        ctx.beginPath(); ctx.ellipse(k * s * 0.22, -s * 0.8, s * 0.09, s * 0.3, k * 0.3, 0, 6.29); ctx.fill();
      }
      // Tentacles curling below the maw.
      ctx.strokeStyle = '#2d0a5e'; ctx.lineCap = 'round'; ctx.lineWidth = s * 0.16;
      for (let k = -2; k <= 2; k++) {
        const sway = Math.sin(G.time * 3 + k * 1.4) * s * 0.07;
        ctx.beginPath(); ctx.moveTo(k * s * 0.32, s * 0.45);
        ctx.quadraticCurveTo(k * s * 0.38 + sway, s * 0.95, k * s * 0.3 + sway * 1.6, s * 1.25); ctx.stroke();
      }
      ctx.fillStyle = '#fff';
      for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(-s * 0.7 + k * 12, s * 0.35); ctx.lineTo(-s * 0.64 + k * 12, s * 0.55); ctx.lineTo(-s * 0.58 + k * 12, s * 0.35); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = '#ff2e63'; ctx.beginPath(); ctx.arc(s * 0.55, -s * 0.15, s * 0.24, 0, 6.29); ctx.fill();
    }
    if (f.type === 'shark') {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.moveTo(s * 0.3, s * 0.3); ctx.lineTo(s * 0.55, s * 0.3); ctx.lineTo(s * 0.42, s * 0.5); ctx.closePath(); ctx.fill();
    }
  }
  // HP bar.
  if (f.hp < f.maxHp) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(-s, -s - 14, s * 2, 5);
    ctx.fillStyle = f.type === 'maw' ? '#ff2e63' : '#7dffb2';
    ctx.fillRect(-s, -s - 14, s * 2 * Math.max(0, f.hp / f.maxHp), 5);
  }
  if (f.hooked) { text('HOOKED!', 0, -s - 24, 12, '#fff', 'center'); }
  ctx.restore();
}

function drawTowers() {
  for (let i = 0; i < PLOTS.length; i++) {
    const p = PLOTS[i];
    const t = G.towers.find(tw => tw.plot === i);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.ellipse(p.x, p.y, 26, 12, 0, 0, 6.29); ctx.fill();
    ctx.strokeStyle = G.hoverPlot === i ? '#fff' : 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2; ctx.stroke();
    if (!t) { text('+', p.x, p.y, 18, 'rgba(255,255,255,0.9)', 'center'); continue; }
    // Tower body.
    ctx.fillStyle = t.def.color;
    ctx.beginPath(); ctx.arc(p.x, p.y - 6, 18, 0, 6.29); ctx.fill();
    ctx.strokeStyle = '#083344'; ctx.lineWidth = 2; ctx.stroke();
    text(t.def.icon, p.x, p.y - 6, 18, '#083344', 'center');
    text('Lv' + t.level, p.x, p.y + 20, 11, '#083344', 'center');
    if (G.placing === i) {
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.setLineDash([6, 6]);
      ctx.beginPath(); ctx.arc(p.x, p.y - 6, t.def.range, 0, 6.29); ctx.stroke(); ctx.setLineDash([]);
    }
  }
}

function drawHooksAndShots() {
  for (const s of G.shots) {
    ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.tx, s.ty); ctx.stroke();
    ctx.fillStyle = '#ffd60a'; ctx.beginPath(); ctx.arc(s.tx, s.ty, 4, 0, 6.29); ctx.fill();
  }
  for (const h of G.hooks) {
    ctx.strokeStyle = '#5b3a1a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(BOAT.x, BOAT.y + 6); ctx.lineTo(h.x, h.y); ctx.stroke();
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath(); ctx.arc(h.x, h.y, 6, 0, 6.29); ctx.fill();
    ctx.strokeStyle = '#5b3a1a'; ctx.stroke();
    if (h.phase === 'fly') { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(h.tx, h.ty, 8, 0, 6.29); ctx.stroke(); }
  }
  for (const n of G.nets) {
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(n.x, n.y, n.r * (0.6 + n.t), 0, 6.29); ctx.stroke();
  }
  for (const c of G.chums) {
    ctx.fillStyle = 'rgba(255,183,3,0.5)';
    ctx.beginPath(); ctx.arc(c.x, c.y, 26 + Math.sin(G.time * 4) * 4, 0, 6.29); ctx.fill();
    text('CHUM', c.x, c.y, 11, '#7c2d12', 'center');
  }
}

function drawFloats() {
  for (const f of G.floats) {
    ctx.globalAlpha = 1 - f.t / f.life;
    text(f.text, f.x, f.y - f.t * 40, 15, f.color, 'center');
    ctx.globalAlpha = 1;
  }
  for (const p of G.particles) {
    ctx.globalAlpha = 1 - p.t / p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.29); ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawHUD() {
  // Top banner: explicit win/lose + tide/score/gold/lives.
  ctx.fillStyle = 'rgba(6,42,51,0.85)'; rr(8, 8, 1264, 64, 12); ctx.fill();
  text('DEEPHOOK', 24, 40, 26, '#7dffb2');
  text('WIN: Hook the Maw\'s heart — survive 12 tides', 190, 30, 14, '#e0fbfc');
  text('LOSE: Reef Heart reaches 0', 190, 52, 13, '#ffb4c2');
  text('TIDE ' + Math.max(1, G.tide) + '/12', 620, 30, 18, '#ffd60a', 'center');
  text(G.tideState === 'build' ? 'BUILD — press SPACE' : G.tideState === 'fighting' ? 'FIGHTING' : 'CLEARED', 620, 52, 12, '#fff', 'center');
  text('SCORE ' + G.score, 800, 30, 16, '#fff', 'center');
  text('GOLD ' + G.gold + 'g', 800, 52, 14, '#ffd60a', 'center');
  text('LIVES ' + G.lives + '/' + G.maxLives, 980, 30, 16, '#ff8fa3', 'center');
  text('PEARLS ' + G.pearls, 980, 52, 13, '#e0aaff', 'center');
  // Combo.
  if (G.combo >= 2) {
    ctx.fillStyle = 'rgba(255,214,10,0.9)'; rr(1090, 16, 170, 48, 10); ctx.fill();
    text('HOOKED x' + G.combo + '  +' + (10 + G.combo * 6), 1175, 32, 17, '#7c2d12', 'center');
    text('CHAIN BONUS ACTIVE', 1175, 52, 11, '#7c2d12', 'center');
  } else {
    text('HOOK x0 — cast with Q', 1175, 40, 13, '#bde0fe', 'center');
  }

  // Right panel: threat queue + relics.
  ctx.fillStyle = 'rgba(6,42,51,0.8)'; rr(1024, 84, 248, 300, 12); ctx.fill();
  text('THREAT QUEUE', 1040, 104, 14, '#7dffb2');
  const upcoming = G.spawnQueue.slice(0, 6);
  if (G.tideState === 'fighting' && upcoming.length === 0 && G.fish.length === 0) text('— clear —', 1040, 130, 13, '#fff');
  upcoming.forEach((s, i) => {
    const d = FISH[s.type];
    ctx.fillStyle = d.color; ctx.beginPath(); ctx.arc(1052, 128 + i * 22, 8, 0, 6.29); ctx.fill();
    text(d.name + '  x' + 1, 1066, 128 + i * 22, 13, '#fff');
  });
  if (G.tideState === 'build' && G.tide < 12) {
    text('Next: TIDE ' + (G.tide + 1), 1040, 130, 13, '#ffd60a');
    text('Press SPACE to start', 1040, 152, 12, '#fff');
  }
  text('RELICS HELD (' + G.relics.length + '/8)', 1040, 268, 14, '#e0aaff');
  if (G.relics.length === 0) text('None yet — clear tides!', 1040, 292, 12, '#fff');
  G.relics.slice(0, 4).forEach((r, i) => {
    ctx.fillStyle = '#ffd60a'; ctx.beginPath(); ctx.arc(1052, 292 + i * 20, 6, 0, 6.29); ctx.fill();
    text(r.name, 1066, 292 + i * 20, 12, '#fff');
  });
  if (G.relics.length > 4) text('+' + (G.relics.length - 4) + ' more…', 1040, 292 + 4 * 20, 12, '#fff');

  // Boss bar.
  if (G.boss) {
    ctx.fillStyle = 'rgba(6,42,51,0.85)'; rr(340, 84, 600, 40, 10); ctx.fill();
    text('THE MAW OF THE DEEP — PHASE ' + G.bossPhase + '/3   ·   ' + Math.max(0, Math.ceil(G.boss.hp)) + ' / ' + G.bossMax + ' HP', 640, 98, 15, '#ff8fa3', 'center');
    ctx.fillStyle = '#3a0ca3'; ctx.fillRect(360, 108, 560, 10);
    ctx.fillStyle = '#ff2e63'; ctx.fillRect(360, 108, 560 * Math.max(0, G.boss.hp / G.bossMax), 10);
  }

  // Bottom: tower shop + ability bar.
  ctx.fillStyle = 'rgba(6,42,51,0.85)'; rr(8, 620, 1264, 92, 12); ctx.fill();
  TOWERS.forEach((t, i) => {
    const x = 24 + i * 128, y = 630;
    const sel = G.selectedTower === i;
    const afford = G.gold >= t.cost;
    ctx.fillStyle = sel ? 'rgba(125,255,178,0.9)' : afford ? 'rgba(255,255,255,0.12)' : 'rgba(255,77,109,0.30)';
    rr(x, y, 118, 72, 8); ctx.fill();
    ctx.fillStyle = t.color; ctx.beginPath(); ctx.arc(x + 18, y + 18, 12, 0, 6.29); ctx.fill();
    text(t.icon, x + 18, y + 18, 14, '#083344', 'center');
    text('[' + t.key + '] ' + t.name, x + 36, y + 14, 10, '#fff');
    text(t.cost + 'g · ' + t.desc, x + 8, y + 38, 9, '#bde0fe');
    text('dmg ' + t.dmg + '   rng ' + t.range, x + 8, y + 56, 9, '#bde0fe');
  });
  // Ability bar.
  const ab = [
    ['Q', 'CAST HOOK', G.hookCd], ['E', 'NET', G.netCd], ['R', 'CHUM', G.chumCd], ['F', 'HARPOON', G.harpoonCd],
  ];
  ab.forEach((a, i) => {
    const x = 800 + i * 116, y = 630;
    const ready = a[2] <= 0;
    ctx.fillStyle = ready ? 'rgba(255,214,10,0.9)' : 'rgba(255,255,255,0.15)';
    rr(x, y, 106, 72, 8); ctx.fill();
    text('[' + a[0] + ']', x + 53, y + 16, 14, ready ? '#7c2d12' : '#fff', 'center');
    text(a[1], x + 53, y + 38, 12, ready ? '#7c2d12' : '#bde0fe', 'center');
    text(ready ? 'READY' : Math.ceil(a[2]) + 's', x + 53, y + 58, 11, ready ? '#7c2d12' : '#ff8fa3', 'center');
  });

  // Big event callout.
  if (G.callout) {
    const a = Math.min(1, G.callout.timer * 2);
    ctx.globalAlpha = a;
    text(G.callout.text, 640, 200, 40, '#ffffff', 'center');
    ctx.strokeStyle = '#083344'; ctx.lineWidth = 6;
    ctx.strokeText(G.callout.text, 640, 200);
    text(G.callout.text, 640, 200, 40, '#ffffff', 'center');
    if (G.callout.sub) text(G.callout.sub, 640, 260, 17, '#fff', 'center');
    ctx.globalAlpha = 1;
  }
  if (G.message) { text(G.message, 640, 600, 14, '#ff8fa3', 'center'); }
  // Drag hint while casting.
  if (G.mouse.dragging) {
    ctx.strokeStyle = '#ffd60a'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.moveTo(BOAT.x, BOAT.y); ctx.lineTo(G.mouse.x, G.mouse.y); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#ffd60a'; ctx.beginPath(); ctx.arc(G.mouse.x, G.mouse.y, 10, 0, 6.29); ctx.fill();
    text('RELEASE TO CAST!', G.mouse.x, G.mouse.y - 22, 14, '#fff', 'center');
  }
}

function drawTitle() {
  drawBackground(0);
  // Title fish school decoration.
  for (let i = 0; i < 8; i++) {
    const f = { type: i % 3 === 0 ? 'puffer' : 'minnow', size: 16 + (i % 3) * 6, x: 150 + i * 130, y: 420 + Math.sin(i * 1.3) * 30, hp: 10, maxHp: 10, wp: 0, wob: i };
    drawFish(f);
  }
  drawHeart();
  ctx.fillStyle = 'rgba(6,42,51,0.55)'; rr(240, 90, 800, 420, 18); ctx.fill();
  text('DEEPHOOK', 640, 160, 72, '#7dffb2', 'center');
  text('hook the deep, hold the reef', 640, 210, 24, '#e0fbfc', 'center');
  text('Cast hooks. Reel in the school. Hold the Reef Heart through 12 tides', 640, 252, 16, '#fff', 'center');
  text('— and hook the heart of THE MAW OF THE DEEP.', 640, 278, 16, '#ffd60a', 'center');
  // How-to.
  text('HOW TO PLAY', 640, 322, 16, '#7dffb2', 'center');
  text('1-6 pick a lure · click a sand plot to build · SPACE starts a tide', 640, 348, 14, '#fff', 'center');
  text('Q or drag from the boat: CAST & REEL a hook — chain catches for combo gold', 640, 372, 14, '#fff', 'center');
  text('E net · R chum · F harpoon the boss · Click a tower to upgrade it', 640, 396, 14, '#fff', 'center');
  text('WIN: survive 12 tides and hook the Maw   ·   LOSE: Reef Heart hits 0', 640, 420, 14, '#ff8fa3', 'center');
  ctx.fillStyle = '#ffd60a'; rr(520, 448, 240, 52, 12); ctx.fill();
  text('▶  PLAY  (click or SPACE)', 640, 474, 20, '#7c2d12', 'center');
  text('Bright lagoon · 6 lures · 8 relics · combo chains · 3-phase Kraken boss', 640, 540, 13, '#bde0fe', 'center');
}

function drawEnd(victory) {
  drawBackground(0);
  ctx.fillStyle = 'rgba(6,42,51,0.6)'; rr(280, 110, 720, 480, 18); ctx.fill();
  if (victory) {
    text('REEF SAVED!', 640, 170, 56, '#7dffb2', 'center');
    text('The Maw is hooked. The lagoon sings again.', 640, 214, 18, '#fff', 'center');
    let stars = '';
    for (let i = 0; i < 3; i++) stars += i < G.victoryStars ? '★' : '☆';
    text(stars, 640, 280, 64, '#ffd60a', 'center');
    text(G.victoryStars + ' / 3 STARS', 640, 330, 18, '#ffd60a', 'center');
  } else {
    text('THE REEF FALLS', 640, 170, 56, '#ff8fa3', 'center');
    text('The current carried the school through. The heart is dark.', 640, 214, 18, '#fff', 'center');
    text('Tide reached: ' + G.tide + ' / 12', 640, 280, 20, '#fff', 'center');
  }
  text('SCORE ' + G.score + '    GOLD EARNED ' + G.totalGoldEarned + 'g', 640, 380, 18, '#fff', 'center');
  text('FISH HOOKED ' + G.totalHooked + '    BEST CHAIN x' + G.bestCombo + '    KILLS ' + G.stats.kills, 640, 412, 16, '#bde0fe', 'center');
  text('RELICS ' + G.relics.length + '/8    TIDES CLEARED ' + G.stats.tidesCleared + '/12', 640, 442, 16, '#bde0fe', 'center');
  ctx.fillStyle = '#ffd60a'; rr(520, 480, 240, 52, 12); ctx.fill();
  text('↻  PLAY AGAIN  (SPACE)', 640, 506, 20, '#7c2d12', 'center');
}

function render() {
  ctx.clearRect(0, 0, W, H);
  if (G.screen === 'title') { drawTitle(); return; }
  if (G.screen === 'victory') { drawEnd(true); return; }
  if (G.screen === 'defeat') { drawEnd(false); return; }
  drawBackground(G.time);
  drawHeart(); drawBoat();
  drawTowers();
  for (const f of G.fish) drawFish(f);
  drawHooksAndShots();
  drawFloats();
  drawHUD();
}
