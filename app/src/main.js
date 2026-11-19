import { renderCover, SIZES, LAYOUTS, GRADES, FRAMES } from './cover.js';
import { runShot } from './shots.js';

// Grab the static controls once; the four panel groups are built below.
const canvas = document.getElementById('coverCanvas');
const capInput = document.getElementById('capInput');
const subInput = document.getElementById('subInput');
const layoutSel = document.getElementById('layoutSel');
const gradeSel = document.getElementById('gradeSel');
const sizeSel = document.getElementById('sizeSel');
const frameSel = document.getElementById('frameSel');
const fillAllChk = document.getElementById('fillAllChk');
const shuffleBtn = document.getElementById('shuffleBtn');
const exportBtn = document.getElementById('exportBtn');
const statusMsg = document.getElementById('statusMsg');
const panelsBox = document.getElementById('panelsBox');

// Everything a cover is drawn from: four photos (or none), the layout, the
// grade, the frame, the export size, the words, and one zoom/pan set per
// panel. The shuffle button re-rolls layout, grade and frame from this.
const state = {
  photos: [null, null, null, null],
  layout: 'hero',
  grade: 'sunset',
  frame: 'none',
  size: '1080x1080',
  caption: 'SUNSET HEIST',
  subtitle: 'VICE CITY',
  fillAll: false,
  zoom: [1, 1, 1, 1],
  ox: [0, 0, 0, 0],
  oy: [0, 0, 0, 0],
};

export function loadPhoto(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// Fill a <select> from a list of values, with a human label per value.
function fillSelect(select, values, labels) {
  select.innerHTML = '';
  for (const value of values) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = labels[value] || value;
    select.appendChild(option);
  }
}

fillSelect(layoutSel, LAYOUTS, {
  hero: 'Hero — one tall panel, two small ones',
  triptych: 'Triptych — three tall panels',
  quad: 'Quad — 2 x 2 panels',
  single: 'Single — one full-bleed photo',
  diptych: 'Diptych — two tall panels',
  bands: 'Bands — three horizontal strips',
});
fillSelect(gradeSel, GRADES, {
  sunset: 'Sunset — orange and magenta',
  neon: 'Neon — cyan and magenta',
  gold: 'Gold — teal shadows and gold',
  noir: 'Noir — desaturated, high contrast',
  dawn: 'Dawn — soft rose and lavender',
  midnight: 'Midnight — deep blue and stars',
});
fillSelect(frameSel, FRAMES, {
  none: 'No frame',
  polaroid: 'Polaroid — white border, thick foot',
  cinema: 'Cinema — black letterbox bars',
});
fillSelect(sizeSel, Object.keys(SIZES), {
  '1080x1080': '1080 x 1080 — square post',
  '1080x1350': '1080 x 1350 — portrait post',
  '1080x1920': '1080 x 1920 — story',
  '1920x1080': '1920 x 1080 — landscape post',
});
layoutSel.value = state.layout;
gradeSel.value = state.grade;
frameSel.value = state.frame;
sizeSel.value = state.size;

// Resize the canvas to the chosen export size and label the export button.
function resizeCanvas() {
  const dims = SIZES[state.size] || SIZES['1080x1080'];
  canvas.width = dims[0];
  canvas.height = dims[1];
  exportBtn.textContent = `Export PNG ${dims[0]} x ${dims[1]}`;
}

function redraw() {
  resizeCanvas();
  renderCover(canvas, state);
}

function say(message) {
  statusMsg.textContent = message;
}

// Build one panel's controls: a file upload, a sample-photo button, and
// zoom and pan sliders. The four groups are identical in shape, so they
// are generated here instead of written out four times in the markup.
function buildPanel(index) {
  const group = document.createElement('fieldset');
  group.className = 'panel-card';
  const legend = document.createElement('legend');
  legend.textContent = `Panel ${index + 1}`;
  group.appendChild(legend);

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.id = `photo-${index}`;
  group.appendChild(fileInput);

  const sampleButton = document.createElement('button');
  sampleButton.type = 'button';
  sampleButton.id = `sample-${index}`;
  sampleButton.textContent = 'Use sample';
  group.appendChild(sampleButton);

  const sliders = [
    ['zoom', 'Zoom', 1, 3, 0.05, 1],
    ['ox', 'Pan X', -1, 1, 0.05, 0],
    ['oy', 'Pan Y', -1, 1, 0.05, 0],
  ];
  const inputs = {};
  for (const [key, label, min, max, step, value] of sliders) {
    const wrap = document.createElement('label');
    wrap.textContent = label;
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = `${key}-${index}`;
    slider.min = String(min);
    slider.max = String(max);
    slider.step = String(step);
    slider.value = String(value);
    wrap.appendChild(slider);
    group.appendChild(wrap);
    inputs[key] = slider;
  }

  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    state.photos[index] = await loadPhoto(URL.createObjectURL(file));
    redraw();
    say(`Panel ${index + 1} photo loaded.`);
  });
  sampleButton.addEventListener('click', async () => {
    const sample = index % 2 === 0 ? 'pier' : 'boulevard';
    state.photos[index] = await loadPhoto(`samples/${sample}.jpg`);
    redraw();
    say(`Panel ${index + 1} using sample photo.`);
  });
  inputs.zoom.addEventListener('input', () => {
    state.zoom[index] = Number(inputs.zoom.value);
    redraw();
  });
  inputs.ox.addEventListener('input', () => {
    state.ox[index] = Number(inputs.ox.value);
    redraw();
  });
  inputs.oy.addEventListener('input', () => {
    state.oy[index] = Number(inputs.oy.value);
    redraw();
  });
  return group;
}

for (let i = 0; i < 4; i++) panelsBox.appendChild(buildPanel(i));

capInput.addEventListener('input', () => { state.caption = capInput.value; redraw(); });
subInput.addEventListener('input', () => { state.subtitle = subInput.value; redraw(); });
layoutSel.addEventListener('change', () => { state.layout = layoutSel.value; redraw(); });
gradeSel.addEventListener('change', () => { state.grade = gradeSel.value; redraw(); });
frameSel.addEventListener('change', () => { state.frame = frameSel.value; redraw(); });
sizeSel.addEventListener('change', () => {
  state.size = sizeSel.value;
  redraw();
  say(`Size set to ${state.size}.`);
});
fillAllChk.addEventListener('change', () => { state.fillAll = fillAllChk.checked; redraw(); });

// Surprise me: roll a fresh layout, grade and frame, and show the result.
shuffleBtn.addEventListener('click', () => {
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  state.layout = pick(LAYOUTS);
  state.grade = pick(GRADES);
  state.frame = pick(FRAMES);
  layoutSel.value = state.layout;
  gradeSel.value = state.grade;
  frameSel.value = state.frame;
  redraw();
  say(`Rolled ${state.layout} / ${state.grade} / ${state.frame}. Roll again or tweak it.`);
});

exportBtn.addEventListener('click', () => {
  const dims = SIZES[state.size] || SIZES['1080x1080'];
  const filename = `vice-city-cover-${dims[0]}x${dims[1]}.png`;
  canvas.toBlob((blob) => {
    if (!blob) {
      say('Export failed.');
      return;
    }
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    say(`Saved ${filename}`);
  }, 'image/png');
});

// Screenshot mode (?shot=...) drives the app from the query string and
// reports readiness through window.__shotReady; otherwise just draw once.
const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, async (opts) => {
    state.layout = opts.layout;
    state.grade = opts.grade;
    state.frame = opts.frame;
    state.size = opts.size;
    state.caption = opts.caption;
    state.subtitle = opts.subtitle;
    layoutSel.value = opts.layout;
    gradeSel.value = opts.grade;
    frameSel.value = opts.frame;
    sizeSel.value = opts.size;
    capInput.value = opts.caption;
    subInput.value = opts.subtitle;
    const img = await loadPhoto(`samples/${opts.photo}.jpg`);
    state.photos = [img, img, img, img];
    redraw();
  });
} else {
  redraw();
}
