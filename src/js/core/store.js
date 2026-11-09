/* Мінімальний стейт-менеджер (патерн «store»: один об'єкт стану + підписки).
   - стан незмінний: setState створює новий об'єкт, старий не змінюється;
   - підписники отримують (state, prevState) і самі вирішують, що перемалювати;
   - якщо оновлення нічого не змінило — підписники не викликаються. */
export function createStore(initialState) {
  let state = Object.freeze({ ...initialState });
  const listeners = new Set();

  function getState() {
    return state;
  }

  /** @param {object|function} update — часткові зміни або функція (state) => часткові зміни */
  function setState(update) {
    const patch = typeof update === 'function' ? update(state) : update;
    if (!patch) return;
    const changed = Object.keys(patch).some((key) => !Object.is(patch[key], state[key]));
    if (!changed) return;

    const prevState = state;
    state = Object.freeze({ ...state, ...patch });
    listeners.forEach((listener) => listener(state, prevState));
  }

  /** Підписка на зміни; повертає функцію відписки */
  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return { getState, setState, subscribe };
}
