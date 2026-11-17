# Slime Harvest

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/devtk-core/slime-harvest/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/devtk-core/slime-harvest/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

A physics merge game about farming slimes, built for the
[make.fun](https://make.fun) "Make the best game" bounty (best-game-01).

Drop slimes into the farm box. **Two of a kind** touching merge and evolve
into the next stage — Droplet, Sprout, Bloom, Bolt, Ember, Frost, Star, and
finally the King. **Three of a kind** touching are *harvested* instead: they
vanish in a burst of points and free up precious space. Chain harvests for
combos, reach **3,000 points and 4 harvests of Bloom or bigger** to win — merging alone is
never enough — and never let a settled slime sit above the danger line
for long.

The twist on the usual merge formula is the harvest rule: a normal merge game
only ever fills up, but here a well-placed third slime clears the board —
so the skill is in setting up triples, not just pairs.

## Play it locally

```
node serve.ts          # then open http://localhost:8080
```

No build step, no dependencies, no network: the whole game is plain HTML,
CSS and ES modules under `game/`, and every slime is drawn in code on a
canvas (there are no image files). Sound is synthesised with WebAudio.

Controls: move the mouse (or arrow keys) to aim, click / SPACE to drop,
P to pause, R to restart.

## Layout

- `game/` — the game itself (static, offline)
- `main.ts` — the make.fun entry program: copies `game/` and `screenshots/`
  to the output directory and writes the dossier the judge reads
- `vendor/makefun-game.ts` — the make.fun kit library, vendored unchanged
- `screenshots/` — real renders of the game (see `shots.json` for the
  deterministic scenes that produced them)

## About

An experiment by Taku Hayashi — notes on building and entering this game are
being written up at [dennou.tech](https://www.dennou.tech). The "three of a
kind gets harvested" rule comes from an earlier browser game of mine; this
entry is a fresh implementation written for this competition.

MIT licensed — see `LICENSE`.
