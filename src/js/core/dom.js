/* Дрібні DOM-помічники, спільні для всіх компонентів */

export const qs = (selector, root = document) => root.querySelector(selector);
export const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

/** Клон вмісту <template> (розмітка лишається в HTML, JS лише підставляє дані) */
export function cloneTemplate(template) {
  return template.content.firstElementChild.cloneNode(true);
}

/** Перезапуск CSS-анімації класу (наприклад, «підстрибування» суми) */
export function restartAnimation(node, className) {
  node.classList.remove(className);
  void node.offsetWidth; // примусовий reflow — без нього браузер не помітить повторного додавання класу
  node.classList.add(className);
}

/** Робить посилання-кнопку неактивним (aria-disabled + прибирає з Tab-порядку) */
export function setLinkDisabled(link, disabled) {
  link.setAttribute('aria-disabled', String(disabled));
  if (disabled) link.setAttribute('tabindex', '-1');
  else link.removeAttribute('tabindex');
}

/** Виконує колбек один раз, коли елемент наблизиться до екрана */
export function onceVisible(el, callback, options) {
  if (!('IntersectionObserver' in window)) {
    callback();
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      observer.disconnect();
      callback();
    }
  }, options);
  observer.observe(el);
}
