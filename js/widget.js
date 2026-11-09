/* =============================================================================
   ЛР №11. Інтерактивний віджет «Планувальник навчання» (версія 3: єдине оформлення)
   -----------------------------------------------------------------------------
   Це крок 2 оформлення курсу. Модулі приходять з блоку «Модулі та вартість»
   (подія pm:modules з js/main.js) і синхронізуються в обидва боки.

   Тривалість = ⌈уроки обраних модулів ÷ уроків на тиждень⌉ тижнів.
   Вартість   = (ціна модулів + опції) × кількість учнів; від 2 учнів знижка 10 %;
                далі — персональний промокод.
   Кнопка «Залишити заявку» отримує весь план у data-lead-summary (вікно заявки в js/main.js).

   Захисне програмування (Defensive Programming), три рівні:
   1) HTML5: type="number", min, max, step="1", required;
   2) JavaScript: кожне значення перевіряється перед розрахунком (порожнє, нецілі,
      NaN, Infinity, нуль, від'ємні, поза діапазоном, невідомий модуль, невідомий промокод);
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

  /* Персональні знижки. На статичному сайті коди видно у вихідному коді —
     у продакшені їх треба перевіряти на сервері. Діють на суму після знижки за кількох учнів. */
  const PROMO_CODES = Object.freeze({
    START10: { type: 'percent', value: 10, description: '−10 % на навчання' },
    FRIEND15: { type: 'percent', value: 15, description: '−15 % за запрошенням друга' },
    DUO20: { type: 'percent', value: 20, minModules: 2, description: '−20 % при виборі від 2 модулів' },
    MINUS500: { type: 'fixed', value: 500, minSubtotal: 2000, description: '−500 ₴ при замовленні від 2 000 ₴' }
  });

  /* ---------- DOM: усі елементи перевіряються одразу ---------- */
  const ids = ['study-module', 'lessons-per-week', 'students-count', 'mentor-opt', 'certificate-opt',
    'total-weeks', 'total-price', 'total-old', 'summary-module', 'summary-options', 'summary-students',
    'summary-discount', 'discount-row', 'promo-row', 'summary-promo', 'summary-promo-code',
    'error-lessons', 'error-students', 'planner-error',
    'promo-form', 'promo-code', 'promo-apply', 'promo-remove', 'promo-message', 'plan-submit'];
  const el = {};
  const missing = ids.filter(function (id) {
    el[id] = document.getElementById(id);
    return !el[id];
  });
  const moduleBoxes = Array.prototype.slice.call(root.querySelectorAll('input[name="module"]'));
  if (missing.length || !moduleBoxes.length) {
    // Fail-Safe: віджет не запускається, але решта сторінки працює
    console.warn('[planner] Віджет вимкнено: на сторінці немає елементів ' + (missing.join(', ') || 'input[name="module"]'));
    return;
  }
  const errorFor = { 'lessons-per-week': el['error-lessons'], 'students-count': el['error-students'] };
  const state = { promo: null };

  /* ---------- Форматування ---------- */
  const formatUAH = function (value) {
    return value.toLocaleString('uk-UA') + ' ₴';
  };
  function plural(n, one, few, many) {
    const last = n % 10;
    const lastTwo = n % 100;
    if (last === 1 && lastTwo !== 11) return one;
    if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return few;
    return many;
  }
  function weeksLabel(n) {
    return n + ' ' + plural(n, 'тиждень', 'тижні', 'тижнів');
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

  /* Обрані модулі: лише відомі ключі (невідоме значення чекбокса ігнорується) */
  function readModules() {
    return moduleBoxes.filter(function (box) {
      return box.checked && Object.prototype.hasOwnProperty.call(MODULES, box.value);
    }).map(function (box) { return MODULES[box.value]; });
  }

  /* Промокод: { amount, reason } — reason пояснює, чому код поки не діє */
  function promoDiscount(promo, amount, count) {
    if (!promo) return { amount: 0, reason: '' };
    if (promo.minModules && count < promo.minModules) {
      return { amount: 0, reason: 'діє від ' + promo.minModules + ' модулів — додай ще один.' };
    }
    if (promo.minSubtotal && amount < promo.minSubtotal) {
      return { amount: 0, reason: 'діє від ' + formatUAH(promo.minSubtotal) + '.' };
    }
    const value = promo.type === 'percent' ? Math.round(amount * promo.value / 100) : Math.min(promo.value, amount);
    return { amount: value, reason: '' };
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

  function setPromoMessage(type, text) {
    if (type) el['promo-form'].dataset.state = type;
    else delete el['promo-form'].dataset.state;
    el['promo-message'].textContent = text;
  }

  function toggleRow(row, show) {
    row.classList.toggle('hidden', !show);
    row.classList.toggle('flex', show);
  }

  function setSubmit(rows) {
    const ok = rows.length > 0;
    el['plan-submit'].setAttribute('aria-disabled', String(!ok));
    if (ok) el['plan-submit'].removeAttribute('tabindex');
    else el['plan-submit'].setAttribute('tabindex', '-1');
    el['plan-submit'].dataset.leadSummary = JSON.stringify(rows);
  }

  /* ---------- Підсумок ---------- */
  function resetSummary() {
    ['total-weeks', 'total-price', 'summary-module', 'summary-options', 'summary-students'].forEach(function (id) {
      el[id].textContent = '—';
    });
    toggleRow(el['discount-row'], false);
    toggleRow(el['promo-row'], false);
    el['total-old'].hidden = true;
    setSubmit([]);
    sharePlan(null);
  }

  /* План для блоку «Твій курс» (js/main.js): там видно учнів, темп, опції й підсумкову суму */
  function sharePlan(detail) {
    document.dispatchEvent(new CustomEvent('pm:plan', { detail: detail }));
  }

  function render(r) {
    el['total-weeks'].textContent = weeksLabel(r.weeks);
    el['summary-module'].textContent = r.modules.map(function (m) { return m.title; }).join(', ');
    el['summary-options'].textContent = formatUAH(r.options);
    el['summary-students'].textContent = String(r.students);
    el['summary-discount'].textContent = '−' + formatUAH(r.discount);
    toggleRow(el['discount-row'], r.discount > 0);
    el['summary-promo'].textContent = '−' + formatUAH(r.promo);
    el['summary-promo-code'].textContent = state.promo || '';
    toggleRow(el['promo-row'], r.promo > 0);
    el['total-old'].textContent = formatUAH(r.subtotal);
    el['total-old'].hidden = r.total === r.subtotal;
    el['total-price'].textContent = formatUAH(r.total);

    const opts = [];
    if (el['mentor-opt'].checked) opts.push('наставник');
    if (el['certificate-opt'].checked) opts.push('сертифікат');
    const rows = [
      ['Модулі', el['summary-module'].textContent],
      ['Темп', r.perWeek + ' ' + plural(r.perWeek, 'урок', 'уроки', 'уроків') + ' на тиждень'],
      ['Учнів', String(r.students)],
      ['Опції', opts.length ? opts.join(', ') : 'без опцій'],
      ['Тривалість', weeksLabel(r.weeks)]
    ];
    if (r.promo > 0) rows.push(['Промокод', state.promo]);
    rows.push(['До сплати', formatUAH(r.total)]);
    setSubmit(rows);

    const extras = [];
    if (el['mentor-opt'].checked) extras.push({ title: 'Особистий наставник', price: MENTOR_PRICE });
    if (el['certificate-opt'].checked) extras.push({ title: 'Сертифікат', price: CERTIFICATE_PRICE });
    sharePlan({ students: r.students, perWeek: r.perWeek, weeks: r.weeks, extras: extras, total: r.total });
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

      const modules = readModules();
      setGeneralError(modules.length ? '' : 'Обери хоча б один модуль.');

      updateStepButtons();
      if (!lessons.ok || !students.ok || !modules.length) {
        resetSummary();
        return;
      }

      const totalLessons = modules.reduce(function (sum, m) { return sum + m.lessons; }, 0);
      const modulesPrice = modules.reduce(function (sum, m) { return sum + m.price; }, 0);
      const options = (el['mentor-opt'].checked ? MENTOR_PRICE : 0) + (el['certificate-opt'].checked ? CERTIFICATE_PRICE : 0);
      const weeks = Math.ceil(totalLessons / lessons.value);
      const subtotal = (modulesPrice + options) * students.value;
      const discount = students.value >= 2 ? Math.round(subtotal * FAMILY_DISCOUNT) : 0;
      const promoCode = state.promo ? PROMO_CODES[state.promo] : null;
      const promo = promoDiscount(promoCode, subtotal - discount, modules.length);
      const total = subtotal - discount - promo.amount;

      if (promoCode) {
        setPromoMessage(promo.amount > 0 ? 'success' : 'error', promo.amount > 0
          ? 'Промокод ' + state.promo + ' застосовано: ' + promoCode.description + '.'
          : 'Промокод ' + state.promo + ' ' + promo.reason);
      }

      // Останній запобіжник: на екран не потрапляє NaN, Infinity чи від'ємна сума
      if (![weeks, subtotal, discount, promo.amount, total].every(Number.isFinite) || total < 0) {
        resetSummary();
        setGeneralError('Не вдалося розрахувати план. Перевірте введені дані.');
        return;
      }
      render({
        modules: modules, options: options, students: students.value, perWeek: lessons.value,
        weeks: weeks, subtotal: subtotal, discount: discount, promo: promo.amount, total: total
      });
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

  // Модулі: зміна тут → картки в «Модулі та вартість»; зміна там → чекбокси тут
  moduleBoxes.forEach(function (box) {
    box.addEventListener('change', function () {
      document.dispatchEvent(new CustomEvent('pm:set-module', { detail: { key: box.value, selected: box.checked } }));
      calculate();
    });
  });
  function applyKeys(keys) {
    moduleBoxes.forEach(function (box) { box.checked = keys.indexOf(box.value) !== -1; });
    calculate();
  }
  document.addEventListener('pm:modules', function (event) {
    if (event.detail && Array.isArray(event.detail.keys)) applyKeys(event.detail.keys);
  });
  // Початковий стан — з карток (js/main.js завантажується раніше й першу подію вже надіслав)
  const preselected = Array.prototype.map.call(document.querySelectorAll('[data-module][data-selected="true"]'), function (card) {
    return card.dataset.key;
  });
  if (document.querySelector('[data-module][data-key]')) applyKeys(preselected);

  el['lessons-per-week'].addEventListener('input', calculate);
  el['students-count'].addEventListener('input', calculate);
  el['mentor-opt'].addEventListener('change', calculate);
  el['certificate-opt'].addEventListener('change', calculate);

  /* ---------- Промокод ---------- */
  function lockPromo(isLocked) {
    el['promo-code'].readOnly = isLocked;
    el['promo-apply'].hidden = isLocked;
    el['promo-remove'].hidden = !isLocked;
  }

  el['promo-form'].addEventListener('submit', function (event) {
    event.preventDefault();
    const code = el['promo-code'].value.trim().toUpperCase();
    if (!code) {
      setPromoMessage('error', 'Введи промокод.');
      el['promo-code'].focus();
      return;
    }
    if (!Object.prototype.hasOwnProperty.call(PROMO_CODES, code)) {
      setPromoMessage('error', 'Промокод «' + code + '» не знайдено. Перевір написання.');
      el['promo-code'].select();
      return;
    }
    state.promo = code;
    el['promo-code'].value = code;
    lockPromo(true);
    calculate();
    el['promo-remove'].focus();
  });

  el['promo-remove'].addEventListener('click', function () {
    state.promo = null;
    el['promo-code'].value = '';
    lockPromo(false);
    setPromoMessage(null, '');
    calculate();
    el['promo-code'].focus();
  });

  el['promo-code'].addEventListener('input', function () {
    if (!state.promo) setPromoMessage(null, '');
  });

  calculate();
})();
