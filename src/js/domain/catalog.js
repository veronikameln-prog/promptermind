/* Каталог курсу та бізнес-правила — єдине джерело даних для калькулятора, планувальника й заявки.
   (Раніше ціни й уроки дублювалися в data-атрибутах карток і в js/widget.js.) */

/** Модулі в порядку проходження. weeks — тривалість у стандартному темпі (3 уроки на тиждень). */
export const MODULES = Object.freeze({
  start: Object.freeze({ key: 'start', title: 'Старт у ШІ', lessons: 12, price: 1490, weeks: 4 }),
  bots: Object.freeze({ key: 'bots', title: 'Створення ботів', lessons: 18, price: 2290, weeks: 6 }),
  prompting: Object.freeze({ key: 'prompting', title: 'Просунутий промптинг', lessons: 24, price: 2990, weeks: 8 })
});

export const MODULE_KEYS = Object.freeze(Object.keys(MODULES));

export const isModuleKey = (key) => Object.prototype.hasOwnProperty.call(MODULES, key);

/** Додаткові опції (ціна — на одного учня) */
export const EXTRAS = Object.freeze({
  mentor: Object.freeze({ key: 'mentor', title: 'Особистий наставник', short: 'наставник', price: 500 }),
  certificate: Object.freeze({ key: 'certificate', title: 'Сертифікат', short: 'сертифікат', price: 300 })
});

export const EXTRA_KEYS = Object.freeze(Object.keys(EXTRAS));

/** Знижка за кількох учнів */
export const FAMILY_DISCOUNT = Object.freeze({ minStudents: 2, rate: 0.1 });

/** Допустимі значення лічильників планувальника */
export const LIMITS = Object.freeze({
  lessonsPerWeek: Object.freeze({ min: 1, max: 7, what: 'кількість уроків' }),
  students: Object.freeze({ min: 1, max: 5, what: 'кількість учнів' })
});

/* Персональні промокоди. На статичному сайті коди видно у вихідному коді —
   у продакшені їх треба перевіряти на сервері. Діють на суму після знижки за кількох учнів. */
export const PROMO_CODES = Object.freeze({
  START10: Object.freeze({ type: 'percent', value: 10, description: '−10 % на навчання' }),
  FRIEND15: Object.freeze({ type: 'percent', value: 15, description: '−15 % за запрошенням друга' }),
  DUO20: Object.freeze({ type: 'percent', value: 20, minModules: 2, description: '−20 % при виборі від 2 модулів' }),
  MINUS500: Object.freeze({ type: 'fixed', value: 500, minSubtotal: 2000, description: '−500 ₴ при замовленні від 2 000 ₴' })
});

export const isPromoCode = (code) => Object.prototype.hasOwnProperty.call(PROMO_CODES, code);
