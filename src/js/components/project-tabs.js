/* «Що ти створиш»: вкладки модулів — показуємо 2 проєкти обраного модуля; стрілки ←/→ перемикають вкладки.
   Кнопки «Обрати модуль» додають модуль у кошик курсу (стор) і ведуть до планувальника.
   Без JS вкладки сховані й видно всі картки (клас is-tabs вмикає режим вкладок у CSS). */

import { qs, qsa, restartAnimation } from '../core/dom.js';
import { addModules } from '../store/course-store.js';

export function initProjectTabs() {
  const section = qs('[data-pj]');
  if (!section) return;

  const tabs = qsa('[data-pj-tab]', section);
  const cards = qsa('[data-pj-module]', section);
  const panel = qs('#pj-panel', section);
  const pick = qs('[data-pj-pick]', section);
  if (!tabs.length || !panel) return;
  section.classList.add('is-tabs');

  function show(tab, focus) {
    const key = tab.dataset.pjTab;
    tabs.forEach((t) => {
      const active = t === tab;
      t.setAttribute('aria-selected', String(active));
      t.tabIndex = active ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', tab.id);
    tab.parentNode.style.setProperty('--pj-i', tabs.indexOf(tab)); // підкладка перемикача їде під активний розділ
    cards.forEach((card) => { card.hidden = card.dataset.pjModule !== key; });

    // Одна кнопка під парою карток — для модуля активної вкладки
    if (pick) {
      const name = qs('.pj-tab__title', tab).textContent;
      const meta = qs('.pj-tab__meta', tab).textContent.split(' · '); // «4 тижні · 12 уроків · 1 490 ₴»
      pick.dataset.pickModule = key;
      qs('[data-pj-pick-name]', pick).textContent = name;
      qs('[data-pj-pick-meta]', pick).textContent = meta[0] + ' · ' + meta[meta.length - 1];
    }
    restartAnimation(panel, 'is-switching');
    if (focus) tab.focus();
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => show(tab));
    tab.addEventListener('keydown', (event) => {
      const dir = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      if (!dir) return;
      event.preventDefault();
      show(tabs[(i + dir + tabs.length) % tabs.length], true);
    });
  });
  show(tabs[0]);

  // Посилання не блокуємо — після вибору сторінка прокручується до планувальника
  section.addEventListener('click', (event) => {
    const button = event.target.closest('[data-pick-module]');
    if (button) addModules(button.dataset.pickModule);
  });
}
