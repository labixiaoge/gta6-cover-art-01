export async function runShot(shot, query, setup) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  if (shot === 'editor') document.body.classList.add('shot-editor');
  const photo = query.get('photo') || 'pier';
  const caption = query.get('caption') || 'Sunset Heist';
  const layout = query.get('layout') || 'hero';
  const grade = query.get('grade') || 'sunset';
  const size = query.get('size') || '1080x1080';
  const subtitle = query.get('subtitle') || 'VICE CITY';
  await setup({ photo, caption, layout, grade, size, subtitle });
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
