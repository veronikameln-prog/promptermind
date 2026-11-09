/* Погода: переклад кодів погодних сервісів українською — чисті функції */

/** Коди погоди WMO (Open-Meteo) → опис */
export function describeWmo(code) {
  if (code === 0) return 'Ясно';
  if (code <= 2) return 'Мінлива хмарність';
  if (code === 3) return 'Хмарно';
  if (code <= 48) return 'Туман';
  if (code <= 57) return 'Мряка';
  if (code <= 67) return 'Дощ';
  if (code <= 77) return 'Сніг';
  if (code <= 82) return 'Злива';
  if (code <= 86) return 'Снігопад';
  return 'Гроза';
}

/** symbol_code MET Norway ('cloudy', 'lightrain_day'…) → опис */
export function describeMet(symbol) {
  const s = symbol.replace(/_(day|night|polartwilight)$/, '');
  if (s === 'clearsky') return 'Ясно';
  if (s === 'fair' || s === 'partlycloudy') return 'Мінлива хмарність';
  if (s === 'cloudy') return 'Хмарно';
  if (s === 'fog') return 'Туман';
  if (s.includes('thunder')) return 'Гроза';
  if (s.includes('sleet')) return 'Мокрий сніг';
  if (s.includes('snow')) return 'Сніг';
  if (s.includes('showers')) return 'Злива';
  return 'Дощ';
}
