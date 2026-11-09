/* Правила валідації форм — чисті функції: значення → текст помилки або '' (порожньо = валідно).
   Спільні для форми зворотного зв'язку і вікна заявки, тож на сайті одні правила. */

// Ім'я: латиниця або кирилиця (включно з ґ, є, і, ї), апостроф, дефіс і пробіл між частинами.
// ^ і $ — збіг з усім рядком, а не з його частиною.
export const REGEX_NAME = /^[A-Za-zА-Яа-яҐЄІЇґєії]+(?:['’ʼ\- ][A-Za-zА-Яа-яҐЄІЇґєії]+)*$/;

// Email: локальна частина @ домен . зона з 2+ літер.
// \. — саме крапка (без \ крапка означала б «будь-який символ»), + — «один або більше».
export const REGEX_EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

// Телефон: строго +380 і рівно 9 цифр, без пробілів, дужок і дефісів.
export const REGEX_PHONE = /^\+380\d{9}$/;

// Telegram-нікнейм (для форми заявки в модальному вікні): @ і 5–32 символи.
export const REGEX_TELEGRAM = /^@[A-Za-z0-9_]{5,32}$/;

export const LIMITS = Object.freeze({
  nameMin: 2,
  nameMax: 50,
  messageMin: 10,
  messageMax: 1000
});

/** Прибирає зайві пробіли: «  Ірина   Марія » → «Ірина Марія» */
export function normalizeSpaces(value) {
  return value.trim().replace(/\s+/g, ' ');
}

/** Безпечна UX-підказка для телефону: прибрати пробіли, дужки, дефіси
 *  і привести 0XXXXXXXXX або 380XXXXXXXXX до +380XXXXXXXXX. Інші випадки не чіпаємо. */
export function normalizePhone(value) {
  const compact = value.trim().replace(/[\s()\-.]/g, '');
  if (/^0\d{9}$/.test(compact)) return '+38' + compact;
  if (/^380\d{9}$/.test(compact)) return '+' + compact;
  return compact;
}

export const rules = Object.freeze({
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

  consent(checked) {
    return checked ? '' : 'Потрібна згода на обробку контактних даних.';
  },

  // Для вікна заявки: Telegram-нікнейм або телефон
  contact(value) {
    const v = value.trim();
    if (!v) return 'Вкажи нікнейм у Telegram або номер телефону.';
    if (v.startsWith('@')) return REGEX_TELEGRAM.test(v) ? '' : 'Нікнейм: @ і 5–32 латинські літери, цифри або _.';
    return REGEX_PHONE.test(normalizePhone(v)) ? '' : 'Телефон у форматі +380XXXXXXXXX або нікнейм @nickname.';
  }
});

/** Телефон, який можна безпечно виправити автоматично: повертає +380… або null */
export function autoFixPhone(raw) {
  const fixed = normalizePhone(raw);
  return fixed !== raw.trim() && REGEX_PHONE.test(fixed) ? fixed : null;
}
