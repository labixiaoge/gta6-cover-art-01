export const LAYOUTS = ['hero', 'triptych', 'quad', 'single'];
export const GRADES = ['sunset', 'neon', 'gold', 'noir'];
export const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

export function layoutRects(layout, w, h) {
  if (layout === 'triptych') {
    return [[0, 0, w / 3, h], [w / 3, 0, w / 3, h], [(2 * w) / 3, 0, w / 3, h], null];
  }
  if (layout === 'quad') {
    return [[0, 0, w / 2, h / 2], [w / 2, 0, w / 2, h / 2], [0, h / 2, w / 2, h / 2], [w / 2, h / 2, w / 2, h / 2]];
  }
  if (layout === 'single') {
    return [[0, 0, w, h], null, null, null];
  }
  return [[0, 0, w * 0.62, h], [w * 0.62, 0, w * 0.38, h / 2], [w * 0.62, h / 2, w * 0.38, h / 2], null];
}

function panelCount(layout) {
  if (layout === 'single') return 1;
  if (layout === 'quad') return 4;
  return 3;
}

function placeholder(ctx, x, y, pw, ph) {
  const g = ctx.createLinearGradient(x, y, x, y + ph);
  g.addColorStop(0, '#ff9a3d');
  g.addColorStop(0.5, '#e84393');
  g.addColorStop(1, '#2d1b4e');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, pw, ph);
  const sunR = Math.min(pw, ph) * 0.22;
  const cx = x + pw / 2;
  const cy = y + ph * 0.38;
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(cx, cy, sunR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2d1b4e';
  for (let i = 0; i < 3; i++) {
    const sy = cy - sunR * 0.4 + i * sunR * 0.35;
    ctx.fillRect(cx - sunR, sy, sunR * 2, sunR * 0.09);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = `bold ${Math.max(14, pw * 0.055)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('ADD PHOTO', cx, y + ph * 0.78);
}

function drawPhotoCover(ctx, img, x, y, pw, ph, zoom, ox, oy) {
  const base = Math.max(pw / img.naturalWidth, ph / img.naturalHeight);
  const scale = base * zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = x + (pw - dw) / 2 + ox * (dw - pw) * 0.5;
  const dy = y + (ph - dh) / 2 + oy * (dh - ph) * 0.5;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, pw, ph);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function drawPalm(ctx, x, y, s, lean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.scale(s, s);
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

function drawSkyline(ctx, w, h) {
  ctx.fillStyle = 'rgba(12, 5, 24, 0.85)';
  ctx.beginPath();
  ctx.moveTo(0, h);
  let x = 0;
  const heights = [0.10, 0.16, 0.08, 0.20, 0.12, 0.18, 0.09, 0.22, 0.13, 0.17, 0.07, 0.15];
  const step = w / heights.length;
  for (let i = 0; i < heights.length; i++) {
    const top = h - h * heights[i];
    ctx.lineTo(x, top);
    ctx.lineTo(x + step * 0.55, top);
    ctx.lineTo(x + step * 0.55, h - h * heights[i] - h * 0.02);
    ctx.lineTo(x + step * 0.7, h - h * heights[i] - h * 0.02);
    ctx.lineTo(x + step * 0.7, top);
    ctx.lineTo(x + step, top);
    ctx.lineTo(x + step, h);
    x += step;
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

function drawSun(ctx, w, h) {
  const cx = w * 0.10;
  const cy = h * 0.12;
  const r = Math.min(w, h) * 0.10;
  const g = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  g.addColorStop(0, '#ffe259');
  g.addColorStop(0.55, '#ff7e5f');
  g.addColorStop(1, '#e84393');
  ctx.save();
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 4; i++) {
    const sy = cy + r * (0.05 + i * 0.22);
    ctx.fillRect(cx - r - 2, sy, r * 2 + 4, r * 0.075);
  }
  ctx.restore();
}

function gradeOverlay(ctx, w, h, grade) {
  if (grade === 'noir') {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(20,20,28,0.10)');
    g.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = g;
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
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  const g2 = ctx.createLinearGradient(0, h * 0.5, 0, h);
  g2.addColorStop(0, 'rgba(255,255,255,0)');
  g2.addColorStop(1, 'rgba(90,0,90,0.5)');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawTitle(ctx, w, h, caption, subtitle, grade) {
  const text = (caption || '').trim().toUpperCase();
  const sub = (subtitle || '').trim().toUpperCase();
  const accent = grade === 'neon' ? '#00e5ff' : grade === 'gold' ? '#ffd166' : grade === 'noir' ? '#e8e8e8' : '#ff9a3d';
  const bandH = h * 0.30;
  const bandY = h - bandH;
  const shade = ctx.createLinearGradient(0, bandY, 0, h);
  shade.addColorStop(0, 'rgba(10,4,20,0)');
  shade.addColorStop(1, 'rgba(10,4,20,0.72)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, bandY, w, h - bandY);
  if (!text && !sub) return;
  ctx.save();
  ctx.translate(w / 2, h - h * 0.155);
  ctx.rotate(-0.015);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let size = h * 0.115;
  if (text) {
    ctx.font = `900 ${size}px Impact, Arial Black, system-ui, sans-serif`;
    while (ctx.measureText(text).width > w * 0.92 && size > 16) {
      size -= 4;
      ctx.font = `900 ${size}px Impact, Arial Black, system-ui, sans-serif`;
    }
    const tg = ctx.createLinearGradient(0, -size * 0.6, 0, size * 0.6);
    tg.addColorStop(0, '#ffffff');
    tg.addColorStop(0.55, '#ffe259');
    tg.addColorStop(1, '#ff7e5f');
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(3, size * 0.09);
    ctx.strokeStyle = 'rgba(20,4,30,0.95)';
    ctx.strokeText(text, 0, 0);
    ctx.fillStyle = tg;
    ctx.fillText(text, 0, 0);
  }
  if (sub) {
    const subSize = Math.max(14, h * 0.032);
    ctx.font = `800 ${subSize}px system-ui, sans-serif`;
    let sw = subSize;
    while (ctx.measureText(sub).width > w * 0.86 && sw > 10) {
      sw -= 2;
      ctx.font = `800 ${sw}px system-ui, sans-serif`;
    }
    const sy = text ? size * 0.72 : 0;
    ctx.lineWidth = Math.max(2, sw * 0.14);
    ctx.strokeStyle = 'rgba(20,4,30,0.95)';
    ctx.strokeText(sub, 0, sy);
    ctx.fillStyle = accent;
    ctx.fillText(sub, 0, sy);
  }
  ctx.restore();
}

export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES.includes(state.grade) ? state.grade : 'sunset';
  const layout = LAYOUTS.includes(state.layout) ? state.layout : 'hero';
  const count = panelCount(layout);
  const rects = layoutRects(layout, w, h);
  const gap = Math.max(4, Math.round(w * 0.006));
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#14081f';
  ctx.fillRect(0, 0, w, h);
  const filters = {
    sunset: 'saturate(1.25) contrast(1.08)',
    neon: 'saturate(1.6) contrast(1.12) hue-rotate(-8deg)',
    gold: 'saturate(1.15) contrast(1.12) sepia(0.25)',
    noir: 'saturate(0.15) contrast(1.35) brightness(1.05)',
  };
  for (let i = 0; i < count; i++) {
    const r = rects[i];
    if (!r) continue;
    const x = r[0] + (i === 0 || layout === 'quad' ? 0 : gap / 2);
    const px = r[0] === 0 ? r[0] : r[0] + gap / 2;
    const pw = r[2] - (r[0] === 0 ? gap / 2 : gap);
    const py = r[1] === 0 ? r[1] : r[1] + gap / 2;
    const ph = r[3] - (r[1] === 0 ? gap / 2 : gap);
    void x;
    const img = state.fillAll ? state.photos[0] : state.photos[i];
    ctx.save();
    ctx.filter = filters[grade];
    if (img) {
      drawPhotoCover(ctx, img, px, py, pw, ph, state.zoom[i] || 1, state.ox[i] || 0, state.oy[i] || 0);
    } else {
      placeholder(ctx, px, py, pw, ph);
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
  const streak = ctx.createLinearGradient(0, 0, w, h);
  streak.addColorStop(0, 'rgba(255,255,255,0)');
  streak.addColorStop(0.5, 'rgba(255,255,255,0.07)');
  streak.addColorStop(0.52, 'rgba(255,255,255,0)');
  streak.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = streak;
  ctx.fillRect(0, 0, w, h);
  gradeOverlay(ctx, w, h, grade);
  const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);
  drawTitle(ctx, w, h, state.caption, state.subtitle, grade);
  const m = Math.max(6, w * 0.012);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = Math.max(2, w * 0.002);
  ctx.strokeRect(m, m, w - 2 * m, h - 2 * m);
}
