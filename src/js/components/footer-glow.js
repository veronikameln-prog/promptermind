/* Футер: світіння за курсором (лише при наведенні, на пристроях з мишкою).
   JS лише ставить клас is-glow і координати --gx/--gy; вигляд — у layout/footer.css. */

import { qs } from '../core/dom.js';
import { canHover } from '../core/env.js';

export function initFooterGlow() {
  const glow = qs('[data-ft-glow]');
  const footer = glow && glow.closest('footer');
  if (!footer || !canHover()) return;

  let frame = 0;
  let x = 0;
  let y = 0;

  footer.addEventListener('pointerenter', () => footer.classList.add('is-glow'));
  footer.addEventListener('pointerleave', () => footer.classList.remove('is-glow'));
  footer.addEventListener('pointermove', (event) => {
    const box = footer.getBoundingClientRect();
    x = event.clientX - box.left;
    y = event.clientY - box.top;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      glow.style.setProperty('--gx', x + 'px');
      glow.style.setProperty('--gy', y + 'px');
    });
  });
}
