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
const status = document.getElementById('status');

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

function applySize() {
  const dims = SIZES[state.size] || SIZES['1080x1080'];
  canvas.width = dims[0];
  canvas.height = dims[1];
  exportButton.textContent = `Export PNG ${dims[0]} x ${dims[1]}`;
}

function redraw() {
  applySize();
  drawCover(canvas, state);
}

function setStatus(msg) {
  status.textContent = msg;
}

for (let i = 0; i < 4; i++) {
  const fileInput = document.getElementById(`photo-${i}`);
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    state.photos[i] = await loadImage(URL.createObjectURL(file));
    redraw();
    setStatus(`Panel ${i + 1} photo loaded.`);
  });
  const sampleButton = document.getElementById(`sample-${i}`);
  sampleButton.addEventListener('click', async () => {
    state.photos[i] = await loadImage(`samples/${i % 2 === 0 ? 'pier' : 'boulevard'}.jpg`);
    redraw();
    setStatus(`Panel ${i + 1} using sample photo.`);
  });
  const zoom = document.getElementById(`zoom-${i}`);
  zoom.addEventListener('input', () => { state.zoom[i] = Number(zoom.value); redraw(); });
  const ox = document.getElementById(`ox-${i}`);
  ox.addEventListener('input', () => { state.ox[i] = Number(ox.value); redraw(); });
  const oy = document.getElementById(`oy-${i}`);
  oy.addEventListener('input', () => { state.oy[i] = Number(oy.value); redraw(); });
}

captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
layoutSelect.addEventListener('change', () => { state.layout = layoutSelect.value; redraw(); });
gradeSelect.addEventListener('change', () => { state.grade = gradeSelect.value; redraw(); });
sizeSelect.addEventListener('change', () => { state.size = sizeSelect.value; redraw(); setStatus(`Size set to ${state.size}.`); });
fillAllInput.addEventListener('change', () => { state.fillAll = fillAllInput.checked; redraw(); });

exportButton.addEventListener('click', () => {
  const dims = SIZES[state.size] || SIZES['1080x1080'];
  const name = `vice-city-cover-${dims[0]}x${dims[1]}.png`;
  canvas.toBlob((blob) => {
    if (!blob) { setStatus('Export failed.'); return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setStatus(`Saved ${name}`);
  }, 'image/png');
});

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
