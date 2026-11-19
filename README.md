# Vice City Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/labixiaoge/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/labixiaoge/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

## Make a Vice City-style cover

Vice City Cover Studio turns a photo and a few words into GTA-style cover art, right in your browser. Drop your own photo into a panel — or let one photo fill every panel — choose a layout, a colour grade and a frame, type a bold caption and a subtitle, then export the finished cover as a PNG. Nothing is uploaded: your photos stay on your machine, and the whole studio works offline.

The cover itself is painted live on a canvas from hand-drawn vector art: a striped synthwave sun with rays, palm silhouettes, gulls, a rooftop skyline, a colour wash, a touch of film grain and a big gradient title with a hard offset shadow. No Rockstar Games logo, wordmark, artwork, character or font appears anywhere — all type is set in system fonts, and the two sample photos are free to use.

## What you can do with it

- **Eight layouts** — hero, triptych, quad, single, diptych, bands, plus two new ones: columns (four tall strips) and stack (one wide band over three small panels).
- **Seven colour grades** — sunset, neon, gold, noir, dawn, midnight (deep blue with a star field) and the new ember (deep red and smoke).
- **Frames, three of them** — none, a polaroid with a white border and a thick foot, or cinema letterbox bars.
- **Export sizes, four of them** — square 1080 x 1080, portrait 1080 x 1350, story 1080 x 1920 and landscape 1920 x 1080.
- **Per-panel control** — each panel takes its own photo (upload or sample), with zoom and pan sliders to crop and position it, and a clear button to empty it again.
- **One-click looks** — Sunset Heist, Neon Streets and Vice Nights set the layout, grade, frame and words in one go; tweak the result from there.
- **Surprise me** — one click rolls a fresh layout, grade, frame and caption.
- **Copy link** — a link that reopens the exact cover you are looking at, with its layout, grade, frame, size and words in the address.
- **Reset** — back to the opening look, with every panel emptied.

## Run it

```sh
node serve.ts --port 8080
```

Then point your browser at http://localhost:8080

## The screenshots

```sh
node serve.ts --port 8091
node ../shots.mjs
```

`shots.mjs` opens each lens in `shots.json` in a headless browser and writes the four pictures into `screenshots/`: a wide hero cover, the editor itself, a columns cover in the ember grade, and a stack cover in midnight.

## Building the dossier

```sh
mkdir -p out
MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` into the output directory and writes `dossier.json` with `buildDossier` from `vendor/makefun-app.ts`. It checks every screenshot is a real JPEG of a sane size, confirms the dossier is a well-formed JSON object, and prints a stage report of what it packaged. Run it twice and the two dossiers are byte-identical.

Built for the make.fun bounty "Make GTA 6 Cover Art" — https://make.fun/bounty/gta6-cover-art-01
