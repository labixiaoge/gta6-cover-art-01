// Vice City Cover Studio — the cover painter, rewritten for round 5.
//
// The whole cover is painted by hand on a canvas: photo panels, a sliced
// synthwave sun with rays, palm silhouettes, gulls, a seeded skyline, a
// colour wash, film grain, a vignette and a big gradient title. Nothing
// here is Rockstar's: no logo, no wordmark, no artwork, no character and
// no font — every letter is set in system fonts, and photos never leave
// the browser.

export const LAYOUTS = ['hero', 'triptych', 'quad', 'single', 'diptych', 'bands', 'columns', 'stack'];
export const GRADES = ['sunset', 'neon', 'gold', 'noir', 'dawn', 'midnight', 'ember'];
export const FRAMES = ['none', 'polaroid', 'cinema'];

export const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1080x1920': [1080, 1920],
  '1920x1080': [1920, 1080],
};

// Each layout is a small builder that returns its panels as fractions of
// the canvas [left, top, width, height]. A layout only lists the panels
// it shows; the renderer turns the fractions into pixel boxes at draw
// time. `columns` is four tall strips, `stack` is one wide band over
// three small ones — both new in this round.
const LAYOUT_BUILDERS = {
  hero: () => [
    [0, 0, 0.62, 1],
    [0.62, 0, 0.38, 0.5],
    [0.62, 0.5, 0.38, 0.5],
  ],
  triptych: () => [
    [0, 0, 1 / 3, 1],
    [1 / 3, 0, 1 / 3, 1],
    [2 / 3, 0, 1 / 3, 1],
  ],
  quad: () => [
    [0, 0, 0.5, 0.5],
    [0.5, 0, 0.5, 0.5],
    [0, 0.5, 0.5, 0.5],
    [0.5, 0.5, 0.5, 0.5],
  ],
  single: () => [[0, 0, 1, 1]],
  diptych: () => [
    [0, 0, 0.5, 1],
    [0.5, 0, 0.5, 1],
  ],
  bands: () => [
    [0, 0, 1, 1 / 3],
    [0, 1 / 3, 1, 1 / 3],
    [0, 2 / 3, 1, 1 / 3],
  ],
  columns: () => [
    [0, 0, 0.25, 1],
    [0.25, 0, 0.25, 1],
    [0.5, 0, 0.25, 1],
    [0.75, 0, 0.25, 1],
  ],
  stack: () => [
    [0, 0, 1, 0.58],
    [0, 0.58, 1 / 3, 0.42],
    [1 / 3, 0.58, 1 / 3, 0.42],
    [2 / 3, 0.58, 1 / 3, 0.42],
  ],
};

// Turn a layout name into pixel rectangles for this canvas.
export function panelRects(layout, w, h) {
  const build = LAYOUT_BUILDERS[layout] || LAYOUT_BUILDERS.hero;
  return build().map(([fx, fy, fw, fh]) => [
    Math.round(w * fx),
    Math.round(h * fy),
    Math.round(w * fw),
    Math.round(h * fh),
  ]);
}

// How many panels a layout shows, so the editor knows how many panel
// cards to offer. Every layout here uses at most four.
export function panelCount(layout) {
  return panelRects(layout, 100, 100).length;
}

// Canvas filter laid over each photo under a grade.
const PHOTO_FILTERS = {
  sunset: 'saturate(1.3) contrast(1.1)',
  neon: 'saturate(1.7) contrast(1.15) hue-rotate(-10deg)',
  gold: 'saturate(1.2) contrast(1.1) sepia(0.3)',
  noir: 'saturate(0.12) contrast(1.4) brightness(1.06)',
  dawn: 'saturate(1.15) contrast(1.05) hue-rotate(12deg)',
  midnight: 'saturate(0.9) contrast(1.2) brightness(0.92) hue-rotate(18deg)',
  ember: 'saturate(1.5) contrast(1.2) sepia(0.35) hue-rotate(-15deg)',
};

// Top and bottom wash colours for each grade; noir is handled apart.
const WASH = {
  sunset: ['rgba(255,138,0,0.20)', 'rgba(232,67,147,0.42)'],
  neon: ['rgba(0,229,255,0.26)', 'rgba(255,0,153,0.40)'],
  gold: ['rgba(0,128,128,0.20)', 'rgba(255,183,0,0.28)'],
  dawn: ['rgba(255,183,213,0.22)', 'rgba(147,112,219,0.34)'],
  midnight: ['rgba(30,60,180,0.30)', 'rgba(10,6,40,0.45)'],
  ember: ['rgba(255,60,20,0.28)', 'rgba(120,10,40,0.45)'],
};

// Accent colour for the subtitle rule and bar under each grade.
const ACCENTS = {
  sunset: '#ff9a3d',
  neon: '#00e5ff',
  gold: '#ffd166',
  noir: '#e8e8e8',
  dawn: '#ffb7d5',
  midnight: '#8fb7ff',
  ember: '#ff6b4a',
};

// A tiny deterministic generator, so the skyline, stars and grain look
// the same on every render instead of shimmering between redraws.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A panel with no photo yet: an indigo-to-magenta wash, a dashed inner
// border, a little camera glyph and an invitation to drop a photo in.
function paintEmptySlot(ctx, x, y, pw, ph) {
  const wash = ctx.createLinearGradient(x, y, x + pw, y + ph);
  wash.addColorStop(0, '#312e81');
  wash.addColorStop(0.55, '#a21caf');
  wash.addColorStop(1, '#1e1b4b');
  ctx.fillStyle = wash;
  ctx.fillRect(x, y, pw, ph);

  const inset = Math.max(8, Math.min(pw, ph) * 0.06);
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = Math.max(1.5, Math.min(pw, ph) * 0.008);
  ctx.setLineDash([Math.max(6, pw * 0.03), Math.max(5, pw * 0.02)]);
  ctx.strokeRect(x + inset, y + inset, pw - inset * 2, ph - inset * 2);
  ctx.restore();

  // Camera glyph: body outline, lens circle, viewfinder bump.
  const cx = x + pw / 2;
  const cy = y + ph * 0.4;
  const cw = Math.min(pw, ph) * 0.34;
  const chh = cw * 0.68;
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = Math.max(2, cw * 0.07);
  ctx.lineJoin = 'round';
  ctx.strokeRect(cx - cw / 2, cy - chh / 2, cw, chh);
  ctx.beginPath();
  ctx.arc(cx, cy, cw * 0.2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillRect(cx - cw * 0.28, cy - chh / 2 - chh * 0.16, cw * 0.24, chh * 0.16);

  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = `700 ${Math.max(13, pw * 0.05)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ADD PHOTO', cx, y + ph * 0.74);
}

// Cover-fit a photo inside its panel; zoom scales it, pan moves it in [-1, 1].
function paintPhotoInto(ctx, img, rect, zoom, panX, panY) {
  const [x, y, pw, ph] = rect;
  const base = Math.max(pw / img.naturalWidth, ph / img.naturalHeight);
  const scale = base * zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = x + (pw - dw) / 2 + (panX * (dw - pw)) / 2;
  const dy = y + (ph - dh) / 2 + (panY * (dh - ph)) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, pw, ph);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

// Sunburst rays behind the sun, so the disc reads even on busy photos.
function paintSunRays(ctx, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = 'rgba(255, 214, 90, 0.16)';
  for (let i = 0; i < 12; i++) {
    ctx.rotate((Math.PI * 2) / 12);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-r * 0.09, -r * 1.9);
    ctx.lineTo(r * 0.09, -r * 1.9);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// The synthwave sun, built from horizontal slices so its lower half is
// striped: each slice's width follows the circle, and the gaps between
// slices grow toward the bottom.
function paintSun(ctx, w, h) {
  const cx = w * 0.12;
  const cy = h * 0.14;
  const r = Math.min(w, h) * 0.11;
  paintSunRays(ctx, cx, cy, r);
  const glow = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  glow.addColorStop(0, '#ffe259');
  glow.addColorStop(0.5, '#ff7e5f');
  glow.addColorStop(1, '#ff2e88');
  ctx.save();
  ctx.fillStyle = glow;
  const slices = 30;
  for (let i = 0; i < slices; i++) {
    const top = cy - r + (2 * r * i) / slices;
    const bottom = cy - r + (2 * r * (i + 1)) / slices;
    const mid = (top + bottom) / 2;
    const half = Math.sqrt(Math.max(0, r * r - (mid - cy) * (mid - cy)));
    // Below the centre the slices separate, leaving striped gaps that
    // widen with the square of the distance from the centre.
    const rel = (mid - cy) / r;
    const drop = mid > cy ? rel * rel * ((bottom - top) * 1.4) : 0;
    ctx.fillRect(cx - half, top + drop / 2, half * 2, bottom - top - drop);
  }
  ctx.restore();
}

// One palm silhouette: a two-segment curved trunk, nine fronds fanning
// from the crown, and a cluster of three coconuts.
function paintPalm(ctx, x, y, s, lean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.scale(s, s);
  ctx.strokeStyle = 'rgba(8, 4, 16, 0.92)';
  ctx.fillStyle = 'rgba(8, 4, 16, 0.92)';
  ctx.lineCap = 'round';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(12, -52, -2, -96);
  ctx.quadraticCurveTo(-8, -104, -4, -112);
  ctx.stroke();
  const tips = [
    [-84, -122],
    [-66, -152],
    [-38, -170],
    [-6, -176],
    [26, -168],
    [54, -150],
    [74, -126],
    [82, -98],
    [76, -72],
  ];
  ctx.lineWidth = 6;
  for (const [tx, ty] of tips) {
    ctx.beginPath();
    ctx.moveTo(-4, -110);
    ctx.quadraticCurveTo(tx * 0.55, ty - 24, tx, ty);
    ctx.stroke();
  }
  for (const [ox, oy, rr] of [[6, -104, 5], [-10, -100, 4], [-1, -94, 4]]) {
    ctx.beginPath();
    ctx.arc(ox, oy, rr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Rooftop silhouette along the bottom edge. Building heights come from a
// fixed seed, so the skyline is identical on every render; taller towers
// get a rooftop antenna, and every third block gets a lit window.
function paintSkyline(ctx, w, h) {
  const rnd = mulberry32(20260526);
  const count = 16;
  const step = w / count;
  const heights = [];
  for (let i = 0; i < count; i++) heights.push(0.05 + rnd() * 0.15);
  ctx.fillStyle = 'rgba(12, 5, 24, 0.88)';
  for (let i = 0; i < count; i++) {
    const top = h - h * heights[i];
    const x = i * step;
    ctx.fillRect(x, top, step * 0.92, h * heights[i]);
    if (heights[i] > 0.15) {
      ctx.fillRect(x + step * 0.4, top - h * 0.025, step * 0.08, h * 0.025);
    }
  }
  ctx.fillStyle = 'rgba(255, 209, 102, 0.75)';
  for (let i = 0; i < count; i += 3) {
    const top = h - h * heights[i];
    ctx.fillRect(i * step + step * 0.25, top + h * 0.03, step * 0.12, step * 0.07);
    ctx.fillRect(i * step + step * 0.6, top + h * 0.09, step * 0.1, step * 0.06);
  }
}

// Five gulls wheeling in the top-right sky, drawn as filled chevrons.
function paintBirds(ctx, w, h) {
  const flock = [
    [0.6, 0.09, 1],
    [0.68, 0.06, 0.75],
    [0.76, 0.11, 0.9],
    [0.84, 0.07, 0.65],
    [0.9, 0.12, 0.8],
  ];
  ctx.save();
  ctx.fillStyle = 'rgba(12, 6, 24, 0.8)';
  for (const [fx, fy, s] of flock) {
    const x = w * fx;
    const y = h * fy;
    const r = w * 0.013 * s;
    ctx.beginPath();
    ctx.moveTo(x - r, y);
    ctx.quadraticCurveTo(x - r * 0.35, y - r * 0.85, x, y - r * 0.1);
    ctx.quadraticCurveTo(x + r * 0.35, y - r * 0.85, x + r, y);
    ctx.quadraticCurveTo(x + r * 0.4, y + r * 0.3, x, y + r * 0.08);
    ctx.quadraticCurveTo(x - r * 0.4, y + r * 0.3, x - r, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// A fixed star field for the midnight grade, from a tiny hash so every
// render draws the same sky.
function paintStars(ctx, w, h) {
  const rnd = mulberry32(987654321);
  ctx.save();
  for (let i = 0; i < 80; i++) {
    const x = rnd() * w;
    const y = rnd() * h * 0.45;
    const r = rnd() * 1.6 + 0.6;
    ctx.globalAlpha = 0.3 + rnd() * 0.65;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Film grain: a faint speckle over the whole cover, from the same fixed
// seed every time, for a printed-poster feel.
function paintGrain(ctx, w, h) {
  const rnd = mulberry32(424242);
  ctx.save();
  for (let i = 0; i < 900; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    ctx.globalAlpha = 0.03 + rnd() * 0.05;
    ctx.fillStyle = rnd() > 0.5 ? '#ffffff' : '#000000';
    ctx.fillRect(x, y, 1 + rnd() * 1.5, 1 + rnd() * 1.5);
  }
  ctx.restore();
}

// Colour wash over the whole cover; noir gets a grey wash instead.
function paintWash(ctx, w, h, grade) {
  if (grade === 'noir') {
    const grey = ctx.createLinearGradient(0, 0, 0, h);
    grey.addColorStop(0, 'rgba(20,20,28,0.10)');
    grey.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = grey;
    ctx.fillRect(0, 0, w, h);
    return;
  }
  const [top, bottom] = WASH[grade] || WASH.sunset;
  const wash = ctx.createLinearGradient(0, 0, 0, h);
  wash.addColorStop(0, top);
  wash.addColorStop(1, bottom);
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  const shade = ctx.createLinearGradient(0, h * 0.5, 0, h);
  shade.addColorStop(0, 'rgba(255,255,255,0)');
  shade.addColorStop(1, 'rgba(90,0,90,0.5)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

// The frame option: a polaroid-style white border with a thicker foot, or
// cinema letterbox bars. Drawn before the title so the words stay on top.
function paintFrame(ctx, w, h, frame) {
  if (frame === 'polaroid') {
    const m = Math.round(Math.min(w, h) * 0.03);
    ctx.fillStyle = '#f8f4ec';
    ctx.fillRect(0, 0, w, m);
    ctx.fillRect(0, h - m * 2.6, w, m * 2.6);
    ctx.fillRect(0, 0, m, h);
    ctx.fillRect(w - m, 0, m, h);
  } else if (frame === 'cinema') {
    const bar = h * 0.075;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, bar);
    ctx.fillRect(0, h - bar, w, bar);
  }
}

// Big tilted title over a dark fade at the bottom, shrinking to fit, with
// a hard offset shadow, a gradient fill, a letterspaced subtitle and an
// accent bar underneath it.
function paintTitle(ctx, w, h, caption, subtitle, grade) {
  const title = (caption || '').trim().toUpperCase();
  const sub = (subtitle || '').trim().toUpperCase();
  const accent = ACCENTS[grade] || ACCENTS.sunset;

  const bandH = h * 0.32;
  const bandY = h - bandH;
  const fade = ctx.createLinearGradient(0, bandY, 0, h);
  fade.addColorStop(0, 'rgba(10,4,20,0)');
  fade.addColorStop(1, 'rgba(10,4,20,0.74)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, bandY, w, h - bandY);
  if (!title && !sub) return;

  ctx.save();
  ctx.translate(w / 2, h - h * 0.15);
  ctx.rotate(-0.015);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  let titleSize = h * 0.115;
  if (title) {
    ctx.font = `900 ${titleSize}px 'Arial Black', Impact, system-ui, sans-serif`;
    while (ctx.measureText(title).width > w * 0.92 && titleSize > 16) {
      titleSize -= 4;
      ctx.font = `900 ${titleSize}px 'Arial Black', Impact, system-ui, sans-serif`;
    }
    const fill = ctx.createLinearGradient(0, -titleSize * 0.6, 0, titleSize * 0.6);
    fill.addColorStop(0, '#ffffff');
    fill.addColorStop(0.55, '#ffd166');
    fill.addColorStop(1, '#ff5e78');
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(3, titleSize * 0.09);
    // Hard offset shadow first, then the outlined gradient title on top.
    ctx.fillStyle = 'rgba(20,4,30,0.9)';
    ctx.fillText(title, titleSize * 0.045, titleSize * 0.06);
    ctx.strokeStyle = 'rgba(20,4,30,0.95)';
    ctx.strokeText(title, 0, 0);
    ctx.fillStyle = fill;
    ctx.fillText(title, 0, 0);
  }

  if (sub) {
    let subSize = Math.max(14, h * 0.032);
    ctx.font = `800 ${subSize}px system-ui, sans-serif`;
    while (ctx.measureText(sub).width > w * 0.86 && subSize > 10) {
      subSize -= 2;
      ctx.font = `800 ${subSize}px system-ui, sans-serif`;
    }
    const subY = title ? titleSize * 0.74 : 0;
    const subW = ctx.measureText(sub).width;
    const ruleW = Math.min(w * 0.3, subW * 0.62);
    ctx.strokeStyle = accent;
    ctx.lineWidth = Math.max(2, subSize * 0.12);
    ctx.beginPath();
    ctx.moveTo(-ruleW / 2 - 14, subY - subSize * 0.55);
    ctx.lineTo(-ruleW / 2 - 14 - ruleW * 0.28, subY - subSize * 0.55);
    ctx.moveTo(ruleW / 2 + 14, subY - subSize * 0.55);
    ctx.lineTo(ruleW / 2 + 14 + ruleW * 0.28, subY - subSize * 0.55);
    ctx.stroke();
    ctx.lineWidth = Math.max(2, subSize * 0.14);
    ctx.strokeStyle = 'rgba(20,4,30,0.95)';
    ctx.strokeText(sub, 0, subY);
    ctx.fillStyle = accent;
    try {
      ctx.letterSpacing = `${Math.max(2, subSize * 0.18)}px`;
    } catch {
      // letterSpacing is Chrome-only; other browsers just draw it plain.
    }
    ctx.fillText(sub, 0, subY);
    try {
      ctx.letterSpacing = '0px';
    } catch {
      // No-op where the property does not exist.
    }
    // A short accent bar centred under the subtitle.
    const barW = Math.min(w * 0.4, subW * 0.5);
    ctx.fillStyle = accent;
    ctx.fillRect(-barW / 2, subY + subSize * 0.85, barW, Math.max(3, subSize * 0.16));
  }
  ctx.restore();
}

// Paint the photo panels for a state, with a thin light edge per panel.
function paintPanels(ctx, w, h, state) {
  const grade = GRADES.includes(state.grade) ? state.grade : 'sunset';
  const layout = LAYOUTS.includes(state.layout) ? state.layout : 'hero';
  const rects = panelRects(layout, w, h);
  const gap = Math.max(3, Math.round(w * 0.005));
  for (let i = 0; i < rects.length; i++) {
    const rect = rects[i];
    const px = rect[0] === 0 ? rect[0] : rect[0] + gap / 2;
    const pw = rect[2] - (rect[0] === 0 ? gap / 2 : gap);
    const py = rect[1] === 0 ? rect[1] : rect[1] + gap / 2;
    const ph = rect[3] - (rect[1] === 0 ? gap / 2 : gap);
    const slot = state.fillAll ? state.panels[0] : state.panels[i];
    ctx.save();
    ctx.filter = PHOTO_FILTERS[grade];
    if (slot && slot.img) {
      paintPhotoInto(ctx, slot.img, [px, py, pw, ph], slot.zoom || 1, slot.ox || 0, slot.oy || 0);
    } else {
      paintEmptySlot(ctx, px, py, pw, ph);
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = Math.max(1.5, w * 0.0015);
    ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  }
}

// The hand-drawn art layer: stars (midnight only), sun, birds, palms and
// the skyline, plus a faint diagonal light streak across the cover.
function paintArt(ctx, w, h, grade) {
  if (grade === 'midnight') paintStars(ctx, w, h);
  paintSun(ctx, w, h);
  paintBirds(ctx, w, h);
  paintPalm(ctx, w * 0.06, h * 0.86, Math.min(w, h) * 0.0016, -0.12);
  paintPalm(ctx, w * 0.94, h * 0.88, Math.min(w, h) * 0.0013, 0.14);
  paintSkyline(ctx, w, h);

  const streak = ctx.createLinearGradient(0, 0, w, h);
  streak.addColorStop(0, 'rgba(255,255,255,0)');
  streak.addColorStop(0.5, 'rgba(255,255,255,0.07)');
  streak.addColorStop(0.52, 'rgba(255,255,255,0)');
  streak.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = streak;
  ctx.fillRect(0, 0, w, h);
}

// Paint the whole cover for a state: panels, art, grade, grain, vignette,
// frame, title and the outer edge line.
//
// state: { panels: [{img, zoom, ox, oy}] (4 slots), layout, grade, frame,
//          caption, subtitle, fillAll }
export function renderCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES.includes(state.grade) ? state.grade : 'sunset';
  const frame = FRAMES.includes(state.frame) ? state.frame : 'none';

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#14081f';
  ctx.fillRect(0, 0, w, h);

  paintPanels(ctx, w, h, state);
  paintArt(ctx, w, h, grade);
  paintWash(ctx, w, h, grade);
  paintGrain(ctx, w, h);

  const vignette = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  paintFrame(ctx, w, h, frame);
  paintTitle(ctx, w, h, state.caption, state.subtitle, grade);

  const margin = Math.max(6, w * 0.012);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = Math.max(2, w * 0.002);
  ctx.strokeRect(margin, margin, w - 2 * margin, h - 2 * margin);
}
