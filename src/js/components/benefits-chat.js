/* Міні-месенджер у картці переваг: коло починається з уже надісланого питання → бот «друкує…» → відповідь;
   далі друге питання друкується в полі → «надсилається» → відповідь бота.
   Потім чат очищається й усе повторюється. Працює лише поки картку видно.
   Розмітка повідомлень — у <template data-bn-chat-tpl="me|bot|typing"> в HTML. */

import { qs, cloneTemplate, restartAnimation } from '../core/dom.js';

const DIALOG = [
  { me: 'Налаштуй помічника, що пояснює фізику простими словами', bot: 'Готово! Твій ШІ-помічник уже на зв’язку 🚀' },
  { me: 'А можна, щоб він ще давав задачі?', bot: 'Додав режим тренування: 5 задач щодня 💪' }
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function initBenefitsChat() {
  const chat = qs('[data-bn-chat]');
  if (!chat || !('IntersectionObserver' in window)) return;

  const log = qs('[data-bn-chat-log]', chat);
  const field = qs('[data-bn-chat-field]', chat);
  const send = qs('[data-bn-chat-send]', chat);
  const template = (name) => qs('[data-bn-chat-tpl="' + name + '"]', chat);

  let visible = false;
  let running = false;
  let wake = null;

  const whenVisible = () => (visible ? Promise.resolve() : new Promise((resolve) => { wake = resolve; }));

  function append(name, text) {
    const node = cloneTemplate(template(name));
    if (text) node.textContent = text;
    log.appendChild(node);
    return node;
  }

  async function typeInto(text) {
    field.classList.add('is-typing');
    for (let i = 1; i <= text.length; i++) {
      field.textContent = text.slice(0, i);
      await wait(38 + Math.random() * 45);
    }
    field.classList.remove('is-typing');
  }

  async function loop() {
    running = true;
    for (;;) {
      await whenVisible();
      log.replaceChildren();
      for (let k = 0; k < DIALOG.length; k++) {
        if (k === 0) {
          // Коло починається з уже надісланого першого повідомлення — одразу відповідає бот
          append('me', DIALOG[k].me);
          await wait(700);
        } else {
          await wait(500);
          await typeInto(DIALOG[k].me);
          await wait(250);
          restartAnimation(send, 'is-pulse');
          field.textContent = '';
          append('me', DIALOG[k].me);
          await wait(900);
        }
        const typing = append('typing');
        await wait(1500);
        typing.remove();
        append('bot', DIALOG[k].bot);
        await wait(1600);
      }
      await wait(3000);
      log.classList.add('is-clearing');
      await wait(450);
      log.classList.remove('is-clearing');
    }
  }

  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible && wake) {
      wake();
      wake = null;
    }
    if (visible && !running) loop();
  }, { threshold: 0.3 }).observe(chat);
}
