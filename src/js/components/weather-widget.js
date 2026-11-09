/* Інформер погоди на день інтенсиву: <aside data-weather="2026-11-22">.
   Дані приносить services/weather-api.js; тут — лише виведення на сторінку. */

import { qs } from '../core/dom.js';
import { formatTemp } from '../utils/format.js';
import { fetchEventWeather, FORECAST_DAYS, SOURCES } from '../services/weather-api.js';

const formatDay = (isoDay) =>
  new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', timeZone: 'Europe/Kyiv' }).format(new Date(isoDay + 'T12:00:00Z'));

export function initWeatherWidget() {
  const box = qs('[data-weather]');
  if (!box || !box.dataset.weather) return;

  const day = box.dataset.weather;
  const dayLabel = formatDay(day);
  const el = {
    temp: qs('[data-weather-temp]', box),
    desc: qs('[data-weather-desc]', box),
    note: qs('[data-weather-note]', box),
    source: qs('[data-weather-source]', box),
    sourceName: qs('[data-weather-source-name]', box)
  };

  function render(weather) {
    el.temp.textContent = formatTemp(weather.temp);
    if (weather.isForecast) {
      el.desc.textContent = weather.description + ', вночі ' + formatTemp(weather.tempMin);
      el.note.textContent = 'Прогноз на ' + dayLabel + ' — день інтенсиву.';
    } else {
      el.desc.textContent = weather.description + ' зараз';
      el.note.textContent = weather.source === SOURCES.openMeteo
        ? 'Прогноз на ' + dayLabel + ' з\'явиться за ' + FORECAST_DAYS + ' днів до інтенсиву.'
        : 'Прогноз на ' + dayLabel + ' з\'явиться ближче до інтенсиву.';
    }
    if (el.source && el.sourceName) {
      el.source.href = weather.source.url;
      el.sourceName.textContent = weather.source.name;
    }
  }

  function renderError() {
    el.desc.textContent = 'Не вдалося завантажити погоду.';
    el.note.textContent = 'Спробуй оновити сторінку пізніше.';
  }

  fetchEventWeather(day).then(render, renderError);
}
