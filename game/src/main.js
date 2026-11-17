// DEEPHOOK bootstrap: input, game loop, shot scenes.
'use strict';

function canvasPos(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) };
}

function plotAt(x, y) {
  for (let i = 0; i < PLOTS.length; i++) {
    if (Math.hypot(PLOTS[i].x - x, PLOTS[i].y - y) < 30) return i;
  }
  return -1;
}

function towerAt(x, y) {
  return G.towers.find(t => Math.hypot(t.x - x, t.y - y) < 28) || null;
}

function handleClick(x, y) {
  AudioSys.ensure();
  if (G.screen === 'title') {
    if (x > 520 && x < 760 && y > 448 && y < 500) startGame();
    else startGame();
    return;
  }
  if (G.screen === 'victory' || G.screen === 'defeat') {
    if (x > 520 && x < 760 && y > 480 && y < 532) startGame();
    return;
  }
  // Play screen.
  const t = towerAt(x, y);
  if (t) { upgradeTower(t); return; }
  const p = plotAt(x, y);
  if (p >= 0) { placeTower(p); return; }
  castHook(x, y);
}

canvas.addEventListener('mousedown', (e) => {
  const p = canvasPos(e);
  G.mouse.x = p.x; G.mouse.y = p.y;
  G.mouse.down = true;
  // Drag-to-cast: hold near the boat, drag out, release to cast.
  if (G.screen === 'play' && Math.hypot(p.x - BOAT.x, p.y - BOAT.y) < 90) {
    G.mouse.dragging = true; G.mouse.dragX = p.x; G.mouse.dragY = p.y;
  }
});

canvas.addEventListener('mousemove', (e) => {
  const p = canvasPos(e);
  G.mouse.x = p.x; G.mouse.y = p.y;
  G.hoverPlot = G.screen === 'play' ? plotAt(p.x, p.y) : -1;
});

window.addEventListener('mouseup', (e) => {
  const p = canvasPos(e);
  G.mouse.down = false;
  if (G.mouse.dragging) {
    G.mouse.dragging = false;
    if (G.screen === 'play' && Math.hypot(p.x - BOAT.x, p.y - BOAT.y) > 40) castHook(p.x, p.y);
    return;
  }
  handleClick(p.x, p.y);
});

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (k === ' ') {
    e.preventDefault();
    AudioSys.ensure();
    if (G.screen === 'title' || G.screen === 'victory' || G.screen === 'defeat') startGame();
    else if (G.tideState === 'build') startTide();
    return;
  }
  if (G.screen !== 'play') return;
  if (k >= '1' && k <= '6') { G.selectedTower = Number(k) - 1; return; }
  if (k === 'q') castHook(G.mouse.x, G.mouse.y);
  if (k === 'e') castNet(G.mouse.x, G.mouse.y);
  if (k === 'r') castChum(G.mouse.x, G.mouse.y);
  if (k === 'f') castHarpoon();
  if (k === 'm') { AudioSys.muted = !AudioSys.muted; }
});

// Game loop: fixed-ish dt clamp, update + render every frame.
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

if (!applyShot()) {
  window.__shotReady = true;
}
requestAnimationFrame(loop);
