/* Форматування чисел і слів українською (чисті функції, без DOM) */

const money = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 });

/** 1490 → «1 490 ₴» */
export const formatUAH = (value) => money.format(value) + ' ₴';

/** Відмінювання за числом: plural(5, 'урок', 'уроки', 'уроків') → 'уроків' */
export function plural(n, one, few, many) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export const formatWeeks = (n) => n + ' ' + plural(n, 'тиждень', 'тижні', 'тижнів');
export const formatLessons = (n) => n + ' ' + plural(n, 'урок', 'уроки', 'уроків');
export const formatModules = (n) => n + ' ' + plural(n, 'модуль', 'модулі', 'модулів');

/** 7 → '07' */
export const pad2 = (n) => String(n).padStart(2, '0');

/** 12.6 → '13°' */
export const formatTemp = (t) => Math.round(t) + '°';
