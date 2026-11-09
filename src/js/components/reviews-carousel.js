/* Карусель відгуків: кнопки «назад/вперед» і автопрокрутка.
   <div data-carousel> з <ul data-carousel-track> та кнопками data-carousel-prev/next */

import { qs } from '../core/dom.js';
import { prefersReducedMotion } from '../core/env.js';

const AUTOPLAY_MS = 5000;

export function initReviewsCarousel() {
  const carousel = qs('[data-carousel]');
  if (!carousel) return;

  const track = qs('[data-carousel-track]', carousel);
  const reduceMotion = prefersReducedMotion();
  const behavior = reduceMotion ? 'auto' : 'smooth';
  let timer = null;

  // Крок прокрутки — ширина однієї картки + проміжок між картками
  function step() {
    return track.firstElementChild.offsetWidth + parseFloat(getComputedStyle(track).columnGap || 0);
  }

  // Після останньої картки повертаємось на початок (і навпаки)
  function go(direction) {
    const max = track.scrollWidth - track.clientWidth;
    if (direction > 0 && track.scrollLeft >= max - 4) track.scrollTo({ left: 0, behavior });
    else if (direction < 0 && track.scrollLeft <= 4) track.scrollTo({ left: max, behavior });
    else track.scrollBy({ left: direction * step(), behavior });
  }

  function start() {
    if (reduceMotion || timer) return;
    timer = setInterval(() => go(1), AUTOPLAY_MS);
  }

  function stop() {
    clearInterval(timer);
    timer = null;
  }

  qs('[data-carousel-prev]', carousel).addEventListener('click', () => go(-1));
  qs('[data-carousel-next]', carousel).addEventListener('click', () => go(1));

  // Пауза, поки користувач наводить мишку, гортає пальцем або перебуває фокусом у каруселі
  carousel.addEventListener('mouseenter', stop);
  carousel.addEventListener('mouseleave', start);
  carousel.addEventListener('focusin', stop);
  carousel.addEventListener('focusout', (event) => {
    if (!carousel.contains(event.relatedTarget)) start();
  });
  track.addEventListener('touchstart', stop, { passive: true });

  start();
}
