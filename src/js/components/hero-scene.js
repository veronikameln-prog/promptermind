/* Hero-сцена показується цілою: чекаємо, поки всі шари завантажаться І декодуються
   (Safari інакше малює великі картинки по одній уже після завантаження).
   Поки класу is-ready немає, CSS тримає сцену прозорою (sections/hero-scene.css);
   там же запобіжник — через 4 с сцена з'являється й без JS. */

import { qs, qsa } from '../core/dom.js';

const FALLBACK_MS = 4000;

function whenDecoded(img) {
  const loaded = img.complete
    ? Promise.resolve()
    : new Promise((resolve) => {
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', resolve, { once: true });
    });
  return loaded.then(() => (img.decode ? img.decode().catch(() => {}) : null));
}

export function initHeroScene() {
  const scene = qs('.hero-scene');
  if (!scene) return;

  let shown = false;
  function show() {
    if (shown) return;
    shown = true;
    scene.classList.add('is-ready');
  }

  Promise.all(qsa('img', scene).map(whenDecoded)).then(() => {
    requestAnimationFrame(() => requestAnimationFrame(show));
  });
  setTimeout(show, FALLBACK_MS);
}
