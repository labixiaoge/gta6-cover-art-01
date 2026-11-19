// Screenshot driver: reads the cover options out of the query string,
// hands them to the app's setup step, then flags the page ready once the
// browser has painted twice, so a screenshot never catches a half-drawn
// cover. The `frame` option is new in round 4; older links without it
// still work and fall back to no frame.
export async function runShot(shot, query, setup) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  if (shot === 'editor') document.body.classList.add('shot-editor');
  const options = {
    photo: query.get('photo') || 'pier',
    caption: query.get('caption') || 'Sunset Heist',
    layout: query.get('layout') || 'hero',
    grade: query.get('grade') || 'sunset',
    frame: query.get('frame') || 'none',
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
