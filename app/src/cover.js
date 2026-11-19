// Cover renderer: draws the multi-panel cover onto a canvas.
// Everything here is hand-drawn vector art on top of the user's photos:
// a synthwave sun, palm silhouettes, a skyline, a colour grade, a vignette
// and a big gradient title. No Rockstar artwork, logo, character or font
// is used anywhere; titles use system fonts only.

export const LAYOUTS = ['hero', 'triptych', 'quad', 'single'];
export const GRADES = ['sunset', 'neon', 'gold', 'noir'];

export const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

// Panel rectangles [x, y, w, h] for a layout; unused slots are null.
export function layoutRects(layout, w, h) {
  if (layout === 'triptych') {
    const third = w / 3;
    return [[0, 0, third, h], [third, 0, third, h], [2 * third, 0, third, h], null];
  }
  if (layout === 'quad') {
    const halfW = w / 2;
    const halfH = h / 2;
    return [
      [0, 0, halfW, halfH],
      [halfW, 0, halfW, halfH],
      [0, halfH, halfW, halfH],
      [halfW, halfH, halfW, halfH],
    ];
  }
  if (layout === 'single') {
    return [[0, 0, w, h], null, null, null];
  }
  // Hero: one tall panel on the left, two stacked panels on the right.
  const left = w * 0.62;
  const right = w * 0.38;
  return [[0, 0, left, h], [left, 0, right, h / 2], [left, h / 2, right, h / 2], null];
}

function visiblePanels(layout) {
  if (layout === 'single') return 1;
  if (layout === 'quad') return 4;
  return 3;
}

const PHOTO_FILTERS = {
  sunset: 'saturate(1.25) contrast(1.08)',
  neon: 'saturate(1.6) contrast(1.12) hue-rotate(-8deg)',
  gold: 'saturate(1.15) contrast(1.12) sepia(0.25)',
  noir: 'saturate(0.15) contrast(1.35) brightness(1.05)',
};

// Empty panel: sunset gradient, a striped sun and an "add photo" prompt.
function drawEmptyPanel(ctx, x, y, pw, ph) {
  const wash = ctx.createLinearGradient(x, y, x, y + ph);
  wash.addColorStop(0, '#ff9a3d');
  wash.addColorStop(0.5, '#e84393');
  wash.addColorStop(1, '#2d1b4e');
  ctx.fillStyle = wash;
  ctx.fillRect(x, y, pw, ph);

  const radius = Math.min(pw, ph) * 0.22;
  const cx = x + pw / 2;
  const cy = y + ph * 0.38;
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2d1b4e';
  for (let i = 0; i < 3; i++) {
    const slitY = cy - radius * 0.4 + i * radius * 0.35;
    ctx.fillRect(cx - radius, slitY, radius * 2, radius * 0.09);
  }

  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = `bold ${Math.max(14, pw * 0.055)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('ADD PHOTO', cx, y + ph * 0.78);
}

// Cover-fit a photo inside a panel, with zoom and pan offsets in [-1, 1].
function drawPhoto(ctx, img, x, y, pw, ph, zoom, ox, oy) {
  const fit = Math.max(pw / img.naturalWidth, ph / img.naturalHeight);
  const scale = fit * zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = x + (pw - dw) / 2 + (ox * (dw - pw)) / 2;
  const dy = y + (ph - dh) / 2 + (oy * (dh - ph)) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, pw, ph);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

// One palm silhouette: a curved trunk with seven drooping fronds.
function drawPalm(ctx, x, y, scale, lean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.scale(scale, scale);
  ctx.strokeStyle = 'rgba(10, 6, 18, 0.92)';
  ctx.fillStyle = 'rgba(10, 6, 18, 0.92)';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(6, -60, -6, -110);
  ctx.stroke();
  ctx.lineWidth = 5;
  const fronds = [[-70, -30], [-55, -55], [-25, -72], [10, -75], [45, -62], [68, -35], [55, -8]];
  for (const [fx, fy] of fronds) {
    ctx.beginPath();
    ctx.moveTo(-6, -110);
    ctx.quadraticCurveTo(fx * 0.6, fy - 18, fx, fy + 22);
    ctx.quadraticCurveTo(fx * 0.55, fy + 2, -6, -104);
    ctx.fill();
  }
  ctx.restore();
}

// Jagged rooftop silhouette along the bottom of the cover.
function drawSkyline(ctx, w, h) {
  const roofline = [0.10, 0.16, 0.08, 0.20, 0.12, 0.18, 0.09, 0.22, 0.13, 0.17, 0.07, 0.15];
  const step = w / roofline.length;
  ctx.fillStyle = 'rgba(12, 5, 24, 0.85)';
  ctx.beginPath();
  ctx.moveTo(0, h);
  let x = 0;
  for (let i = 0; i < roofline.length; i++) {
    const top = h - h * roofline[i];
    const antennaTop = top - h * 0.02;
    ctx.lineTo(x, top);
    ctx.lineTo(x + step * 0.55, top);
    ctx.lineTo(x + step * 0.55, antennaTop);
    ctx.lineTo(x + step * 0.7, antennaTop);
    ctx.lineTo(x + step * 0.7, top);
    ctx.lineTo(x + step, top);
    ctx.lineTo(x + step, h);
    x += step;
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

// Striped synthwave sun in the top-left corner.
function drawSun(ctx, w, h) {
  const cx = w * 0.10;
  const cy = h * 0.12;
  const r = Math.min(w, h) * 0.10;
  const glow = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  glow.addColorStop(0, '#ffe259');
  glow.addColorStop(0.55, '#ff7e5f');
  glow.addColorStop(1, '#e84393');
  ctx.save();
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // Cut horizontal slits out of the lower half with destination-out.
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 4; i++) {
    const slitY = cy + r * (0.05 + i * 0.22);
    ctx.fillRect(cx - r - 2, slitY, r * 2 + 4, r * 0.075);
  }
  ctx.restore();
}

// Colour wash over the whole cover; noir gets a grey gradient instead.
function applyGrade(ctx, w, h, grade) {
  if (grade === 'noir') {
    const grey = ctx.createLinearGradient(0, 0, 0, h);
    grey.addColorStop(0, 'rgba(20,20,28,0.10)');
    grey.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = grey;
    ctx.fillRect(0, 0, w, h);
    return;
  }
  let top;
  let bottom;
  if (grade === 'neon') {
    top = 'rgba(0,229,255,0.28)';
    bottom = 'rgba(255,0,153,0.42)';
  } else if (grade === 'gold') {
    top = 'rgba(0,128,128,0.22)';
    bottom = 'rgba(255,183,0,0.30)';
  } else {
    top = 'rgba(255,140,0,0.22)';
    bottom = 'rgba(232,67,147,0.45)';
  }
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

// Big tilted title over a dark band at the bottom, shrinking to fit.
function drawTitle(ctx, w, h, caption, subtitle, grade) {
  const title = (caption || '').trim().toUpperCase();
  const sub = (subtitle || '').trim().toUpperCase();
  const accent = grade === 'neon' ? '#00e5ff' : grade === 'gold' ? '#ffd166' : grade === 'noir' ? '#e8e8e8' : '#ff9a3d';

  const bandH = h * 0.30;
  const bandY = h - bandH;
  const fade = ctx.createLinearGradient(0, bandY, 0, h);
  fade.addColorStop(0, 'rgba(10,4,20,0)');
  fade.addColorStop(1, 'rgba(10,4,20,0.72)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, bandY, w, h - bandY);
  if (!title && !sub) return;

  ctx.save();
  ctx.translate(w / 2, h - h * 0.155);
  ctx.rotate(-0.015);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  let titleSize = h * 0.115;
  if (title) {
    ctx.font = `900 ${titleSize}px Impact, Arial Black, system-ui, sans-serif`;
    while (ctx.measureText(title).width > w * 0.92 && titleSize > 16) {
      titleSize -= 4;
      ctx.font = `900 ${titleSize}px Impact, Arial Black, system-ui, sans-serif`;
    }
    const fill = ctx.createLinearGradient(0, -titleSize * 0.6, 0, titleSize * 0.6);
    fill.addColorStop(0, '#ffffff');
    fill.addColorStop(0.55, '#ffe259');
    fill.addColorStop(1, '#ff7e5f');
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(3, titleSize * 0.09);
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
    const subY = title ? titleSize * 0.72 : 0;
    ctx.lineWidth = Math.max(2, subSize * 0.14);
    ctx.strokeStyle = 'rgba(20,4,30,0.95)';
    ctx.strokeText(sub, 0, subY);
    ctx.fillStyle = accent;
    ctx.fillText(sub, 0, subY);
  }
  ctx.restore();
}

export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES.includes(state.grade) ? state.grade : 'sunset';
  const layout = LAYOUTS.includes(state.layout) ? state.layout : 'hero';
  const count = visiblePanels(layout);
  const rects = layoutRects(layout, w, h);
  const gap = Math.max(4, Math.round(w * 0.006));

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#14081f';
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < count; i++) {
    const rect = rects[i];
    if (!rect) continue;
    // Inset each panel by half a gap on the sides shared with a neighbour.
    const px = rect[0] === 0 ? rect[0] : rect[0] + gap / 2;
    const pw = rect[2] - (rect[0] === 0 ? gap / 2 : gap);
    const py = rect[1] === 0 ? rect[1] : rect[1] + gap / 2;
    const ph = rect[3] - (rect[1] === 0 ? gap / 2 : gap);
    const img = state.fillAll ? state.photos[0] : state.photos[i];
    ctx.save();
    ctx.filter = PHOTO_FILTERS[grade];
    if (img) {
      drawPhoto(ctx, img, px, py, pw, ph, state.zoom[i] || 1, state.ox[i] || 0, state.oy[i] || 0);
    } else {
      drawEmptyPanel(ctx, px, py, pw, ph);
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = Math.max(1.5, w * 0.0015);
    ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  }

  drawSun(ctx, w, h);
  drawPalm(ctx, w * 0.06, h * 0.86, Math.min(w, h) * 0.0016, -0.12);
  drawPalm(ctx, w * 0.94, h * 0.88, Math.min(w, h) * 0.0013, 0.14);
  drawSkyline(ctx, w, h);

  // Faint diagonal light streak across the whole cover.
  const streak = ctx.createLinearGradient(0, 0, w, h);
  streak.addColorStop(0, 'rgba(255,255,255,0)');
  streak.addColorStop(0.5, 'rgba(255,255,255,0.07)');
  streak.addColorStop(0.52, 'rgba(255,255,255,0)');
  streak.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = streak;
  ctx.fillRect(0, 0, w, h);

  applyGrade(ctx, w, h, grade);

  const vignette = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  drawTitle(ctx, w, h, state.caption, state.subtitle, grade);

  const margin = Math.max(6, w * 0.012);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = Math.max(2, w * 0.002);
  ctx.strokeRect(margin, margin, w - 2 * margin, h - 2 * margin);
}
