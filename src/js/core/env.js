/* Налаштування середовища користувача (медіазапити) */

const matches = (query) => window.matchMedia(query).matches;

export const prefersReducedMotion = () => matches('(prefers-reduced-motion: reduce)');
export const canHover = () => matches('(hover: hover)');
export const hasFinePointerAndMotion = () => matches('(pointer: fine) and (prefers-reduced-motion: no-preference)');
