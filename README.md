# Vice City Cover Studio

[![Make GTA 6 Cover Art](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/labixiaoge/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)

## About

Vice City Cover Studio is an offline, in-browser maker for GTA 6-style cover art. Drop your own photo into one of four panels — or let a single photo fill every panel — pick a layout (hero, triptych, quad or single), choose a sunset, neon, gold or noir colour grade, add a bold caption and subtitle, and export the finished cover as a PNG at 1080 x 1080, 1080 x 1350 or 1920 x 1080. The cover is drawn live on canvas from hand-made vector art: a striped synthwave sun, palm-tree silhouettes, a city skyline and a Vice City sunset grade. It uses no Rockstar Games logo, wordmark, artwork, character or font — all type is set in system fonts.

## How to run it

```sh
node serve.ts
```

Then open http://localhost:8080

## How the dossier is made

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` into the output directory and writes `dossier.json` with `buildDossier` from `vendor/makefun-app.ts`. Run it twice and the two dossiers are byte-identical.

Built for the make.fun bounty "Make GTA 6 Cover Art" — https://make.fun/bounty/gta6-cover-art-01
