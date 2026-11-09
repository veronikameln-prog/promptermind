/* Шапка під час прокрутки: тінь (data-scrolled) + смужка прогресу (CSS-змінна --progress) */

import { qs } from '../core/dom.js';

export function initScrollHeader() {
  const header = qs('[data-header]');
  const progress = qs('[data-progress]');
  if (!header) return;

  let ticking = false;

  function update() {
    const scrollTop = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    header.dataset.scrolled = String(scrollTop > 8);
    if (progress) progress.style.setProperty('--progress', maxScroll > 0 ? (scrollTop / maxScroll).toFixed(4) : '0');
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }, { passive: true });

  update();
}
