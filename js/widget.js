/* =============================================================================
   ЛР №11. Інтерактивний віджет «Планувальник навчання» (версія 2, після QA)
   -----------------------------------------------------------------------------
   Тривалість = ⌈уроки модуля ÷ уроків на тиждень⌉ тижнів.
   Вартість   = (ціна модуля + опції) × кількість учнів; від 2 учнів знижка 10 %.

   Захисне програмування (Defensive Programming), три рівні:
   1) HTML5: type="number", min, max, step="1", required;
   2) JavaScript: кожне значення перевіряється перед розрахунком (порожнє, нецілі,
      NaN, Infinity, нуль, від'ємні, поза діапазоном, невідомий модуль);
   3) безпечне відображення: лише textContent; замість NaN користувач бачить «—»
      і зрозуміле повідомлення під полем.
   Код ізольовано в IIFE — жодних глобальних змінних; якщо віджета немає на сторінці,
   скрипт тихо завершується (Fail-Safe).
   ========================================================================== */
(function () {
  'use strict';

  const root = document.querySelector('[data-planner]');
  if (!root) return; // віджета немає на цій сторінці

  /* ---------- Бізнес-правила (незмінні) ---------- */
  const MODULES = Object.freeze({
    start: { title: 'Старт у ШІ', lessons: 12, price: 1490 },
    bots: { title: 'Створення ботів', lessons: 18, price: 2290 },
    prompting: { title: 'Просунутий промптинг', lessons: 24, price: 2990 }
  });
  const MENTOR_PRICE = 500;
  const CERTIFICATE_PRICE = 300;
  const FAMILY_DISCOUNT = 0.1;
  const LIMITS = Object.freeze({
    'lessons-per-week': { min: 1, max: 7, what: 'кількість уроків' },
    'students-count': { min: 1, max: 5, what: 'кількість учнів' }
  });

  /* ---------- DOM: усі елементи перевіряються одразу ---------- */
  const ids = ['study-module', 'lessons-per-week', 'students-count', 'mentor-opt', 'certificate-opt',
    'total-weeks', 'total-price', 'summary-module', 'summary-options', 'summary-students',
    'summary-discount', 'discount-row', 'error-lessons', 'error-students', 'planner-error'];
  const el = {};
  const missing = ids.filter(function (id) {
    el[id] = document.getElementById(id);
    return !el[id];
  });
  if (missing.length) {
    // Fail-Safe: віджет не запускається, але решта сторінки працює
    console.warn('[planner] Віджет вимкнено: на сторінці немає елементів ' + missing.join(', '));
    return;
  }
  const errorFor = { 'lessons-per-week': el['error-lessons'], 'students-count': el['error-students'] };

  /* ---------- Форматування ---------- */
  const formatUAH = function (value) {
    return value.toLocaleString('uk-UA') + ' ₴';
  };
  function weeksLabel(n) {
    const last = n % 10;
    const lastTwo = n % 100;
    if (last === 1 && lastTwo !== 11) return n + ' тиждень';
    if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return n + ' тижні';
    return n + ' тижнів';
  }

  /* ---------- Читання цілого числа з перевіркою ----------
     Повертає { ok: true, value } або { ok: false, message } — без винятків і без NaN. */
  function readInt(input) {
    const limit = LIMITS[input.id];
    const range = 'від ' + limit.min + ' до ' + limit.max;
    const raw = input.value.trim();

    if (input.validity && input.validity.badInput) {
      return { ok: false, message: 'Введіть число ' + range + '.' }; // літери в type="number"
    }
    if (raw === '') {
      return { ok: false, message: 'Поле не може бути порожнім. Введіть ' + limit.what + ' ' + range + '.' };
    }
    if (!/^-?\d+$/.test(raw)) {
      return { ok: false, message: 'Введіть ціле число ' + range + '.' }; // 2.5, 1e1, 3,0
    }
    const value = Number(raw);
    if (!Number.isSafeInteger(value) || value < limit.min || value > limit.max) {
      return { ok: false, message: 'Введіть ' + limit.what + ' ' + range + '.' }; // 0, −5, 9999999999999999
    }
    return { ok: true, value: value };
  }

  /* ---------- UI-стани полів (Tailwind-класи перемикаються наборами) ---------- */
  const NORMAL = ['border-brand-200', 'focus:border-brand', 'focus:ring-brand/15'];
  const ERROR = ['border-red-500', 'bg-red-50', 'focus:border-red-500', 'focus:ring-red-500/20'];

  function showError(input, message) {
    input.classList.remove.apply(input.classList, NORMAL);
    input.classList.add.apply(input.classList, ERROR);
    input.setAttribute('aria-invalid', 'true');
    errorFor[input.id].textContent = message; // textContent — ніякого HTML з даних
    errorFor[input.id].classList.remove('hidden');
  }

  function clearError(input) {
    input.classList.remove.apply(input.classList, ERROR);
    input.classList.add.apply(input.classList, NORMAL);
    input.setAttribute('aria-invalid', 'false');
    errorFor[input.id].textContent = '';
    errorFor[input.id].classList.add('hidden');
  }

  function setGeneralError(message) {
    el['planner-error'].textContent = message;
    el['planner-error'].classList.toggle('hidden', !message);
  }

  /* ---------- Підсумок ---------- */
  function resetSummary() {
    ['total-weeks', 'total-price', 'summary-module', 'summary-options', 'summary-students'].forEach(function (id) {
      el[id].textContent = '—';
    });
    el['discount-row'].classList.add('hidden');
    el['discount-row'].classList.remove('flex');
  }

  function render(result) {
    el['total-weeks'].textContent = weeksLabel(result.weeks);
    el['summary-module'].textContent = result.module.title;
    el['summary-options'].textContent = formatUAH(result.options);
    el['summary-students'].textContent = String(result.students);
    el['summary-discount'].textContent = '−' + formatUAH(result.discount);
    el['discount-row'].classList.toggle('hidden', result.discount === 0);
    el['discount-row'].classList.toggle('flex', result.discount > 0);
    el['total-price'].textContent = formatUAH(result.total);
  }

  /* ---------- Кнопки −/+: блокуються на межах діапазону ---------- */
  const stepButtons = Array.prototype.slice.call(root.querySelectorAll('[data-step][data-target]'));

  function updateStepButtons() {
    stepButtons.forEach(function (button) {
      const input = document.getElementById(button.dataset.target);
      const limit = input && LIMITS[input.id];
      if (!limit) return;
      const parsed = readInt(input);
      const step = Number(button.dataset.step);
      button.disabled = parsed.ok && ((step < 0 && parsed.value <= limit.min) || (step > 0 && parsed.value >= limit.max));
    });
  }

  /* ---------- Розрахунок ---------- */
  function calculate() {
    try {
      const lessons = readInt(el['lessons-per-week']);
      const students = readInt(el['students-count']);
      lessons.ok ? clearError(el['lessons-per-week']) : showError(el['lessons-per-week'], lessons.message);
      students.ok ? clearError(el['students-count']) : showError(el['students-count'], students.message);

      const key = el['study-module'].value;
      const module = Object.prototype.hasOwnProperty.call(MODULES, key) ? MODULES[key] : null;
      setGeneralError(module ? '' : 'Оберіть модуль зі списку.');

      updateStepButtons();
      if (!lessons.ok || !students.ok || !module) {
        resetSummary();
        return;
      }

      const options = (el['mentor-opt'].checked ? MENTOR_PRICE : 0) + (el['certificate-opt'].checked ? CERTIFICATE_PRICE : 0);
      const weeks = Math.ceil(module.lessons / lessons.value);
      const subtotal = (module.price + options) * students.value;
      const discount = students.value >= 2 ? Math.round(subtotal * FAMILY_DISCOUNT) : 0;
      const total = subtotal - discount;

      // Останній запобіжник: на екран не потрапляє NaN, Infinity чи від'ємна сума
      if (![weeks, subtotal, discount, total].every(Number.isFinite) || total < 0) {
        resetSummary();
        setGeneralError('Не вдалося розрахувати план. Перевірте введені дані.');
        return;
      }
      render({ module: module, options: options, students: students.value, weeks: weeks, discount: discount, total: total });
    } catch (error) {
      // Fail-Safe: технічна помилка — у консоль для розробника, користувачу — зрозумілий текст
      console.error('[planner]', error);
      resetSummary();
      setGeneralError('Не вдалося розрахувати план. Оновіть сторінку.');
    }
  }

  /* ---------- Події ---------- */
  stepButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      const input = document.getElementById(button.dataset.target);
      const limit = input && LIMITS[input.id];
      if (!limit) return;
      const raw = input.value.trim();
      const step = Number(button.dataset.step);
      // Ціле число (навіть поза межами) → ±1 і обмеження діапазоном; порожнє чи дробове → мінімальне значення
      const next = /^-?\d+$/.test(raw) ? Number(raw) + step : limit.min;
      input.value = String(Math.min(limit.max, Math.max(limit.min, next)));
      calculate();
    });
  });

  el['study-module'].addEventListener('change', calculate);
  el['lessons-per-week'].addEventListener('input', calculate);
  el['students-count'].addEventListener('input', calculate);
  el['mentor-opt'].addEventListener('change', calculate);
  el['certificate-opt'].addEventListener('change', calculate);

  calculate();
})();
