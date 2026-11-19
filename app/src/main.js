import { renderCover, SIZES, LAYOUTS, GRADES, FRAMES } from './cover.js';
import { runShot } from './shots.js';

// Small helper so every control below reads as a name, not a lookup.
const $ = (id) => document.getElementById(id);
const canvas = $('coverCanvas');
const capInput = $('capInput');
const subInput = $('subInput');
const layoutSel = $('layoutSel');
const gradeSel = $('gradeSel');
const sizeSel = $('sizeSel');
const frameSel = $('frameSel');
const fillAllChk = $('fillAllChk');
const shuffleBtn = $('shuffleBtn');
const exportBtn = $('exportBtn');
const copyLinkBtn = $('copyLinkBtn');
const resetBtn = $('resetBtn');
const statusMsg = $('statusMsg');
const panelsBox = $('panelsBox');

// One-click looks: each preset sets the layout, grade, frame and words
// in one go, and the user can tweak the result from there.
const PRESETS = {
  sunset: { layout: 'hero', grade: 'sunset', frame: 'none', caption: 'SUNSET HEIST', subtitle: 'VICE CITY' },
  neon: { layout: 'triptych', grade: 'neon', frame: 'cinema', caption: 'NEON STREETS', subtitle: 'VICE CITY' },
  vice: { layout: 'columns', grade: 'ember', frame: 'polaroid', caption: 'VICE NIGHTS', subtitle: 'LEONIDA' },
};

// Captions the Surprise button can roll, so a re-roll can change the
// words as well as the look.
const ROLL_CAPTIONS = ['SUNSET HEIST', 'NEON STREETS', 'VICE NIGHTS', 'OCEAN DRIVE', 'PALM SHADOWS'];

// A photo slot: the image (or null), plus its crop (zoom and pan).
function emptySlot() {
  return { img: null, zoom: 1, ox: 0, oy: 0 };
}

// Everything a cover is drawn from: four photo slots, the layout, the
// grade, the frame, the export size, the words, and a fill-all switch.
const studio = {
  panels: [emptySlot(), emptySlot(), emptySlot(), emptySlot()],
  layout: 'hero',
  grade: 'sunset',
  frame: 'none',
  size: '1080x1080',
  caption: 'SUNSET HEIST',
  subtitle: 'VICE CITY',
  fillAll: false,
};

export function loadPhoto(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// Fill a <select> from [value, label] pairs.
function fillSelect(select, pairs) {
  select.innerHTML = '';
  for (const [value, label] of pairs) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
  }
}

fillSelect(layoutSel, [
  ['hero', 'Hero — one tall panel, two small ones'],
  ['triptych', 'Triptych — three tall panels'],
  ['quad', 'Quad — 2 x 2 panels'],
  ['single', 'Single — one full-bleed photo'],
  ['diptych', 'Diptych — two tall panels'],
  ['bands', 'Bands — three horizontal strips'],
  ['columns', 'Columns — four tall strips'],
  ['stack', 'Stack — one wide band, three small ones'],
]);
fillSelect(gradeSel, [
  ['sunset', 'Sunset — orange and magenta'],
  ['neon', 'Neon — cyan and magenta'],
  ['gold', 'Gold — teal shadows and gold'],
  ['noir', 'Noir — desaturated, high contrast'],
  ['dawn', 'Dawn — soft rose and lavender'],
  ['midnight', 'Midnight — deep blue and stars'],
  ['ember', 'Ember — deep red and smoke'],
]);
fillSelect(frameSel, [
  ['none', 'No frame'],
  ['polaroid', 'Polaroid — white border, thick foot'],
  ['cinema', 'Cinema — black letterbox bars'],
]);
fillSelect(sizeSel, [
  ['1080x1080', '1080 x 1080 — square post'],
  ['1080x1350', '1080 x 1350 — portrait post'],
  ['1080x1920', '1080 x 1920 — story'],
  ['1920x1080', '1920 x 1080 — landscape post'],
]);

// Push the whole studio state back into the controls, so presets, the
// shuffle button and the reset button all go through one path.
function syncControls() {
  layoutSel.value = studio.layout;
  gradeSel.value = studio.grade;
  frameSel.value = studio.frame;
  sizeSel.value = studio.size;
  capInput.value = studio.caption;
  subInput.value = studio.subtitle;
  fillAllChk.checked = studio.fillAll;
}

syncControls();

// Resize the canvas to the chosen export size and label the export button.
function resizeCanvas() {
  const dims = SIZES[studio.size] || SIZES['1080x1080'];
  canvas.width = dims[0];
  canvas.height = dims[1];
  exportBtn.textContent = `Export PNG ${dims[0]} x ${dims[1]}`;
}

function redraw() {
  resizeCanvas();
  renderCover(canvas, studio);
}

function say(message) {
  statusMsg.textContent = message;
}

// One panel's controls: a file upload, a sample-photo button, a clear
// button, and zoom and pan sliders. The four cards share one shape, so
// they are generated here instead of written out four times in the markup.
function buildPanel(index) {
  const card = document.createElement('section');
  card.className = 'panel';

  const heading = document.createElement('h3');
  heading.textContent = `Panel ${index + 1}`;
  card.appendChild(heading);

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.id = `photo-${index}`;
  card.appendChild(fileInput);

  const row = document.createElement('div');
  row.className = 'panel-btns';
  const sampleButton = document.createElement('button');
  sampleButton.type = 'button';
  sampleButton.id = `sample-${index}`;
  sampleButton.textContent = 'Use sample';
  row.appendChild(sampleButton);
  const clearButton = document.createElement('button');
  clearButton.type = 'button';
  clearButton.id = `clear-${index}`;
  clearButton.textContent = 'Clear';
  row.appendChild(clearButton);
  card.appendChild(row);

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
    card.appendChild(wrap);
    inputs[key] = slider;
  }

  const slot = studio.panels[index];
  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    slot.img = await loadPhoto(URL.createObjectURL(file));
    redraw();
    say(`Panel ${index + 1} photo loaded.`);
  });
  sampleButton.addEventListener('click', async () => {
    const sample = index % 2 === 0 ? 'pier' : 'boulevard';
    slot.img = await loadPhoto(`samples/${sample}.jpg`);
    redraw();
    say(`Panel ${index + 1} using sample photo.`);
  });
  clearButton.addEventListener('click', () => {
    slot.img = null;
    slot.zoom = 1;
    slot.ox = 0;
    slot.oy = 0;
    inputs.zoom.value = '1';
    inputs.ox.value = '0';
    inputs.oy.value = '0';
    redraw();
    say(`Panel ${index + 1} cleared.`);
  });
  inputs.zoom.addEventListener('input', () => {
    slot.zoom = Number(inputs.zoom.value);
    redraw();
  });
  inputs.ox.addEventListener('input', () => {
    slot.ox = Number(inputs.ox.value);
    redraw();
  });
  inputs.oy.addEventListener('input', () => {
    slot.oy = Number(inputs.oy.value);
    redraw();
  });
  return card;
}

for (let i = 0; i < 4; i++) panelsBox.appendChild(buildPanel(i));

capInput.addEventListener('input', () => { studio.caption = capInput.value; redraw(); });
subInput.addEventListener('input', () => { studio.subtitle = subInput.value; redraw(); });
layoutSel.addEventListener('change', () => { studio.layout = layoutSel.value; redraw(); });
gradeSel.addEventListener('change', () => { studio.grade = gradeSel.value; redraw(); });
frameSel.addEventListener('change', () => { studio.frame = frameSel.value; redraw(); });
sizeSel.addEventListener('change', () => {
  studio.size = sizeSel.value;
  redraw();
  say(`Size set to ${studio.size}.`);
});
fillAllChk.addEventListener('change', () => { studio.fillAll = fillAllChk.checked; redraw(); });

// Presets: one click sets layout, grade, frame and words together.
document.querySelectorAll('[data-preset]').forEach((button) => {
  button.addEventListener('click', () => {
    const preset = PRESETS[button.dataset.preset];
    if (!preset) return;
    Object.assign(studio, preset);
    syncControls();
    redraw();
    say(`Preset “${button.textContent.trim()}” applied — tweak it from here.`);
  });
});

// Surprise me: roll a fresh layout, grade, frame and caption.
shuffleBtn.addEventListener('click', () => {
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  studio.layout = pick(LAYOUTS);
  studio.grade = pick(GRADES);
  studio.frame = pick(FRAMES);
  studio.caption = pick(ROLL_CAPTIONS);
  syncControls();
  redraw();
  say(`Rolled ${studio.layout} / ${studio.grade} / ${studio.frame}. Roll again or tweak it.`);
});

// Copy a link that reopens this exact cover: layout, grade, frame, size
// and words all ride in the query string.
copyLinkBtn.addEventListener('click', async () => {
  const params = new URLSearchParams({
    shot: 'cover',
    photo: 'pier',
    layout: studio.layout,
    grade: studio.grade,
    frame: studio.frame,
    size: studio.size,
    caption: studio.caption,
    subtitle: studio.subtitle,
  });
  const link = `${location.origin}${location.pathname}?${params}`;
  try {
    await navigator.clipboard.writeText(link);
    say('Link copied — open it to reload this cover.');
  } catch {
    say(`Copy this link: ${link}`);
  }
});

// Reset: back to the opening look, with every panel emptied.
resetBtn.addEventListener('click', () => {
  studio.panels = [emptySlot(), emptySlot(), emptySlot(), emptySlot()];
  studio.layout = 'hero';
  studio.grade = 'sunset';
  studio.frame = 'none';
  studio.size = '1080x1080';
  studio.caption = 'SUNSET HEIST';
  studio.subtitle = 'VICE CITY';
  studio.fillAll = false;
  syncControls();
  redraw();
  say('Reset to the opening look.');
});

exportBtn.addEventListener('click', () => {
  const dims = SIZES[studio.size] || SIZES['1080x1080'];
  const slug = studio.caption.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cover';
  const filename = `vice-city-${slug}-${dims[0]}x${dims[1]}.png`;
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
    studio.layout = opts.layout;
    studio.grade = opts.grade;
    studio.frame = opts.frame;
    studio.size = opts.size;
    studio.caption = opts.caption;
    studio.subtitle = opts.subtitle;
    syncControls();
    const img = await loadPhoto(`samples/${opts.photo}.jpg`);
    studio.panels = [
      { img, zoom: 1, ox: 0, oy: 0 },
      { img, zoom: 1, ox: 0, oy: 0 },
      { img, zoom: 1, ox: 0, oy: 0 },
      { img, zoom: 1, ox: 0, oy: 0 },
    ];
    redraw();
  });
} else {
  redraw();
}
