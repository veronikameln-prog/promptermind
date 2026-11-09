/* Лічильники в цифрах hero: «500+», «6 хв», «70%» рахують від нуля, коли їх видно */

import { qsa } from '../core/dom.js';
import { prefersReducedMotion } from '../core/env.js';

const DURATION = 1400; // мс
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

function animateCounter(el) {
  const match = el.textContent.trim().match(/^(\d+)(.*)$/);
  if (!match) return;
  const target = parseInt(match[1], 10);
  const suffix = match[2];
  const start = performance.now();

  function frame(now) {
    const t = Math.min((now - start) / DURATION, 1);
    el.textContent = Math.round(target * easeOutCubic(t)) + suffix;
    if (t < 1) window.requestAnimationFrame(frame);
  }

  window.requestAnimationFrame(frame);
}

export function initStatCounters() {
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateCounter(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.6 });

  qsa('[data-counter]').forEach((el) => observer.observe(el));
}
