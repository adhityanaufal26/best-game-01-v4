// DEEPHOOK data: lure-towers, sea creatures, relics and the 12 tides.
// All numbers tuned for a 1280x720 lagoon; costs in gold, pearls buy relics.
'use strict';

// Seeded RNG so screenshot scenes are reproducible.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TOWERS = [
  { id: 'bubble', name: 'Bubble Trap',  key: '1', cost: 40,  range: 110, rate: 0.9, dmg: 6,  color: '#7dd7ff', desc: 'Pops small fish', icon: 'O' },
  { id: 'kelp',   name: 'Kelp Snare',   key: '2', cost: 60,  range: 100, rate: 0.7, dmg: 4,  color: '#3ddc84', desc: 'Slows school',     icon: '~' },
  { id: 'pearl',  name: 'Pearl Cannon', key: '3', cost: 90,  range: 150, rate: 0.55, dmg: 16, color: '#ffd6f2', desc: 'Hard pearl shots',  icon: '*' },
  { id: 'lantern',name: 'Angler Lantern',key: '4',cost: 120, range: 210, rate: 0.8, dmg: 10, color: '#ffe066', desc: 'Long reach',       icon: 'o' },
  { id: 'mortar', name: 'Coral Mortar', key: '5', cost: 160, range: 140, rate: 0.4, dmg: 26, color: '#ff9f68', desc: 'Splash damage',    icon: '#' },
  { id: 'harpoon',name: 'Tide Harpoon', key: '6', cost: 220, range: 260, rate: 0.28, dmg: 55, color: '#c9b8ff', desc: 'Heavy piercing',   icon: '>' },
];

const FISH = {
  minnow:  { name: 'Minnow',      hp: 18,  speed: 52, gold: 6,  size: 13, color: '#ff9d5c', score: 10 },
  puffer:  { name: 'Puffer',      hp: 46,  speed: 34, gold: 12, size: 18, color: '#ffb703', score: 20 },
  eel:     { name: 'Eel',         hp: 30,  speed: 88, gold: 11, size: 12, color: '#7b2fbe', score: 25 },
  ray:     { name: 'Stingray',    hp: 90,  speed: 44, gold: 20, size: 24, color: '#4cc9f0', score: 40 },
  shark:   { name: 'Reef Shark',  hp: 170, speed: 58, gold: 34, size: 30, color: '#8d99ae', score: 70 },
  jelly:   { name: 'Jellyfish',   hp: 60,  speed: 26, gold: 16, size: 20, color: '#f72585', score: 35 },
  maw:     { name: 'The Maw',     hp: 2600,speed: 22, gold: 500,size: 74, color: '#3a0ca3', score: 1000 },
};

// Relic lures: one offered after tides 2,4,5,6,8,9,10,11 (auto-granted in order).
const RELICS = [
  { id: 'golden',  name: 'Golden Lure',   desc: '+25% gold from hooks' },
  { id: 'swift',   name: 'Swift Reel',    desc: 'Hook recharges 35% faster' },
  { id: 'net',     name: 'Wide Net',      desc: 'Net radius +60%' },
  { id: 'chum',    name: 'Rich Chum',     desc: 'Chum also pays +8 gold per fish' },
  { id: 'pearl',   name: 'Pearl Heart',   desc: 'Reef Heart +10 lives' },
  { id: 'sharp',   name: 'Sharp Hook',    desc: 'Hook damage x2' },
  { id: 'tide',    name: 'Tide Charm',    desc: 'All towers +20% damage' },
  { id: 'kraken',  name: 'Kraken Bane',   desc: 'Harpoon deals +150 vs boss' },
];

// Tide table: [fish type, count, gap seconds, hp multiplier]
const TIDES = [
  [['minnow', 8, 0.9, 1]],
  [['minnow', 12, 0.8, 1.1], ['puffer', 3, 1.6, 1]],
  [['minnow', 10, 0.7, 1.2], ['eel', 5, 1.2, 1]],
  [['puffer', 8, 1.0, 1.2], ['eel', 6, 1.0, 1.1]],
  [['minnow', 14, 0.55, 1.4], ['jelly', 5, 1.4, 1]],
  [['ray', 6, 1.4, 1.1], ['eel', 8, 0.8, 1.3]],
  [['puffer', 10, 0.8, 1.5], ['ray', 6, 1.2, 1.2], ['jelly', 6, 1.1, 1.2]],
  [['shark', 4, 2.0, 1.1], ['minnow', 12, 0.5, 1.6]],
  [['ray', 10, 0.9, 1.4], ['shark', 4, 1.8, 1.2], ['eel', 8, 0.7, 1.5]],
  [['shark', 7, 1.5, 1.4], ['jelly', 10, 0.8, 1.5], ['puffer', 10, 0.6, 1.7]],
  [['shark', 8, 1.2, 1.6], ['ray', 10, 0.8, 1.6], ['eel', 10, 0.6, 1.7]],
  [['maw', 1, 1.0, 1], ['shark', 6, 1.6, 1.8], ['ray', 8, 1.0, 1.8]],
];

// The current: waypoints the fish swim, left edge to the Reef Heart.
const PATH = [
  { x: -30, y: 300 }, { x: 180, y: 300 }, { x: 180, y: 130 }, { x: 480, y: 130 },
  { x: 480, y: 480 }, { x: 780, y: 480 }, { x: 780, y: 210 }, { x: 1010, y: 210 },
  { x: 1010, y: 430 }, { x: 1150, y: 520 },
];

// Build plots: sandy spots near (but not on) the path where lures sit.
const PLOTS = [
  { x: 90, y: 210 }, { x: 280, y: 210 }, { x: 280, y: 420 }, { x: 390, y: 230 },
  { x: 580, y: 230 }, { x: 580, y: 390 }, { x: 680, y: 580 }, { x: 880, y: 380 },
  { x: 880, y: 130 }, { x: 700, y: 90 }, { x: 990, y: 560 }, { x: 1080, y: 110 },
];

const HEART = { x: 1150, y: 520, r: 42 };
const BOAT = { x: 640, y: 150 };
