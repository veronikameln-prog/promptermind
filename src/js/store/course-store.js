/* Стан «кошика» курсу — єдине джерело правди для трьох частин сторінки:
   - картки «Модулі та вартість» і підсумок «Твій курс» (components/module-picker.js);
   - «Планувальник навчання» (components/planner.js);
   - вікно заявки «Оформлення курсу» (components/lead-modal.js).
   Раніше ці частини синхронізувались ланцюжком подій pm:modules → pm:plan → pm:set-module;
   тепер кожна лише викликає дії (actions) і підписується на зміни стану.

   У стані — лише «сирі» дані, які ввів користувач. Усе похідне (суми, тижні, помилки)
   рахує selectPlan() через чисті функції з domain/pricing.js. */

import { createStore } from '../core/store.js';
import { MODULE_KEYS, isModuleKey, EXTRAS, isPromoCode } from '../domain/catalog.js';
import { calculatePlan } from '../domain/pricing.js';

const initialState = {
  modules: ['start'], // ключі обраних модулів у порядку каталогу
  lessonsPerWeek: { raw: '3', badInput: false },
  students: { raw: '1', badInput: false },
  extras: { mentor: false, certificate: false },
  promoCode: null
};

export const courseStore = createStore(initialState);

/* ---------- Дії (єдиний спосіб змінити стан) ---------- */

const inCatalogOrder = (keys) => MODULE_KEYS.filter((key) => keys.includes(key));

export function setModuleSelected(key, selected) {
  if (!isModuleKey(key)) return;
  courseStore.setState(({ modules }) => {
    const has = modules.includes(key);
    if (has === selected) return null;
    return { modules: inCatalogOrder(selected ? [...modules, key] : modules.filter((k) => k !== key)) };
  });
}

export function toggleModule(key) {
  setModuleSelected(key, !courseStore.getState().modules.includes(key));
}

/** Додає модулі до вибору (не знімає вже обрані); 'all' — усі модулі */
export function addModules(keys) {
  const wanted = keys === 'all' ? MODULE_KEYS : [].concat(keys).filter(isModuleKey);
  courseStore.setState(({ modules }) => {
    const next = inCatalogOrder([...modules, ...wanted]);
    return next.length === modules.length ? null : { modules: next };
  });
}

/** Значення лічильника: field — 'lessonsPerWeek' | 'students' */
export function setCount(field, raw, badInput = false) {
  const next = { raw: String(raw), badInput: Boolean(badInput) };
  courseStore.setState((state) => {
    const current = state[field];
    return current && current.raw === next.raw && current.badInput === next.badInput ? null : { [field]: next };
  });
}

export function setExtra(key, enabled) {
  if (!Object.prototype.hasOwnProperty.call(EXTRAS, key)) return;
  courseStore.setState(({ extras }) => (extras[key] === enabled ? null : { extras: { ...extras, [key]: enabled } }));
}

/** Застосовує промокод. Повертає { ok, code?, message? } — повідомлення про помилку показує компонент. */
export function applyPromo(input) {
  const code = String(input).trim().toUpperCase();
  if (!code) return { ok: false, message: 'Введи промокод.' };
  if (!isPromoCode(code)) return { ok: false, message: 'Промокод «' + code + '» не знайдено. Перевір написання.' };
  courseStore.setState({ promoCode: code });
  return { ok: true, code };
}

export function removePromo() {
  courseStore.setState({ promoCode: null });
}

/* ---------- Селектори ---------- */

// Кеш: план перераховується лише тоді, коли змінився сам стан
let cachedState = null;
let cachedPlan = null;

export function selectPlan(state = courseStore.getState()) {
  if (state !== cachedState) {
    cachedState = state;
    cachedPlan = calculatePlan(state);
  }
  return cachedPlan;
}
