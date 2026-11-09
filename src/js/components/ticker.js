/* Бігучі стрічки: рух без CSS-анімації, щоб текст на нахилених стрічках був чітким.
   CSS-анімація transform передає рух відеокарті, яка повертає вже готову (рівну) картинку тексту — літери розмиваються.
   Тут зсув задається з JS раз на кадр: браузер щоразу малює текст одразу під нахилом, тож він чіткий.
   Рух лише поки стрічки видно на екрані; пауза при наведенні; при prefers-reduced-motion — без руху. */

import { qs, qsa } from '../core/dom.js';
import { prefersReducedMotion } from '../core/env.js';

const FRONT_LAP_MS = 40000; // передня стрічка — коло вліво
const BACK_LAP_MS = 55000; // задня — коло вправо

export function initTicker() {
  const ticker = qs('.ticker');
  if (!ticker || prefersReducedMotion() || !('IntersectionObserver' in window)) return;

  const tracks = qsa('.ticker-track', ticker).map((track) => {
    const back = Boolean(track.closest('.ticker-band--back'));
    return { el: track, duration: back ? BACK_LAP_MS : FRONT_LAP_MS, reverse: back, half: 0 };
  });

  const measure = () => tracks.forEach((t) => { t.half = t.el.scrollWidth / 2; });

  let visible = false;
  let paused = false;
  let frame = 0;
  let last = 0;
  let elapsed = 0;

  function tick(now) {
    frame = 0;
    if (!visible) return;
    if (!paused && last) elapsed += now - last;
    last = now;
    tracks.forEach((t) => {
      const p = (elapsed / t.duration) % 1;
      const x = t.reverse ? -(1 - p) * t.half : -p * t.half;
      // Пряма властивість, а не CSS-змінна: змінна змусила б перераховувати стилі всіх нащадків щокадру
      t.el.style.translate = x.toFixed(2) + 'px 0';
    });
    frame = requestAnimationFrame(tick);
  }

  function start() {
    if (frame) return;
    last = 0;
    frame = requestAnimationFrame(tick);
  }

  measure();
  window.addEventListener('resize', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible) start();
  }).observe(ticker);

  ticker.addEventListener('mouseenter', () => { paused = true; });
  ticker.addEventListener('mouseleave', () => { paused = false; });
}
