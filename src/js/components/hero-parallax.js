/* Hero: легкий паралакс ілюстрації за курсором.
   Лише для миші (pointer: fine) і якщо користувач не просив зменшити рух.
   Зсув до 10 px; запис у CSS-змінні --px/--py раз на кадр (requestAnimationFrame). */

import { qs } from '../core/dom.js';
import { hasFinePointerAndMotion } from '../core/env.js';

export function initHeroParallax() {
  const art = qs('[data-hero-art]');
  const hero = art && art.closest('section');
  if (!hero || !hasFinePointerAndMotion()) return;

  let frame = 0;
  hero.addEventListener('pointermove', (event) => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      art.style.setProperty('--px', (x * -20).toFixed(1) + 'px');
      art.style.setProperty('--py', (y * -12).toFixed(1) + 'px');
    });
  });

  hero.addEventListener('pointerleave', () => {
    art.style.setProperty('--px', '0px');
    art.style.setProperty('--py', '0px');
  });
}
