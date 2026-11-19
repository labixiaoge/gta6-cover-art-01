// Screenshot driver: applies the query string to the app, runs the given
// setup step, then flags the page ready once the browser has painted twice.
export async function runShot(shot, query, setup) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  if (shot === 'editor') document.body.classList.add('shot-editor');
  const options = {
    photo: query.get('photo') || 'pier',
    caption: query.get('caption') || 'Sunset Heist',
    layout: query.get('layout') || 'hero',
    grade: query.get('grade') || 'sunset',
    size: query.get('size') || '1080x1080',
    subtitle: query.get('subtitle') || 'VICE CITY',
  };
  await setup(options);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.__shotReady = true;
    });
  });
}
