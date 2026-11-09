/* Мобільне меню (бургер).
   JS лише перемикає aria-expanded і hidden; вигляд станів описано Tailwind-варіантами в розмітці. */

import { qs } from '../core/dom.js';

export function initBurgerMenu() {
  const burger = qs('[data-burger]');
  const menu = qs('[data-mobile-menu]');
  if (!burger || !menu) return;

  const isOpen = () => burger.getAttribute('aria-expanded') === 'true';

  function setOpen(open) {
    menu.classList.toggle('hidden', !open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
  }

  burger.addEventListener('click', () => setOpen(!isOpen()));

  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) {
      setOpen(false);
      burger.focus();
    }
  });

  // Ширина, з якої бургер ховається (головна — 1024, інтенсив — 768)
  const breakpoint = burger.dataset.burgerBreakpoint || 768;
  window.matchMedia('(min-width: ' + breakpoint + 'px)').addEventListener('change', (event) => {
    if (event.matches) setOpen(false);
  });
}
