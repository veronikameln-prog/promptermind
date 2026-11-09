/* Тексти підсумків плану для різних місць сторінки — чисті функції.
   Компоненти лише виводять готові рядки, тож формулювання змінюються в одному місці. */

import { formatUAH, formatLessons, formatModules, formatWeeks, plural } from '../utils/format.js';

/** Блок «Твій курс» (крок 1). Поки план у планувальнику неповний — ціна модулів за одного учня. */
export function courseSummary(modules, plan) {
  const ready = plan.valid ? plan : null;
  const perWeek = ready ? ready.perWeek : 0;
  const students = ready ? ready.students : 1;
  const weeksOf = (lessons, fallback) => (perWeek ? Math.ceil(lessons / perWeek) : fallback);

  const lessons = modules.reduce((sum, m) => sum + m.lessons, 0);
  const subtotal = modules.reduce((sum, m) => sum + m.price, 0);
  const weeks = weeksOf(lessons, modules.reduce((sum, m) => sum + m.weeks, 0));

  const rows = modules.map((m) => ({
    title: m.title,
    meta: formatLessons(m.lessons) + ' · ' + formatWeeks(weeksOf(m.lessons, m.weeks)),
    price: formatUAH(m.price)
  }));
  if (ready) {
    ready.extras.forEach((x) => rows.push({ title: '+ ' + x.title, meta: '', price: '+' + formatUAH(x.price) }));
  }

  const forWhom = students === 1 ? 'за одного учня' : 'за ' + students + ' ' + plural(students, 'учня', 'учнів', 'учнів');
  return {
    rows,
    caption: forWhom + (modules.length ? ' · ' + formatLessons(lessons) + ' · ' + formatWeeks(weeks) : ''),
    total: formatUAH(ready ? ready.total : subtotal),
    announce: modules.length
      ? 'Обрано ' + formatModules(modules.length) + ', ' + formatLessons(lessons) + ', ' + formatUAH(subtotal) + '.'
      : 'Жодного модуля не обрано.'
  };
}

/** Рядки [назва, значення] для вікна заявки «Оформлення курсу». Порожньо — план ще не готовий. */
export function orderSummaryRows(plan) {
  if (!plan.valid) return [];
  const rows = [
    ['Модулі', plan.modules.map((m) => m.title).join(', ')],
    ['Темп', plan.perWeek + ' ' + plural(plan.perWeek, 'урок', 'уроки', 'уроків') + ' на тиждень'],
    ['Учнів', String(plan.students)],
    ['Опції', plan.extras.length ? plan.extras.map((x) => x.short).join(', ') : 'без опцій'],
    ['Тривалість', formatWeeks(plan.weeks)]
  ];
  if (plan.promo.amount > 0) rows.push(['Промокод', plan.promo.code]);
  rows.push(['До сплати', formatUAH(plan.total)]);
  return rows;
}

/** Повідомлення під полем промокоду, коли код уже застосовано */
export function promoStatus(plan) {
  if (!plan.valid || !plan.promo.code) return null;
  const { code, amount, reason, description } = plan.promo;
  return amount > 0
    ? { type: 'success', text: 'Промокод ' + code + ' застосовано: ' + description + '.' }
    : { type: 'error', text: 'Промокод ' + code + ' ' + reason };
}
