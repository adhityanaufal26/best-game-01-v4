// DEEPHOOK screenshot scenes: ?shot=1..4 builds a deterministic staged frame
// and sets window.__shotReady when it has rendered. No network, no randomness
// beyond the seeded RNG in data.js.
'use strict';

function stagePlayShot() {
  G = newGame();
  G.screen = 'play';
  G.rng = mulberry32(777);
  G.tide = 6; G.tideState = 'fighting';
  G.gold = 342; G.score = 2840; G.lives = 17;
  G.combo = 6; G.comboTimer = 3; G.bestCombo = 8;
  // A busy mid-tide: towers built, fish everywhere, hooks mid-flight.
  const build = [['bubble', 0], ['kelp', 1], ['pearl', 3], ['lantern', 4], ['mortar', 6], ['harpoon', 7], ['bubble', 9], ['pearl', 10]];
  for (const [id, plot] of build) {
    const def = TOWERS.find(t => t.id === id);
    G.towers.push({ plot, def, level: plot % 3 === 0 ? 2 : 1, cd: 0, x: PLOTS[plot].x, y: PLOTS[plot].y });
  }
  const school = [
    ['minnow', 120, 300], ['minnow', 180, 300], ['minnow', 240, 295], ['eel', 300, 310],
    ['puffer', 180, 130], ['puffer', 260, 135], ['minnow', 340, 130], ['ray', 480, 200],
    ['minnow', 480, 420], ['eel', 560, 480], ['jelly', 640, 470], ['ray', 720, 480],
    ['shark', 780, 300], ['minnow', 800, 210], ['puffer', 900, 210], ['eel', 950, 250],
    ['jelly', 1010, 300], ['minnow', 1060, 360], ['ray', 700, 130], ['minnow', 420, 130],
  ];
  school.forEach(([type, x, y], i) => {
    const def = FISH[type];
    const f = { type, hp: def.hp * (i % 4 === 0 ? 0.55 : 1), maxHp: def.hp, speed: def.speed, x, y, wp: 3, slow: 0, slowT: 0, hooked: false, wob: i, dead: false, gold: def.gold, size: def.size, color: def.color, score: def.score, chummed: 0 };
    G.fish.push(f);
  });
  G.spawnQueue = [{ type: 'shark', gap: 1, hpMul: 1 }, { type: 'ray', gap: 1, hpMul: 1 }, { type: 'eel', gap: 1, hpMul: 1 }, { type: 'minnow', gap: 1, hpMul: 1 }];
  G.relics = [RELICS[0], RELICS[1], RELICS[2]];
  G.hooks.push({ x: 500, y: 200, tx: 480, ty: 200, t: 0.15, phase: 'fly', fish: G.fish[7], caught: false });
  G.hooks.push({ x: 700, y: 300, tx: 720, ty: 480, t: 0.2, phase: 'fly', fish: G.fish[11], caught: false });
  G.nets.push({ x: 480, y: 130, r: 120, t: 0.2 });
  G.chums.push({ x: 780, y: 480, t: 1, life: 5 });
  G.shots.push({ x: 580, y: 230, tx: 640, ty: 470, t: 0.05 });
  addFloat(480, 180, '+24g', '#ffd60a');
  addFloat(720, 440, '+18g', '#ffd60a');
  addFloat(640, 300, 'HOOKED x6  +46', '#7dffb2');
  G.callout = { text: 'CHAIN x6!', sub: 'Keep casting — the school is biting', timer: 2 };
  G.bubbles = [{ x: 200, y: 500, r: 4, v: 30 }, { x: 900, y: 400, r: 5, v: 25 }, { x: 500, y: 550, r: 3, v: 35 }];
}

function stageBossShot() {
  G = newGame();
  G.screen = 'play';
  G.rng = mulberry32(4242);
  G.tide = 12; G.tideState = 'fighting';
  G.gold = 518; G.score = 12480; G.lives = 12;
  G.combo = 4; G.comboTimer = 3; G.bestCombo = 9;
  // (No tower on plot 4: it would sit on the callout subtitle line.)
  const build = [['bubble', 0], ['kelp', 1], ['pearl', 3], ['mortar', 6], ['harpoon', 7], ['pearl', 2], ['mortar', 10], ['lantern', 5]];
  for (const [id, plot] of build) {
    const def = TOWERS.find(t => t.id === id);
    G.towers.push({ plot, def, level: 2, cd: 0, x: PLOTS[plot].x, y: PLOTS[plot].y });
  }
  // Boss shot staging: the Maw is the star — huge, dead-center below the
  // callout, drifting slowly toward waypoint 5 (down-right) so it stays clear
  // of the callout text while the frame is live. Do NOT attach a reeling hook
  // to it: updateHook would drag it to the boat and kill it mid-capture.
  const maw = { type: 'maw', hp: 1450, maxHp: 2600, speed: 34, x: 640, y: 420, wp: 5, slow: 0, slowT: 0, hooked: false, wob: 1, dead: false, gold: 500, size: 120, color: '#3a0ca3', score: 1000, chummed: 0 };
  G.boss = maw; G.bossMax = 2600; G.bossPhase = 2;
  G.fish.push(maw);
  const escorts = [['shark', 420, 430], ['ray', 920, 300], ['eel', 880, 470], ['shark', 430, 250], ['jelly', 920, 180]];
  escorts.forEach(([type, x, y], i) => {
    const def = FISH[type];
    G.fish.push({ type, hp: def.hp * 0.7, maxHp: def.hp, speed: def.speed, x, y, wp: 6, slow: 0, slowT: 0, hooked: false, wob: i * 2, dead: false, gold: def.gold, size: def.size, color: def.color, score: def.score, chummed: 0 });
  });
  G.spawnQueue = [{ type: 'shark', gap: 1, hpMul: 1 }, { type: 'ray', gap: 1, hpMul: 1 }];
  G.relics = RELICS.slice(0, 6);
  // Hook mid-flight toward the Maw's crown (unattached, so it never reels
  // the boss away); harpoon shots already striking the boss.
  G.hooks.push({ x: 650, y: 330, tx: 640, ty: 380, t: 0.15, phase: 'fly', fish: null, caught: false });
  G.shots.push({ x: 880, y: 380, tx: 700, ty: 400, t: 0.05 });
  G.shots.push({ x: 580, y: 230, tx: 580, ty: 380, t: 0.1 });
  addFloat(840, 330, 'HARPOON! -160', '#e0aaff');
  addFloat(440, 330, 'HOOKED x4  +34', '#7dffb2');
  G.callout = { text: 'KRAKEN SURFACES!', sub: 'The Maw of the Deep — hook its heart!', timer: 2.5 };
  G.bubbles = [{ x: 300, y: 500, r: 5, v: 30 }, { x: 1000, y: 450, r: 4, v: 25 }];
}

function stageVictoryShot() {
  G = newGame();
  G.screen = 'victory';
  G.victoryStars = 3;
  G.score = 15230; G.totalGoldEarned = 2840;
  G.totalHooked = 87; G.bestCombo = 12; G.stats.kills = 214; G.stats.tidesCleared = 12;
  G.relics = RELICS.slice();
  G.lives = 19;
}

function applyShot() {
  const q = new URLSearchParams(window.location.search);
  const shot = q.get('shot');
  if (!shot) return false;
  if (shot === '1') stagePlayShot();
  else if (shot === '2') { G = newGame(); G.screen = 'title'; }
  else if (shot === '3') stageBossShot();
  else if (shot === '4') stageVictoryShot();
  else return false;
  // Two frames so the canvas is fully painted, then signal readiness.
  requestAnimationFrame(() => {
    render();
    requestAnimationFrame(() => { render(); window.__shotReady = true; });
  });
  return true;
}
