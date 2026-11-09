/* Планувальник на телефоні: плаваюча панель «До сплати · Залишити заявку».
   Показується, поки форма планувальника на екрані, а «Твій план» із сумою — ще ні.
   Сума — зі стору (selectPlan), кнопка натискає справжню «Залишити заявку».
   Вигляд — у layout/mobile.css (на десктопі панель прихована). */

import { qs } from '../core/dom.js';
import { courseStore, selectPlan } from '../store/course-store.js';
import { formatUAH } from '../utils/format.js';

export function initPlannerDock() {
  const dock = qs('[data-pl-dock]');
  const form = qs('#planner-form');
  const result = qs('[aria-labelledby="planner-result-title"]');
  const submit = qs('#plan-submit');
  if (!dock || !form || !result || !('IntersectionObserver' in window)) return;

  const total = qs('[data-pl-dock-total]', dock);
  const button = qs('[data-pl-dock-btn]', dock);
  let formIn = false;
  let resultIn = false;
  let valid = false;

  function update() {
    const on = formIn && !resultIn && valid;
    dock.classList.toggle('is-on', on);
    dock.setAttribute('aria-hidden', String(!on));
    button.tabIndex = on ? 0 : -1;
  }

  function render(state) {
    const plan = selectPlan(state);
    valid = plan.valid;
    if (plan.valid) total.textContent = formatUAH(plan.total);
    update();
  }

  new IntersectionObserver((entries) => { formIn = entries[0].isIntersecting; update(); }).observe(form);
  new IntersectionObserver((entries) => { resultIn = entries[0].isIntersecting; update(); },
    { rootMargin: '0px 0px -80px 0px' }).observe(result);

  button.addEventListener('click', () => { if (submit) submit.click(); });

  courseStore.subscribe(render);
  render(courseStore.getState());
}
