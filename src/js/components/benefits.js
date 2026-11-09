/* Переваги (bento-картки) оживають при появі на екрані:
   кільце заповнюється, цифри рахуються, таймер іде, віяло розкривається (класи is-in — у sections/benefits.css). */

import { qs, qsa } from '../core/dom.js';
import { prefersReducedMotion } from '../core/env.js';
import { initBenefitsChat } from './benefits-chat.js';

const COUNT_MS = 1200;
const LESSON_SECONDS = 360; // «урок на 6 хвилин»
const TIMER_STEP = 6; // с за один тік — таймер іде прискорено
const TIMER_TICK_MS = 200;

function countUp(el, reduce) {
  const to = Number(el.dataset.bnCount);
  if (reduce) {
    el.textContent = to;
    return;
  }
  let start = null;
  function step(t) {
    if (!start) start = t;
    const p = Math.min((t - start) / COUNT_MS, 1);
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function runTimer(el) {
  let left = LESSON_SECONDS;
  setInterval(() => {
    left = left > 0 ? left - TIMER_STEP : LESSON_SECONDS;
    el.textContent = '0' + Math.floor(left / 60) + ':' + ('0' + (left % 60)).slice(-2);
    el.parentNode.style.setProperty('--bn-left', left / LESSON_SECONDS);
  }, TIMER_TICK_MS);
}

export function initBenefits() {
  const cards = qsa('[data-bn]');
  if (!cards.length || !('IntersectionObserver' in window)) return;
  const reduce = prefersReducedMotion();

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const card = entry.target;
      card.classList.add('is-in');
      qsa('[data-bn-count]', card).forEach((el) => countUp(el, reduce));
      const timer = qs('[data-bn-timer]', card);
      if (timer && !reduce) runTimer(timer);
      observer.unobserve(card);
    });
  }, { threshold: 0.35 });

  cards.forEach((card) => observer.observe(card));

  if (!reduce) initBenefitsChat();
}
