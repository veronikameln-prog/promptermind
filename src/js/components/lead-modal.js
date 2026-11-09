/* Вікно заявки (<dialog data-lead-modal>).
   Кнопки з data-lead="trial|consult|project|order" відкривають його замість переходу до #contact.
   data-lead-module / data-lead-project підставляють вибір у форму; data-lead="order" показує
   весь план навчання — його беремо прямо зі стору курсу.
   На статичному сайті заявка нікуди не надсилається — у продакшені тут буде fetch на сервер. */

import { qs, qsa, cloneTemplate } from '../core/dom.js';
import { rules, normalizePhone } from '../domain/validation.js';
import { selectPlan } from '../store/course-store.js';
import { orderSummaryRows } from '../domain/plan-summary.js';

const COPY = Object.freeze({
  trial: { badge: 'Безкоштовно', title: 'Запис на пробний урок', text: 'Наставник напише протягом робочого дня й підбере зручний час.' },
  consult: { badge: 'Консультація', title: 'Поставити питання наставнику', text: 'Розкажи, що цікавить, — наставник відповість і допоможе обрати модуль.' },
  project: { badge: 'Проєкт', title: 'Хочу такий проєкт', text: 'Почнемо з безкоштовного пробного уроку в модулі, де створюють цей проєкт.' },
  order: { badge: 'Заявка на курс', title: 'Оформлення курсу', text: 'Перевір свій вибір — наставник підтвердить розклад і надішле реквізити.' }
});

export function initLeadModal() {
  const modal = qs('[data-lead-modal]');
  if (!modal || typeof modal.showModal !== 'function') return;

  const form = qs('[data-lead-form]', modal);
  const el = {
    badge: qs('[data-lead-badge]', modal),
    title: qs('[data-lead-title]', modal),
    text: qs('[data-lead-text]', modal),
    summary: qs('[data-lead-summary]', modal),
    rowTemplate: qs('[data-lead-row-template]', modal),
    fields: qs('[data-lead-fields]', modal),
    moduleField: qs('[data-lead-module-field]', modal),
    success: qs('[data-lead-success]', modal),
    error: qs('[data-lead-error]', modal),
    name: form.elements.name,
    contact: form.elements.contact,
    module: form.elements.module,
    consent: form.elements.consent
  };

  let opener = null;

  function renderSummary(rows) {
    el.summary.replaceChildren(...rows.map(([label, value]) => {
      const line = cloneTemplate(el.rowTemplate);
      qs('[data-row-label]', line).textContent = label;
      qs('[data-row-value]', line).textContent = value;
      return line;
    }));
    el.summary.hidden = rows.length === 0;
  }

  function selectModule(title) {
    const option = Array.from(el.module.options).find((o) => o.text === title);
    el.module.selectedIndex = option ? option.index : 0;
  }

  /** Що показати у вікні для конкретної кнопки */
  function contentFor(trigger) {
    const type = COPY[trigger.dataset.lead] ? trigger.dataset.lead : 'trial';
    if (type === 'project') {
      return { type, rows: [['Проєкт', trigger.dataset.leadProject], ['Модуль', trigger.dataset.leadModule]], module: trigger.dataset.leadModule };
    }
    if (type === 'order') return { type, rows: orderSummaryRows(selectPlan()), module: '' };
    return { type, rows: [], module: '' };
  }

  function open(trigger) {
    const content = contentFor(trigger);
    const copy = COPY[content.type];
    el.badge.textContent = copy.badge;
    el.title.textContent = copy.title;
    el.text.textContent = copy.text;

    renderSummary(content.rows);
    selectModule(content.module);
    el.moduleField.hidden = content.type === 'order'; // модулі вже обрано в плані

    el.fields.hidden = false;
    el.success.hidden = true;
    el.error.textContent = '';
    opener = trigger;
    modal.showModal();
    el.name.focus();
  }

  function fail(field, message) {
    el.error.textContent = message;
    field.setAttribute('aria-invalid', 'true');
    field.focus();
  }

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-lead]');
    if (!trigger || trigger.getAttribute('aria-disabled') === 'true') return;
    event.preventDefault();
    open(trigger);
  });

  qsa('[data-lead-close]', modal).forEach((btn) => btn.addEventListener('click', () => modal.close()));

  // Клік по затемненню поза вікном теж закриває
  modal.addEventListener('click', (event) => {
    if (event.target === modal) modal.close();
  });

  modal.addEventListener('close', () => {
    if (opener) opener.focus();
  });

  [el.name, el.contact].forEach((input) => {
    input.addEventListener('input', () => {
      input.removeAttribute('aria-invalid');
      el.error.textContent = '';
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    // Ті самі правила, що й у формі зворотного зв'язку (domain/validation.js)
    const nameError = rules.name(el.name.value);
    if (nameError) return fail(el.name, nameError);
    const contactError = rules.contact(el.contact.value);
    if (contactError) return fail(el.contact, contactError);
    if (!el.contact.value.trim().startsWith('@')) el.contact.value = normalizePhone(el.contact.value);
    el.name.removeAttribute('aria-invalid');
    el.contact.removeAttribute('aria-invalid');
    const consentError = rules.consent(el.consent.checked);
    if (consentError) return fail(el.consent, consentError);

    el.fields.hidden = true;
    el.summary.hidden = true;
    el.success.hidden = false;
    form.reset();
    qs('[data-lead-close]', el.success).focus();
  });
}
