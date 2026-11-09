/* Розрахунок плану навчання — чисті функції (вхід → результат), без DOM і без побічних ефектів.

   Тривалість = ⌈уроки обраних модулів ÷ уроків на тиждень⌉ тижнів.
   Вартість   = (ціна модулів + опції) × кількість учнів; від 2 учнів знижка 10 %;
                далі — персональний промокод.

   Захисне програмування: кожне значення перевіряється перед розрахунком (порожнє, нецілі,
   NaN, Infinity, нуль, від'ємні, поза діапазоном, невідомий модуль, невідомий промокод),
   тож на екран ніколи не потрапляє NaN чи від'ємна сума. */

import { MODULES, EXTRAS, EXTRA_KEYS, FAMILY_DISCOUNT, LIMITS, PROMO_CODES, isModuleKey } from './catalog.js';
import { formatUAH } from '../utils/format.js';

/** Ціле число з поля-лічильника.
 *  @param {{ raw: string, badInput: boolean }} field — текст поля і чи ввів користувач нечислові символи
 *  @returns {{ ok: true, value: number } | { ok: false, message: string }} */
export function parseCount(field, limit) {
  const range = 'від ' + limit.min + ' до ' + limit.max;
  const raw = String(field.raw).trim();

  if (field.badInput) return { ok: false, message: 'Введіть число ' + range + '.' }; // літери в type="number"
  if (raw === '') return { ok: false, message: 'Поле не може бути порожнім. Введіть ' + limit.what + ' ' + range + '.' };
  if (!/^-?\d+$/.test(raw)) return { ok: false, message: 'Введіть ціле число ' + range + '.' }; // 2.5, 1e1, 3,0

  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < limit.min || value > limit.max) {
    return { ok: false, message: 'Введіть ' + limit.what + ' ' + range + '.' }; // 0, −5, 9999999999999999
  }
  return { ok: true, value };
}

/** Наступне значення лічильника для кнопок −/+.
 *  Ціле число (навіть поза межами) → ±1 і обмеження діапазоном; порожнє чи дробове → мінімум. */
export function stepCount(raw, step, limit) {
  const text = String(raw).trim();
  const next = /^-?\d+$/.test(text) ? Number(text) + step : limit.min;
  return Math.min(limit.max, Math.max(limit.min, next));
}

/** Знижка за промокодом: { amount, reason } — reason пояснює, чому код поки не діє */
export function promoDiscount(promo, amount, modulesCount) {
  if (!promo) return { amount: 0, reason: '' };
  if (promo.minModules && modulesCount < promo.minModules) {
    return { amount: 0, reason: 'діє від ' + promo.minModules + ' модулів — додай ще один.' };
  }
  if (promo.minSubtotal && amount < promo.minSubtotal) {
    return { amount: 0, reason: 'діє від ' + formatUAH(promo.minSubtotal) + '.' };
  }
  const value = promo.type === 'percent' ? Math.round(amount * promo.value / 100) : Math.min(promo.value, amount);
  return { amount: value, reason: '' };
}

/** Обрані модулі як об'єкти каталогу (невідомі ключі ігноруються) */
export const selectedModules = (keys) => keys.filter(isModuleKey).map((key) => MODULES[key]);

/** Повний розрахунок плану зі стану кошика (див. src/js/store/course-store.js).
 *  Повертає { valid: false, errors } або { valid: true, …усі суми }. */
export function calculatePlan(state) {
  const modules = selectedModules(state.modules);
  const lessons = parseCount(state.lessonsPerWeek, LIMITS.lessonsPerWeek);
  const students = parseCount(state.students, LIMITS.students);
  const errors = {
    lessonsPerWeek: lessons.ok ? '' : lessons.message,
    students: students.ok ? '' : students.message,
    general: modules.length ? '' : 'Обери хоча б один модуль.'
  };

  if (!lessons.ok || !students.ok || !modules.length) return { valid: false, modules, errors };

  const extras = EXTRA_KEYS.filter((key) => state.extras[key]).map((key) => EXTRAS[key]);
  const totalLessons = modules.reduce((sum, m) => sum + m.lessons, 0);
  const modulesPrice = modules.reduce((sum, m) => sum + m.price, 0);
  const optionsPrice = extras.reduce((sum, x) => sum + x.price, 0);
  const weeks = Math.ceil(totalLessons / lessons.value);
  const subtotal = (modulesPrice + optionsPrice) * students.value;
  const discount = students.value >= FAMILY_DISCOUNT.minStudents ? Math.round(subtotal * FAMILY_DISCOUNT.rate) : 0;
  const promoDef = state.promoCode ? PROMO_CODES[state.promoCode] : null;
  const promo = promoDiscount(promoDef, subtotal - discount, modules.length);
  const total = subtotal - discount - promo.amount;

  // Останній запобіжник: жодних NaN, Infinity чи від'ємної суми
  if (![weeks, subtotal, discount, promo.amount, total].every(Number.isFinite) || total < 0) {
    return { valid: false, modules, errors: { ...errors, general: 'Не вдалося розрахувати план. Перевірте введені дані.' } };
  }

  return {
    valid: true,
    errors,
    modules,
    extras,
    perWeek: lessons.value,
    students: students.value,
    totalLessons,
    modulesPrice,
    optionsPrice,
    weeks,
    subtotal,
    discount,
    promo: {
      code: state.promoCode,
      amount: promo.amount,
      reason: promo.reason,
      description: promoDef ? promoDef.description : ''
    },
    total
  };
}
