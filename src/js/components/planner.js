/* Крок 2 оформлення: «Планувальник навчання» (модулі, темп, учні, опції, промокод).
   Поля форми → дії стору; стан стору → перемальовування підсумку.
   Логіка розрахунку — у domain/pricing.js, тексти — у domain/plan-summary.js.

   Захисне програмування, три рівні:
   1) HTML5: type="number", min, max, step="1", required;
   2) перевірка кожного значення перед розрахунком (domain/pricing.js → parseCount);
   3) безпечне відображення: лише textContent; замість NaN користувач бачить «—»
      і зрозуміле повідомлення під полем. Якщо віджета немає на сторінці — тихо завершуємось. */

import { qs, qsa, setLinkDisabled } from '../core/dom.js';
import { formatUAH, formatWeeks } from '../utils/format.js';
import { LIMITS } from '../domain/catalog.js';
import { parseCount, stepCount } from '../domain/pricing.js';
import { promoStatus } from '../domain/plan-summary.js';
import {
  courseStore, selectPlan, setModuleSelected, setCount, setExtra, applyPromo, removePromo
} from '../store/course-store.js';

const IDS = ['lessons-per-week', 'students-count', 'mentor-opt', 'certificate-opt',
  'total-weeks', 'total-price', 'total-old', 'summary-module', 'summary-options', 'summary-students',
  'summary-discount', 'discount-row', 'promo-row', 'summary-promo', 'summary-promo-code',
  'error-lessons', 'error-students', 'planner-error',
  'promo-form', 'promo-code', 'promo-remove', 'promo-apply', 'promo-message', 'plan-submit'];

export function initPlanner() {
  const root = qs('[data-planner]');
  if (!root) return; // віджета немає на цій сторінці

  const el = {};
  const missing = IDS.filter((id) => {
    el[id] = document.getElementById(id);
    return !el[id];
  });
  const moduleBoxes = qsa('input[name="module"]', root);
  if (missing.length || !moduleBoxes.length) {
    // Fail-Safe: віджет не запускається, але решта сторінки працює
    console.warn('[planner] Віджет вимкнено: на сторінці немає елементів ' + (missing.join(', ') || 'input[name="module"]'));
    return;
  }

  /* Лічильники: поле ↔ ключ стану ↔ межі ↔ елемент помилки */
  const counters = [
    { input: el['lessons-per-week'], field: 'lessonsPerWeek', limit: LIMITS.lessonsPerWeek, error: el['error-lessons'] },
    { input: el['students-count'], field: 'students', limit: LIMITS.students, error: el['error-students'] }
  ];
  const extras = [
    { input: el['mentor-opt'], key: 'mentor' },
    { input: el['certificate-opt'], key: 'certificate' }
  ];
  const stepButtons = qsa('[data-step][data-target]', root);
  const counterFor = (id) => counters.find((c) => c.input.id === id);

  // Повідомлення про невдалу спробу ввести промокод (не є станом курсу — живе лише тут)
  let promoNotice = null;

  /* ---------- Відображення ---------- */

  function showFieldError(counter, message) {
    counter.input.setAttribute('aria-invalid', String(Boolean(message)));
    counter.error.textContent = message; // textContent — ніякого HTML з даних
    counter.error.hidden = !message;
  }

  function setGeneralError(message) {
    el['planner-error'].textContent = message;
    el['planner-error'].hidden = !message;
  }

  function setPromoMessage(notice) {
    if (notice) el['promo-form'].dataset.state = notice.type;
    else delete el['promo-form'].dataset.state;
    el['promo-message'].textContent = notice ? notice.text : '';
  }

  function renderInputs(state) {
    moduleBoxes.forEach((box) => { box.checked = state.modules.includes(box.value); });
    counters.forEach((c) => {
      // Не переписуємо поле, поки користувач у ньому друкує (значення вже збігається зі станом)
      if (c.input.value !== state[c.field].raw && !state[c.field].badInput) c.input.value = state[c.field].raw;
    });
    extras.forEach((x) => { x.input.checked = state.extras[x.key]; });

    stepButtons.forEach((button) => {
      const counter = counterFor(button.dataset.target);
      if (!counter) return;
      const parsed = parseCount(state[counter.field], counter.limit);
      const step = Number(button.dataset.step);
      button.disabled = parsed.ok && ((step < 0 && parsed.value <= counter.limit.min) || (step > 0 && parsed.value >= counter.limit.max));
    });
  }

  function resetSummary() {
    ['total-weeks', 'total-price', 'summary-module', 'summary-options', 'summary-students'].forEach((id) => {
      el[id].textContent = '—';
    });
    el['discount-row'].hidden = true;
    el['promo-row'].hidden = true;
    el['total-old'].hidden = true;
    setLinkDisabled(el['plan-submit'], true);
  }

  function renderSummary(plan) {
    el['total-weeks'].textContent = formatWeeks(plan.weeks);
    el['summary-module'].textContent = plan.modules.map((m) => m.title).join(', ');
    el['summary-options'].textContent = formatUAH(plan.optionsPrice);
    el['summary-students'].textContent = String(plan.students);
    el['summary-discount'].textContent = '−' + formatUAH(plan.discount);
    el['discount-row'].hidden = plan.discount <= 0;
    el['summary-promo'].textContent = '−' + formatUAH(plan.promo.amount);
    el['summary-promo-code'].textContent = plan.promo.code || '';
    el['promo-row'].hidden = plan.promo.amount <= 0;
    el['total-old'].textContent = formatUAH(plan.subtotal);
    el['total-old'].hidden = plan.total === plan.subtotal;
    el['total-price'].textContent = formatUAH(plan.total);
    setLinkDisabled(el['plan-submit'], false);
  }

  function renderPromo(state, prevState, plan) {
    const locked = Boolean(state.promoCode);
    el['promo-code'].readOnly = locked;
    el['promo-apply'].hidden = locked;
    el['promo-remove'].hidden = !locked;

    if (locked) {
      el['promo-code'].value = state.promoCode;
      const status = promoStatus(plan);
      if (status) setPromoMessage(status); // план неповний — лишаємо попереднє повідомлення
    } else {
      if (prevState && prevState.promoCode) el['promo-code'].value = '';
      setPromoMessage(promoNotice);
    }
  }

  function render(state, prevState) {
    try {
      const plan = selectPlan(state);
      renderInputs(state);
      counters.forEach((c) => showFieldError(c, plan.errors[c.field]));
      setGeneralError(plan.errors.general);
      if (plan.valid) renderSummary(plan);
      else resetSummary();
      renderPromo(state, prevState, plan);
    } catch (error) {
      // Fail-Safe: технічна помилка — у консоль для розробника, користувачу — зрозумілий текст
      console.error('[planner]', error);
      resetSummary();
      setGeneralError('Не вдалося розрахувати план. Оновіть сторінку.');
    }
  }

  /* ---------- Події → дії стору ---------- */

  moduleBoxes.forEach((box) => {
    box.addEventListener('change', () => setModuleSelected(box.value, box.checked));
  });

  counters.forEach((c) => {
    c.input.addEventListener('input', () => {
      setCount(c.field, c.input.value, Boolean(c.input.validity && c.input.validity.badInput));
    });
  });

  stepButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const counter = counterFor(button.dataset.target);
      if (!counter) return;
      setCount(counter.field, String(stepCount(counter.input.value, Number(button.dataset.step), counter.limit)));
    });
  });

  extras.forEach((x) => {
    x.input.addEventListener('change', () => setExtra(x.key, x.input.checked));
  });

  el['promo-form'].addEventListener('submit', (event) => {
    event.preventDefault();
    const result = applyPromo(el['promo-code'].value);
    if (result.ok) {
      promoNotice = null;
      el['promo-remove'].focus();
      return;
    }
    promoNotice = { type: 'error', text: result.message };
    setPromoMessage(promoNotice);
    if (el['promo-code'].value.trim()) el['promo-code'].select();
    else el['promo-code'].focus();
  });

  el['promo-remove'].addEventListener('click', () => {
    promoNotice = null;
    removePromo();
    el['promo-code'].focus();
  });

  el['promo-code'].addEventListener('input', () => {
    if (courseStore.getState().promoCode) return;
    promoNotice = null;
    setPromoMessage(null);
  });

  courseStore.subscribe(render);
  render(courseStore.getState(), null);
}
