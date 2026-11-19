import { drawCover, SIZES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const subtitleInput = document.getElementById('subtitle');
const layoutSelect = document.getElementById('layout');
const gradeSelect = document.getElementById('grade');
const sizeSelect = document.getElementById('size');
const fillAllInput = document.getElementById('fillAll');
const exportButton = document.getElementById('export');
const statusLine = document.getElementById('status');

// Everything the cover is drawn from: four photos (or none), the layout,
// the grade, the export size, the words, and one zoom/pan set per panel.
const state = {
  photos: [null, null, null, null],
  layout: 'hero',
  grade: 'sunset',
  size: '1080x1080',
  caption: 'SUNSET HEIST',
  subtitle: 'VICE CITY',
  fillAll: false,
  zoom: [1, 1, 1, 1],
  ox: [0, 0, 0, 0],
  oy: [0, 0, 0, 0],
};

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// Resize the canvas to the chosen export size and label the export button.
function resizeCanvas() {
  const dims = SIZES[state.size] || SIZES['1080x1080'];
  canvas.width = dims[0];
  canvas.height = dims[1];
  exportButton.textContent = `Export PNG ${dims[0]} x ${dims[1]}`;
}

function redraw() {
  resizeCanvas();
  drawCover(canvas, state);
}

function say(message) {
  statusLine.textContent = message;
}

// One control group per panel: file upload, sample photo, zoom and pan.
for (let i = 0; i < 4; i++) {
  const fileInput = document.getElementById(`photo-${i}`);
  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    state.photos[i] = await loadImage(URL.createObjectURL(file));
    redraw();
    say(`Panel ${i + 1} photo loaded.`);
  });

  const sampleButton = document.getElementById(`sample-${i}`);
  sampleButton.addEventListener('click', async () => {
    const sample = i % 2 === 0 ? 'pier' : 'boulevard';
    state.photos[i] = await loadImage(`samples/${sample}.jpg`);
    redraw();
    say(`Panel ${i + 1} using sample photo.`);
  });

  const zoomSlider = document.getElementById(`zoom-${i}`);
  zoomSlider.addEventListener('input', () => {
    state.zoom[i] = Number(zoomSlider.value);
    redraw();
  });
  const panXSlider = document.getElementById(`ox-${i}`);
  panXSlider.addEventListener('input', () => {
    state.ox[i] = Number(panXSlider.value);
    redraw();
  });
  const panYSlider = document.getElementById(`oy-${i}`);
  panYSlider.addEventListener('input', () => {
    state.oy[i] = Number(panYSlider.value);
    redraw();
  });
}

captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
layoutSelect.addEventListener('change', () => { state.layout = layoutSelect.value; redraw(); });
gradeSelect.addEventListener('change', () => { state.grade = gradeSelect.value; redraw(); });
sizeSelect.addEventListener('change', () => {
  state.size = sizeSelect.value;
  redraw();
  say(`Size set to ${state.size}.`);
});
fillAllInput.addEventListener('change', () => { state.fillAll = fillAllInput.checked; redraw(); });

exportButton.addEventListener('click', () => {
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
    state.size = opts.size;
    state.caption = opts.caption;
    state.subtitle = opts.subtitle;
    layoutSelect.value = opts.layout;
    gradeSelect.value = opts.grade;
    sizeSelect.value = opts.size;
    captionInput.value = opts.caption;
    subtitleInput.value = opts.subtitle;
    const img = await loadImage(`samples/${opts.photo}.jpg`);
    state.photos = [img, img, img, img];
    redraw();
  });
} else {
  redraw();
}
