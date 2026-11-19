# Vice City Cover Studio

[![Competition](https://make.fun/badge/competition/gta6-cover-art-01)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![Rank](https://make.fun/badge/rank/gta6-cover-art-01)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![Reward](https://make.fun/badge/reward/gta6-cover-art-01)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

## What it is

Vice City Cover Studio is an offline, in-browser maker for GTA-style cover art. Drop your own photo into a panel — or let one photo fill every panel — pick a layout, a colour grade and a frame, write a bold caption and a subtitle, and export the finished cover as a PNG. Everything runs on your own machine in the browser: your photos are never uploaded anywhere.

The cover is painted live on a canvas from hand-drawn vector art: a striped synthwave sun, palm silhouettes, gulls, a rooftop skyline, a colour wash and a big gradient title with an offset shadow. No Rockstar Games logo, wordmark, artwork, character or font is used anywhere — all type is set in system fonts, and the two sample photos are free to use.

## What you can do with it

- **Six layouts** — hero, triptych, quad, single, diptych (two tall panels) and bands (three horizontal strips).
- **Six colour grades** — sunset, neon, gold, noir, dawn (soft rose and lavender) and midnight (deep blue with a star field).
- **Three frames** — none, polaroid (white border with a thick foot) or cinema (black letterbox bars).
- **Four export sizes** — 1080 x 1080, 1080 x 1350, 1080 x 1920 (story) and 1920 x 1080.
- **Per-panel control** — each panel takes its own photo (upload or sample), with zoom and pan sliders to crop and position it.
- **Surprise me** — one click rolls a fresh layout, grade and frame, and you can tweak the result from there.

## How to run it

```sh
node serve.ts
```

Then open http://localhost:8080

## How the dossier is made

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` into the output directory and writes `dossier.json` with `buildDossier` from `vendor/makefun-app.ts`. It checks the result is a well-formed JSON object of a sane size, and reports how many app files and screenshots it packaged. Run it twice and the two dossiers are byte-identical.

Built for the make.fun bounty "Make GTA 6 Cover Art" — https://make.fun/bounty/gta6-cover-art-01
