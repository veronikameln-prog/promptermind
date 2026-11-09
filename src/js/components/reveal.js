/* Поява блоків під час прокрутки: <div data-reveal> або data-reveal="zoom".
   Сусідні блоки з'являються «драбинкою» (затримка --reveal-delay). Вигляд — у utilities/animations.css. */

import { qsa } from '../core/dom.js';
import { prefersReducedMotion } from '../core/env.js';

const STAGGER_STEP = 0.1; // с
const MAX_STAGGER = 5;

export function initReveal() {
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('is-visible');
      observer.unobserve(el);

      // Після появи прибираємо службові класи, щоб не заважати hover-ефектам Tailwind
      el.addEventListener('transitionend', function cleanup(event) {
        if (event.target !== el || event.propertyName !== 'transform') return;
        el.classList.remove('reveal', 'reveal--zoom', 'is-visible');
        el.style.removeProperty('--reveal-delay');
        el.removeEventListener('transitionend', cleanup);
      });
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });

  qsa('[data-reveal]').forEach((el) => {
    el.classList.add('reveal');
    if (el.dataset.reveal === 'zoom') el.classList.add('reveal--zoom');
    const siblings = Array.from(el.parentElement.children).filter((child) => child.hasAttribute('data-reveal'));
    if (siblings.length > 1) {
      el.style.setProperty('--reveal-delay', (Math.min(siblings.indexOf(el), MAX_STAGGER) * STAGGER_STEP) + 's');
    }
    observer.observe(el);
  });
}
