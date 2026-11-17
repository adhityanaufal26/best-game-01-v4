# best-game-01-v4

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/adhityanaufal26/best-game-01-v4/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/adhityanaufal26/best-game-01-v4/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

**DEEPHOOK — hook the deep, hold the reef.** A bright-lagoon hook-and-reel tower
defense. Fish ride the current toward the Reef Heart; you build 6 kinds of
lure-towers on the sand, and — the signature move — **cast a hook, reel the fish
in**, chaining catches for combo gold. Survive 12 tides, collect 8 relic lures,
and hook the heart of the 3-phase Kraken boss, **The Maw of the Deep**.

- **Cast & Reel:** click-drag from the boat (or press Q) to cast a hook anywhere, snag a fish, and reel it in for bonus gold and a chain combo.
- **Abilities:** E net sweep, R chum lure, F harpoon snipe (boss first).
- **6 lure-towers:** Bubble Trap, Kelp Snare, Pearl Cannon, Angler Lantern, Coral Mortar, Tide Harpoon — each upgradable to Lv3.
- **12 tides + boss:** escalating schools, a threat queue, 8 relics, lives, score, and a 3-phase Kraken with its own health bar.
- **Full loop:** title, play, boss, victory (stars + stats) and defeat screens, restart included.
- **Original everything:** all art is drawn in code on a plain 2D canvas, all music and SFX are synthesized with WebAudio. No libraries, no network requests.

## Run it

```sh
cd game
python3 -m http.server
```

Open http://localhost:8000 in a desktop browser. Keyboard + mouse: 1–6 pick a
lure, click a sand plot to build, click a tower to upgrade, SPACE starts a tide,
Q cast hook, E net, R chum, F harpoon, M mute.

## Screenshots

Deterministic scenes: open `game/index.html?shot=1` (mid-tide play), `?shot=2`
(title), `?shot=3` (Kraken boss), `?shot=4` (victory). Each sets
`window.__shotReady` when rendered.

<sub>Entered on [make.fun](https://make.fun/?ref=adhitya-naufal&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
