/* Залишок часу до події — чиста функція */

/** Мілісекунди → { days, hours, minutes, seconds, done } */
export function timeLeft(target, now = Date.now()) {
  const left = Math.max(0, target - now);
  const s = Math.floor(left / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor(s / 3600) % 24,
    minutes: Math.floor(s / 60) % 60,
    seconds: s % 60,
    done: left === 0
  };
}
