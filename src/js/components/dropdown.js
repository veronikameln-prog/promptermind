/* Випадне меню «Ще» в шапці */

import { qs, qsa } from '../core/dom.js';

function initDropdown(dropdown) {
  const toggle = qs('[data-dropdown-toggle]', dropdown);
  const menu = qs('[data-dropdown-menu]', dropdown);
  if (!toggle || !menu) return;

  function setOpen(open) {
    menu.classList.toggle('hidden', !open);
    toggle.setAttribute('aria-expanded', String(open));
  }

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));

  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });

  document.addEventListener('click', (event) => {
    if (!dropdown.contains(event.target)) setOpen(false);
  });

  dropdown.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setOpen(false);
      toggle.focus();
    }
  });

  // Закриваємо, коли фокус пішов за межі меню (Tab)
  dropdown.addEventListener('focusout', (event) => {
    if (!dropdown.contains(event.relatedTarget)) setOpen(false);
  });
}

export function initDropdowns() {
  qsa('[data-dropdown]').forEach(initDropdown);
}
