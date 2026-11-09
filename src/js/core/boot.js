/* Запуск компонентів сторінки. Кожен компонент ізольований:
   помилка в одному пишеться в консоль, але не зупиняє решту сторінки (Fail-Safe). */

export function boot(components) {
  components.forEach((init) => {
    try {
      init();
    } catch (error) {
      console.error('[boot] ' + (init.name || 'component') + ':', error);
    }
  });
}
