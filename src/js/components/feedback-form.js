/* Форма зворотного зв'язку (#feedbackForm): клієнтська валідація без сторонніх бібліотек.
   Правила — у domain/validation.js (чисті функції). Тут лише поведінка:
   - відкрили форму — помилок немає;
   - вводимо — поле стає «успішним», щойно значення правильне; показану помилку оновлюємо;
   - залишили поле (blur) — фінальна перевірка цього поля;
   - submit — перевірка всіх полів, імітація надсилання, модальне вікно, очищення.
   Вигляд станів поля (рамка, іконка) — у CSS за атрибутом data-state="normal|error|success". */

import { qs } from '../core/dom.js';
import { rules, normalizeSpaces, autoFixPhone, LIMITS } from '../domain/validation.js';

const SUBMIT_DELAY = 600; // мс — імітація запиту

export function initFeedbackForm() {
  const form = document.getElementById('feedbackForm');
  if (!form) return;

  const fields = {
    username: form.elements.username,
    email: form.elements.email,
    phone: form.elements.phone,
    message: form.elements.message,
    agreement: form.elements.agreement
  };
  // Яке правило перевіряє яке поле
  const check = {
    username: () => rules.name(fields.username.value),
    email: () => rules.email(fields.email.value),
    phone: () => rules.phone(fields.phone.value),
    message: () => rules.message(fields.message.value),
    agreement: () => rules.agreement(fields.agreement.checked)
  };
  const keys = Object.keys(check);

  const submitBtn = qs('[data-feedback-submit]', form);
  const submitLabel = qs('[data-submit-label]', form);
  const status = qs('[data-form-status]', form);
  const counter = qs('[data-char-counter]', form);
  const phoneHint = document.getElementById('phoneHint');
  const modal = qs('[data-feedback-modal]');

  // Поля, з якими користувач уже взаємодіяв — лише їм показуємо помилки
  const touched = new Set();
  let isSubmitting = false;

  /* ---------- Стани поля ---------- */
  const errorEl = (field) => document.getElementById(field.id + 'Error');

  function setState(field, state, message = '') {
    field.dataset.state = field.type === 'checkbox' && state === 'success' ? 'normal' : state;
    field.setAttribute('aria-invalid', String(state === 'error'));
    const error = errorEl(field);
    error.textContent = message; // textContent — введений текст ніколи не стає HTML; порожньо — скрінрідер не читає стару помилку
    error.hidden = !message;
  }

  /** Перевіряє поле й оновлює його стан; повертає true, якщо поле валідне */
  function validate(key) {
    const message = check[key]();
    setState(fields[key], message ? 'error' : 'success', message);
    return !message;
  }

  /* ---------- Edge cases телефону ----------
     «050 123 45 67», «(050) 123-45-67», «380501234567» → +380…, лише коли результат точно валідний;
     зміну пояснюємо в підказці. Інакше нічого не міняємо — людина бачить, що саме не так. */
  function tidyPhone() {
    const fixed = autoFixPhone(fields.phone.value);
    if (fixed) {
      fields.phone.value = fixed;
      phoneHint.textContent = 'Номер приведено до формату +380XXXXXXXXX';
    } else if (!fields.phone.value) {
      phoneHint.textContent = phoneHint.dataset.default;
    }
  }

  function updateCounter() {
    const length = fields.message.value.length;
    counter.textContent = length + ' / ' + LIMITS.messageMax;
    counter.dataset.over = String(length > LIMITS.messageMax);
  }

  /* ---------- Динамічна валідація ---------- */
  keys.forEach((key) => {
    const field = fields[key];
    const isCheckbox = field.type === 'checkbox';

    field.addEventListener(isCheckbox ? 'change' : 'input', () => {
      if (key === 'message') updateCounter();
      if (key === 'phone') phoneHint.textContent = phoneHint.dataset.default;

      if (isCheckbox) {
        touched.add(key);
        validate(key);
        return;
      }

      const message = check[key]();
      if (!message) setState(field, 'success');
      else if (touched.has(key) || field.dataset.state === 'error') setState(field, 'error', message);
      else setState(field, 'normal');
    });

    if (!isCheckbox) {
      field.addEventListener('blur', () => {
        // Просто пройшли Tab-ом через порожнє поле — не лякаємо помилкою
        if (!field.value && !touched.has(key)) return;
        if (key === 'phone') tidyPhone();
        if (key === 'username') field.value = normalizeSpaces(field.value);
        touched.add(key);
        validate(key);
      });
    }
  });

  /* ---------- Надсилання ---------- */
  function resetForm() {
    form.reset();
    touched.clear();
    keys.forEach((key) => setState(fields[key], 'normal'));
    phoneHint.textContent = phoneHint.dataset.default;
    updateCounter();
    status.textContent = '';
  }

  function setSubmitting(busy) {
    isSubmitting = busy;
    submitBtn.disabled = busy;
    if (busy) submitBtn.setAttribute('aria-busy', 'true');
    else submitBtn.removeAttribute('aria-busy');
    submitLabel.textContent = busy ? 'Надсилаємо…' : 'Надіслати';
  }

  function openThanks(name) {
    if (!modal || typeof modal.showModal !== 'function') {
      window.alert('Форма успішно пройшла клієнтську валідацію. Демонстрація надсилання.');
      return;
    }
    qs('[data-feedback-name]', modal).textContent = name ? ', ' + name : '';
    modal.showModal();
    qs('[data-feedback-close]', modal).focus();
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault(); // без цього браузер перезавантажив би сторінку і дані зникли б
    if (isSubmitting) return; // захист від швидкого повторного натискання

    tidyPhone();
    fields.username.value = normalizeSpaces(fields.username.value);

    const invalid = keys.filter((key) => {
      touched.add(key);
      return !validate(key);
    });

    if (invalid.length) {
      status.textContent = 'Форму не надіслано: перевір поля з помилками (' + invalid.length + ').';
      fields[invalid[0]].focus();
      return;
    }

    // Усі поля валідні: імітуємо коротке надсилання, очищаємо форму і показуємо подяку
    setSubmitting(true);
    const name = fields.username.value.split(' ')[0];
    window.setTimeout(() => {
      resetForm();
      setSubmitting(false);
      openThanks(name);
    }, SUBMIT_DELAY);
  });

  /* ---------- Вікно подяки ---------- */
  if (modal) {
    qs('[data-feedback-close]', modal).addEventListener('click', () => modal.close());
    // Клік по затемненню (ціль — сам <dialog>) закриває; клік по картці — ні
    modal.addEventListener('click', (event) => {
      if (event.target === modal) modal.close();
    });
    // Esc закриває <dialog> нативно; після закриття фокус повертається у форму
    modal.addEventListener('close', () => fields.username.focus());
  }

  updateCounter();
}
