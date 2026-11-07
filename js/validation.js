/* =============================================================================
   ЛР №9. Клієнтська валідація форми зворотного зв'язку (#feedbackForm)
   -----------------------------------------------------------------------------
   1. Регулярні вирази та налаштування
   2. Перевірки-«правила» (чисті функції: значення → текст помилки або '')
   3. Керування UI-станами поля: showError / showSuccess / clearError
   4. Функції валідації полів: validateName … validateAgreement
   5. Динамічна валідація: input / blur
   6. Submit: preventDefault, перевірка всіх полів, модальне вікно, reset
   Без сторонніх бібліотек. Правила також доступні як window.PMValidation —
   їх використовує модальне вікно заявки в main.js, щоб на сайті були одні правила.
   ========================================================================== */

/* ---------- 1. Регулярні вирази та налаштування ---------- */

// Ім'я: латиниця або кирилиця (включно з ґ, є, і, ї), апостроф, дефіс і пробіл між частинами.
// ^ і $ — збіг з усім рядком, а не з його частиною.
const REGEX_NAME = /^[A-Za-zА-Яа-яҐЄІЇґєії]+(?:['’ʼ\- ][A-Za-zА-Яа-яҐЄІЇґєії]+)*$/;

// Email: локальна частина @ домен . зона з 2+ літер.
// \. — саме крапка (без \ крапка означала б «будь-який символ»), + — «один або більше».
const REGEX_EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

// Телефон: строго +380 і рівно 9 цифр, без пробілів, дужок і дефісів.
const REGEX_PHONE = /^\+380\d{9}$/;

// Telegram-нікнейм (для форми заявки в модальному вікні): @ і 5–32 символи.
const REGEX_TELEGRAM = /^@[A-Za-z0-9_]{5,32}$/;

const LIMITS = {
  nameMin: 2,
  nameMax: 50,
  messageMin: 10,
  messageMax: 1000
};

/* ---------- 2. Перевірки (правила) ----------
   Кожна приймає значення і повертає текст помилки або порожній рядок. */

// Прибирає зайві пробіли: «  Ірина   Марія » → «Ірина Марія»
function normalizeSpaces(value) {
  return value.trim().replace(/\s+/g, ' ');
}

// Безпечна UX-підказка для телефону: прибрати пробіли, дужки, дефіси
// і привести 0XXXXXXXXX або 380XXXXXXXXX до +380XXXXXXXXX. Інші випадки не чіпаємо.
function normalizePhone(value) {
  const compact = value.trim().replace(/[\s()\-.]/g, '');
  if (/^0\d{9}$/.test(compact)) return '+38' + compact;
  if (/^380\d{9}$/.test(compact)) return '+' + compact;
  return compact;
}

const rules = {
  name(value) {
    const v = normalizeSpaces(value);
    if (!v) return 'Вкажи, як до тебе звертатися.';
    if (v.length < LIMITS.nameMin) return "Ім'я має містити щонайменше 2 літери.";
    if (v.length > LIMITS.nameMax) return "Ім'я задовге — до 50 символів.";
    if (!REGEX_NAME.test(v)) return 'Використовуй лише літери, апостроф або дефіс.';
    return '';
  },

  email(value) {
    const v = value.trim();
    if (!v) return 'Вкажи email, щоб ми могли відповісти.';
    if (!v.includes('@')) return 'В адресі бракує символу @.';
    if (/[А-Яа-яҐЄІЇґєії]/.test(v)) return 'Email пишеться латиницею, наприклад name@example.com.';
    if (/\s/.test(v)) return 'Email не може містити пробілів.';
    if (v.includes('..') || !REGEX_EMAIL.test(v)) return 'Перевір формат: name@example.com.';
    return '';
  },

  phone(value) {
    const v = value.trim();
    if (!v) return 'Вкажи номер телефону.';
    if (/[^\d+\s()\-.]/.test(v)) return 'Номер може містити лише цифри після +380.';
    if (!REGEX_PHONE.test(v)) return 'Потрібен формат +380 і ще 9 цифр, наприклад +380501234567.';
    return '';
  },

  message(value) {
    const v = value.trim();
    if (!v) return 'Напиши кілька слів про своє питання.';
    if (v.length < LIMITS.messageMin) return 'Повідомлення закоротке — ще ' + (LIMITS.messageMin - v.length) + ' симв. щонайменше.';
    if (v.length > LIMITS.messageMax) return 'Повідомлення задовге — до 1000 символів.';
    return '';
  },

  agreement(checked) {
    return checked ? '' : 'Без згоди на обробку даних ми не зможемо відповісти.';
  },

  // Для модального вікна заявки: Telegram-нікнейм або телефон
  contact(value) {
    const v = value.trim();
    if (!v) return 'Вкажи нікнейм у Telegram або номер телефону.';
    if (v.startsWith('@')) return REGEX_TELEGRAM.test(v) ? '' : 'Нікнейм: @ і 5–32 латинські літери, цифри або _.';
    return REGEX_PHONE.test(normalizePhone(v)) ? '' : 'Телефон у форматі +380XXXXXXXXX або нікнейм @nickname.';
  }
};

// Спільний доступ для main.js (модальне вікно заявки) і для перевірки в консолі DevTools
window.PMValidation = { rules: rules, normalizePhone: normalizePhone, normalizeSpaces: normalizeSpaces, REGEX_PHONE: REGEX_PHONE, REGEX_EMAIL: REGEX_EMAIL, REGEX_NAME: REGEX_NAME };

(function () {
  const form = document.getElementById('feedbackForm');
  if (!form) return;

  const fields = {
    username: form.elements.username,
    email: form.elements.email,
    phone: form.elements.phone,
    message: form.elements.message,
    agreement: form.elements.agreement
  };
  const submitBtn = form.querySelector('[data-feedback-submit]');
  const submitLabel = form.querySelector('[data-submit-label]');
  const status = form.querySelector('[data-form-status]');
  const counter = form.querySelector('[data-counter]');
  const phoneHint = document.getElementById('phoneHint');

  // Поля, з якими користувач уже взаємодіяв (залишив після введення) — лише їм показуємо помилки
  const touched = new Set();
  let isSubmitting = false;

  /* ---------- 3. UI-стани поля ----------
     Класи міняються наборами, щоб не було конфлікту кольорів рамки й focus ring. */
  const STATE_CLASSES = {
    normal: ['border-brand-200', 'focus:border-brand', 'focus:ring-brand/15'],
    error: ['border-red-500', 'bg-red-50', 'focus:border-red-500', 'focus:ring-red-500/20'],
    success: ['border-green-500', 'focus:border-green-600', 'focus:ring-green-500/20']
  };
  const ALL_STATE_CLASSES = [].concat(STATE_CLASSES.normal, STATE_CLASSES.error, STATE_CLASSES.success);

  function errorEl(field) {
    return document.getElementById(field.id + 'Error');
  }

  function setIcons(field, state) {
    const box = field.parentElement;
    const ok = box.querySelector('[data-icon="success"]');
    const bad = box.querySelector('[data-icon="error"]');
    if (ok) ok.classList.toggle('hidden', state !== 'success');
    if (bad) bad.classList.toggle('hidden', state !== 'error');
  }

  function setState(field, state) {
    if (field.type !== 'checkbox') {
      field.classList.remove.apply(field.classList, ALL_STATE_CLASSES);
      field.classList.add.apply(field.classList, STATE_CLASSES[state]);
      setIcons(field, state);
    }
    field.dataset.state = state;
  }

  // Помилка: червона рамка, іконка, текст під полем, aria-invalid="true"
  function showError(field, message) {
    setState(field, 'error');
    field.setAttribute('aria-invalid', 'true');
    const el = errorEl(field);
    el.textContent = message; // textContent, а не innerHTML — введений користувачем текст ніколи не стає HTML
    el.classList.remove('hidden');
  }

  // Успіх: зелена рамка та галочка, aria-invalid="false"
  function showSuccess(field) {
    setState(field, field.type === 'checkbox' ? 'normal' : 'success');
    field.setAttribute('aria-invalid', 'false');
    clearErrorText(field);
  }

  // Нейтральний стан (поле ще не заповнювали або форму очищено)
  function clearError(field) {
    setState(field, 'normal');
    field.setAttribute('aria-invalid', 'false');
    clearErrorText(field);
  }

  function clearErrorText(field) {
    const el = errorEl(field);
    el.textContent = ''; // порожній текст — скрінрідер не читає стару помилку через aria-describedby
    el.classList.add('hidden');
  }

  /* ---------- 4. Валідація окремих полів ----------
     Повертають true/false і самі оновлюють UI. */
  function applyRule(field, message) {
    if (message) {
      showError(field, message);
      return false;
    }
    showSuccess(field);
    return true;
  }

  function validateName() {
    return applyRule(fields.username, rules.name(fields.username.value));
  }

  function validateEmail() {
    return applyRule(fields.email, rules.email(fields.email.value));
  }

  function validatePhone() {
    return applyRule(fields.phone, rules.phone(fields.phone.value));
  }

  function validateMessage() {
    return applyRule(fields.message, rules.message(fields.message.value));
  }

  function validateAgreement() {
    return applyRule(fields.agreement, rules.agreement(fields.agreement.checked));
  }

  const validators = {
    username: validateName,
    email: validateEmail,
    phone: validatePhone,
    message: validateMessage,
    agreement: validateAgreement
  };

  /* ---------- Edge cases телефону ----------
     Користувач вставив «050 123 45 67», «(050) 123-45-67» або «380501234567» — приводимо до +380…
     лише коли результат точно валідний, і пояснюємо зміну в підказці. Інакше нічого не міняємо
     й показуємо помилку, щоб людина бачила, що саме не так. */
  function tidyPhone() {
    const raw = fields.phone.value;
    const fixed = normalizePhone(raw);
    if (fixed !== raw.trim() && REGEX_PHONE.test(fixed)) {
      fields.phone.value = fixed;
      phoneHint.textContent = 'Номер приведено до формату +380XXXXXXXXX';
    } else if (!raw) {
      phoneHint.textContent = phoneHint.dataset.default;
    }
  }

  function updateCounter() {
    const length = fields.message.value.length;
    counter.textContent = length + ' / ' + LIMITS.messageMax;
    counter.classList.toggle('text-red-600', length > LIMITS.messageMax);
  }

  /* ---------- 5. Динамічна валідація ----------
     Відкрили форму — помилок немає.
     Вводимо — поле стає зеленим, щойно значення правильне; якщо помилку вже показано, вона оновлюється.
     Залишили поле (blur) — фінальна перевірка цього поля. */
  Object.keys(validators).forEach(function (key) {
    const field = fields[key];
    const validate = validators[key];
    const eventName = field.type === 'checkbox' ? 'change' : 'input';

    field.addEventListener(eventName, function () {
      if (key === 'message') updateCounter();
      if (key === 'phone' && phoneHint.textContent !== phoneHint.dataset.default) phoneHint.textContent = phoneHint.dataset.default;

      if (field.type === 'checkbox') {
        touched.add(key);
        validate();
        return;
      }

      const message = key === 'username' ? rules.name(field.value) : rules[key](field.value);
      if (!message) {
        showSuccess(field);
      } else if (touched.has(key) || field.dataset.state === 'error') {
        showError(field, message);
      } else {
        clearError(field);
      }
    });

    if (field.type !== 'checkbox') {
      field.addEventListener('blur', function () {
        // Просто пройшли Tab-ом через порожнє поле — не лякаємо помилкою
        if (!field.value && !touched.has(key)) return;
        if (key === 'phone') tidyPhone();
        if (key === 'username') field.value = normalizeSpaces(field.value);
        touched.add(key);
        validate();
      });
    }
  });

  /* ---------- 6. Надсилання ---------- */
  const modal = document.querySelector('[data-feedback-modal]');
  const modalName = modal ? modal.querySelector('[data-feedback-name]') : null;

  function resetForm() {
    form.reset();
    touched.clear();
    Object.keys(fields).forEach(function (key) {
      clearError(fields[key]);
    });
    phoneHint.textContent = phoneHint.dataset.default;
    updateCounter();
    status.textContent = '';
  }

  function openModal(name) {
    if (!modal || typeof modal.showModal !== 'function') {
      window.alert('Форма успішно пройшла клієнтську валідацію. Демонстрація надсилання.');
      return;
    }
    modalName.textContent = name ? ', ' + name : '';
    modal.showModal();
    modal.querySelector('[data-feedback-close]').focus();
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault(); // без цього браузер перезавантажив би сторінку і дані зникли б
    if (isSubmitting) return; // захист від швидкого повторного натискання

    tidyPhone();
    fields.username.value = normalizeSpaces(fields.username.value);

    const keys = Object.keys(validators);
    const invalid = keys.filter(function (key) {
      touched.add(key);
      return !validators[key]();
    });

    if (invalid.length) {
      status.textContent = 'Форму не надіслано: перевір поля з помилками (' + invalid.length + ').';
      fields[invalid[0]].focus();
      return;
    }

    // Усі поля валідні: імітуємо коротке надсилання, очищаємо форму і показуємо модальне вікно
    isSubmitting = true;
    submitBtn.disabled = true;
    submitBtn.setAttribute('aria-busy', 'true');
    submitLabel.textContent = 'Надсилаємо…';
    const name = fields.username.value.split(' ')[0];

    window.setTimeout(function () {
      resetForm();
      isSubmitting = false;
      submitBtn.disabled = false;
      submitBtn.removeAttribute('aria-busy');
      submitLabel.textContent = 'Надіслати';
      openModal(name);
    }, 600);
  });

  /* ---------- Модальне вікно ---------- */
  if (modal) {
    modal.querySelector('[data-feedback-close]').addEventListener('click', function () {
      modal.close();
    });

    // Клік по затемненню (ціль — сам <dialog>) закриває; клік по картці (ціль — її вміст) — ні
    modal.addEventListener('click', function (event) {
      if (event.target === modal) modal.close();
    });

    // Esc закриває <dialog> нативно; після закриття фокус повертається у форму
    modal.addEventListener('close', function () {
      fields.username.focus();
    });
  }

  updateCounter();
})();
