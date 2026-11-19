// Screenshot driver: reads the cover options out of the query string,
// hands them to the app's setup step, then flags the page ready once the
// browser has painted twice, so a screenshot never catches a half-drawn
// cover. Any option left out of the query falls back to the defaults
// below, so older links without `frame` still work.
const DEFAULTS = {
  photo: 'pier',
  caption: 'Sunset Heist',
  layout: 'hero',
  grade: 'sunset',
  frame: 'none',
  size: '1080x1080',
  subtitle: 'VICE CITY',
};

// Merge the query string over the defaults, key by key.
function readOptions(query) {
  const options = {};
  for (const key of Object.keys(DEFAULTS)) {
    options[key] = query.get(key) || DEFAULTS[key];
  }
  return options;
}

export async function runShot(shot, query, setup) {
  document.body.classList.add(shot === 'cover' ? 'shot-cover' : 'shot-editor');
  const options = readOptions(query);
  await setup(options);
  await new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
  window.__shotReady = true;
}
