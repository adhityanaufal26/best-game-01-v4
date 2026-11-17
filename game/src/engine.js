// DEEPHOOK engine: tides, lure-towers, cast & reel hook, abilities, boss phases.
'use strict';

function newGame() {
  return {
    screen: 'title',            // title | play | victory | defeat
    time: 0, gold: 160, pearls: 0, score: 0,
    lives: 20, maxLives: 20,
    tide: 0, tideState: 'build', // build | fighting | done
    spawnQueue: [], spawnTimer: 0, spawnGap: 1,
    fish: [], towers: [], shots: [], floats: [], particles: [], bubbles: [],
    hooks: [], nets: [], chums: [],
    relics: [], relicOffer: null,
    combo: 0, comboTimer: 0, bestCombo: 0, totalHooked: 0, totalGoldEarned: 0,
    hookCd: 0, netCd: 0, chumCd: 0, harpoonCd: 0,
    selectedTower: 0, placing: null, hoverPlot: -1,
    boss: null, bossPhase: 0, bossMax: 0,
    callout: null, calloutTimer: 0,
    stats: { kills: 0, hooks: 0, tidesCleared: 0, damageDealt: 0 },
    mouse: { x: 640, y: 360, down: false, dragX: 0, dragY: 0, dragging: false },
    rng: mulberry32(20261117),
    victoryStars: 0, message: '',
  };
}

let G = newGame();

function showCallout(text, sub, dur) {
  G.callout = { text, sub: sub || '', timer: dur || 2.2 };
}

function addFloat(x, y, text, color) {
  G.floats.push({ x, y, text, color: color || '#fff', t: 0, life: 1.1 });
}

function burst(x, y, color, n) {
  for (let i = 0; i < (n || 10); i++) {
    const a = G.rng() * Math.PI * 2, s = 30 + G.rng() * 90;
    G.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, life: 0.5 + G.rng() * 0.4, color, r: 2 + G.rng() * 3 });
  }
}

function startGame() {
  G = newGame();
  G.screen = 'play';
  AudioSys.ensure(); AudioSys.startMusic();
  showCallout('TIDE 1 — THE LAGOON WAKES', 'Place lures, then press SPACE to start the tide', 3);
}

function startTide() {
  if (G.screen !== 'play' || G.tideState !== 'build') return;
  G.tide++;
  const plan = TIDES[G.tide - 1];
  G.spawnQueue = [];
  plan.forEach(([type, count, gap, hpMul]) => {
    for (let i = 0; i < count; i++) G.spawnQueue.push({ type, gap, hpMul });
  });
  // Shuffle a little so the school mixes, but keep the boss first on tide 12.
  if (G.tide < 12) {
    for (let i = G.spawnQueue.length - 1; i > 0; i--) {
      const j = Math.floor(G.rng() * (i + 1));
      const t = G.spawnQueue[i]; G.spawnQueue[i] = G.spawnQueue[j]; G.spawnQueue[j] = t;
    }
  }
  G.spawnTimer = 0.5;
  G.tideState = 'fighting';
  if (G.tide === 12) {
    showCallout('KRAKEN SURFACES!', 'The Maw of the Deep — hook its heart!', 3);
    AudioSys.boss();
  } else {
    showCallout('TIDE ' + G.tide + ' INCOMING', plan.length + ' groups riding the current', 2);
    AudioSys.splash();
  }
}

function spawnFish(type, hpMul) {
  const def = FISH[type];
  const f = {
    type, hp: def.hp * hpMul, maxHp: def.hp * hpMul,
    speed: def.speed * (0.9 + G.rng() * 0.2),
    x: PATH[0].x, y: PATH[0].y, wp: 1,
    slow: 0, slowT: 0, hooked: false, wob: G.rng() * 6.28, dead: false,
    gold: def.gold, size: def.size, color: def.color, score: def.score,
    chummed: 0,
  };
  if (type === 'maw') {
    G.boss = f; G.bossMax = f.maxHp; G.bossPhase = 1;
    f.size = 74;
  }
  G.fish.push(f);
}

function earnGold(n, x, y, silent) {
  G.gold += n; G.totalGoldEarned += n;
  if (x !== undefined) addFloat(x, y, '+' + n + 'g', '#ffd60a');
  if (!silent) AudioSys.coin();
}

function damageFish(f, dmg) {
  f.hp -= dmg; G.stats.damageDealt += dmg;
  if (f.hp <= 0 && !f.dead) killFish(f, false);
}

function killFish(f, hooked) {
  f.dead = true;
  G.stats.kills++;
  G.score += f.score;
  let g = f.gold;
  if (hasRelic('golden')) g = Math.round(g * 1.25);
  if (hooked) g = Math.round(g * (1 + 0.15 * Math.min(G.combo, 10)));
  earnGold(g, f.x, f.y - 20, true);
  burst(f.x, f.y, f.color, 12);
  if (f.type === 'maw') bossDown();
  AudioSys.pop();
}

function bossDown() {
  G.boss = null;
  G.score += 1000;
  showCallout('THE MAW IS HOOKED!', '+1000 score — the reef is safe', 3);
  AudioSys.fanfare();
}

function hasRelic(id) { return G.relics.some(r => r.id === id); }

function relicByTide(tide) {
  const order = [0, 1, 2, 3, 4, 5, 6, 7]; // tides 2,4,5,6,8,9,10,11
  const map = { 2: 0, 4: 1, 5: 2, 6: 3, 8: 4, 9: 5, 10: 6, 11: 7 };
  return map[tide] !== undefined ? RELICS[order[map[tide]]] : null;
}

function tideCleared() {
  G.tideState = 'done';
  G.stats.tidesCleared++;
  const bonus = 30 + G.tide * 10;
  earnGold(bonus, HEART.x - 80, HEART.y - 60);
  const rel = relicByTide(G.tide);
  if (rel) {
    G.relics.push(rel);
    if (rel.id === 'pearl') { G.maxLives += 10; G.lives += 10; }
    showCallout('RELIC CAUGHT: ' + rel.name.toUpperCase(), rel.desc, 3);
  } else if (G.tide < 12) {
    showCallout('TIDE ' + G.tide + ' CLEARED!', 'Bonus +' + bonus + 'g — press SPACE for tide ' + (G.tide + 1), 2.5);
  }
  if (G.tide === 12 && !G.boss) {
    G.screen = 'victory';
    G.victoryStars = G.lives >= 18 ? 3 : G.lives >= 10 ? 2 : 1;
    AudioSys.fanfare();
  } else if (G.tide < 12) {
    G.tideState = 'build';
  }
}

function loseLife(f) {
  G.lives -= f.type === 'maw' ? 10 : 1;
  addFloat(HEART.x, HEART.y - 50, f.type === 'maw' ? '-10 REEF!' : '-1 REEF', '#ff4d6d');
  burst(HEART.x, HEART.y, '#ff4d6d', 14);
  AudioSys.hurt();
  if (G.lives <= 0) {
    G.lives = 0;
    G.screen = 'defeat';
    AudioSys.lose();
  }
}

// ---- Cast & reel: the signature verb ----
function castHook(tx, ty) {
  if (G.screen !== 'play' || G.hookCd > 0) return;
  const cd = hasRelic('swift') ? 1.3 : 2.0;
  G.hookCd = cd;
  // Find nearest living fish within 170px of the cast point.
  let best = null, bestD = 170;
  for (const f of G.fish) {
    if (f.dead || f.hooked) continue;
    const d = Math.hypot(f.x - tx, f.y - ty);
    if (d < bestD) { bestD = d; best = f; }
  }
  G.hooks.push({ x: BOAT.x, y: BOAT.y, tx, ty, t: 0, phase: 'fly', fish: best, caught: false });
  AudioSys.pluck();
}

function updateHook(h, dt) {
  h.t += dt;
  if (h.phase === 'fly') {
    const k = Math.min(1, h.t / 0.28);
    h.x = BOAT.x + (h.tx - BOAT.x) * k;
    h.y = BOAT.y + (h.ty - BOAT.y) * k;
    if (k >= 1) {
      if (h.fish && !h.fish.dead) {
        h.phase = 'reel';
        h.fish.hooked = true;
        AudioSys.splash();
      } else { h.phase = 'gone'; }
    }
  } else if (h.phase === 'reel' && h.fish) {
    const f = h.fish;
    const dx = BOAT.x - f.x, dy = BOAT.y - f.y;
    const d = Math.hypot(dx, dy) || 1;
    const pull = 240 * dt;
    f.x += (dx / d) * pull; f.y += (dy / d) * pull;
    h.x = f.x; h.y = f.y;
    let dmg = (hasRelic('sharp') ? 2 : 1) * 26 * dt;
    if (f.type === 'maw' && hasRelic('kraken')) dmg += 150 * dt;
    damageFish(f, dmg);
    if (f.dead) {
      // Reeling a fish in alive scores the catch bonus + combo.
      G.combo++; G.comboTimer = 4;
      G.bestCombo = Math.max(G.bestCombo, G.combo);
      G.totalHooked++; G.stats.hooks++;
      const bonus = 10 + G.combo * 6;
      earnGold(bonus, f.x, f.y - 24);
      addFloat(f.x, f.y - 44, 'HOOKED x' + G.combo + '  +' + bonus, '#7dffb2');
      if (G.combo >= 5) showCallout('CHAIN x' + G.combo + '!', 'Keep casting — the school is biting', 1.4);
      killFish(f, true);
      h.phase = 'gone';
    } else if (d < 60) {
      // Fish dragged to the boat: caught.
      G.combo++; G.comboTimer = 4;
      G.bestCombo = Math.max(G.bestCombo, G.combo);
      G.totalHooked++; G.stats.hooks++;
      const bonus = 10 + G.combo * 6;
      earnGold(bonus, f.x, f.y - 24);
      addFloat(f.x, f.y - 44, 'HOOKED x' + G.combo + '  +' + bonus, '#7dffb2');
      if (G.combo >= 5) showCallout('CHAIN x' + G.combo + '!', 'Keep casting — the school is biting', 1.4);
      killFish(f, true);
      h.phase = 'gone';
    }
    if (h.t > 3.5) { if (f) f.hooked = false; h.phase = 'gone'; }
  }
  return h.phase !== 'gone';
}

// ---- Abilities ----
function castNet(x, y) {
  if (G.screen !== 'play' || G.netCd > 0) return;
  G.netCd = 9;
  const r = hasRelic('net') ? 190 : 120;
  G.nets.push({ x, y, r, t: 0 });
  let hit = 0;
  for (const f of G.fish) {
    if (f.dead) continue;
    if (Math.hypot(f.x - x, f.y - y) < r + f.size) {
      damageFish(f, 22); f.slow = 0.5; f.slowT = 2.5; hit++;
    }
  }
  addFloat(x, y - r / 2, 'NET! ' + hit + ' caught', '#bde0fe');
  AudioSys.net();
}

function castChum(x, y) {
  if (G.screen !== 'play' || G.chumCd > 0) return;
  G.chumCd = 12;
  G.chums.push({ x, y, t: 0, life: 5 });
  for (const f of G.fish) {
    if (f.dead) continue;
    if (Math.hypot(f.x - x, f.y - y) < 220) {
      f.chummed = 5;
      if (hasRelic('chum')) earnGold(8, f.x, f.y - 20, true);
    }
  }
  showCallout('CHUM IN THE WATER!', 'Fish are drawn to the scent', 1.6);
  AudioSys.splash();
}

function castHarpoon() {
  if (G.screen !== 'play' || G.harpoonCd > 0) return;
  G.harpoonCd = 14;
  // Strongest fish on screen, boss first.
  let target = G.boss && !G.boss.dead ? G.boss : null;
  if (!target) {
    let bestHp = 0;
    for (const f of G.fish) if (!f.dead && f.hp > bestHp) { bestHp = f.hp; target = f; }
  }
  if (!target) return;
  let dmg = 160;
  if (target.type === 'maw' && hasRelic('kraken')) dmg += 150;
  damageFish(target, dmg);
  G.shots.push({ x: BOAT.x, y: BOAT.y, tx: target.x, ty: target.y, t: 0 });
  burst(target.x, target.y, '#c9b8ff', 16);
  addFloat(target.x, target.y - 40, 'HARPOON! -' + dmg, '#e0aaff');
  AudioSys.harpoon();
}

function placeTower(plotIdx) {
  const def = TOWERS[G.selectedTower];
  if (G.gold < def.cost) { G.message = 'Not enough gold for ' + def.name; return; }
  if (G.towers.some(t => t.plot === plotIdx)) return;
  G.gold -= def.cost;
  G.towers.push({ plot: plotIdx, def, level: 1, cd: 0, x: PLOTS[plotIdx].x, y: PLOTS[plotIdx].y });
  AudioSys.pop();
}

function upgradeTower(t) {
  const cost = 40 * t.level;
  if (G.gold < cost || t.level >= 3) return;
  G.gold -= cost; t.level++;
  burst(t.x, t.y, '#ffd60a', 12);
  AudioSys.coin();
}

// ---- Main update ----
function update(dt) {
  G.time += dt;
  if (G.callout) { G.callout.timer -= dt; if (G.callout.timer <= 0) G.callout = null; }
  if (G.comboTimer > 0) { G.comboTimer -= dt; if (G.comboTimer <= 0) G.combo = 0; }
  G.hookCd = Math.max(0, G.hookCd - dt);
  G.netCd = Math.max(0, G.netCd - dt);
  G.chumCd = Math.max(0, G.chumCd - dt);
  G.harpoonCd = Math.max(0, G.harpoonCd - dt);

  for (const f of G.floats) f.t += dt;
  G.floats = G.floats.filter(f => f.t < f.life);
  for (const p of G.particles) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 40 * dt; }
  G.particles = G.particles.filter(p => p.t < p.life);
  for (const n of G.nets) n.t += dt;
  G.nets = G.nets.filter(n => n.t < 0.5);
  for (const s of G.shots) s.t += dt;
  G.shots = G.shots.filter(s => s.t < 0.25);
  for (const c of G.chums) c.t += dt;
  G.chums = G.chums.filter(c => c.t < c.life);
  G.hooks = G.hooks.filter(h => updateHook(h, dt));

  // Bubbles for life.
  if (G.rng() < dt * 6) G.bubbles.push({ x: 40 + G.rng() * 1200, y: 700, r: 2 + G.rng() * 5, v: 20 + G.rng() * 30 });
  for (const b of G.bubbles) b.y -= b.v * dt;
  G.bubbles = G.bubbles.filter(b => b.y > -10);

  if (G.screen !== 'play') return;

  // Spawning.
  if (G.tideState === 'fighting' && G.spawnQueue.length > 0) {
    G.spawnTimer -= dt;
    if (G.spawnTimer <= 0) {
      const s = G.spawnQueue.shift();
      spawnFish(s.type, s.hpMul);
      G.spawnTimer = s.gap;
    }
  }

  // Fish movement along the current.
  for (const f of G.fish) {
    if (f.dead || f.hooked) continue;
    f.wob += dt * 4;
    let sp = f.speed * (f.slowT > 0 ? (1 - f.slow) : 1);
    if (f.slowT > 0) f.slowT -= dt;
    // Chum pulls fish toward the chum spot.
    if (f.chummed > 0) {
      f.chummed -= dt;
      const c = G.chums[0];
      if (c) {
        const dx = c.x - f.x, dy = c.y - f.y, d = Math.hypot(dx, dy) || 1;
        if (d > 24) { f.x += (dx / d) * sp * dt; f.y += (dy / d) * sp * dt; continue; }
      }
    }
    const wp = PATH[f.wp];
    if (!wp) continue;
    const dx = wp.x - f.x, dy = wp.y - f.y, d = Math.hypot(dx, dy);
    if (d < 6) { f.wp++; continue; }
    f.x += (dx / d) * sp * dt;
    f.y += (dy / d) * sp * dt + Math.sin(f.wob) * 6 * dt;
    // Boss phase shifts.
    if (f.type === 'maw') {
      const frac = 1 - f.hp / f.maxHp;
      const phase = frac < 0.33 ? 1 : frac < 0.66 ? 2 : 3;
      if (phase !== G.bossPhase) {
        G.bossPhase = phase;
        showCallout(phase === 2 ? 'THE MAW RAGES!' : 'THE MAW IS FRENZIED!', 'Phase ' + phase + ' — it swims faster!', 2);
        AudioSys.boss();
      }
      f.speed = 22 + (phase - 1) * 12;
    }
    if (f.wp >= PATH.length) { f.dead = true; loseLife(f); }
  }
  G.fish = G.fish.filter(f => !f.dead);

  // Towers fire.
  const dmgMul = hasRelic('tide') ? 1.2 : 1;
  for (const t of G.towers) {
    t.cd -= dt;
    if (t.cd > 0) continue;
    let target = null, bestD = 1e9;
    for (const f of G.fish) {
      if (f.dead) continue;
      const d = Math.hypot(f.x - t.x, f.y - t.y);
      if (d < t.def.range && d < bestD) { bestD = d; target = f; }
    }
    if (!target) continue;
    t.cd = 1 / (t.def.rate * (1 + 0.25 * (t.level - 1)));
    const dmg = t.def.dmg * t.level * dmgMul;
    if (t.def.id === 'mortar') {
      for (const f of G.fish) {
        if (!f.dead && Math.hypot(f.x - target.x, f.y - target.y) < 60) damageFish(f, dmg);
      }
      burst(target.x, target.y, '#ff9f68', 8);
    } else if (t.def.id === 'kelp') {
      damageFish(target, dmg); target.slow = 0.55; target.slowT = 1.6;
    } else {
      damageFish(target, dmg);
    }
    G.shots.push({ x: t.x, y: t.y, tx: target.x, ty: target.y, t: 0 });
  }

  // Tide end check.
  if (G.tideState === 'fighting' && G.spawnQueue.length === 0 && G.fish.length === 0 && G.tide > 0) {
    tideCleared();
  }
}
