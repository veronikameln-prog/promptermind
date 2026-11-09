/* Таймер зворотного відліку:
   <div data-countdown="2026-11-22T10:00:00+02:00"> з полями data-countdown-days/hours/minutes/seconds */

import { qs } from '../core/dom.js';
import { pad2 } from '../utils/format.js';
import { timeLeft } from '../domain/countdown.js';

export function initCountdown() {
  const box = qs('[data-countdown]');
  if (!box) return;

  const target = new Date(box.dataset.countdown).getTime();
  const parts = {
    days: qs('[data-countdown-days]', box),
    hours: qs('[data-countdown-hours]', box),
    minutes: qs('[data-countdown-minutes]', box),
    seconds: qs('[data-countdown-seconds]', box)
  };
  let timer = 0;

  function tick() {
    const left = timeLeft(target);
    Object.keys(parts).forEach((key) => {
      parts[key].textContent = pad2(left[key]);
    });
    if (left.done) clearInterval(timer);
  }

  tick();
  timer = setInterval(tick, 1000);
}
