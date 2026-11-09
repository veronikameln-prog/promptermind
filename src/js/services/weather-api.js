/* Погода у Львові: Open-Meteo (без ключа), запасне джерело — MET Norway (теж без ключа).
   Сервіс лише ходить у мережу й повертає нормалізовані дані — що й як показати, вирішує компонент.

   Прогноз Open-Meteo доступний лише на 16 днів уперед. Якщо до події ще далі —
   повертаємо поточну погоду з позначкою isForecast: false. */

import { describeWmo, describeMet } from '../domain/weather.js';

export const FORECAST_DAYS = 16;

const LVIV = { lat: 49.8397, lon: 24.0297 };

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast?latitude=' + LVIV.lat + '&longitude=' + LVIV.lon +
  '&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min' +
  '&timezone=Europe%2FKyiv&forecast_days=' + FORECAST_DAYS;

const MET_URL = 'https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=49.84&lon=24.03';

export const SOURCES = Object.freeze({
  openMeteo: Object.freeze({ name: 'Open-Meteo', url: 'https://open-meteo.com/' }),
  met: Object.freeze({ name: 'MET Norway', url: 'https://api.met.no/' })
});

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('HTTP ' + response.status);
  return response.json();
}

async function fromOpenMeteo(day) {
  const data = await getJson(OPEN_METEO_URL);
  const index = data.daily.time.indexOf(day);
  if (index !== -1) {
    return {
      isForecast: true,
      temp: data.daily.temperature_2m_max[index],
      tempMin: data.daily.temperature_2m_min[index],
      description: describeWmo(data.daily.weather_code[index]),
      source: SOURCES.openMeteo
    };
  }
  return {
    isForecast: false,
    temp: data.current.temperature_2m,
    description: describeWmo(data.current.weather_code),
    source: SOURCES.openMeteo
  };
}

async function fromMet() {
  const data = await getJson(MET_URL);
  const now = data.properties.timeseries[0].data;
  return {
    isForecast: false,
    temp: now.instant.details.air_temperature,
    description: describeMet(now.next_1_hours.summary.symbol_code),
    source: SOURCES.met
  };
}

/** Прогноз на день події ('YYYY-MM-DD') або поточна погода. Відхиляється, якщо обидва джерела недоступні. */
export function fetchEventWeather(day) {
  return fromOpenMeteo(day).catch(fromMet);
}
