/* Крок 1 оформлення: картки «Модулі та вартість» і підсумок «Твій курс».
   Картка: <article data-module data-key="start"> з кнопкою [data-module-toggle].
   Компонент нічого не рахує сам: клік → дія стору, зміна стору → перемальовування.
   Рядки списку будуються з <template data-calc-row-template> — розмітка лишається в HTML. */

import { qs, qsa, cloneTemplate, restartAnimation, setLinkDisabled } from '../core/dom.js';
import { courseStore, toggleModule, selectPlan } from '../store/course-store.js';
import { selectedModules } from '../domain/pricing.js';
import { courseSummary } from '../domain/plan-summary.js';

export function initModulePicker() {
  const calc = qs('[data-calc]');
  const cards = qsa('[data-module][data-key]');
  if (!calc || !cards.length) return;

  const el = {
    list: qs('[data-calc-list]', calc),
    empty: qs('[data-calc-empty]', calc),
    caption: qs('[data-calc-lessons]', calc),
    total: qs('[data-calc-total]', calc),
    totalWrap: qs('[data-calc-total-wrap]', calc),
    announce: qs('[data-calc-announce]', calc),
    rowTemplate: qs('[data-calc-row-template]', calc),
    next: qs('[data-calc-next]')
  };

  function createRow(row) {
    const li = cloneTemplate(el.rowTemplate);
    qs('[data-row-title]', li).textContent = row.title;
    qs('[data-row-price]', li).textContent = row.price;
    const meta = qs('[data-row-meta]', li);
    if (row.meta) meta.textContent = row.meta;
    else meta.remove();
    return li;
  }

  function renderCards(keys) {
    cards.forEach((card) => {
      const selected = keys.includes(card.dataset.key);
      card.dataset.selected = String(selected);
      const toggle = qs('[data-module-toggle]', card);
      if (!toggle) return;
      toggle.setAttribute('aria-pressed', String(selected));
      qs('[data-toggle-text]', toggle).textContent = selected ? 'Обрано' : 'Обрати';
    });
  }

  function render(state, prevState) {
    const modules = selectedModules(state.modules);
    const summary = courseSummary(modules, selectPlan(state));

    renderCards(state.modules);

    el.list.replaceChildren(...summary.rows.map(createRow));
    el.list.hidden = modules.length === 0;
    el.empty.hidden = modules.length > 0;
    if (el.caption) el.caption.textContent = summary.caption;

    if (el.total.textContent !== summary.total) {
      el.total.textContent = summary.total;
      if (prevState) restartAnimation(el.totalWrap, 'bump');
    }

    if (el.next) setLinkDisabled(el.next, modules.length === 0);

    // Для скрінрідерів — лише коли змінився саме вибір модулів
    if (prevState && prevState.modules !== state.modules) el.announce.textContent = summary.announce;
  }

  cards.forEach((card) => {
    const toggle = qs('[data-module-toggle]', card);
    if (toggle) toggle.addEventListener('click', () => toggleModule(card.dataset.key));
  });

  courseStore.subscribe(render);
  render(courseStore.getState(), null);
}
