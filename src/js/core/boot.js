/* Запуск компонентів сторінки. Кожен компонент ізольований:
   помилка в одному пишеться в консоль, але не зупиняє решту сторінки (Fail-Safe).

   Швидкодія: компоненти запускаються по черзі невеликими порціями (~8 мс), між порціями
   браузер отримує паузу, щоб малювати й реагувати на дотики. Так замість одного довгого
   завдання — кілька коротких (менший Total Blocking Time у Lighthouse). Порядок зберігається. */

const SLICE_MS = 8;

function run(init) {
  try {
    init();
  } catch (error) {
    console.error('[boot] ' + (init.name || 'component') + ':', error);
  }
}

function yieldToBrowser(callback) {
  if (window.scheduler && typeof window.scheduler.postTask === 'function') {
    window.scheduler.postTask(callback, { priority: 'user-visible' });
  } else {
    setTimeout(callback, 0);
  }
}

export function boot(components) {
  const queue = components.slice();

  function next() {
    const start = performance.now();
    while (queue.length) {
      run(queue.shift());
      if (queue.length && performance.now() - start > SLICE_MS) {
        yieldToBrowser(next);
        return;
      }
    }
  }

  next();
}
